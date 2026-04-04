"""
local_brain_agent.py – Lightweight local LLM for fast responses.

Uses llama-cpp-python to run a quantised GGUF model entirely on CPU.

Handles:
* Short Q&A
* Confirmations / clarifications
* Formatting / rephrasing
* Clarifying questions when STT confidence is low

Streams tokens back to the caller via an async generator.
The generator is cancellable: pass an asyncio.Event to abort mid-stream.
"""
from __future__ import annotations

import asyncio
import logging
from typing import AsyncIterator, Optional

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are Agent Lee, a concise voice assistant. "
    "Keep answers short and direct. No filler words. "
    "Do not say 'um', 'uh', or similar. "
    "Respond in plain text only – no markdown."
)


class LocalBrainAgent:
    """Local LLM agent using llama.cpp."""

    def __init__(
        self,
        model_path: str,
        max_tokens: int = 256,
        context_size: int = 2048,
        n_threads: int = 4,
    ) -> None:
        self.model_path = model_path
        self.max_tokens = max_tokens
        self.context_size = context_size
        self.n_threads = n_threads
        self._llm = None

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    def load(self) -> None:
        """Load the GGUF model.  May take several seconds."""
        try:
            from llama_cpp import Llama

            self._llm = Llama(
                model_path=self.model_path,
                n_ctx=self.context_size,
                n_threads=self.n_threads,
                verbose=False,
            )
            logger.info("LocalBrainAgent: loaded model from %s", self.model_path)
        except Exception as exc:
            logger.error("LocalBrainAgent: failed to load model: %s", exc)
            raise

    @property
    def llm(self):
        return self._llm

    # ── Generation ────────────────────────────────────────────────────────────

    async def generate_stream(
        self,
        user_text: str,
        context: str = "",
        cancel_event: Optional[asyncio.Event] = None,
    ) -> AsyncIterator[str]:
        """
        Async generator that yields text tokens as they are produced.
        Runs the blocking llama.cpp call in a thread pool so the event loop
        is not blocked.
        """
        if self._llm is None:
            yield self._fallback(user_text)
            return

        prompt = self._build_prompt(user_text, context)
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue[Optional[str]] = asyncio.Queue()

        def _run() -> None:
            try:
                for chunk in self._llm(
                    prompt,
                    max_tokens=self.max_tokens,
                    temperature=0.7,
                    stream=True,
                    stop=["</s>", "<|end|>", "<|eot_id|>"],
                ):
                    token = chunk["choices"][0]["text"]
                    asyncio.run_coroutine_threadsafe(queue.put(token), loop)
            except Exception as exc:
                logger.error("LocalBrainAgent generation error: %s", exc)
            finally:
                asyncio.run_coroutine_threadsafe(queue.put(None), loop)

        loop.run_in_executor(None, _run)

        while True:
            if cancel_event and cancel_event.is_set():
                logger.debug("LocalBrainAgent: generation cancelled.")
                break
            try:
                token = await asyncio.wait_for(queue.get(), timeout=0.5)
            except asyncio.TimeoutError:
                continue
            if token is None:
                break
            yield token

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _build_prompt(self, user_text: str, context: str) -> str:
        ctx_block = f"Context:\n{context}\n\n" if context else ""
        return (
            f"<|system|>\n{_SYSTEM_PROMPT}\n"
            f"{ctx_block}"
            f"<|user|>\n{user_text}\n"
            f"<|assistant|>\n"
        )

    @staticmethod
    def _fallback(user_text: str) -> str:
        """Return a minimal reply when the LLM is unavailable."""
        return "I'm sorry, the local language model is not available right now."

    async def clarify(
        self,
        original_text: str,
        cancel_event: Optional[asyncio.Event] = None,
    ) -> AsyncIterator[str]:
        """Generate a clarifying question for a low-confidence transcript."""
        prompt_text = (
            f'I heard: "{original_text}". '
            "I am not sure I understood correctly. Ask one clarifying question."
        )
        async for token in self.generate_stream(prompt_text, cancel_event=cancel_event):
            yield token
