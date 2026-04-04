# system_reports/

Operational reporting root for Agent Lee. This directory is managed by Clerk Archive and Janitor Sentinel.

## Rules

- **All agents write here** (append-only NDJSON per agent)
- **No secrets**: `serviceAccountKey.json`, `*adminsdk*.json`, `.env*` values are never included
- **Janitor Sentinel** rotates and compacts on schedule (daily + storage pressure)
- **Clerk Archive** validates schema and maintains `_index/`
- **SITREPs** live in `system/sitrep/daily/YYYY-MM-DD.md`

## Layout

```
system_reports/
  _index/
    manifest.json              ← global index (rolling)
    latest.ndjson              ← recent event stream
  system/
    runtime/                   ← scheduler, taskbroker, brain_sentinel, shield_aegis logs
    governance/                ← permissions, breakglass, security_events, docs_audit
    checkpoints/               ← checkpoint snapshots
    sitrep/daily/              ← human-readable daily SITREPs
  agents/
    LEE/ FORGE/ ARCHIVE/ AEGIS/ VECTOR/ CORTEX/ AURA/ NEXUS/ SENTINEL/
  maintenance/
    cleaner_runs.ndjson        ← every rotation/deletion audited here
    compaction.ndjson          ← compaction summaries
    retention_policy.md        ← current policy (human readable)
```

## On-Device Root

Primary location: `/storage/emulated/0/AgentLee/system_reports/`

In-browser (IndexedDB): keyed by `reports:<path>` (MCP agents flush to device)

## Schema

See `docs/reference/report-schema.md` for the canonical NDJSON event schema.
