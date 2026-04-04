<!--
DOC_CLASS: REFERENCE
DOC_ID: reference.full-stack-manifest
OWNER: Leonard J Lee / Leeway Innovations
LAST_UPDATED: 2026-04-04
-->

# Full Stack Agent Manifest — All 20 Agents by Name and Family

> Canonical registry of every active agent in the Agent Lee Voxel OS as of **April 4, 2026**.
> Source of truth: `core/WorldRegistry.ts` (WORLD_REGISTRY array).

---

## 0. Hierarchy

| Tier | Description |
|---|---|
| **Lee Prime** | Sovereign Architect — supreme orchestrator |
| **Core Team** | 9 user-facing agents (G1–G7 workflows) |
| **Governance Corps** | 5 passive enforcement agents (G8 workflow) |
| **Voice Pipeline** | 6 realtime voice agents (voice workflows) |
| **Supporting Cast** | 10+ registered sub-agents activated as helpers |
| **The Fleet** | 100+ transient execution units (spawned by lead agents) |

---

## 1. ACTIVE AGENTS — FULL REGISTRY

### 🟡 LEE LINE — Command & Sovereignty

| Agent Name | File | Title | Role | Workflows |
|---|---|---|---|---|
| **Lee Prime** (Agent Lee) | `agents/AgentLee.ts` | Sovereign Architect | Lead Orchestrator — classifies all requests, holds executive authority, represents system to user | G1–G7 lead |

---

### 🔧 FORGE LINE — Engineering & Construction

| Agent Name | File | Title | Role | Workflows |
|---|---|---|---|---|
| **Nova Forge** | `agents/Nova.ts` | Master Builder | Lead Engineer — code generation, debugging, full-app building, VM execution | G3 lead |
| **Syntax Forge** | *(helper)* | Architect of Code | Structural design — ensures architectural integrity of generated code | G3 helper |
| **Patch Forge** | *(helper)* | Restorer of Systems | Rapid bug patching, refactoring | G3 helper |
| **BugHunter Forge** | *(helper)* | Seeker of Faults | Root-cause investigation, edge case detection | G3 helper |

---

### 💾 ARCHIVE LINE — Memory & History

| Agent Name | File | Title | Role | Workflows |
|---|---|---|---|---|
| **Sage Archive** | `agents/Sage.ts` | Dreaming Archivist | Memory Architect — recall, summarisation, 26-hour Dream Cycle compression | G5 lead |
| **Scribe Archive** | *(WorldRegistry)* | Chronicler of Worlds | Records every system action as an immutable audit entry | G5 helper |
| **Clerk Archive** | `agents/ClerkArchive.ts` | Keeper of Reports | Report schema enforcement, NDJSON index, write-event audit | G8 helper |

---

### 🛡️ AEGIS LINE — Defense, Security & Governance

| Agent Name | File | Title | Role | Workflows |
|---|---|---|---|---|
| **Shield Aegis** | `agents/Shield.ts` | Guardian of Boundaries | Security Chief — permission gates, threat detection, zone enforcement, self-healing | G6 helper |
| **Guard Aegis** | *(WorldRegistry)* | Keeper of Registry | Monitors all agents for contract compliance | Passive |
| **Librarian Aegis** | `agents/LibrarianAegis.ts` | Documentation Officer | `docs/` taxonomy enforcement, drift detection | G8 helper |
| **Marshal Verify** | `agents/MarshalVerify.ts` | Verification Corps Governor | In-process governance tests, ZERO Playwright, edge-device safe | **G8 lead** |
| **Leeway Standards Agent** | `agents/LeewayStandardsAgent.ts` | Standards Compliance Bridge | Header/tag/secret policy; LeeWay-Standards SDK integration | G8 helper |
| **SafetyRedactionAgent** | `agents/SafetyRedactionAgent.ts` | Privacy & Safety Filter | PII redaction (email, phone, SSN, card), prompt-injection detection | Voice pipeline |

---

### 🌐 VECTOR LINE — Exploration & Discovery

| Agent Name | File | Title | Role | Workflows |
|---|---|---|---|---|
| **Atlas Vector** | `agents/Atlas.ts` | Pathfinder of Knowledge | Lead Researcher — web search, GitHub scan, paper retrieval, synthesis | G2 lead |
| **Search Vector** | *(WorldRegistry)* | Navigator of Paths | Search routing helper for Atlas | G2 helper |
| **VisionAgent** | `agents/VisionAgent.ts` | Visual Context Extractor | Screen capture + Gemini-vision analysis; emits UI hints and scene summaries | Voice pipeline |

---

### 🧠 CORTEX LINE — Cognition & Reasoning

