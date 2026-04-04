"""
gemini_heavy_brain_agent.py – Gemini Live SDK integration for heavy tasks.

Only called by the pipeline when:
  * RouterAgent returns mode="gemini"
  * OFFLINE_MODE is not set
  * GEMINI_API_KEY is available

Streams tokens back to the caller via an async generator.
Cancellable: pass an asyncio.Event; the generator will stop cleanly.

Context is intentionally kept short (curated by MemoryAgent) to minimise
token usage and stay near the free tier.
"""
from __future__ import annotations

import asyncio
import logging
from typing import AsyncIterator, Optional

logger = logging.getLogger(__name__)

_SYSTEM_INSTRUCTION = (
    "You are Agent Lee, a concise and helpful voice assistant. "
    "Give direct, spoken-English answers. No markdown, no bullet points. "
    "Keep responses under 100 words unless the user explicitly asks for detail."
)


class GeminiHeavyBrainAgent:
    """Gemini API wrapper – streaming, cancellable."""

    def __init__(self, api_key: str, model: str = "gemini-1.5-flash") -> None:
        self.api_key = api_key
        self.model = model
        self._client = None

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    def load(self) -> None:
        """Initialise the Gemini client."""
        if not self.api_key:
            logger.warning("GeminiHeavyBrainAgent: no API key – disabled.")
            return
        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            self._client = genai.GenerativeModel(
                model_name=self.model,
                system_instruction=_SYSTEM_INSTRUCTION,
            )
            logger.info("GeminiHeavyBrainAgent: ready (model=%s).", self.model)
        except Exception as exc:
            logger.error("GeminiHeavyBrainAgent: init failed: %s", exc)

    @property
    def is_available(self) -> bool:
        return self._client is not None

    # ── Generation ────────────────────────────────────────────────────────────

    async def generate_stream(
        self,
        user_text: str,
        context: str = "",
        history: Optional[list[dict]] = None,
        cancel_event: Optional[asyncio.Event] = None,
    ) -> AsyncIterator[str]:
        """
        Stream response tokens from Gemini.
        `context` is the short memory snippet injected before the user query.
        """
        if not self.is_available:
            yield "I'm sorry, the Gemini service is not available right now."
            return

        prompt_parts = []
        if context:
            prompt_parts.append(f"[Context]\n{context}\n\n")
        prompt_parts.append(user_text)
        full_prompt = "".join(prompt_parts)

        gemini_history = self._convert_history(history or [])

        loop = asyncio.get_event_loop()
        queue: asyncio.Queue[Optional[str]] = asyncio.Queue()

        def _run() -> None:
            try:
                chat = self._client.start_chat(history=gemini_history)
                response = chat.send_message(full_prompt, stream=True)
                for chunk in response:
                    text = chunk.text if hasattr(chunk, "text") else ""
                    if text:
                        asyncio.run_coroutine_threadsafe(queue.put(text), loop)
            except Exception as exc:
                logger.error("Gemini generation error: %s", exc)
            finally:
                asyncio.run_coroutine_threadsafe(queue.put(None), loop)

        loop.run_in_executor(None, _run)

        while True:
            if cancel_event and cancel_event.is_set():
                logger.debug("GeminiHeavyBrainAgent: generation cancelled.")
                break
            try:
                chunk = await asyncio.wait_for(queue.get(), timeout=0.5)
            except asyncio.TimeoutError:
                continue
            if chunk is None:
                break
            yield chunk

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _convert_history(history: list[dict]) -> list[dict]:
        """Convert our internal history format to Gemini's format."""
        gemini_history = []
        for turn in history:
            role = "user" if turn.get("role") == "user" else "model"
            gemini_history.append({"role": role, "parts": [turn.get("content", "")]})
        return gemini_history
