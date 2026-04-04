<!--
DOC_CLASS: OPERATIONS
DOC_ID: operations.retention-policy
OWNER: Janitor Sentinel
LAST_UPDATED: 2026-04-03
-->

# Retention Policy

## Overview

The on-device report directory (`/storage/emulated/0/AgentLee/system_reports/`) is managed by Janitor Sentinel to stay lean on a mobile device.

## Retention Windows by Class

| Report Class | Raw Retention | Compacted/Summary Retention |
|---|---|---|
| AGENT logs (`.ndjson`) | **7 days** | Compacted by Sage nightly |
| SYSTEM runtime logs | **7 days** | Rolled daily |
| SITREP (daily `.md`) | **90 days** | Permanent |
| SECURITY_EVENTS | **30 days raw** | Permanent summarized incidents |
| CHECKPOINT | **14 days raw** | Milestone-tagged kept indefinitely |
| Cleaner audit logs | **30 days** | Permanent summary |

## Rotation Rules (per `.ndjson` file)

Rotate when:
1. File size > **2 MB**, OR
2. Daily date boundary crossed (UTC midnight)

Rotated file naming:
```
Nova_Forge.ndjson               ← current
Nova_Forge.2026-04-03.ndjson    ← rolled
```

Janitor may also compress old rotations if the environment supports gzip.

## Compaction Rules (Sage + Scribe)

Every 26-hour dream cycle:
1. Sage produces `/agents/<FAMILY>/<Agent>.summary.md` from last 24–26h raw logs
2. Scribe produces `/system/sitrep/daily/YYYY-MM-DD.md`
3. Janitor then deletes raw `.ndjson` lines older than the retention window

## Log Storm Thresholds

If any agent generates > 500 events/minute:
- Janitor recommends Brain Sentinel reduce active agents
- Janitor recommends Shield freeze non-essential reporting (except checkpoints/security)
- Log storm event written to `system_reports/system/runtime/brain_sentinel.ndjson`

## Audit Trail

Every cleaner run appends to `system_reports/maintenance/cleaner_runs.ndjson`:
```json
{
  "ts": "...", "event": "RETENTION_ROTATE",
  "target": "agents/FORGE/Nova_Forge.ndjson",
  "reason": "size_exceeded_2mb",
  "rotated_to": "agents/FORGE/Nova_Forge.2026-04-03.ndjson",
  "bytes_before": 2198432
}
```

**Janitor Sentinel never deletes silently.** Every rotation and deletion has an audit record.

## Hard Constraints

- Janitor may only operate within `system_reports/`
- Cannot delete CHECKPOINT files tagged `milestone: true`
- Cannot delete SECURITY_EVENT summaries
- Must write a cleaner audit record before and after every delete/rotate action