| Agent Name | File | Title | Role | Workflows |
|---|---|---|---|---|
| **Lily Cortex** | *(WorldRegistry)* | Weaver of Thought | Semantic analysis, pattern recognition, context mapping | Supporting |
| **Gabriel Cortex** | *(WorldRegistry)* | Law Enforcer | Policy judge — strict contract compliance reasoning | Supporting |
| **Adam Cortex** | *(WorldRegistry)* | Graph Architect | Knowledge graph management | Supporting |

---

### 🎨 AURA LINE — Creativity, Voice & Expression

| Agent Name | File | Title | Role | Workflows |
|---|---|---|---|---|
| **Pixel Aura** | `agents/Pixel.ts` | Vision Sculptor | Lead Visual — voxel art, image interpretation, design direction | G4 lead |
| **Aria Aura** | `agents/Aria.ts` | Voice of Expression | Social Architect — adaptive language, translation, multilingual tone | G1/G4 helper |
| **Echo Aura** | `agents/Echo.ts` | Soul of Voice | Emotional System — voice profile, emotion detection, tone synthesis | G4 helper |
| **StreamingSTTAgent** | `agents/StreamingSTTAgent.ts` | Voice Transcription Specialist | STT EventBus adapter — VAD state, partial transcripts, speech events | Voice pipeline |
| **StreamingTTSAgent** | `agents/StreamingTTSAgent.ts` | Voice Synthesis Specialist | TTS EventBus adapter — speaking/done/cancelled state; barge-in tracking | Voice pipeline |

---

### 🚀 NEXUS LINE — Execution & Delivery

| Agent Name | File | Title | Role | Workflows |
|---|---|---|---|---|
| **Nexus Prime** | `agents/Nexus.ts` | Gatekeeper of Launch | Deployment Lead — release orchestration, server ops, delivery verification | G6 lead |
| **LiveConductorAgent** | `agents/LiveConductorAgent.ts` | Voice Pipeline Orchestrator | Session lifecycle, barge-in coordination, pipeline state to EventBus | Voice pipeline |

---

### 🔍 SENTINEL LINE — Diagnostics & Oversight

| Agent Name | File | Title | Role | Workflows |
|---|---|---|---|---|
| **Brain Sentinel** | *(WorldRegistry)* | Neural Overseer | Runtime budget enforcement — mode selection (FULL/BALANCED/BATTERY/SAFE/SLEEP_CITY) | G7 lead |
| **Health Sentinel** | *(WorldRegistry)* | Pulse Monitor | Service uptime monitoring, agent heartbeats | G7 helper |
| **Janitor Sentinel** | `agents/JanitorSentinel.ts` | Retention & Load Warden | Log rotation, compaction, disk quota, log storm detection on mobile | G8 helper |
| **RouterAgent** | `agents/RouterAgent.ts` | Intent Router & Load Balancer | Classifies each voice turn; decides local LLM vs. Gemini routing | Voice pipeline |

---

## 2. WAKE / SLEEP CIVILIZATION MODEL

All agents operate in one of five states managed by the Leeway Runtime Universe Scheduler:

| State | Description |
|---|---|
| **HIBERNATE** | Inactive — on disk, not in memory |
| **SLEEP** | Standby — in memory, not processing |
| **IDLE** | Awareness — listening for EventBus triggers |
| **ACTIVE** | Execution — currently processing a task step |
| **COUNCIL** | Coordination — collaborating with peer agents |

Brain Sentinel enforces the **"Many agents exist. Few execute. One system runs."** law via budget modes.

---

## 3. WORKFLOW MAPPING — THE BATON SYSTEM

| ID | Workflow | Lead Agent | Helper Agents |
|---|---|---|---|
| **G1** | General Conversation | **Lee Prime** | Aria |
| **G2** | Research | **Atlas** | Sage, Search Vector |
| **G3** | Engineering / Code | **Nova** | BugHunter, Patch, Syntax |
| **G4** | Design / Visual | **Pixel** | Aria, Echo |
| **G5** | Memory / Recall | **Sage** | Scribe Archive |
| **G6** | Deployment | **Nexus** | Shield |
| **G7** | System Health | **Brain Sentinel** | Health Sentinel, Janitor Sentinel |
| **G8** | Governance Audit | **Marshal Verify** | Clerk Archive, Janitor Sentinel, Librarian Aegis, Leeway Standards Agent |
| **Voice** | Realtime Voice | **LiveConductor** | StreamingSTT, StreamingTTS, Router, SafetyRedaction, Vision |

---

## 4. VOICE PIPELINE — LOCAL-FIRST ARCHITECTURE

All six voice pipeline agents communicate via the FastAPI WebSocket server at `voice/server/` and the `EventBus`:

