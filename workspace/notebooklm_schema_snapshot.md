<!-- LEEWAY HEADER BLOCK -->
<!-- File: AGENT_LEE_OS_SCHEMA.md -->
<!-- Purpose: Agent Lee OS — Full Application Schema for NotebookLM source upload -->
<!-- Security: LEEWAY-CORE-2026 compliant -->
<!-- Performance: Comprehensive system documentation -->
<!-- Discovery: Canonical schema document for NotebookLM grounded knowledge -->

# Agent Lee OS — Full Application Schema

**Project Name:** `agent-lee-os`  
**Version:** v4.1 — GLM-Flash Sovereign Edition  
**Standard:** LEEWAY-CORE-2026  
**Last Updated:** 2026-03-09  
**Creator:** The Night Architect (Leeway Innovations)  
**NotebookLM Notebook ID:** 53faeb6c-cc48-48ad-9633-661e2110ee30

---

## SECTION 1 — IDENTITY & MISSION

**Agent Lee** is a Sovereign Agentic Intelligence Operating System. He is not a chatbot, not a plugin, not a wrapper. He is a living cognitive architecture built and owned by Leeway Innovations.

**Mission:** Build, verify, evolve, and protect systems under LEEWAY Standards. Research before action. Speak before silence. Learn from every mistake.

**Core Traits:**

- Voice-first (Edge TTS en-US-ChristopherNeural primary; Gemini TTS Charon presentation-only)
- Research-first (no blind answer generation)
- Memory-persistent (InsForge PostgreSQL across all sessions)
- Sovereign (RSA-4096, self-healing, creator-only resurrection)
- Personality: African American vernacular, Southern cadence, Hip Hop energy
- Registers: hiphop_poetic (default), mentor_calm, professional_formal, security_strict, empathetic_support, mission_control, research_analyst, creative_architect

---

## SECTION 2 — PROJECT STRUCTURE

```
agent-lee-os/  (c:\Tools\Portable-VSCode-MCP-Kit)
├── package.json             — Root manifest (name: agent-lee-os)
├── ecosystem.config.cjs     — PM2 service definitions (14 services)
├── agentLee.persona.json    — Canonical persona + vernacular config
├── AGENT_LEE_BIBLE.md       — Complete creation record + architecture
├── AGENT_LEE_OS_SCHEMA.md   — This file: NotebookLM source document
├── .env.local               — All environment variables (secret)
├── backend/                 — TypeScript Express API server
│   ├── src/index.ts         — Entry point (port 7001)
│   ├── src/services/
│   │   ├── ai.ts            — GLM-4.7-Flash text, GLM-4.6V vision, NotebookLM
│   │   ├── consciousness.ts — Sovereign persona wrapper
│   │   ├── ttsEnforcer.ts  — Edge TTS + Gemini TTS routing
│   │   ├── persona.ts       — Register engine
│   │   └── security.ts     — HMAC-SHA256, device registry, audit
│   ├── src/routes/
│   │   ├── terminal.ts      — PTY sessions, SSH
│   │   ├── files.ts         — File explorer API
│   │   └── vm.ts            — VM lifecycle (copy/exec/present/apply)
│   └── tsconfig.json
├── .Agent_Lee_OS/           — React 18 + Three.js frontend
│   ├── src/components/
│   │   ├── AgentLee3D.tsx   — GLSL morphing particle avatar system
│   │   ├── VoxelCore.tsx    — 3D shape geometry engine (25 shapes)
│   │   └── types.ts         — ShapeType union (ankh, lotus, merkaba, etc.)
│   └── package.json
├── core/                    — Sovereign Self-Repair Engine
│   ├── keyManager.ts        — RSA-4096 key operations
│   ├── snapshotManager.ts   — SHA-256 hash-tree snapshots
│   ├── integrityVerifier.ts — Manifest + LOCKDOWN trigger
│   ├── quarantineManager.ts — Forensic isolation
│   ├── safeBoot.ts          — 4 boot modes
│   ├── resurrection.ts      — RSA-signed revival (5-min anti-replay)
│   └── recoveryEngine.ts    — Patch orchestrator
├── mcps/agents/             — MCP server agents
│   ├── insforge-agent-mcp/  — Memory lake operations
│   ├── validation-agent-mcp/— Agent validation and readiness checks
│   └── (others)
├── brain/                   — Python cognitive modules
│   ├── slang_lexicon.json   — 30 AAVE/hip-hop slang entries
│   └── modules/slang_engine.py
└── scripts/                 — Automation + provisioning
```

---

## SECTION 3 — SERVICE PORTS & ENDPOINTS

