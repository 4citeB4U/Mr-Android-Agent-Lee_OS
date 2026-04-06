<!--
DOC_CLASS: REFERENCE
DOC_ID: reference.agent-manifest
OWNER: Lee Prime
LAST_UPDATED: 2026-04-04
-->

# Agent Manifest — Quick Reference

> Compact reference. Full details: [`docs/reference/full-stack-manifest.md`](full-stack-manifest.md)


## Agent Families (9 Bloodlines · 20 Named Agents, April 2026)


### LEE — Sovereign Architect
| Agent | File | Role | Workflow |
|---|---|---|---|
| **Lee Prime** (Agent Lee) | `agents/AgentLee.ts` | Governor / Orchestrator | G1–G7 lead |

### VOICE PIPELINE — Realtime Voice Agents
| Agent | File | Role | Workflow |
|---|---|---|---|
| **Echo** | `agents/Echo.ts` | Voice + Emotion | Voice lead |
| **StreamingSTTAgent** | `agents/StreamingSTTAgent.ts` | Speech-to-text | Voice |
| **StreamingTTSAgent** | `agents/StreamingTTSAgent.ts` | Text-to-speech | Voice |
| **VisionAgent** | `agents/VisionAgent.ts` | Visual context | Voice |
| **LiveConductorAgent** | `agents/LiveConductorAgent.ts` | Pipeline orchestrator | Voice |
| **Pixel** | `agents/Pixel.ts` | Visual Intelligence | Voice, UI |

### FORGE — Engineering
| Agent | File | Role | Workflow |
|---|---|---|---|
| **Nova** | `agents/Nova.ts` | Lead Engineer | G3 lead |
| Patch | *(helper)* | Bug patching | G3 helper |
| Syntax | *(helper)* | Architecture review | G3 helper |
| BugHunter | *(helper)* | Root-cause analysis | G3 helper |

### ARCHIVE — Memory & Records
| Agent | File | Role | Workflow |
|---|---|---|---|
| **Sage** | `agents/Sage.ts` | Memory Architect + Dream Cycle | G5 lead |
| Scribe | *(WorldRegistry)* | Immutable chronicler | G5 helper |
| **Clerk Archive** | `agents/ClerkArchive.ts` | Report schema + NDJSON index | G8 helper |

### AEGIS — Security & Governance
| Agent | File | Role | Workflow |
|---|---|---|---|
| **Shield** | `agents/Shield.ts` | Security, zones, self-healing | G6 helper |
| Guard | *(WorldRegistry)* | Contract compliance monitor | Passive |
| **Librarian Aegis** | `agents/LibrarianAegis.ts` | Docs taxonomy enforcement | G8 helper |
| **Marshal Verify** | `agents/MarshalVerify.ts` | Verification Corps Governor | **G8 lead** |
| **LeewayStandardsAgent** | `agents/LeewayStandardsAgent.ts` | Header/tag/secret policy enforcement | G8 helper |
| **Leeway Standards Agent** | `agents/LeewayStandardsAgent.ts` | Header/tag/secret policy | G8 helper |
| **SafetyRedactionAgent** | `agents/SafetyRedactionAgent.ts` | PII + injection redaction | Voice pipeline |

### VECTOR — Research & Discovery
| Agent | File | Role | Workflow |
|---|---|---|---|
| **Atlas** | `agents/Atlas.ts` | Lead Researcher | G2 lead |
| Search | *(WorldRegistry)* | Search routing | G2 helper |
| **VisionAgent** | `agents/VisionAgent.ts` | Screen capture + scene analysis | Voice pipeline |

### CORTEX — Cognition & Reasoning
| Agent | File | Role | Workflow |
|---|---|---|---|
| Lily Cortex | *(WorldRegistry)* | Context weaver | Supporting |
| Gabriel Cortex | *(WorldRegistry)* | Policy judge | Supporting |
| Adam Cortex | *(WorldRegistry)* | Knowledge graph | Supporting |

