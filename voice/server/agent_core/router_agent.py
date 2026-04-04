"""
router_agent.py – Decides whether to use the local LLM or escalate to Gemini.

Input:  transcript text + conversation state
Output: RouteDecision {mode: "local"|"gemini", reason, confidence}

Design notes
------------
* Stage 1 – Rule-based fast path (always runs, O(1)):
    Keywords/patterns that definitely belong to local or Gemini.
* Stage 2 – llama.cpp classification prompt (runs when rules are ambiguous):
    A tiny single-sentence prompt → binary classification.
* The agent NEVER calls Gemini in offline mode.
* Confidence < threshold → escalate to Gemini (when online).
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class RouteDecision:
    mode: str  # "local" | "gemini"
    reason: str
    confidence: float  # 0.0 – 1.0


# ── Keyword rules ─────────────────────────────────────────────────────────────

_LOCAL_PATTERNS = [
    r"\b(hi|hello|hey|thanks?|thank you|bye|goodbye|yes|no|ok(ay)?)\b",
    r"\bwhat (time|day|date) is it\b",
    r"\brepeat\b",
    r"\bstop\b",
    r"\bpause\b",
    r"\bcancel\b",
    r"\bconfirm\b",
    r"\bremind me\b",
]

_GEMINI_PATTERNS = [
    r"\b(write|draft|generate|create|compose)\b.{10,}",  # creative / long
    r"\b(explain|summarize|analyse|analyze|research)\b.{15,}",
    r"\b(code|program|script|function|class|algorithm)\b",
    r"\b(translate|translate to)\b",
    r"\b(what (is|are|does|do|did|was|were)).{30,}",  # long factual
]

_LOCAL_RE = [re.compile(p, re.IGNORECASE) for p in _LOCAL_PATTERNS]
_GEMINI_RE = [re.compile(p, re.IGNORECASE) for p in _GEMINI_PATTERNS]


class RouterAgent:
    """Fast routing agent that keeps Gemini usage minimal."""

    def __init__(
        self,
        gemini_threshold: float = 0.6,
        offline_mode: bool = False,
        llama_model=None,  # optional Llama instance
    ) -> None:
        self.gemini_threshold = gemini_threshold
        self.offline_mode = offline_mode
        self._llama = llama_model

    def route(
        self,
        transcript: str,
        conversation_turns: int = 0,
        low_confidence_stt: bool = False,
    ) -> RouteDecision:
        """
        Return a RouteDecision synchronously (must be fast < 50 ms).
        """
        text = transcript.strip()

        # ── Clarifying question for very short / low-confidence STT ──────────
        if low_confidence_stt or len(text) < 3:
            return RouteDecision(
                mode="local",
                reason="low_stt_confidence_clarify",
                confidence=0.95,
            )

        # ── Stage 1: rule-based ───────────────────────────────────────────────
        for pat in _LOCAL_RE:
            if pat.search(text):
                return RouteDecision(
                    mode="local",
                    reason="rule_local_match",
                    confidence=0.9,
                )

        if not self.offline_mode:
            for pat in _GEMINI_RE:
                if pat.search(text):
                    return RouteDecision(
                        mode="gemini",
                        reason="rule_gemini_match",
                        confidence=0.85,
                    )

        # ── Stage 2: llama.cpp lightweight classifier ─────────────────────────
        if self._llama is not None:
            decision = self._llama_classify(text)
            if decision is not None:
                return decision

        # ── Heuristic fallback: word count + question complexity ──────────────
        words = text.split()
        if len(words) <= 8:
            return RouteDecision(
                mode="local",
                reason="heuristic_short_query",
                confidence=0.75,
            )

        if self.offline_mode:
            return RouteDecision(
                mode="local",
                reason="offline_mode_forced_local",
                confidence=1.0,
            )

        # Long, unmatched query → Gemini
        return RouteDecision(
            mode="gemini",
            reason="heuristic_complex_query",
            confidence=0.65,
        )

    def _llama_classify(self, text: str) -> Optional[RouteDecision]:
        """
        Ask llama.cpp to classify the query.
        Returns None on failure (fallback to heuristics).
        """
        prompt = (
            "Classify if this request needs a powerful AI (gemini) or can be answered locally (local).\n"
            f'Query: "{text}"\n'
            "Answer with one word only – local or gemini:\n"
        )
        try:
            output = self._llama(
                prompt,
                max_tokens=4,
                temperature=0.0,
                stop=["\n", " "],
            )
            answer = output["choices"][0]["text"].strip().lower()
            if "gemini" in answer and not self.offline_mode:
                return RouteDecision(
                    mode="gemini",
                    reason="llama_classifier",
                    confidence=0.78,
                )
            return RouteDecision(
                mode="local",
                reason="llama_classifier",
                confidence=0.78,
            )
        except Exception as exc:
            logger.debug("Llama router classify failed: %s", exc)
            return None