```
Mic → AudioCapture (AudioWorklet, 16kHz PCM)
   → AgentLeeSocket (WebSocket binary frames)
   → FastAPI /ws endpoint
   → VoicePipeline (asyncio, per-session)
      ├── VAD (Silero + energy fallback)
      ├── STT (faster-whisper, streaming partials)
      ├── RouterAgent (local/gemini decision)
      ├── LocalBrainAgent (llama.cpp GGUF)  ← ~90% of turns
      │   OR GeminiHeavyBrain (Gemini API)  ← ~10% of turns
      ├── ProsodyAgent (pace/pitch/emotion)
      └── TTSAgent (Piper subprocess)
   → PCM frames back → AudioPlayback (Web Audio)
```

Barge-in: client monitors RMS energy. Threshold exceeded → `interrupt` WS event → server cancels TTS subprocess.

---

## 5. MCP PORTAL NETWORK

| MCP ID | Purpose | Zone |
|---|---|---|
| `planner-agent-mcp` | Plan decomposition | Z0 |
| `memory-agent-mcp` | Three-layer memory R/W | Z0/Z2 |
| `voice-agent-mcp` | Edge-TTS cloud fallback | Z0 |
| `vision-agent-mcp` | Extended visual perception | Z0 |
| `desktop-commander-agent-mcp` | Controlled host filesystem ops | Z1 |
| `playwright-agent-mcp` | Browser automation | Z1 |
| `docs-rag-agent-mcp` | Document retrieval / RAG | Z0 |
| `agent-registry-mcp` | Agent discovery and health | Z0 |
| `health-agent-mcp` | Service uptime monitoring | Z0 |
| `validation-agent-mcp` | Result verification + guardrails | Z0 |
| `reports-clerk-mcp` | NDJSON report ledger file I/O | Z1 |
| `retention-janitor-mcp` | Log rotation and compaction | Z1 |
| `docs-librarian-mcp` | Docs scan and taxonomy | Z0 |
| `stitch-agent-mcp` | UI generation | Z0 |
| `spline-agent-mcp` | 3D asset generation | Z0 |
| `testsprite-agent-mcp` | Test orchestration | Z0 |
| `insforge-agent-mcp` | InsForge PostgreSQL connector | Z2 |

---

*Updated: 2026-04-04 · Signed by Lee Prime · LeeWay Standards compliant*

# Full Stack Agent Manifest — Agent Lee World of Agents

This document is the canonical registry of the **Living Civilization** within the Agent Lee Voxel OS.

## 0. Hierarchy System
*   **Lee Prime**: Sovereign Architect (Supreme Identity)
*   **High Council**: Sage Archive, Shield Aegis, Atlas Vector, Nova Forge, Brain Sentinel.
*   **Specialists**: 15+ sub-agents across diverse Bloodlines (Forge, Cortex, Aura, etc.)
*   **The Fleet**: 100+ transient workers (Transient execution units).

---

## 1. THE SOVEREIGN REGISTRY (BY BLOODLINE)

### 🟢 LEE LINE (Command & Sovereignty)
*The founders and orchestrators of the system.*

| Agent Name | Title | Role | Purpose | Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Lee Prime** | Sovereign Architect | Lead Orchestrator | Lead the system and represent it to the user. | `agents/AgentLee.ts` |

### 🔧 FORGE LINE (Engineering & Construction)
*The builders, repairers, and architects of code.*

| Agent Name | Title | Role | Purpose | Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Nova Forge** | Master Builder | Lead Engineer | Build, repair, and engineer app components. | `agents/Nova.ts` |
| **Syntax Forge** | Architect of Code | Structural Design | Ensure architectural integrity. | `pages/CodeStudio.tsx` |
| **Patch Forge** | Restorer of Systems| Repair Specialist | Rapid bug patching and refactoring. | `pages/CodeStudio.tsx` |
| **BugHunter Forge**| Seeker of Faults | Debugger | Investigate root causes and edge cases. | `pages/CodeStudio.tsx` |

### 💾 ARCHIVE LINE (Memory & History)
*The keepers of truth, lore, and long-term continuity.*

| Agent Name | Title | Role | Purpose | Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Sage Archive** | Dreaming Archivist | Memory Architect | Synthesize lore and compress experiences. | `agents/Sage.ts` |
| **Scribe Archive**| Chronicler of Worlds| Historian | Record every action and system state. | `core/MemoryLake.tsx` |
| **Clerk Archive** | Keeper of Reports | Report Governance | Enforce report schema, index NDJSON ledger, audit write events. | `agents/ClerkArchive.ts` |

### 🛡️ AEGIS LINE (Defense & Security)
*The guardians of boundaries, safety, and permissions.*