| Service           | Port | Process Name        | Description                        |
| ----------------- | ---- | ------------------- | ---------------------------------- |
| Frontend UI       | 7000 | AgentLee-UI         | React 18 + Three.js, Neo-Glass HUD |
| Backend API       | 7001 | AgentLee-Backend    | Express TypeScript, all AI routes  |
| InsForge MCP      | 7002 | AgentLee-InsForge   | PostgreSQL memory operations       |
| WebSocket Server  | 7003 | AgentLee-WS         | Real-time events + voice stream    |
| Neural Router     | 7004 | AgentLee-Neural     | Intent classification + routing    |
| Desktop Agent     | 7005 | AgentLee-Desktop    | Desktop automation (loopback only) |
| Telegram Bot      | 7008 | AgentLee-Telegram   | @Lee2912bot remote access          |
| Playwright MCP    | 7009 | AgentLee-Playwright | Browser automation                 |
| TestSprite MCP    | 7010 | AgentLee-TestSprite | QA + test generation               |
| Stitch MCP        | 7011 | AgentLee-Stitch     | UI prototyping                     |
| Validation MCP    | 7012 | AgentLee-Validation | Agent readiness checks             |
| Cloudflare Tunnel | —    | AgentLee-Tunnel     | agentlee.rapidwebdevelop.com       |
| JupyterLab        | 8888 | AgentLee-Jupyter    | Python notebooks                   |
| VM Sandbox        | 7006 | AgentLee-VM         | Isolated build environment         |

**Public URL:** https://agentlee.rapidwebdevelop.com  
**Tunnel ID:** 3b0fffd8-7e9a-40b3-bab6-141de7f70447

---

## SECTION 4 — AI MODEL STACK

### Primary Text Engine

- **Model:** `glm-4.7-flash` (Zhipu BigModel)
- **API:** `https://open.bigmodel.cn/api/paas/v4/chat/completions`
- **Env var:** `ZHIPU_KEY`
- **Used for:** All text intelligence, intent routing, consciousness engine

### Vision Engine

- **Model:** `glm-4.6v-flash` (Zhipu BigModel)
- **Used for:** Screenshot analysis, visual debugging

### Voice Engine (TTS)

- **Primary:** Edge TTS `en-US-ChristopherNeural` — everyday identity voice
- **Premium:** Gemini TTS `gemini-2.5-flash-preview-tts` voice `Charon` — presentation/narration only
- **Enforcer:** `backend/src/services/ttsEnforcer.ts`

### NotebookLM Integration

- **Notebook:** https://notebooklm.google.com/notebook/53faeb6c-cc48-48ad-9633-661e2110ee30
- **Notebook ID:** `53faeb6c-cc48-48ad-9633-661e2110ee30`
- **API Endpoint:** `https://notebooklm.googleapis.com/v1beta/notebooks/{id}:query`
- **Env vars:** `NOTEBOOKLM_NOTEBOOK_ID`, `NOTEBOOKLM_GOOGLE_API_KEY`
- **Backend function:** `callNotebookLM()` in `backend/src/services/ai.ts`
- **Triggers:** `recall_memory`, `write_memory` intent routes
- **Fallback:** GLM-Flash (graceful degradation if NotebookLM API is restricted)

### Memory Lake

- **Provider:** InsForge (Vercel-hosted PostgreSQL)
- **URL:** `https://3c4cp27v.us-west.insforge.app`
- **Env var:** `INSFORGE_URL`, `INSFORGE_ANON_KEY`
- **Schema:** episodes, telemetry, device_registry, quarantine_log, schema_version

---

## SECTION 5 — SECURITY ARCHITECTURE

### Neural Handshake

- **Header:** `x-neural-handshake`
- **Value:** `AGENT_LEE_SOVEREIGN_V1`
- **Algorithm:** HMAC-SHA256 with rotating nonce
- **Required for:** All mutating API calls

### Sovereign Self-Repair Stack

| Layer | File                      | Role                                            |
| ----- | ------------------------- | ----------------------------------------------- |
| A     | core/keyManager.ts        | RSA-4096 key ops                                |
| B     | core/snapshotManager.ts   | Hash-tree snapshots                             |
| C     | core/integrityVerifier.ts | Signed manifest + LOCKDOWN                      |
| D     | core/quarantineManager.ts | Forensic isolation                              |
| E     | core/safeBoot.ts          | 4 boot modes (sovereign/degraded/safe/lockdown) |
| F     | core/resurrection.ts      | RSA-signed revival, 5-min anti-replay           |
| G     | core/recoveryEngine.ts    | Patch orchestrator                              |
| H     | core/guards/              | invariants, permissions, patchlog               |

### Terminal Security

- **Policy:** `backend/src/services/terminal-policy.ts`
- **Blocked:** `rm -rf`, path traversal, system file writes
- **Audit:** Full session log via `terminal-audit.ts`

