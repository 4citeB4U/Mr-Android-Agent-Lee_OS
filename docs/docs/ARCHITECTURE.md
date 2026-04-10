# Agent Lee Voice Core – Architecture

## Overview

Agent Lee Voice Core is a **production-oriented, low-latency, real-time voice conversational AI system**. It operates full-duplex, supports barge-in, and is designed to minimise leeway API usage (targeting the free tier for one primary user + up to ten testers).

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Web / Android (TWA) Client                                                │
│                                                                            │
│  ┌──────────────┐   PCM audio (binary WS frames)   ┌──────────────────┐  │
│  │ AudioCapture │ ──────────────────────────────►  │                  │  │
│  │ (AudioWorklet│                                   │  AgentLeeSocket  │  │
│  │  16 kHz mono)│   JSON events (state, transcript, │  (WebSocket)     │  │
│  └──────────────┘   tokens, audio_out metadata)    └────────┬─────────┘  │
│                                                             │             │
│  ┌──────────────┐  PCM audio (binary WS frames)            │             │
│  │ AudioPlayback│ ◄───────────────────────────────────────-┘             │
│  │ (Web Audio)  │                                                         │
│  └──────────────┘                                                         │
│        ▲                                                                   │
│        │  Barge-in: energy > threshold → stopPlayback() + sendInterrupt() │
│        │                                                                   │
└────────┼───────────────────────────────────────────────────────────────────┘
         │  WebSocket (ws:// or wss://)
┌────────┼───────────────────────────────────────────────────────────────────┐
│  FastAPI Server  (main.py + pipeline.py)                                   │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  VoicePipeline  (one instance per WebSocket connection)             │  │
│  │                                                                     │  │
│  │  Audio in                                                           │  │
│  │    │                                                                │  │
│  │    ▼                                                                │  │
│  │  ┌──────────┐  speech_start ──► interrupt TTS (barge-in)           │  │
│  │  │ VADAgent │  speech_end   ──► fire STT pipeline                   │  │
│  │  │ (Silero) │                                                       │  │
│  │  └──────────┘                                                       │  │
│  │    │ (audio frames only during speech)                              │  │
│  │    ▼                                                                │  │
│  │  ┌──────────┐  partial_transcript ──► client                       │  │
│  │  │ STTAgent │  final_transcript   ──► RouterAgent                  │  │
│  │  │ (Whisper)│                                                       │  │
│  │  └──────────┘                                                       │  │
│  │    │                                                                │  │
│  │    ▼                                                                │  │
│  │  ┌─────────────┐                                                   │  │
│  │  │ RouterAgent │──── mode=local  ──►  ┌────────────────────┐      │  │
│  │  │ (rules +    │                      │  LocalBrainAgent   │      │  │
│  │  │  llama.cpp) │                      │  (llama.cpp GGUF)  │      │  │
│  │  └─────────────┘                      └─────────┬──────────┘      │  │
│  │         │                                        │                 │  │
│  │         └─── mode=leeway ──► ┌─────────────────┐│                 │  │
│  │                              │leewayHeavyBrain  ││                 │  │
│  │                              │Agent (leeway API)││                 │  │
│  │                              └────────┬─────────┘│                │  │
│  │                                       ▼          ▼                 │  │
│  │                              streaming text tokens                  │  │
│  │                                       │                            │  │
│  │                                       ▼                            │  │
│  │                             ┌──────────────────┐                  │  │
│  │                             │  ProsodyAgent    │                  │  │
│  │                             │  (heuristics)    │                  │  │
│  │                             └────────┬─────────┘                  │  │
│  │                                      │ ProsodyPlan                 │  │
│  │                                      ▼                             │  │
│  │                             ┌──────────────────┐                  │  │
│  │                             │   TTSAgent       │                  │  │
│  │                             │   (Piper local)  │                  │  │
│  │                             └────────┬─────────┘                  │  │
│  │                                      │ PCM audio chunks            │  │
│  │                                      ▼                             │  │
│  │                             audio_out → client (binary WS)         │  │
│  │                                                                     │  │
│  │  MemoryAgent (SQLite) provides context to all LLM stages           │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Streaming & Cancellation Design

### End-to-end streaming

| Stage | Streaming mechanism |
|---|---|
| Client → Server audio | WebSocket binary frames (512-sample PCM chunks ≈ 32 ms) |
| Server STT (Whisper) | `faster-whisper` yields segments; each is forwarded as `partial_transcript` |
| Server LLM | Generator yields tokens; each forwarded as `partial_response_text` |
| Server TTS | Piper subprocess stdout piped in 4 KB chunks; each forwarded as binary audio frame |
| Server → Client audio | WebSocket binary frames, played immediately via Web Audio API |

### Cancellation (Barge-in)

A single `asyncio.Event` (`_interrupt`) is shared across all pipeline stages within a session.

**Server-side flow:**
1. VADAgent detects speech onset while AI is speaking → `_interrupt.set()`
2. `TTSAgent._kill_current()` sends `SIGKILL` to the Piper subprocess immediately
3. LLM generation loop checks `cancel_event.is_set()` on every token → exits
4. `_interrupt.clear()` is called at the start of the next pipeline run

**Client-side flow:**
1. Local energy-based VAD in `AudioCapture` detects speech while `AudioPlayback.isPlaying`
2. `AudioPlayback.stopPlayback()` cancels all scheduled `AudioBufferSourceNode` objects
3. `AgentLeeSocket.sendInterrupt()` sends `{"type":"interrupt"}` to server
4. Server pipeline acknowledges and resets to `listening` state

Target barge-in latency: **< 150 ms** (network RTT + subprocess kill + AudioContext cancel)

---

## Agent Core Modules

| Module | Responsibility |
|---|---|
| `VADAgent` | Silero VAD; emits `speech_start`/`speech_end`; drives barge-in |
| `STTAgent` | faster-whisper; streams partial + final transcripts |
| `RouterAgent` | Rules + llama.cpp; decides local vs leeway; never calls leeway offline |
| `LocalBrainAgent` | llama.cpp GGUF; handles light tasks; streaming tokens |
| `leewayHeavyBrainAgent` | leeway API; heavy tasks only; streaming; cancellable |
| `MemoryAgent` | SQLite; stores facts + turns; provides curated context snippets |
| `ProsodyAgent` | Heuristic prosody planning; accepts leeway tags when online |
| `TTSAgent` | Piper subprocess; sentence-level streaming; immediately stoppable |

---

## WebSocket Protocol

### Client → Server

| Event | Format | Description |
|---|---|---|
| `hello` | JSON | Client capabilities handshake |
| `audio` | Binary (PCM 16-bit LE, 16 kHz, mono) | Raw microphone frames |
| `interrupt` | JSON | Barge-in signal |
| `text` | JSON | Typed text input (fallback) |

### Server → Client

| Event | Format | Description |
|---|---|---|
| `state` | JSON | `listening` / `thinking` / `speaking` / `idle` |
| `partial_transcript` | JSON | Interim STT result |
| `final_transcript` | JSON | Confirmed STT result |
| `partial_response_text` | JSON | Streaming LLM token |
| `final_response_text` | JSON | Complete LLM response + route mode |
| `audio_out` | JSON (metadata) then Binary (PCM) | TTS audio chunk |
| `error` | JSON | Error code + message |

---

## Latency Targets

| Metric | Target |
|---|---|
| Time to first transcript | < 500 ms after speech start |
| Time to first AI audio | < 1200 ms after user stops speaking |
| Barge-in stop time | < 150 ms |

---

## Technology Stack

| Component | Technology |
|---|---|
| Server runtime | Python 3.11+, FastAPI, Uvicorn |
| VAD | Silero VAD (silero-vad) |
| STT | faster-whisper (CPU, int8) |
| Local LLM | llama-cpp-python (GGUF, CPU) |
| TTS | Piper (local binary) |
| Heavy AI | leeway leeway (leeway-1.5-flash, online only) |
| Memory | SQLite (via `sqlite3` stdlib) |
| Web Client | TypeScript, Vite, Web Audio API |
| Android | Trusted Web Activity (TWA) wrapping the web client |
| Cloud hosting | Cloudflare Pages (client) + any CPU VM (server) |
| Edge/offline | Raspberry Pi 8 GB (all components local) |

