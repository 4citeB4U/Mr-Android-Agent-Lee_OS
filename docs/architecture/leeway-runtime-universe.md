<!--
DOC_CLASS: ARCHITECTURE
DOC_ID: architecture.leeway-runtime-universe
OWNER: Lee Prime
LAST_UPDATED: 2026-04-03
-->

# Leeway Runtime Universe — Architecture

## Overview

Agent Lee Agentic OS is a multi-agent civilization running in a React 19 + TypeScript 5.8 + Vite 6 browser application on an edge device (mobile/desktop).

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5.8, Vite 6, Tailwind CSS |
| AI / LLM | Google Gemini 2.0 Flash + Gemini Live (WebSocket audio) |
| Storage | IndexedDB (via `idb`) — `core/MemoryDB.ts` |
| Voice | Gemini Live → Edge-TTS (voice-agent-mcp) → Browser TTS |
| Agents | TypeScript static classes in `agents/` |
| Core | Governance, routing, prompts in `core/` |
| MCP | Node.js MCP servers in `MCP agents/` |

## Runtime Layers

```
┌─────────────────────────────────────────┐
│           USER / DEVICE SURFACE         │
│  React UI (App.tsx, ChatConsole, pages) │
└──────────────┬──────────────────────────┘
               │ EventBus (typed events)
┌──────────────▼──────────────────────────┐
│         GOVERNANCE LAYER (Z0)           │
│  AgentRouter → classifyWorkflow(G1-G7)  │
│  TaskGraph → budget-clamped execution   │
│  GovernanceContract → zone + caps       │
│  CheckpointManager → before/after snaps │
└──────────────┬──────────────────────────┘
               │ baton dispatch
┌──────────────▼──────────────────────────┐
│         AGENT LAYER (Z0)                │
│  AgentLee (Orchestrator / Governor)     │
│  Nova, Atlas, Echo, Sage, ...           │
│  ClerkArchive, JanitorSentinel,         │
│  LibrarianAegis (governance agents)     │
└──────────────┬──────────────────────────┘
               │ Portal Requests (via Shield)
┌──────────────▼──────────────────────────┐
│         MCP PORTAL LAYER (Z1/Z2)        │
│  voice-agent-mcp (Edge-TTS)             │
│  reports-clerk-mcp (file I/O)           │
│  retention-janitor-mcp (rotate/delete)  │
│  docs-librarian-mcp (scan/suggest)      │
│  memory-agent-mcp, health-agent-mcp,... │
└─────────────────────────────────────────┘
```

## Voice Priority Chain

1. **Gemini Live** — bidirectional WebSocket audio (first-line)
2. **voice-agent-mcp Edge-TTS** — offline REST fallback (`http://127.0.0.1:3010/speak`)
3. **Browser SpeechSynthesis** — last-resort fallback

## Key Modules

| Module | Path | Purpose |
|---|---|---|
| GovernanceContract | `core/GovernanceContract.ts` | G1-G7, zones, caps, prompts, commands |
| AgentRouter | `core/AgentRouter.ts` | intent classify + baton dispatch |
| TaskGraph | `core/TaskGraph.ts` | task state-machine, budget enforcement |
| CheckpointManager | `core/CheckpointManager.ts` | before/after write snapshots |
| ReportWriter | `core/ReportWriter.ts` | NDJSON event schema + IndexedDB buffer |
| ReportIndex | `core/ReportIndex.ts` | manifest.json + latest.ndjson |
| RetentionCleaner | `core/RetentionCleaner.ts` | rotation + compaction + indexing |
| EventBus | `core/EventBus.ts` | typed singleton, governance events |
| VoiceService | `core/VoiceService.ts` | 3-tier voice priority chain |
| MemoryDB | `core/MemoryDB.ts` | IndexedDB wrapper |
| GeminiLiveClient | `core/GeminiLiveClient.ts` | Live API WebSocket client |
| Shield | `agents/Shield.ts` | security, zone enforcement, break-glass |
| ClerkArchive | `agents/ClerkArchive.ts` | report schema + index maintenance |
| JanitorSentinel | `agents/JanitorSentinel.ts` | retention + compaction |
| LibrarianAegis | `agents/LibrarianAegis.ts` | docs taxonomy enforcement |

## On-Device Filesystem Layout

```
/storage/emulated/0/AgentLee/
  system_reports/        ← operational truth (Janitor + Clerk manage)
  docs_exports/          ← optional repo doc exports
```

## Repo Layout

```
docs/                    ← developer truth (Librarian Aegis enforces)
core/                    ← governance + runtime modules
agents/                  ← agent implementations
MCP agents/              ← MCP servers
```
