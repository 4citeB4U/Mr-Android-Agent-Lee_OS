#!/usr/bin/env python3
"""
verify.py – Minimal verification checklist for Agent Lee Voice Core.

Run: python verify.py
"""
from __future__ import annotations

import importlib
import os
import shutil
import sys

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
WARN = "\033[93m!\033[0m"

results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    symbol = PASS if ok else FAIL
    suffix = f"  ({detail})" if detail else ""
    print(f"  {symbol}  {name}{suffix}")


def warn(name: str, detail: str = "") -> None:
    results.append((name, True, detail))
    print(f"  {WARN}  {name}  ({detail})")


print("\n=== Agent Lee Voice Core – Verification Checklist ===\n")

# ── 1. Config ─────────────────────────────────────────────────────────────────
print("1. Configuration")
sys.path.insert(0, os.path.dirname(__file__))
try:
    from config import settings
    check("config module imports", True)
    check("offline_mode flag present", hasattr(settings, "offline_mode"))
    check("leeway_api_key field present", hasattr(settings, "leeway_api_key"))
    if settings.offline_mode:
        warn("offline_mode=1 (leeway disabled)", "set OFFLINE_MODE=0 to enable leeway")
    elif not settings.leeway_api_key:
        warn("leeway_API_KEY not set", "leeway features disabled")
except Exception as e:
    check("config module imports", False, str(e))

# ── 2. Agent Core modules ─────────────────────────────────────────────────────
print("\n2. Agent Core modules")
for mod_name in [
    "agent_core.vad_agent",
    "agent_core.stt_agent",
    "agent_core.router_agent",
    "agent_core.local_brain_agent",
    "agent_core.leeway_heavy_brain_agent",
    "agent_core.memory_agent",
    "agent_core.prosody_agent",
    "agent_core.tts_agent",
]:
    try:
        importlib.import_module(mod_name)
        check(mod_name, True)
    except ImportError as e:
        check(mod_name, False, str(e))

# ── 3. Core Python dependencies ───────────────────────────────────────────────
print("\n3. Python dependencies")
for pkg, friendly in [
    ("fastapi", "FastAPI"),
    ("uvicorn", "Uvicorn"),
    ("websockets", "websockets"),
    ("pydantic", "Pydantic"),
    ("numpy", "NumPy"),
    ("aiofiles", "aiofiles"),
]:
    try:
        importlib.import_module(pkg)
        check(friendly, True)
    except ImportError:
        check(friendly, False, f"pip install {pkg}")

# ── 4. ML dependencies (optional – large) ─────────────────────────────────────
print("\n4. ML dependencies (optional)")
for pkg, friendly in [
    ("faster_whisper", "faster-whisper (STT)"),
    ("torch", "PyTorch (Silero VAD)"),
    ("llama_cpp", "llama-cpp-python (local LLM)"),
    ("leeway.generativeai", "leeway-generativeai (leeway)"),
]:
    try:
        importlib.import_module(pkg)
        check(friendly, True)
    except ImportError:
        warn(friendly, "not installed – see docs/SETUP.md")

# ── 5. Model files ────────────────────────────────────────────────────────────
print("\n5. Model files")
try:
    from config import settings as s
    piper_ok = os.path.isfile(s.piper_model_path)
    check(f"Piper model: {s.piper_model_path}", piper_ok,
          "" if piper_ok else "run: make download-piper-model")
    llama_ok = os.path.isfile(s.llama_model_path)
    check(f"Llama model: {s.llama_model_path}", llama_ok,
          "" if llama_ok else "download from HuggingFace – see docs/SETUP.md")
except Exception:
    warn("Could not check model files (config error)")

# ── 6. External binaries ──────────────────────────────────────────────────────
print("\n6. External binaries")
for binary in ["piper", "ffmpeg"]:
    found = shutil.which(binary) is not None
    if found:
        check(binary, True)
    else:
        warn(binary, "not found on PATH – see docs/SETUP.md")

# ── 7. Data directory ─────────────────────────────────────────────────────────
print("\n7. Data directory")
try:
    from config import settings as s
    data_dir = os.path.dirname(s.memory_db_path)
    if os.path.isdir(data_dir):
        check("data directory exists", True, data_dir)
    else:
        warn("data directory missing", f"run: mkdir -p {data_dir}")
except Exception:
    warn("Could not check data directory")

# ── 8. WebSocket protocol ─────────────────────────────────────────────────────
print("\n8. WebSocket protocol")
try:
    from websocket_protocol import (
        make_state, make_error, AgentState, HelloEvent, RouteMode
    )
    msg = make_state(AgentState.LISTENING)
    check("make_state() works", msg["type"] == "state")
    msg = make_error("test", "test error")
    check("make_error() works", msg["type"] == "error")
except Exception as e:
    check("websocket_protocol", False, str(e))

# ── 9. Router logic ───────────────────────────────────────────────────────────
print("\n9. Router logic")
try:
    from agent_core.router_agent import RouterAgent
    r = RouterAgent(offline_mode=False)
    d = r.route("hello")
    check("'hello' routes to local", d.mode == "local")
    d2 = r.route("write me a Python script to parse JSON")
    check("'write script' routes to leeway", d2.mode == "leeway")
    r2 = RouterAgent(offline_mode=True)
    d3 = r2.route("write me a complex analysis of machine learning trends")
    check("offline mode forces local", d3.mode == "local")
except Exception as e:
    check("router_agent", False, str(e))

# ── 10. Memory agent ──────────────────────────────────────────────────────────
print("\n10. Memory agent")
try:
    import tempfile
    from agent_core.memory_agent import MemoryAgent
    with tempfile.TemporaryDirectory() as tmp:
        m = MemoryAgent(db_path=os.path.join(tmp, "test.db"))
        m.load()
        m.remember("test_key", "test_value", "test_session")
        facts = m.retrieve(session_id="test_session")
        check("remember + retrieve works", facts.get("test_key") == "test_value")
        m.add_turn("user", "hello", "test_session")
        turns = m.get_recent_turns(5, "test_session")
        check("add_turn + get_recent_turns works", len(turns) == 1)
        m.close()
except Exception as e:
    check("memory_agent", False, str(e))

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "=" * 52)
passed = sum(1 for _, ok, _ in results if ok)
total = len(results)
print(f"  {passed}/{total} checks passed")
if passed == total:
    print(f"  {PASS} All checks passed. System is ready.")
else:
    failed = [(n, d) for n, ok, d in results if not ok]
    print(f"  {FAIL} {len(failed)} check(s) failed:")
    for name, detail in failed:
        print(f"       - {name}: {detail}")
print()

