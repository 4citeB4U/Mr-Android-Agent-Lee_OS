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
| Gemini API key | Optional | For heavy-brain mode |

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

> **Note on llama-cpp-python**: The default pip package is CPU-only.  
> For GPU acceleration, follow [llama-cpp-python GPU installation](https://github.com/abetlen/llama-cpp-python#supported-backends).

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
GEMINI_API_KEY=your_key_here   # leave blank for offline mode
OFFLINE_MODE=0                 # set 1 on Raspberry Pi
PIPER_MODEL_PATH=./piper_models/en_US-lessac-medium.onnx
LLAMA_MODEL_PATH=./models/llama-3.2-1b-instruct.Q4_K_M.gguf
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
- Disable Gemini entirely
- Use local Whisper, llama.cpp, and Piper only
- Route all requests to `LocalBrainAgent`

This is the default mode on Raspberry Pi (see `pi/install.sh`).
