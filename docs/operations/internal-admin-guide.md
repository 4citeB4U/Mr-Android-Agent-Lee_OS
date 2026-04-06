# Agent Lee System — Internal Admin Guide

## 1. Overview
This guide explains how to use, maintain, monitor, and control the Agent Lee system (frontend and backend), including connection details, environment keys, and Vercel deployment/monitoring.

---

## 2. System Components
- **Frontend:** `agent-lee-voxel-os` (UI, agents, LLM, memory)
- **Backend:** `LeeWay-Edge-RTC-main` (voice, RTC, TTS, WebSocket server)

---

## 3. How Connections Work
- The frontend connects to the backend via WebSocket using the environment variable:
  - `VITE_VOICE_WS_URL` (example: `wss://your-vercel-backend-url/ws`)
- The backend requires a JWT secret for authentication:
  - `JWT_SECRET` (set in Vercel dashboard or .env file)
- Other backend environment variables:
  - `ANNOUNCED_IP` (public IP for RTC, if needed)
  - `PORT` (default: 3000)

---

## 4. Deploying & Verifying Backend on Vercel
1. **Login to Vercel:**
   - Run `npx vercel login` in your terminal and follow the prompts.
2. **Deploy:**
   - In the backend folder, run `npx vercel --prod`.
   - Set environment variables in the Vercel dashboard:
     - `JWT_SECRET` (generate a strong random string)
     - `ANNOUNCED_IP` (if needed)
     - `PORT` (if not default)
3. **Get the backend URL:**
   - After deploy, Vercel will show your live backend URL (e.g., `https://your-backend.vercel.app`).
4. **Set the frontend connection:**
   - In the frontend `.env.local`, set:
     ```
     VITE_VOICE_WS_URL=wss://your-backend.vercel.app/ws
     ```
5. **Verify connection:**
   - Open the frontend app and check for live voice/RTC features.
   - In Vercel, go to your backend project > "Deployments" to see status and logs.
   - Use the Vercel dashboard to view logs, restart, or redeploy as needed.

---

## 5. Monitoring & Control
- **Vercel Dashboard:**
  - Shows deployment status, logs, environment variables, and health.
  - You can redeploy, rollback, or restart from the dashboard.
- **Health Endpoints:**
  - Backend exposes `/health` (GET) for status.
  - Check `/metrics` for Prometheus/Grafana metrics.
- **Logs:**
  - View logs in Vercel dashboard (stdout/stderr from backend).
- **Frontend:**
  - GitHub Pages or Vercel dashboard (if deployed there) shows build/deploy status.

---

## 6. Maintenance
- **Update code:**
  - Make changes, commit, and push to GitHub.
  - Redeploy backend via Vercel if needed.
- **Rotate keys:**
  - Change `JWT_SECRET` in Vercel dashboard and update frontend if required.
- **Monitor health:**
  - Regularly check `/health` and logs.
- **Scaling:**
  - For heavy RTC/SFU use, consider Fly.io or a dedicated VM instead of Vercel.

---

## 7. Troubleshooting
- **Frontend not connecting:**
  - Check `VITE_VOICE_WS_URL` in frontend `.env.local`.
  - Confirm backend is live on Vercel and `/health` returns OK.
- **Backend errors:**
  - Check Vercel logs for errors.
  - Ensure all required environment variables are set.
- **Voice/RTC not working:**
  - Confirm WebSocket connection is established (browser console, backend logs).

---

## 8. Security
- Never share your `JWT_SECRET` or Vercel login with others.
- Use strong, unique secrets for all environment variables.
- Regularly review Vercel access and GitHub repo permissions.

---

## 9. Quick Reference: Keys & Variables
- **Frontend:**
  - `VITE_VOICE_WS_URL` — WebSocket URL to backend
- **Backend:**
  - `JWT_SECRET` — required for auth
  - `ANNOUNCED_IP` — public IP for RTC (if needed)
  - `PORT` — backend port (default 3000)

---

## 10. Useful Links
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub (frontend): https://github.com/your-org/agent-lee-voxel-os
- GitHub (backend): https://github.com/4citeB4U/LeeWay-Edge-RTC

---

Keep this guide for your internal use. Update as your deployment or workflow evolves.
