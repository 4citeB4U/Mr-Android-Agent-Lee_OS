# Agent Lee Voice Core – Deployment Guide

---

## Option A: Cloud VM (online mode)

### Requirements
- Ubuntu 22.04 LTS VM with ≥ 2 vCPU, ≥ 4 GB RAM
- Public IP or domain name
- Ports 80/443 (HTTPS) and 8000 (or reverse-proxy)

### 1. Set up the VM

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.11 python3.11-venv python3-pip git nginx certbot python3-certbot-nginx
```

### 2. Clone and configure

```bash
git clone https://github.com/4citeB4U/agentleevoice.git
cd agentleevoice
cp .env.example .env
# Edit .env:
#   GEMINI_API_KEY=<your key>
#   HOST=0.0.0.0
#   PORT=8000
```

### 3. Install server dependencies

```bash
cd server
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Install Piper + download voice model

```bash
wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz
tar -xzf piper_linux_x86_64.tar.gz -C /usr/local/bin/
make download-piper-model
```

### 5. Download GGUF model

```bash
mkdir -p models
wget -O models/llama-3.2-1b-instruct.Q4_K_M.gguf \
  https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf
```

### 6. Build the web client

```bash
cd ../client
npm install
npm run build
# → client/dist/ is the static site
```

### 7. Deploy web client to Cloudflare Pages

```bash
# Install Wrangler
npm install -g wrangler
cd client
wrangler pages deploy dist --project-name=agent-lee-voice
```

Or drag-and-drop `client/dist/` into the Cloudflare Pages dashboard.

Set the Cloudflare Pages environment variable:
```
VITE_WS_URL=wss://your-server-domain.com/ws
```

Then rebuild the client before deploying.

### 8. Run the server as a systemd service

```bash
sudo cp pi/systemd/agentlee.service /etc/systemd/system/
# Edit the service file – update paths and User
sudo systemctl daemon-reload
sudo systemctl enable agentlee
sudo systemctl start agentlee
```

### 9. Nginx reverse proxy with TLS

```nginx
# /etc/nginx/sites-available/agentlee
server {
    listen 443 ssl;
    server_name your-server-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-server-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-server-domain.com/privkey.pem;

    location /ws {
        proxy_pass         http://127.0.0.1:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "Upgrade";
        proxy_set_header   Host $host;
        proxy_read_timeout 3600;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/agentlee /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-server-domain.com
sudo nginx -t && sudo systemctl reload nginx
```

---

## Option B: Raspberry Pi (offline mode)

### Requirements
- Raspberry Pi 4 / 5 with 8 GB RAM
- Raspberry Pi OS (64-bit) Bookworm
- 32 GB+ SD card or SSD

### Quick install

```bash
git clone https://github.com/4citeB4U/agentleevoice.git
cd agentleevoice
bash pi/install.sh
```

The install script:
1. Installs system dependencies
2. Creates a Python virtual environment
3. Downloads Piper (ARM64 build)
4. Downloads the voice model
5. Optionally downloads a small GGUF model
6. Installs the systemd service
7. Sets `OFFLINE_MODE=1` automatically

### Manual steps

See `pi/install.sh` for the full procedure.

### LAN access

After starting the service:
```bash
# Find the Pi's IP address
hostname -I

# Access from another device on the same LAN:
# http://<pi-ip>:8000/app
```

---

## Android App (TWA)

The Android app wraps the web client as a Trusted Web Activity.

### Requirements
- Android Studio
- Digital Asset Links file hosted at `https://your-domain.com/.well-known/assetlinks.json`

### Steps
1. Open `android/` in Android Studio (create with [PWABuilder](https://www.pwabuilder.com/) or [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap))
2. Set your Cloudflare Pages URL as the TWA origin
3. Build a signed APK/AAB
4. Deploy to Google Play or side-load

Since the UI is served by Cloudflare Pages (single codebase), the Android app stays in sync automatically.

---

## Environment Variables Reference

See `.env.example` for the full list. Key variables:

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | _(empty)_ | Gemini API key (online mode) |
| `OFFLINE_MODE` | `0` | Set `1` to disable Gemini |
| `WHISPER_MODEL` | `base.en` | faster-whisper model size |
| `LLAMA_MODEL_PATH` | `./models/…gguf` | Path to GGUF file |
| `PIPER_MODEL_PATH` | `./piper_models/…onnx` | Piper voice model |
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `8000` | Server port |
