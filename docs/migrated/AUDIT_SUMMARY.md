# ARCHITECTURE AUDIT — EXECUTIVE SUMMARY
**Agent Lee Agentic Operating System | April 8, 2026**

---

## CRITICAL FINDINGS

### ❌ THREE INDEPENDENT VOICE HANDLERS
- **VoiceService** (core/VoiceService.ts) — Frontend bridge with fallback tiers
- **LiveConductorAgent** (agents/LiveConductorAgent.ts) — Server orchestrator
- **AgentleeMic** (components/AgentleeMic.tsx) — UI component with LeewayRTCClient wrapper
- **StreamingSTT/TTS** (agents/) — Read-only query interface

**Impact:** Conflicting state, overlapping concerns, 2x microphone permission requests

---

### ❌ TWO UNINTEGRATED EXECUTION STATE MACHINES
- **TaskGraph** (core/TaskGraph.ts) — Task lifecycle: PLANNED → QUEUED → RUNNING → DONE/FAILED
- **Scheduler** (core/runtime/scheduler.ts) — Agent wake/sleep rotation

**Problem:** Neither connected to main execution flow (AgentLee, BackgroundTaskManager)
- AgentLee bypasses both
- BackgroundTaskManager bypasses both  
- TaskGraph and Scheduler read/write WORLD_REGISTRY in parallel (race condition risk)

---

### ❌ GOVERNANCE 100% DECLARED, 0% ENFORCED
**Declared:**
- `CentralGovernance.enforceGovernance()` — not called anywhere
- `GovernanceContract.buildWriteIntentBlock()` — not called anywhere
- `APPROVAL_REQUIRED_CAPS = [...]` — never checked
- User approval flow — no UI implementation

**Consequence:** All execution proceeds without validation or user consent

---

### ⚠️ FOUR SEPARATE INFERENCE PATHS

### 🟢 LEEWAY-COMPLIANT LOCAL MODEL WORKFLOW (2026)

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

---

### 🔴 DIRECT UI→EXECUTION SHORTCUT (Bypasses Intent Classification)
```typescript
User voice // AgentleeMic.tsx
  ↓
await sendBackgroundCommand('Build a React app')  // DIRECT!
  ↓
BackgroundTaskManager.queueTask()  // No routing pre-check
  ↓
[Later, in poll] AgentRouter.classify()  // Classification AFTER queueing!
```

## KEY LATENCY HOTSPOTS

| Bottleneck | Latency | Cause |
|-----------|---------|-------|
| **getUserMedia()** | 1-3s | User permission dialog (BLOCKING app startup) |
| **AgentRouter.classify()** | 100-200ms | Synchronous leeway call per message |
| **RTCInitializer chain** | 2-5s | Serial init (fetchToken → WebSocket → mediaoup) |
| **BackgroundTaskManager poll** | ~5s (worst case) | Hardcoded 5-second interval |
| **Inference Tier 2→3 fallback** | 2-5s | Switch from Qwen to leeway |
| **TaskGraph.tick() persist** | 50-200ms | IndexedDB write (holds lock) |

---

## ARCHITECTURAL VIOLATIONS

### V1: Multiple Response Completion Paths
- Text chat: AgentLee.respond() → emit event (no TaskGraph)
- Voice: LiveConductor → event (no TaskGraph)
- Background: BackgroundTaskManager → (stops, missing final state)

### V2: State Synchronization Failure
- WORLD_REGISTRY written by both TaskGraph & Scheduler
- No lock; no event coordination
- **Race condition:** Agent marked SLEEP while running a RUNNING task

### V3: Governance Model Not Enforced
- Write-intent blocks generated nowhere
- Capability gating absent
- User approval dialog never shown

### V4: Agent Orchestrator Not Routing Voice
- Voice goes directly to server inference
- AgentLee ("Lead Orchestrator") bypassed entirely
- Inconsistent with "all requests routed through AgentLee" spec

---

## TOP RECOMMENDATIONS

### Week 1 (Critical)
1. **Unify voice handlers** → Single VoiceSession owner (LiveConductor); others wrap it
2. **Implement enforcement** → Call `enforceGovernance()` at execution entry points
3. **Integrate TaskGraph** → AgentLee + BackgroundTaskManager both call `TaskGraph.add()`

### Week 2-3 (Important)
4. **Fix blocking init** → Async getUserMedia + Promise.all() for parallel RTC setup
5. **Merge state machines** → Single TaskGraph + Scheduler state (no parallel writes)
6. **Event-driven polling** → BackgroundTaskManager listens to 'backgroundTask:queued' (not 5s timer)

### Week 4+ (Nice-to-have)
7. **Parallel inference** → Qwen + leeway simultaneously (not fallback)
8. **Event validation** → Runtime schema checks on EventBus emissions
9. **Formal coordination** → Leader election for concurrent state updates

---

## CODE SNIPPETS FOR AUDIT TEAM

**What's actually called:**
```
AgentRouter (✓ used) → classify()
AgentLee (✓ used) → respond(), plan(), verify()
LiveConductorAgent (✓ used) → start(), stop()
BackgroundTaskManager (✓ used) → queueTask(), executeTask()
VoiceService (✓ used inconsistently) → speak()
```

**What's declared but never used:**
```
CentralGovernance.enforceGovernance()         [0 callers]
GovernanceContract.buildWriteIntentBlock()    [0 callers]
GovernanceContract.APPROVAL_REQUIRED_CAPS     [0 checks]
Scheduler.runSchedulerTick()                  [Unclear when called]
TaskGraph.complete() / fail()                 [No callers in main flow]
```

---

## FULL REPORT

See: **ARCHITECTURE_AUDIT_2026_04_08.md** (9000+ lines with diagrams, flows, tables)

---

**Risk Level:** 🔴 **HIGH** — Governance bypass + state corruption + execution fragmentation  
**Complexity:** MEDIUM — Architecture is sound, implementation fractured  
**Fixability:** HIGH — Issues are structural, not fundamental design flaws


