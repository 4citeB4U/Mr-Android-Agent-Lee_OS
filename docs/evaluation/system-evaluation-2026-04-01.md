<!--
DOC_CLASS: EVALUATION
DOC_ID: evaluation.system-2026-04-01
OWNER: Agent Lee System Engineer
LAST_UPDATED: 2026-04-03
-->

# Agent Lee Complete System Evaluation (2026-04-01)

## Scope
- Pages and major surfaces
- Agent + MCP orchestration paths
- leeway model lane and free-tier guardrails
- Cross-component awareness and diagnostics contract usage

## Findings (Current State)

### 1) Page and Surface Awareness Coverage
- Home: diagnostics contract enabled
- Diagnostics: diagnostics contract ingestion enabled
- Settings: diagnostics + awareness panel + EventBus updates enabled
- Deployment: diagnostics + awareness panel + EventBus updates enabled
- Code Studio: diagnostics + awareness panel enabled
- Database Hub: diagnostics contract enabled
- Memory Lake: mounted as component and governed by App snapshot/index writes
- Creators Studio: now has page wrapper in pages/ for consistent architecture and diagnostics lifecycle reporting


### 2) LeeWay-Compliant Local Model Workflow (2026)

**All inference is performed locally using Ollama models. No leeway fallback is used except for explicit automation.**

**Registered execution-layer models:**
- **gemma4:e2b** — Reasoning, general LLM tasks
- **qwen2.5vl:3b** — Vision, multimodal/image tasks
- **qwen2.5-coder:1.5b** — Code and database tasks

**How it works:**
- All model requests are routed through the SLMRouter and VisionAgent.
- Only the above models are registered as execution-layer tools.
- No direct model-to-UI wiring; all model use is agent-orchestrated.
- leeway and other cloud APIs are disabled for inference except for explicit automation or fallback by user override.

**Configuration:** See `.env.local` for model endpoints and selection. All models are stored in `E:\ollama-models`.

### 3) Team/Object Awareness (Living System Behavior)
- App emits active surface reports and periodic performance heartbeat reports
- App persists body awareness and wiring snapshot for system-level introspection
- Registry MCP now enforces unique_tag and strict tags at runtime
- Registry JSON now carries persisted unique_tag + strict tags for each MCP agent

## Remaining Gaps / Next Hardening Targets
- Add EventBus-driven awareness events for Home and Database interactions (currently diagnostics-only)
- Add explicit Diagnostics panel section for model-lane utilization counters by surface
- Add contract checks for non-page utility pipelines (functions/src, MCP scripts) to push lightweight diagnostics summary events
- Add automated contract test that fails CI when a page lacks diagnostics + awareness markers

## Pass/Fail Summary
- Diagnostics contract propagation: PASS (major surfaces)
- Creators page architecture discoverability: PASS (wrapper added in pages/)
- leeway free-tier guardrails: PASS (policy + settings + service defaults)
- Cross-system heartbeat telemetry: PASS (periodic App heartbeat)
- Full pipeline uniform contract test coverage: PARTIAL (manual coverage complete; automated tests pending)

## Redo Delta (Post-duplicate-VM removal)
- Entry-point stale VM mount removed from `index.tsx` (`AgentVM` import and JSX mount) to align with current single-VM architecture.
- Diagnostics brain now emits its own strict heartbeat (`pages/Diagnostics.tsx`) so it is both consumer and producer in the diagnostics contract.
- MCP model lanes updated to free-tier-first defaults with env overrides:
  - `MCP agents/voice-agent-mcp/index.ts`: translate lane now uses `leeway_TRANSLATE_MODEL` defaulting to `leeway-2.0-flash`.
  - `MCP agents/health-agent-mcp/index.ts`: health probe lane now uses `leeway_HEALTH_MODEL` defaulting to `leeway-2.0-flash`.
  - `MCP agents/stitch-agent-mcp/lib/leeway.ts`: stitch lane now uses `leeway_STITCH_MODEL` defaulting to `leeway-2.0-flash`.
- Core model type cleanup: removed stale `leeway-1.5-pro` lane from `core/leewayClient.ts`.
- Revalidation status: no editor-reported errors in all touched files after redo.

