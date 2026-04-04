<!--
DOC_CLASS: REFERENCE
DOC_ID: docs.readme
OWNER: Lee Prime
LAST_UPDATED: 2026-04-03
-->

# Agent Lee — Developer Documentation

This directory is the **canonical source of truth** for all developer-facing documentation.

## Taxonomy

| Folder | DOC_CLASS | Contents |
|---|---|---|
| `canon/` | CANON | Identity, lore, manifestos |
| `architecture/` | ARCHITECTURE | System design, runtime diagrams |
| `governance/` | GOVERNANCE | Policies, permissions, zone contracts |
| `operations/` | OPERATIONS | Runbooks, SITREPs, incident response |
| `evaluation/` | EVALUATION | Audits, scorecards |
| `reference/` | REFERENCE | Schemas, registries, contracts |

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
