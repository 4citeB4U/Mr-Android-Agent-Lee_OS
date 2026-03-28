"""
LEEWAY HEADER -- DO NOT REMOVE

REGION: BRAIN
TAG: BRAIN.MAIN.FASTAPI_SERVER
PURPOSE: Agent Lee Brain Server - TTS, Emotion, Slang, Voice WebSocket
SECURITY: LEEWAY-CORE-2026 compliant — sovereign handshake enforced
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
"""

import io
import os
import sys
import json
import logging
from typing import Optional

from fastapi import FastAPI, WebSocket, Header, HTTPException, Query, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import uvicorn

# Add brain root to path so modules are importable
sys.path.insert(0, os.path.dirname(__file__))

from modules.emotional_engine import score_emotion
from modules.slang_engine import build_slang_persona_block, get_runtime_slang_context, get_lexicon_stats

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("brain")

app = FastAPI(title="Agent Lee Brain Server", version="2.0.0")

# ── CORS (same allowed origins as backend) ─────────────────────────────────────
ALLOWED_ORIGINS = [
    "http://localhost:7000",
    "http://localhost:7010",
    "http://127.0.0.1:7000",
    "http://127.0.0.1:7010",
    "https://appassets.androidplatform.net",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Configuration ───────────────────────────────────────────────────────────────
SOVEREIGN_TOKEN: str = os.environ.get("NEURAL_HANDSHAKE", "AGENT_LEE_SOVEREIGN_V1")
AGENT_LEE_VOICE: str = "en-US-GuyNeural"
MAX_TTS_CHARS: int = 500
ALLOWED_VOICES: set = {
    "en-US-GuyNeural",
    "en-US-JennyNeural",
    "en-US-ChristopherNeural",
    "en-US-EricNeural",
}


def _require_handshake(token: str) -> None:
    """Raise 401 if token does not match sovereign token."""
    if token != SOVEREIGN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized — sovereign handshake required")


# ── Health ──────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "brain_online",
        "tts_engine": "edge-tts",
        "voice": AGENT_LEE_VOICE,
        "version": "2.0.0",
        "modules": ["emotional_engine", "slang_engine"],
    }


# ── TTS (GET streaming) ─────────────────────────────────────────────────────────
@app.get("/tts")
async def tts_get(
    text: str = Query(..., max_length=MAX_TTS_CHARS),
    voice: str = Query(default=AGENT_LEE_VOICE, max_length=60),
    x_neural_handshake: str = Header(default=""),
):
    """Synthesize speech and stream MP3 audio back to caller."""
    _require_handshake(x_neural_handshake)

    if voice not in ALLOWED_VOICES:
        voice = AGENT_LEE_VOICE

    try:
        import edge_tts  # lazy import — fails gracefully if not installed
    except ImportError:
        raise HTTPException(status_code=503, detail="edge-tts not installed. Run: pip install edge-tts")

    try:
        communicate = edge_tts.Communicate(text, voice)
        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])
        audio_buffer.seek(0)
        log.info(f"TTS synthesized {len(text)} chars with voice={voice}")
        return StreamingResponse(audio_buffer, media_type="audio/mpeg")
    except Exception as exc:
        log.error(f"TTS error: {exc}")
        raise HTTPException(status_code=500, detail="TTS synthesis failed")


# ── TTS (POST — for body-based requests from frontend) ─────────────────────────
@app.post("/tts")
async def tts_post(
    payload: dict,
    x_neural_handshake: str = Header(default=""),
):
    text = str(payload.get("text", ""))[:MAX_TTS_CHARS]
    voice = str(payload.get("voice", AGENT_LEE_VOICE))
    if voice not in ALLOWED_VOICES:
        voice = AGENT_LEE_VOICE
    _require_handshake(x_neural_handshake)

    try:
        import edge_tts
    except ImportError:
        raise HTTPException(status_code=503, detail="edge-tts not installed")

    communicate = edge_tts.Communicate(text, voice)
    audio_buffer = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_buffer.write(chunk["data"])
    audio_buffer.seek(0)
    return StreamingResponse(audio_buffer, media_type="audio/mpeg")


# ── Voice WebSocket (streaming TTS) ────────────────────────────────────────────
@app.websocket("/ws/voice")
async def voice_socket(websocket: WebSocket):
    """
    WebSocket TTS stream.
    - First text message must be the sovereign token.
    - Subsequent text messages are synthesized and returned as audio bytes.
    """
    await websocket.accept()

    # Auth handshake — first message
    try:
        token = await websocket.receive_text()
    except WebSocketDisconnect:
        return
    if token != SOVEREIGN_TOKEN:
        await websocket.close(code=4401)
        log.warning("WS /ws/voice rejected — bad handshake")
        return

    try:
        import edge_tts
    except ImportError:
        await websocket.send_text("ERROR: edge-tts not installed on server")
        await websocket.close()
        return

    await websocket.send_text("READY")
    log.info("WS /ws/voice client authenticated")

    try:
        while True:
            text = await websocket.receive_text()
            if not text or len(text) > MAX_TTS_CHARS:
                await websocket.send_text(f"ERROR: text must be 1–{MAX_TTS_CHARS} chars")
                continue
            communicate = edge_tts.Communicate(text, AGENT_LEE_VOICE)
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    await websocket.send_bytes(chunk["data"])
            # Signal end-of-utterance
            await websocket.send_text("DONE")
    except WebSocketDisconnect:
        log.info("WS /ws/voice client disconnected")


# ── Emotion scoring ─────────────────────────────────────────────────────────────
@app.post("/emotion")
async def emotion(
    payload: dict,
    x_neural_handshake: str = Header(default=""),
):
    _require_handshake(x_neural_handshake)
    text = str(payload.get("text", ""))[:2000]
    env = payload.get("env")
    history = payload.get("history")
    result = score_emotion(text, env=env, history=history)
    return JSONResponse(content=result)


# ── Slang injection ─────────────────────────────────────────────────────────────
@app.post("/slang")
async def slang(
    payload: dict,
    x_neural_handshake: str = Header(default=""),
):
    _require_handshake(x_neural_handshake)
    text = str(payload.get("text", ""))[:2000]
    context = get_runtime_slang_context(text)
    persona_block = build_slang_persona_block()
    stats = get_lexicon_stats()
    return JSONResponse(content={"context": context, "persona_block": persona_block, "stats": stats})


# ── Entry point ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("BRAIN_PORT", 7004))
    log.info(f"Agent Lee Brain Server starting on 0.0.0.0:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
