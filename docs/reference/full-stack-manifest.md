<!--
DOC_CLASS: REFERENCE
DOC_ID: reference.full-stack-manifest
OWNER: Leonard J Lee / Leeway Innovations
LAST_UPDATED: 2026-04-03
-->

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
