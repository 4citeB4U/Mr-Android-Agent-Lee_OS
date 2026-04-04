<!--
DOC_CLASS: OPERATIONS
DOC_ID: operations.sitrep-template
OWNER: Sage Archive
LAST_UPDATED: 2026-04-03
-->

# SITREP Template

## Location

Daily SITREPs are written to:
- On-device: `/storage/emulated/0/AgentLee/system_reports/system/sitrep/daily/YYYY-MM-DD.md`
- In IndexedDB: keyed by `sitrep:YYYY-MM-DD`
- In repo (optional export): `docs/operations/`

## Standard SITREP Format

```markdown
# SITREP — YYYY-MM-DD

<!-- Meta -->
- mode: BALANCED
- max_active_agents: 3
- in_flight_tasks: 12
- writes_today: { Z0: 4, Z1: 1, Z2: 0 }
- incidents: 0
- dream_cycle_ran: true
- generated_by: Sage Archive + Scribe Archive
- generated_at: YYYY-MM-DDTHH:MM:SSZ

---

## Agents Active Today
- AgentLee (Orchestrator)
- Nova (Engineering — 3 tasks)
- Atlas (Research — 1 task)
- Shield (Security monitoring — always on)

## Agents Silent (no reports filed)
- Lily Cortex
- Gabriel Cortex

## Task Summary
- Tasks created: 12
- Tasks completed: 9
- Tasks failed: 1 (G3-ENG-011 — tsc compile error, retried x2, escalated)
- Tasks in flight at EOD: 2

## Write Operations
- Z0 writes: 4 (all auto-approved, append-only)
- Z1 writes: 1 (approved by user, scoped to system_reports/)
- Z2 writes: 0

## Incidents
_None_

## Security Events
_None_

## Memory / Dream Summary
- Sage compacted 287 log lines → 3 INSIGHT records
- Memory Lake snapshots: 2 written, 0 failed

## Governance Drift
- Docs drift detected: 0 files outside taxonomy
- Report coverage: 8/16 agents reported (see coverage report)

## Next Steps
- Resume G6-DEP-002 (Nexus deployment, awaiting user approval)
- Janitor Sentinel scheduled for 02:00 UTC cleanup
```

## Who Writes It

Sage Archive + Scribe Archive produce the SITREP during the dream cycle (every ~26 hours).

Clerk Archive contributes the **Report Coverage section** automatically.

## Retention

SITREPs are kept for **90 days** (long retention, human-readable).
