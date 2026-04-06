<!--
DOC_CLASS: REFERENCE
DOC_ID: docs.readme
OWNER: Lee Prime
LAST_UPDATED: 2026-04-04
-->


# Agent Lee Voxel OS — Developer Documentation

---

## Partnership: LeeWay-Edge-RTC

This system is fully partnered and live-connected with [LeeWay-Edge-RTC](https://github.com/4citeB4U/LeeWay-Edge-RTC) — Agent Lee's real-time voice, emotion, and RTC backbone. Both systems are designed to work together, with Agent Lee orchestrating intelligence, UI, and agent workflows, while LeeWay-Edge-RTC provides always-on, low-latency voice and presence.

**Investors and developers:** Inspect the RTC/voice backbone repo here: [https://github.com/4citeB4U/LeeWay-Edge-RTC](https://github.com/4citeB4U/LeeWay-Edge-RTC)

**How they connect:**
- Set the `VITE_VOICE_WS_URL` (or `VITE_VOICE_AGENT_URL`) in your `.env` to the LeeWay-Edge-RTC WebSocket endpoint.
- Agent Lee and all 20+ agents can route voice, emotion, and RTC tasks to the RTC backbone in real time.
- All system diagrams, architecture, and UI are designed for seamless cross-app operation.

---

This directory is the **canonical source of truth** for all developer-facing documentation.

**System Update (April 2026):**
- Now fully integrated with LeeWay-Edge-RTC for live voice, emotion, and RTC
- 20 named agents · 9 families · G1–G8 + Voice workflows · 17 MCP portals
- Voice Pipeline (6 agents) fully integrated
- New/updated governance bodies (G8, Shield, Brain Sentinel, Librarian Aegis, Janitor Sentinel, LeewayStandardsAgent)
- Universal DB operation wrapper and audit system (Leeway 5W+H, unique IDs)
- Centralized logs by layer/function/ID in /logs
- Enhanced system diagrams: Voice Pipeline, MCP Portal network, Wake/Sleep civilization, runtime universe
- All docs, manifests, and diagrams updated for investor/developer inspection


## Taxonomy (Updated)

| Folder | DOC_CLASS | Contents |
|---|---|---|
| `canon/` | CANON | Identity, lore, agent manifesto, agent-lee-bible |
| `architecture/` | ARCHITECTURE | 7-layer runtime, master plan, tech stack, new system diagrams |
| `governance/` | GOVERNANCE | G8 model, zone contracts, Shield policy, brain budgets, new governance bodies |
| `operations/` | OPERATIONS | SITREPs, retention policy, runbooks |
| `evaluation/` | EVALUATION | System audits, agent scorecards, new evaluation docs |
| `reference/` | REFERENCE | Full-stack manifest, agent manifest, report schema, new/updated field references |
| `systemimages/` | IMAGES | All current system diagrams (SVG, PNG) |


## Quick Links (April 2026)

| What | Doc |
|---|---|
| LeeWay-Edge-RTC partner repo | [https://github.com/4citeB4U/LeeWay-Edge-RTC](https://github.com/4citeB4U/LeeWay-Edge-RTC) |


| What | Doc |
|---|---|
| All 20 agents + families | [`reference/full-stack-manifest.md`](reference/full-stack-manifest.md) |
| Agent quick-reference | [`reference/agent-manifest.md`](reference/agent-manifest.md) |
| 7-layer runtime architecture | [`architecture/leeway-runtime-universe.md`](architecture/leeway-runtime-universe.md) |
| G1–G8 + Voice governance model | [`governance/governance-model.md`](governance/governance-model.md) |
| Agent identity + creed | [`canon/agent-lee-manifesto.md`](canon/agent-lee-manifesto.md) |
| System diagrams | [`systemimages/`](systemimages/) |
| Universal DB audit wrapper | [`core/dbOps.ts`](../../core/dbOps.ts) |
| Governance enforcement | [`core/CentralGovernance.ts`](../../core/CentralGovernance.ts) |


## Rules (2026)


- All canonical `.md` files (except root `README.md`) live here.
- Each file must include the doc-class header block at the top.
- All major docs, manifests, and diagrams are updated for 2026 system state.
- Logs and audit trails are centralized in `/logs` by layer/function/ID.
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
