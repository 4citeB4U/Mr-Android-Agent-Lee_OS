# Agent Lee Voice Core – Setup Guide

## Prerequisites

| Tool | Required | Notes |
|---|---|---|
| Python 3.11+ | Yes | |
| Node.js 20+ | Yes | For web client |
| pip | Yes | |
| npm | Yes | |
| `piper` binary | Yes (TTS) | See below |
| GGUF model file | Recommended | Local LLM routing |
| leeway API key | (DISABLED) | All inference is local except explicit automation |

---

## 1. Clone & configure

```bash
git clone https://github.com/4citeB4U/agentleevoice.git
cd agentleevoice
cp .env.example .env
# Edit .env with your values
```

---

## 2. Install Python dependencies

```bash
make install-server
# or: cd server && pip install -r requirements.txt
```


---

## LeeWay-Compliant Local Model Workflow (2026)

**All inference is performed locally using Ollama models. No leeway fallback is used except for explicit automation.**

**Registered execution-layer models:**
- **gemma4:e2b** — Reasoning, general LLM tasks
- **qwen2.5vl:3b** — Vision, multimodal/image tasks
- **qwen2.5-coder:1.5b** — Code and database tasks

**How it works:**
- All model requests are routed through the SLMRouter and VisionAgent.
- Only the above models are registered as execution-layer tools.
- No direct model-to-UI wiring; all model use is agent-orchestrated.
- leeway and other cloud APIs are disabled for inference except for explicit automation or fallback by user override.

**Configuration:** See `.env` and `.env.local` for model endpoints and selection. All models are stored in `E:\ollama-models`.

---

## 3. Install Piper TTS

Piper is a local TTS engine. Install the binary for your platform:

**Linux (x86_64):**
```bash
wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz
tar -xzf piper_linux_x86_64.tar.gz
sudo mv piper /usr/local/bin/piper
```

**macOS:**
```bash
brew install piper-tts  # if available, or build from source
```

**Verify:**
```bash
piper --version
```

### Download a Piper voice model

```bash
make download-piper-model
# Downloads en_US-lessac-medium.onnx to ./piper_models/
```

Or download manually from [Piper voices](https://github.com/rhasspy/piper/releases) and set `PIPER_MODEL_PATH` in `.env`.

---

## 4. Download a local LLM (GGUF)

The router and local brain use a small quantised GGUF model. Recommended for CPU:

```bash
# Llama 3.2 1B (fast, low RAM)
mkdir -p models
wget -O models/llama-3.2-1b-instruct.Q4_K_M.gguf \
  https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf
```

Set `LLAMA_MODEL_PATH=./models/llama-3.2-1b-instruct.Q4_K_M.gguf` in `.env`.

If you don't have a GGUF model the server will still work — the pipeline falls back to a static reply indicating the LLM is unavailable.

---

## 5. Install web client dependencies

```bash
make install-client
# or: cd client && npm install
```

---

## 6. Set environment variables

Edit `.env`:

```env

# leeway API key is now disabled. All inference is local.
# leeway_API_KEY=  # (disabled)
OFFLINE_MODE=1
PIPER_MODEL_PATH=./piper_models/en_US-lessac-medium.onnx
# Ollama models are used for all LLM, vision, and code tasks:
#   gemma4:e2b, qwen2.5vl:3b, qwen2.5-coder:1.5b
```

---

## 7. Run locally

```bash
# Terminal 1 – server
make server

# Terminal 2 – client dev server
make client
```

Or both at once (background server + foreground client):
```bash
make dev
```

Open **http://localhost:5173** in your browser.

---

## 8. Verify the installation

```bash
cd server && python verify.py
```

---

## 9. Run tests

```bash
make test
```

---

## Offline mode

Set `OFFLINE_MODE=1` in `.env`. The server will:
- Disable leeway entirely
- Use local Whisper, llama.cpp, and Piper only
- Route all requests to `LocalBrainAgent`

This is the default mode on Raspberry Pi (see `pi/install.sh`).

