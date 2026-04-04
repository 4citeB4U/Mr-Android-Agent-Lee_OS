<!--
DOC_CLASS: REFERENCE
DOC_ID: docs.readme
OWNER: Lee Prime
LAST_UPDATED: 2026-04-04
-->

# Agent Lee Voxel OS — Developer Documentation

This directory is the **canonical source of truth** for all developer-facing documentation.
20 named agents · 9 families · G1–G8 + Voice workflows · 17 MCP portals

## Taxonomy

| Folder | DOC_CLASS | Contents |
|---|---|---|
| `canon/` | CANON | Identity, lore, agent manifesto, agent-lee-bible |
| `architecture/` | ARCHITECTURE | 7-layer runtime diagram, master plan, tech stack |
| `governance/` | GOVERNANCE | G8 model, zone contracts, Shield policy, brain budgets |
| `operations/` | OPERATIONS | SITREPs, retention policy, runbooks |
| `evaluation/` | EVALUATION | System audits, agent scorecards |
| `reference/` | REFERENCE | Full-stack manifest, agent manifest, report schema |

## Quick Links

| What | Doc |
|---|---|
| All 20 agents + families | [`reference/full-stack-manifest.md`](reference/full-stack-manifest.md) |
| Agent quick-reference | [`reference/agent-manifest.md`](reference/agent-manifest.md) |
| 7-layer runtime architecture | [`architecture/leeway-runtime-universe.md`](architecture/leeway-runtime-universe.md) |
| G1–G8 + Voice governance model | [`governance/governance-model.md`](governance/governance-model.md) |
| Agent identity + creed | [`canon/agent-lee-manifesto.md`](canon/agent-lee-manifesto.md) |

## Rules

- All canonical `.md` files (except root `README.md`) live here.
- Each file must include the doc-class header block at the top.
- Operational SITREPs/incidents live on-device at `system_reports/system/sitrep/` — not here.
- Do **not** import sensitive keys or config into any doc file.

## Doc header (required)

```markdown
<!--
DOC_CLASS: ARCHITECTURE | GOVERNANCE | OPERATIONS | CANON | EVALUATION | REFERENCE
DOC_ID: <stable-id>
OWNER: Lee Prime
LAST_UPDATED: YYYY-MM-DD
-->
```