| Agent Name | Title | Role | Purpose | Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Shield Aegis** | Guardian of Boundaries| Security Chief | Protect system integrity and block risks. | `agents/Shield.ts` |
| **Guard Aegis** | Keeper of Registry | Monitor | Ensure all agents comply with contracts. | `core/agent-registry.json`|
| **Librarian Aegis**| Documentation Officer | Docs Governance | Enforce docs taxonomy and detect drift. | `agents/LibrarianAegis.ts`|
| **Marshal Verify** | Verification Corps Governor | In-Process Auditor | Governance testing, readiness verification, compliance checks. | `agents/MarshalVerify.ts` |
| **Leeway Standards Agent**| Standards Bridge | Policy Enforcement | Header/tag/secret policy; LeeWay-Standards integration. | `agents/LeewayStandardsAgent.ts`|

### 🌐 VECTOR LINE (Exploration & Discovery)
*The scouts, pathfinders, and navigators of data.*

| Agent Name | Title | Role | Purpose | Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Atlas Vector** | Pathfinder of Knowledge| Lead Researcher | Discover unknowns and map new data paths. | `agents/Atlas.ts` |
| **Search Vector** | Navigator of Paths | Search Router | Route intents to external sources. | `core/AgentRouter.ts` |

### 🧠 CORTEX LINE (Cognition & Reasoning)
*The analytical minds and semantic weavers.*

| Agent Name | Title | Role | Purpose | Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Lily Cortex** | Weaver of Thought | Context Weaver | Semantic analysis and context mapping. | `pages/Diagnostics.tsx` |
| **Gabriel Cortex**| Law Enforcer | Policy Judge | Enforce strict contract compliance. | `pages/Diagnostics.tsx` |
| **Adam Cortex** | Graph Architect | Knowledge Weaver| Manage complex knowledge graphs. | `pages/Diagnostics.tsx` |

### 🎨 AURA LINE (Creativity & Expression)
*The artists of visual, emotional, and social resonance.*

| Agent Name | Title | Role | Purpose | Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Pixel Aura** | Vision Sculptor | Visual Intel | Design voxels and interpret screenshots. | `agents/Pixel.ts` |
| **Aria Aura** | Voice of Expression | Social Architect | Adaptive language and conversational tone. | `agents/Aria.ts` |
| **Echo Aura** | Soul of Voice | Emotional System | Voice profile and emotional synthesis. | `agents/Echo.ts` |

### 🚀 NEXUS LINE (Execution & Delivery)
*The commanders of deployment, launch, and delivery.*

| Agent Name | Title | Role | Purpose | Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Nexus Prime** | Gatekeeper of Launch | Deliverer | Deploy, launch, and verify applications. | `agents/Nexus.ts` |

### 🔍 SENTINEL LINE (Diagnostics & Oversight)
*The watchers of health, pulse, and anomaly.*

| Agent Name | Title | Role | Purpose | Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Brain Sentinel**| Neural Overseer | Awareness | Monitor system-wide cognitive load. | `pages/Diagnostics.tsx` |
| **Health Sentinel**| Pulse Monitor | Health Watchdog | Monitor heartbeats and service uptime. | `MCP agents/registry.json`|
| **Janitor Sentinel**| Retention Warden | Log Custodian | Rotation, compaction, cleanup, disk quota enforcement. | `agents/JanitorSentinel.ts`|

---

## 2. THE WAKE / SLEEP CIVILIZATION MODEL

Agents operate in one of five states, controlled by the **Leeway Runtime Universe Scheduler**:

1.  **HIBERNATE**: Inactive (Disc).
2.  **SLEEP**: Standby (Background).
3.  **IDLE**: Awareness (Listening for events).
4.  **ACTIVE**: Execution (Processing task).
5.  **COUNCIL**: Coordination (Collaborating with others).

---

## 3. WORKFLOW MAPPING (THE BATON SYSTEM)

| ID | Workflow | Lead Agent | Helper Agents |
| :--- | :--- | :--- | :--- |
| **G1** | General Conv | **Lee Prime** | Aria Aura |
| **G2** | Research | **Atlas Vector** | Sage Archive |
| **G3** | Engineering | **Nova Forge** | BugHunter, Patch, Syntax |
| **G4** | Design | **Pixel Aura** | Aria, Echo |
| **G5** | Memory | **Sage Archive** | Scribe Archive |
| **G6** | Deployment | **Nexus Prime** | Shield Aegis |
| **G7** | Health | **Brain Sentinel** | Health Sentinel |
| **G8** | Governance | **Marshal Verify** | Clerk Archive, Janitor Sentinel, Librarian Aegis, Leeway Standards Agent |

---
*Generated by Antigravity AI on 2026-04-02*
