<!--
DOC_CLASS: REFERENCE
DOC_ID: reference.report-schema
OWNER: Clerk Archive
LAST_UPDATED: 2026-04-04
-->

# Report Schema

## Overview

All operational reports use NDJSON (newline-delimited JSON). Each line is one report event.

## NDJSON Event Schema

```json
{
  "ts": "2026-04-03T12:34:56.789Z",
  "report_class": "AGENT",
  "family": "FORGE",
  "agent_id": "Nova_Forge",
  "severity": "INFO",
  "workflow": "G3",
  "task_id": "G3-ENG-014",
  "step_id": "G3-ENG-014.03",
  "zone": "Z0_AGENTVM",
  "event": "STEP_COMPLETE",
  "message": "Generated patch plan for scheduler wake logic.",
  "data": { "confidence": 0.74, "artifacts": [] },
  "next": "Request Shield review before Z1 write."
}
```

## Field Reference

| Field | Type | Required | Values |
|---|---|---|---|
| `ts` | string (ISO 8601) | ✅ | UTC timestamp |
| `report_class` | string | ✅ | `SYSTEM\|GOVERNANCE\|AGENT\|CHECKPOINT\|SITREP\|INCIDENT\|EVALUATION` |
| `family` | string | ✅ | `LEE\|FORGE\|ARCHIVE\|AEGIS\|VECTOR\|CORTEX\|AURA\|NEXUS\|SENTINEL\|SYSTEM` |
| `agent_id` | string | if AGENT | e.g. `Nova_Forge` |
| `severity` | string | ✅ | `TRACE\|INFO\|WARN\|ERROR\|CRITICAL` |
| `workflow` | string | if applicable | `G1…G8\|VOICE` |
| `task_id` | string | if applicable | e.g. `G3-ENG-014` |
| `step_id` | string | if applicable | e.g. `G3-ENG-014.03` |
| `zone` | string | if applicable | `Z0_AGENTVM\|Z1_HOST_FILES\|Z2_MEMORY_DB` |
| `event` | string | ✅ | see Event Types below |
| `message` | string | ✅ | human-readable description |
| `data` | object | optional | structured supplementary data |
| `next` | string | recommended | next step or action |

## Event Types (required values for `event` field)

```
TASK_CREATED       — New task registered in TaskGraph
ROUTED             — Task classified and assigned to lead + helpers
STEP_START         — Agent step began execution
STEP_COMPLETE      — Agent step finished successfully
STEP_FAILED        — Agent step failed with error
WRITE_INTENT_CREATED  — Write Intent Block submitted for approval
WRITE_APPROVED     — User approved the write operation
WRITE_COMPLETE     — Write operation finished successfully
CHECKPOINT_BEFORE  — Snapshot taken before a write step
CHECKPOINT_AFTER   — Snapshot taken after a write step
RETENTION_ROTATE   — Log file rotated by Janitor Sentinel
RETENTION_DELETE   — Old log file deleted per policy
DOCS_DRIFT_DETECTED — Markdown file found outside docs/ taxonomy
DOCS_PROPOSAL_READY — Librarian Aegis prepared a move/correction proposal
SECURITY_EVENT     — Shield detected a threat or policy violation
REDACTION_APPLIED  — SafetyRedactionAgent redacted PII or injection content
VOICE_TURN_STARTED — LiveConductorAgent opened a new voice turn
VOICE_TURN_ENDED   — LiveConductorAgent closed a voice turn
VOICE_BARGE_IN     — User interrupted active TTS playback
STT_TRANSCRIPT     — StreamingSTTAgent produced a transcription
TTS_CHUNK_SENT     — StreamingTTSAgent streamed a TTS audio chunk
ROUTER_DECISION    — RouterAgent selected an inference backend
VISION_FRAME       — VisionAgent captured and analyzed a screen frame
GOVERNANCE_AUDIT   — MarshalVerify ran a G8 governance check
STANDARDS_VIOLATION — LeewayStandardsAgent detected a header/tag/secret violation
```

## Report Classes

| Class | Who writes | Where |
|---|---|---|
| SYSTEM | System components | `system_reports/system/**` |
| GOVERNANCE | Shield, Clerk Archive, Librarian Aegis | `system_reports/system/governance/**` |
| AGENT | Any agent | `system_reports/agents/<FAMILY>/<Agent>.ndjson` |
| CHECKPOINT | CheckpointManager | `system_reports/system/checkpoints/checkpoints.ndjson` |
| SITREP | Sage + Scribe | `system_reports/system/sitrep/daily/YYYY-MM-DD.md` |
| INCIDENT | Shield | `system_reports/system/governance/security_events.ndjson` |
| EVALUATION | External audit | `docs/evaluation/` |

## SITREP Markdown Header (required)

```markdown
# SITREP — YYYY-MM-DD

- mode: Balanced
- max_active_agents: 3
- in_flight_tasks: 12
- writes_today: { Z0: 4, Z1: 1, Z2: 0 }
- incidents: 0
- agents_reporting: [list of agent_ids that reported today]
- agents_silent: [list that did not report]
```

## Retention Policy

| Class | Raw Retention | Summary Retention |
|---|---|---|
| AGENT logs | 7 days | Compacted by Sage every 26h |
| SITREP | 90 days | Permanent |
| SECURITY_EVENTS | 30 days raw | Permanent summarized |
| CHECKPOINT | 14 days raw | Milestone-tagged kept longer |
| SYSTEM logs | 7 days | Rolled daily |

## Rotation Rules

Rotate `*.ndjson` when:
- Size > 2 MB, OR
- Daily boundary crossed

Rotation naming:
- `Nova_Forge.ndjson` (current)
- `Nova_Forge.2026-04-03.ndjson` (rolled)

## Redaction (Shield-enforced)

Never include in any report line:
- Contents of `serviceAccountKey.json` or `*adminsdk*.json`
- `.env*` values
- API keys matching known patterns (leeway, OpenAI, GitHub)

