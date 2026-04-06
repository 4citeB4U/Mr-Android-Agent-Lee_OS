# Agent Lee Primetime Deployment Guide

## Overview
This document explains how Agent Lee's system is deployed for primetime readiness, with the backend (LeeWay-Edge-RTC) and frontend (agent-lee-voxel-os) both live, connected, and production-ready.

---

## Architecture

- **Frontend (agent-lee-voxel-os):**
  - Deployed on GitHub Pages (or Vercel if desired)
  - Handles UI, agent logic, LLM, memory, and user interaction
  - Connects to backend via WebSocket (VITE_VOICE_WS_URL)

- **Backend (LeeWay-Edge-RTC):**
  - Deployed on Vercel (if serverless API) or a dedicated server (for RTC/SFU)
  - Handles real-time voice, TTS, emotion, and RTC transport
  - Exposes WebSocket endpoint for Agent Lee frontend

---

## Deployment Steps

### 1. Push All Code to GitHub
- Both repos (frontend and backend) are pushed to their respective GitHub repositories.

### 2. Deploy Backend (LeeWay-Edge-RTC)
- If using Vercel:
  - Run `npx vercel --prod` in the backend directory
  - Ensure environment variables (JWT_SECRET, etc.) are set in Vercel dashboard
  - Note: For long-running RTC/SFU, use a dedicated VM or Fly.io instead of Vercel
- If using Fly.io or bare metal:
  - Follow the instructions in `docs/deployment.md` in the backend repo

### 3. Deploy Frontend (agent-lee-voxel-os)
- For GitHub Pages:
  - Push to `main` branch; GitHub Actions will deploy automatically
- For Vercel:
  - Run `npx vercel --prod` in the frontend directory

### 4. Connect the Systems
- In the frontend `.env.local`, set:
  ```
  VITE_VOICE_WS_URL=wss://<your-backend-domain>/ws
  ```
- Confirm Agent Lee connects to the backend and voice/RTC features work

---

## Verification
- Visit the frontend live URL (GitHub Pages or Vercel)
- Speak or type to Agent Lee; confirm live voice and RTC features
- Check backend logs for active connections

---

## Primetime Checklist
- [x] All code pushed to GitHub
- [x] Backend deployed and reachable
- [x] Frontend deployed and public
- [x] Environment variables set and systems connected
- [x] Agent Lee responds with live voice and RTC

---

## Repo Links
- Frontend: https://github.com/your-org/agent-lee-voxel-os
- Backend: https://github.com/4citeB4U/LeeWay-Edge-RTC

---

## Notes
- For RTC/SFU, Vercel is not recommended for production; use Fly.io, DigitalOcean, or bare metal for 24/7 reliability.
- For serverless API endpoints, Vercel is suitable.
- Update this document as deployment evolves.
