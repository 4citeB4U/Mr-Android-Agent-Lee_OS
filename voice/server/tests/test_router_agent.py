"""
tests/test_router_agent.py – Unit tests for RouterAgent (no external deps).
"""
import pytest

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from agent_core.router_agent import RouterAgent, RouteDecision


def make_router(offline=False):
    return RouterAgent(
        gemini_threshold=0.6,
        offline_mode=offline,
        llama_model=None,
    )


class TestRouterAgentRules:
    def test_greeting_routes_local(self):
        r = make_router()
        decision = r.route("hello")
        assert decision.mode == "local"

    def test_thanks_routes_local(self):
        r = make_router()
        decision = r.route("thank you")
        assert decision.mode == "local"

    def test_stop_routes_local(self):
        r = make_router()
        decision = r.route("stop")
        assert decision.mode == "local"

    def test_code_routes_gemini(self):
        r = make_router()
        decision = r.route("write me a Python script that reads a CSV file")
        assert decision.mode == "gemini"

    def test_explain_long_routes_gemini(self):
        r = make_router()
        decision = r.route("explain how transformer neural networks work in detail")
        assert decision.mode == "gemini"

    def test_short_query_heuristic_local(self):
        r = make_router()
        decision = r.route("What is pi?")
        assert decision.mode == "local"

    def test_low_confidence_stt_routes_local(self):
        r = make_router()
        decision = r.route("mumble jumble something", low_confidence_stt=True)
        assert decision.mode == "local"
        assert decision.reason == "low_stt_confidence_clarify"

    def test_very_short_text_routes_local(self):
        r = make_router()
        decision = r.route("hi")
        assert decision.mode == "local"

    def test_empty_text_routes_local(self):
        r = make_router()
        decision = r.route("")
        assert decision.mode == "local"


class TestRouterAgentOfflineMode:
    def test_offline_forces_local_for_gemini_patterns(self):
        r = make_router(offline=True)
        # In offline mode even "heavy" queries must go local
        decision = r.route("write me a long essay about machine learning")
        assert decision.mode == "local"

    def test_offline_greeting_still_local(self):
        r = make_router(offline=True)
        decision = r.route("hello")
        assert decision.mode == "local"

    def test_offline_complex_still_local(self):
        r = make_router(offline=True)
        decision = r.route("what are the main differences between Rust and Go programming languages and which should I choose for systems programming in 2024")
        assert decision.mode == "local"


class TestRouteDecision:
    def test_decision_has_required_fields(self):
        r = make_router()
        d = r.route("hello there")
        assert isinstance(d, RouteDecision)
        assert d.mode in ("local", "gemini")
        assert isinstance(d.reason, str)
        assert 0.0 <= d.confidence <= 1.0
