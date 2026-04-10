"""
pipeline.py – Real-time voice pipeline orchestrating all agents.

The pipeline runs per WebSocket connection and coordinates:

  Inbound audio  →  VADAgent  →  (speech_start triggers barge-in check)
                             →  STTAgent  →  transcript
  transcript     →  RouterAgent  →  route decision
  route          →  LocalBrainAgent | leewayHeavyBrainAgent  →  text tokens
  text tokens    →  ProsodyAgent  →  ProsodyPlan
                 →  TTSAgent  →  PCM audio chunks  →  WebSocket to client

Cancellation / Barge-in
-----------------------
An asyncio.Event `_interrupt` is shared across all pipeline stages.
When VADAgent detects new speech while AI is speaking:
  1. The interrupt event is set immediately.
  2. TTSAgent kills the Piper subprocess.
  3. LLM generation loop checks the event and exits.
  4. The event is cleared and the pipeline restarts from STT.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Callable, Coroutine, Optional

from agent_core.leeway_heavy_brain_agent import leewayHeavyBrainAgent
from agent_core.local_brain_agent import LocalBrainAgent
from agent_core.memory_agent import MemoryAgent
from agent_core.prosody_agent import ProsodyAgent
from agent_core.router_agent import RouterAgent
from agent_core.stt_agent import STTAgent
from agent_core.tts_agent import TTSAgent
from agent_core.vad_agent import VADAgent, SpeechEventType
from config import Settings
from websocket_protocol import (
    AgentState,
    AudioOutMetadata,
    RouteMode,
    make_error,
    make_final_response,
    make_final_transcript,
    make_partial_response,
    make_partial_transcript,
    make_state,
)

logger = logging.getLogger(__name__)

# Type alias for the WebSocket send function
SendFn = Callable[[Any], Coroutine[Any, Any, None]]


class VoicePipeline:
    """One pipeline instance per connected WebSocket client."""

    def __init__(
        self,
        settings: Settings,
        send_json: SendFn,
        send_bytes: SendFn,
        session_id: str = "default",
    ) -> None:
        self.settings = settings
        self._send_json = send_json
        self._send_bytes = send_bytes
        self.session_id = session_id

        # Shared cancellation event (barge-in)
        self._interrupt = asyncio.Event()

        # ── Audio accumulator for current utterance ────────────────────────
        self._speech_buffer: bytearray = bytearray()
        self._speech_active = False

        # ── Conversation history ───────────────────────────────────────────
        self._history: list[dict[str, str]] = []

        # ── Build agents ──────────────────────────────────────────────────
        self.vad = VADAgent(
            threshold=settings.vad_threshold,
            sample_rate=settings.vad_sample_rate,
            window_size_samples=settings.vad_window_size_samples,
            silence_duration=settings.vad_silence_duration,
        )
        self.stt = STTAgent(
            model_name=settings.whisper_model,
            device=settings.whisper_device,
            compute_type=settings.whisper_compute_type,
        )
        self.memory = MemoryAgent(db_path=settings.memory_db_path)
        self.prosody = ProsodyAgent()
        self.tts = TTSAgent(
            piper_executable=settings.piper_executable,
            model_path=settings.piper_model_path,
            sample_rate=settings.tts_sample_rate,
        )

        local_llm = None
        self.local_brain: Optional[LocalBrainAgent] = None
        if self._try_load_local_llm():
            local_llm = self.local_brain.llm if self.local_brain else None

        self.router = RouterAgent(
            leeway_threshold=settings.router_leeway_threshold,
            offline_mode=settings.offline_mode,
            llama_model=local_llm,
        )

        self.leeway: Optional[leewayHeavyBrainAgent] = None
        if settings.is_leeway_available:
            self.leeway = leewayHeavyBrainAgent(
                api_key=settings.leeway_api_key,
                model=settings.leeway_model,
            )

    # ── Startup ──────────────────────────────────────────────────────────────

    def start(self) -> None:
        """Load models (called from lifespan or first connection)."""
        self.vad.load()
        try:
            self.stt.load()
        except Exception as exc:
            logger.warning("STT not available: %s", exc)

        self.memory.load()

        if self.leeway:
            self.leeway.load()

        asyncio.get_event_loop().run_in_executor(None, self._preload_local_llm_async)

    def _try_load_local_llm(self) -> bool:
        try:
            self.local_brain = LocalBrainAgent(
                model_path=self.settings.llama_model_path,
                max_tokens=self.settings.llama_max_tokens,
                context_size=self.settings.llama_context_size,
                n_threads=self.settings.llama_threads,
            )
            return True
        except Exception:
            return False

    def _preload_local_llm_async(self) -> None:
        if self.local_brain is not None:
            try:
                self.local_brain.load()
            except Exception as exc:
                logger.warning("LocalBrainAgent model not available: %s", exc)
                self.local_brain = None

    # ── Audio input ───────────────────────────────────────────────────────────

    async def process_audio_chunk(self, pcm_bytes: bytes) -> None:
        """
        Main entry point: called for every incoming audio frame.
        Runs VAD; accumulates speech; triggers pipeline on speech_end.
        """
        events = self.vad.process_chunk(pcm_bytes)

        for event in events:
            if event.type == SpeechEventType.SPEECH_START:
                # Barge-in: if AI is currently speaking, interrupt it
                if not self._interrupt.is_set():
                    logger.debug("Pipeline: barge-in detected.")
                    self._interrupt.set()
                    await self._send_json(make_state(AgentState.LISTENING))
                self._speech_buffer = bytearray()
                self._speech_active = True

            elif event.type == SpeechEventType.SPEECH_END:
                self._speech_active = False
                if len(self._speech_buffer) > 0:
                    utterance = bytes(self._speech_buffer)
                    self._speech_buffer = bytearray()
                    asyncio.ensure_future(self._run_pipeline(utterance))

        if self._speech_active:
            self._speech_buffer.extend(pcm_bytes)

    async def process_text_input(self, text: str) -> None:
        """Typed text fallback – skip STT and go straight to router."""
        await self._run_pipeline_from_transcript(text, confidence=1.0)

    async def handle_interrupt(self) -> None:
        """Client-side barge-in signal."""
        logger.debug("Pipeline: client interrupt received.")
        self._interrupt.set()
        await self._send_json(make_state(AgentState.LISTENING))

    # ── Pipeline stages ───────────────────────────────────────────────────────

    async def _run_pipeline(self, utterance: bytes) -> None:
        """Full pipeline: utterance bytes → STT → router → LLM → TTS."""
        self._interrupt.clear()
        await self._send_json(make_state(AgentState.THINKING))

        transcript = ""
        confidence = 1.0

        # ── STT ───────────────────────────────────────────────────────────
        try:
            async for chunk in self.stt.transcribe_stream(
                utterance,
                sample_rate=self.settings.vad_sample_rate,
                cancel_event=self._interrupt,
            ):
                if self._interrupt.is_set():
                    return
                transcript = chunk.text
                confidence = chunk.confidence
                if not chunk.is_final:
                    await self._send_json(
                        make_partial_transcript(transcript, confidence)
                    )
        except Exception as exc:
            logger.error("STT error: %s", exc)
            await self._send_json(make_error("stt_error", str(exc)))
            await self._send_json(make_state(AgentState.LISTENING))
            return

        if not transcript.strip():
            await self._send_json(make_state(AgentState.LISTENING))
            return

        await self._run_pipeline_from_transcript(transcript, confidence)

    async def _run_pipeline_from_transcript(
        self, transcript: str, confidence: float = 1.0
    ) -> None:
        self._interrupt.clear()
        low_conf = confidence < 0.5

        await self._send_json(make_final_transcript(transcript, confidence))
        await self._send_json(make_state(AgentState.THINKING))

        # ── Memory context ─────────────────────────────────────────────────
        context = self.memory.get_context_snippet(
            transcript,
            self.session_id,
            self.settings.memory_max_context_tokens,
        )
        self.memory.add_turn("user", transcript, self.session_id)

        # ── Router ────────────────────────────────────────────────────────
        decision = self.router.route(
            transcript,
            conversation_turns=len(self._history),
            low_confidence_stt=low_conf,
        )
        logger.info(
            "Router: mode=%s reason=%s conf=%.2f",
            decision.mode, decision.reason, decision.confidence,
        )

        # ── LLM generation ────────────────────────────────────────────────
        full_text = ""
        route_mode = RouteMode.LOCAL
        token_idx = 0

        try:
            if decision.mode == "leeway" and self.leeway and self.leeway.is_available:
                route_mode = RouteMode.leeway
                gen = self.leeway.generate_stream(
                    transcript,
                    context=context,
                    history=self._history[-6:],
                    cancel_event=self._interrupt,
                )
            elif self.local_brain:
                if low_conf and decision.reason == "low_stt_confidence_clarify":
                    gen = self.local_brain.clarify(transcript, self._interrupt)
                else:
                    gen = self.local_brain.generate_stream(
                        transcript, context=context, cancel_event=self._interrupt
                    )
            else:
                gen = self._static_fallback(transcript)

            async for token in gen:
                if self._interrupt.is_set():
                    logger.debug("Pipeline: LLM generation interrupted.")
                    await self._send_json(make_state(AgentState.LISTENING))
                    return
                full_text += token
                await self._send_json(make_partial_response(token, token_idx))
                token_idx += 1

        except Exception as exc:
            logger.error("LLM error: %s", exc)
            full_text = "I encountered an error. Please try again."

        if not full_text.strip():
            await self._send_json(make_state(AgentState.LISTENING))
            return

        await self._send_json(make_final_response(full_text, route_mode))

        # ── Memory: store AI turn ─────────────────────────────────────────
        self.memory.add_turn("assistant", full_text, self.session_id)
        self._history.append({"role": "user", "content": transcript})
        self._history.append({"role": "assistant", "content": full_text})

        # ── Prosody + TTS ─────────────────────────────────────────────────
        plan = self.prosody.plan(full_text)
        await self._send_json(make_state(AgentState.SPEAKING))

        chunk_idx = 0
        try:
            async for audio_chunk in self.tts.synthesise_text(
                full_text, prosody=plan, cancel_event=self._interrupt
            ):
                if self._interrupt.is_set():
                    logger.debug("Pipeline: TTS interrupted (barge-in).")
                    await self._send_json(make_state(AgentState.LISTENING))
                    return
                meta = AudioOutMetadata(
                    sample_rate=self.settings.tts_sample_rate,
                    chunk_index=chunk_idx,
                )
                # Send metadata as JSON then audio as binary
                await self._send_json(
                    {"type": "audio_out", **meta.model_dump()}
                )
                await self._send_bytes(audio_chunk)
                chunk_idx += 1

            # Send end-of-audio marker
            await self._send_json(
                {"type": "audio_out", **AudioOutMetadata(
                    sample_rate=self.settings.tts_sample_rate,
                    chunk_index=chunk_idx,
                    is_last=True,
                ).model_dump()}
            )
        except Exception as exc:
            logger.error("TTS error: %s", exc)

        await self._send_json(make_state(AgentState.LISTENING))

    # ── Fallback ──────────────────────────────────────────────────────────────

    @staticmethod
    async def _static_fallback(text: str):
        """Minimal response when no LLM is available."""
        response = (
            "I heard you say: " + text + ". "
            "Local language model is not loaded. Please install the model."
        )
        for word in response.split():
            yield word + " "
            await asyncio.sleep(0)

    def stop(self) -> None:
        """Clean up on disconnect."""
        self._interrupt.set()
        self.memory.close()

