# Agent Lee Voice Core – Runbook

## Service management

```bash
# Start
sudo systemctl start agentlee

# Stop
sudo systemctl stop agentlee

# Restart
sudo systemctl restart agentlee

# View logs (live)
sudo journalctl -u agentlee -f

# View recent logs
sudo journalctl -u agentlee -n 100
```

---

## Health check

```bash
curl http://localhost:8000/
# Expected: {"status":"ok","service":"Agent Lee Voice Core",...}

curl http://localhost:8000/status
# Expected: {"status":"ok","offline_mode":false,"gemini_available":true,...}
```

---

## Verification checklist

```bash
cd /path/to/agentleevoice/server
python verify.py
```

---

## Common issues

### "Piper not found" in logs

Piper binary is not on PATH. Fix:
```bash
which piper      # should return a path
# If missing, re-run: pi/setup_piper.sh (Pi) or install manually
export PATH="$PATH:/usr/local/bin"   # add to ~/.bashrc
```

### "Whisper model not loaded"

The STT model is downloading on first use. Check logs:
```bash
sudo journalctl -u agentlee -f | grep -i whisper
```

Or pre-download:
```bash
python -c "from faster_whisper import WhisperModel; WhisperModel('base.en', device='cpu')"
```

### "Local language model is not available"

No GGUF file found. Either:
1. Download a model (see docs/SETUP.md step 4)
2. Or run with the static fallback (responses will be limited)

### Barge-in latency > 500 ms

- Check server CPU load: `top`
- If Piper process takes too long to terminate, check kernel OOM settings
- On Raspberry Pi: use `base.en` Whisper model (not `small` or `medium`)

### WebSocket connection fails in browser

- Ensure server is running: `curl http://localhost:8000/`
- Check CORS_ORIGINS in `.env` includes the client origin
- In production, ensure Nginx is passing WebSocket upgrade headers correctly

### Gemini quota exceeded

- Check [Google AI Studio](https://aistudio.google.com/) for usage
- Increase `ROUTER_GEMINI_THRESHOLD` to route fewer requests to Gemini
- Review RouterAgent patterns to add more local rules

### High memory usage on Raspberry Pi

- Use `WHISPER_MODEL=tiny.en` (fastest, least RAM)
- Use a smaller GGUF (Q2_K quantisation)
- Reduce `LLAMA_CONTEXT_SIZE` to 1024

---

## Updating

```bash
git pull
cd server && pip install -r requirements.txt
cd ../client && npm install && npm run build
sudo systemctl restart agentlee
```

---

## Logs location

- **systemd**: `journalctl -u agentlee`
- **stdout/stderr**: captured by systemd journal
- **Memory DB**: `server/data/memory.db` (SQLite)

---

## Backup

```bash
# Backup conversation memory
cp server/data/memory.db backups/memory-$(date +%Y%m%d).db
```

---

## Monitoring

For production, consider adding:
- [Prometheus](https://prometheus.io/) + [Grafana](https://grafana.com/) for metrics
- A simple uptime check (`curl http://localhost:8000/ || systemctl restart agentlee`)

Quick uptime monitor (add to cron):
```bash
# crontab -e
*/5 * * * * curl -sf http://localhost:8000/ > /dev/null || sudo systemctl restart agentlee
```