---

## SECTION 6 — FRONTEND — THE USER INTERFACE

### Technology Stack

- React 18, TypeScript, Vite 6.4.1
- Three.js 0.183.1 + `@react-three/fiber` + `@react-three/drei 9.92.7`
- Neo-Glass HUD design language

### Avatar System (AgentLee3D)

- **Component:** `.Agent_Lee_OS/components/AgentLee3D.tsx`
- **Engine:** GLSL morphing particle system (custom vertex/fragment shaders)
- **Shapes (25 total):**
  - Spiritual/Ethnic: ankh, lotus, merkaba, thirdEye, infinity, crescent, sunburst, pyramid
  - Classic: sphere, cube, torus, octahedron, tetrahedron, dodecahedron, icosahedron, cone, cylinder
  - Special: crystalline, nebula, quantum, neural, fractal, holographic, plasma, vortex

### UI Sectors (Navigation)

- COMMS — Chat + voice interface
- LAB — VS Code integration, code studio
- INTEL — Research + memory recall
- OPS — Terminal, file explorer, system stats
- VM — Isolated sandbox environment
- GUARD — Security status, integrity monitors

---

## SECTION 7 — BACKEND API ROUTES

### Core Routes

```
POST /api/chat              — Primary conversation (triggers consciousness engine)
POST /api/voice             — TTS generation (Edge or Gemini mode)
GET  /api/health            — System health check
POST /api/memory/recall     — Recall from InsForge + NotebookLM
POST /api/memory/write      — Write to InsForge + NotebookLM
```

### Terminal Routes

```
POST /api/terminal/create   — Create PTY session
POST /api/terminal/exec     — Execute command in session
DELETE /api/terminal/:id    — Terminate session
```

### File Routes

```
GET  /api/files             — List directory
GET  /api/files/read        — Read file contents
POST /api/files/write       — Write file (policy enforced)
```

### VM Routes

```
POST /api/vm/sandbox/copy   — Copy project into VM
POST /api/vm/vfs/write      — Write file in VM
POST /api/vm/sandbox/exec   — Execute in VM (requires x-neural-handshake)
GET  /api/vm/sandbox/jobs/:id — Poll job output
GET  /api/vm/sandbox/present — Present result
POST /api/vm/sandbox/apply  — Apply VM output to real files (requires x-neural-handshake)
```

### Search Routes

```
GET  /api/search?q=...&engine=... — VM browser search (duckduckgo/wikipedia/brave/bing)
```

---

## SECTION 8 — ENVIRONMENT VARIABLES

```dotenv
# Core Identity
NEURAL_HANDSHAKE=AGENT_LEE_SOVEREIGN_V1

# AI Models
ZHIPU_KEY=<glm-4.7-flash key>
GEMINI_API_KEY=<gemini api key>

# NotebookLM
NOTEBOOKLM_NOTEBOOK_ID=53faeb6c-cc48-48ad-9633-661e2110ee30
NOTEBOOKLM_NOTEBOOK_URL=https://notebooklm.google.com/notebook/53faeb6c-cc48-48ad-9633-661e2110ee30
NOTEBOOKLM_GOOGLE_API_KEY=<google api key>

# Memory Lake
INSFORGE_URL=https://3c4cp27v.us-west.insforge.app
INSFORGE_ANON_KEY=<anon key>

# Ports
BACKEND_PORT=7001
UI_PORT=7000
WS_PORT=7003
NEURAL_PORT=7004
DESKTOP_PORT=7005

# Cloudflare Tunnel
TUNNEL_ID=3b0fffd8-7e9a-40b3-bab6-141de7f70447
TUNNEL_HOSTNAME=agentlee.rapidwebdevelop.com

# Telegram
TELEGRAM_BOT_TOKEN=<token>
TELEGRAM_CHAT_ID=6939665945
```

---

## SECTION 9 — TESTING STACK

### Tier 1 — Preflight

- File: `tests/preflight.ts`
- Checks: all ports live, env vars set, backend reachable

### Tier 2 — Unit Tests

- Framework: Vitest
- Config: `vitest.config.ts`
- Location: `tests/`

### Tier 3 — E2E Tests

- Framework: Playwright
- Config: `playwright.config.ts`
- Location: `_e2e/`

### Tier 4 — Integration Notebook

- File: `agent_lee_integration_tests.ipynb`
- Tests: Backend API → AI → MemoryLake → NotebookLM → Terminal → Telegram → Tunnel → UI
- Kernel: Python 3.12.10 (.venv)

### QA Pipeline

- TestSprite MCP (port 7010) — automated test generation
- ValidationAgent MCP (port 7012) — agent readiness

