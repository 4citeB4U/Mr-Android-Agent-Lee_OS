<!--
DOC_CLASS: REFERENCE
DOC_ID: reference.agent-manifest
OWNER: Lee Prime
LAST_UPDATED: 2026-04-03
-->

# Agent Manifest — Full Stack Reference

> Source stub — original canonical content lives in `FULL_STACK_AGENT_MANIFEST.md` at repo root.
> This file will supersede it as the taxonomy is finalized.

## Agent Families

### LEE — Sovereign Architect
| Agent | Role | Workflow |
|---|---|---|
| Agent Lee (Lee Prime) | Governor / Orchestrator | All |

### FORGE — Engineering Bloodline
| Agent | Role | Workflow |
|---|---|---|
| Nova | Lead engineer | G3 |
| Patch | Repair & patch automation | G3 helper |
| Syntax | Syntax analysis | G3 helper |
| BugHunter | Bug detection | G3 helper |

### ARCHIVE — Memory & Records
| Agent | Role | Workflow |
|---|---|---|
| Sage | Memory queries, dream compression | G5 |
| Scribe | Immutable audit chronicler | G5 helper |
| Clerk Archive | Report schema + index | Governance |

### AEGIS — Security & Governance
| Agent | Role | Workflow |
|---|---|---|
| Shield | Security, zone enforcement, self-healing | G6 helper |
| Librarian Aegis | Docs taxonomy enforcement | Governance |
| Marshal Verify | Verification Corps Governor; in-process governance testing | Governance |
| Leeway Standards Agent | LeeWay-Standards policy bridge; header/tag/secret enforcement | Governance |

### VECTOR — Research & Search
| Agent | Role | Workflow |
|---|---|---|
| Atlas | Web search, GitHub, research | G2 |
| Search | Specialized search helper | G2 helper |

### CORTEX — Language & Reasoning
| Agent | Role | Workflow |
|---|---|---|
| Lily | Language generation | Support |
| Gabriel | Reasoning | Support |
| Adam | Classification | Support |

### AURA — Social & Creative
| Agent | Role | Workflow |
|---|---|---|
| Pixel | Visual design, voxel art | G4 |
| Aria | Social interaction, translation | G1 helper, G4 helper |
| Echo | Voice, emotion detection | G4 helper |

### NEXUS — Deployment
| Agent | Role | Workflow |
|---|---|---|
| Nexus Prime | Deploy, release, servers | G6 |

### SENTINEL — System Health
| Agent | Role | Workflow |
|---|---|---|
| Brain Sentinel | Load, budget, mode selection | G7 |
| Health | System diagnostics | G7 helper |
| Janitor Sentinel | Retention + load warden; log rotation + compaction | Governance |

## MCP Agents (Z1/Z2 Portal Layer)

| MCP ID | Purpose | Zone |
|---|---|---|
| planner-agent-mcp | Plan decomposition | Z0 |
| memory-agent-mcp | Three-layer memory | Z0/Z2 |
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