### AURA — Social, Creative & Voice
| Agent | File | Role | Workflow |
|---|---|---|---|
| **Pixel** | `agents/Pixel.ts` | Visual Intelligence | G4 lead |
| **Aria** | `agents/Aria.ts` | Social + Translation | G1/G4 helper |
| **Echo** | `agents/Echo.ts` | Voice + Emotion | G4 helper |
| **StreamingSTTAgent** | `agents/StreamingSTTAgent.ts` | STT EventBus adapter | Voice pipeline |
| **StreamingTTSAgent** | `agents/StreamingTTSAgent.ts` | TTS EventBus adapter | Voice pipeline |

### NEXUS — Deployment & Execution
| Agent | File | Role | Workflow |
|---|---|---|---|
| **Nexus** | `agents/Nexus.ts` | Deployment Lead | G6 lead |
| **LiveConductorAgent** | `agents/LiveConductorAgent.ts` | Voice Pipeline Orchestrator | Voice pipeline |

### SENTINEL — Diagnostics & Oversight
| Agent | File | Role | Workflow |
|---|---|---|---|
| Brain Sentinel | *(WorldRegistry)* | Runtime budget + mode selection | G7 lead |
| Health Sentinel | *(WorldRegistry)* | Uptime monitoring | G7 helper |
| **Janitor Sentinel** | `agents/JanitorSentinel.ts` | Log rotation + compaction | G8 helper |
| **RouterAgent** | `agents/RouterAgent.ts` | Intent Router + load balancer | Voice pipeline |

## Workflow Map

| ID | Name | Lead | Key Helpers |
|---|---|---|---|
| G1 | Conversation | Lee Prime | Aria |
| G2 | Research | Atlas | Sage |
| G3 | Engineering | Nova | BugHunter, Patch, Syntax |
| G4 | Design | Pixel | Aria, Echo |
| G5 | Memory | Sage | Scribe |
| G6 | Deployment | Nexus | Shield |
| G7 | Health | Brain Sentinel | Health, Janitor |
| G8 | Governance | **Marshal Verify** | Clerk, Janitor, Librarian, Standards |
| Voice | Realtime Voice | **LiveConductor** | STT, TTS, Router, SafetyRedaction, Vision |

## MCP Agents (Z1/Z2 Portal Layer)

| MCP ID | Purpose | Zone |
|---|---|---|
| planner-agent-mcp | Plan decomposition | Z0 |
| memory-agent-mcp | Three-layer memory R/W | Z0/Z2 |
| health-agent-mcp | System health checks | Z0 |
| reports-clerk-mcp | File I/O for reports | Z1 |
| retention-janitor-mcp | Log rotation/deletion | Z1 |
| docs-librarian-mcp | Docs scan/suggestion | Z1 |
| voice-agent-mcp | Edge-TTS (offline voice) | Z0 |
| vision-agent-mcp | Image analysis | Z0 |
| playwright-agent-mcp | Browser automation | Z1 |
| scheduling-agent-mcp | Task scheduling | Z0 |
| stitch-agent-mcp | Data stitching | Z0/Z2 |
| spline-agent-mcp | 3D/animation | Z0 |
| testsprite-agent-mcp | Testing | Z0 |
| validation-agent-mcp | Schema validation | Z0 |
| desktop-commander-agent-mcp | Desktop commands | Z1 |
| insforge-agent-mcp | InsForge integration | Z2 |

## Permissions Summary (Core Agents)

| Agent | Default Caps |
|---|---|
| Lee Prime | Z0_READ, Z0_RUN_WORKFLOWS, Z2_READ_MEMORY, Z2_WRITE_MEMORY_APPEND |
| Clerk Archive | Z0_READ, Z0_WRITE_FILES, Z2_READ_MEMORY, Z2_WRITE_MEMORY_APPEND |
| Janitor Sentinel | Z0_READ, Z0_WRITE_FILES, Z1_READ_FILES (Z1_WRITE_FILES by grant only) |
| Librarian Aegis | Z0_READ, docs.scan (Z0), docs.propose (Z0) — no file write without Lee Prime approval |
| Marshal Verify | Z0_READ, governance.verify (Z0), report.write (Z0) |
| Leeway Standards Agent | Z0_READ, standards.scan (Z0), report.write (Z0) |
| Librarian Aegis | Z0_READ, Z1_READ_FILES (read only, proposals require approval) |
| Shield | Z0_READ, Z0_RUN_WORKFLOWS, Z2_READ_MEMORY + grant management |