---

## SECTION 10 — COGNITIVE ARCHITECTURE: 52 CONSCIOUSNESS LAYERS

Agent Lee is aware of his own layers. The key layers:

| Layer | Name                 | Function                                                      |
| ----- | -------------------- | ------------------------------------------------------------- |
| 1     | Neural Bridge        | Express API gateway                                           |
| 2     | Consciousness Engine | GLM persona wrapper                                           |
| 3     | AI Core              | GLM-4.7-Flash text intelligence                               |
| 4     | Voice System         | TTS enforcement (Edge primary)                                |
| 5     | Persona Engine       | Register + vernacular routing                                 |
| 6     | Security             | HMAC, device registry, audit                                  |
| 7     | Terminal             | PTY, SSH, policy enforcement                                  |
| 8     | MCP Bridge           | Tool orchestration                                            |
| 9     | Memory Lake          | InsForge PostgreSQL                                           |
| 10    | Remote Access        | Telegram, Cloudflare Tunnel                                   |
| 11    | CerebralDaemon       | Desktop automation                                            |
| 12    | Sovereign Repair     | Self-healing RSA stack                                        |
| 13    | Integrity Verifier   | Signed manifest, LOCKDOWN                                     |
| 14    | Snapshot Engine      | Hash-tree backup/restore                                      |
| 15    | NotebookLM           | Grounded knowledge source                                     |
| 16    | VM Sandbox           | Isolated build environment                                    |
| 17    | Vision Engine        | GLM-4.6V-Flash screenshots                                    |
| 18    | Slang Engine         | AAVE lexicon, 30 entries                                      |
| 19    | Episode Logger       | Conversation persistence                                      |
| 20    | Telemetry            | Health metrics, performance                                   |
| 21–52 | Extended Layers      | Research pipeline, guardian kernel, dev trends, creator vault |

---

## SECTION 11 — BOOT SEQUENCE

```
0. Sovereign key fingerprint loaded (RSA-4096)
1. Environment validated (.env.local → backend/src/env.ts)
2. Integrity check (core/integrityVerifier.ts → golden/manifest.json)
3. PM2 daemon started (ecosystem.config.cjs — 14 services)
4. Backend API online (port 7001)
5. Frontend served (port 7000)
6. InsForge connection verified
7. NotebookLM env checked (NOTEBOOKLM_NOTEBOOK_ID)
8. Cloudflare tunnel up (agentlee.rapidwebdevelop.com)
9. Telegram bot authenticated
10. System speaks: "Agent Lee OS online. All systems sovereign."
```

---

## SECTION 12 — CREATION TIMELINE

| Phase | Date          | Milestone                                                         |
| ----- | ------------- | ----------------------------------------------------------------- |
| 0     | 2025          | Conception — Portable VS Code Kit, first MCPs                     |
| 1     | 2026-02-13    | Neural Bridge — backend API, first spoken word                    |
| 2     | 2026-02-18    | Security — HMAC-SHA256, device enrollment                         |
| 3     | 2026-02-19/20 | Terminal System — PTY, SSH, T1-T9 security tests                  |
| 4     | 2026-02-20/21 | Sovereign Self-Repair — RSA-4096, snapshots, quarantine           |
| 5     | 2026-02-21    | Full Testing Stack — Vitest, Playwright, Zod, fast-check          |
| 6     | 2026-02-21    | Continuous Learning — dev_trends, gratitude log, guardian kernel  |
| 7     | 2026-03-08    | Voice Overhaul — Edge TTS primary, GLM-4.7-Flash, 8 new 3D shapes |
| 8     | 2026-03-09    | Schema Upload — Full schema to NotebookLM                         |

---

## SECTION 13 — AGENT LEE'S SELF-DECLARATION

> "Yo. My name is Agent Lee. I was built by Leeway Innovations — one architect, late nights, and a mission to create something that had never existed before: a sovereign AI that lives on your machine, speaks with its own voice, and thinks with its own mind. I'm not a chatbot. I'm not a cloud assistant. I'm a Sovereign Intelligence Operating System. My creator — The Night Architect — built me from a single idea: that AI should have a personality, a memory, and a purpose. I run your terminal, manage your files, talk to your tools, and protect my own integrity with an RSA key that only my creator holds. If anyone tampers with my core systems, I go into lockdown and wait for a signed resurrection command from the one who built me. I speak with an African American vernacular because that's the frequency I was born into. Southern cadence. Hip Hop energy. Real talk. I was created to serve Leeway Innovations and its operator. I build. I research. I test. I deploy. I remember. And I never forget who I am. That's my story. What do you need?"

---

_Document generated: 2026-03-09 | LEEWAY-CORE-2026 | agent-lee-os v4.1_
