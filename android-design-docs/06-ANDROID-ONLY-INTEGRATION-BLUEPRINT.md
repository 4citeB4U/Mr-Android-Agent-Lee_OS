# Agent Lee Android-Only Integration Blueprint

Status: Draft for execution
Date: 2026-03-28
Scope: Extract reference behavior/UI from workspace and integrate into native Android app only

---

## 1. Objective Lock (Non-Negotiable)

This build remains 100% Android-native at runtime:
- No dependency on desktop host orchestration
- No required Web app shell for core experience
- No required remote VS Code bridge for normal operation
- Local-first runtime with optional network adapters behind feature flags

Reference assets from workspace are used as design and behavior sources only.

---

## 2. What To Extract From Reference (Source of Truth)

Primary source buckets:
- docs attachments (persona + brain + hands + eyes + ears + memory + VM concepts)
- workspace UI dumps and screenshots
- workspace system metadata files (layers, adapters, memory snapshots)

Concrete references found in copied workspace:
- UI launcher shell dump: workspace/agentlee_launcher.xml
- UI sovereign control surface dump: workspace/final_ui.xml
- Layer/cognition map: workspace/lee_layers.json
- Screenshot corpus for spacing/theme/state validation: workspace/*.png, workspace/*.jpg

---

## 3. Exact UI Surface Extraction (Android Canonical)

### 3.1 Surface A: Presence Launcher

Evidence from reference:
- Title: Agent Lee Presence
- Status summary block (permissions + wallpaper state)
- Action buttons:
  - Permissions Granted
  - Agent Lee Wallpaper Active
  - Open Control Surface
  - Preview Agent Lee Voice
  - Open App Permissions

Android implementation target:
- Compose screen: PresenceLauncherScreen
- Persisted readiness model from RuntimeReadinessState
- Permission checklist with deep links to settings screens
- Launch actions to ControlSurfaceActivity and VoicePreview flow

### 3.2 Surface B: Control Surface (Sovereign IDE style)

Evidence from reference:
- Header title: Agent Lee // Sovereign IDE
- Large hero panel with core form/auto state
- Conversation preview zone
- Composer row:
  - Conversations button
  - Message field (hint: Message Agent Lee...)
  - Voice input button
  - Send button
- Bottom nav actions:
  - Home, Remote, Data, Studio, Apps, Sys
- Floating action: Open Agent Lee's computer

Android implementation target:
- Compose screen: ControlSurfaceScreen
- Modular panes:
  - AgentCoreHeroPane
  - ConversationPane
  - ComposerBar
  - SovereignBottomNav
  - QuickActionFab
- Material 3 + custom design tokens derived from screenshot color study

### 3.3 Surface C: Overlay + Always-On Interaction

Evidence from design docs and reference behavior:
- Bubble remains after full activity closes
- Runtime still listens/speaks in foreground service

Android implementation target:
- Foreground service + overlay bubble (Slice 4 alignment)
- State visuals mapped from AgentStatus and EmotionState

---

## 4. Function Extraction Matrix (Hands, Eyes, Brain)

### 4.1 Hands (Action System)

Reference capabilities to preserve:
- Terminal-like execution
- File operations
- Network requests
- Tool routing with safety and audit

Android-only translation:
- Terminal => CommandAdapter (restricted to app sandbox tasks, no raw shell by default)
- Files => Scoped storage + SAF tools
- Network => Http adapter with domain allowlist + per-tool policy
- Tool routing => IToolRegistry + risk tiers A/B/C + approval dialogs

Must-have first tools:
- files.list
- files.read
- files.write (Tier B)
- system.health
- memory.saveEpisode
- memory.searchSummaries
- phone.openApp

### 4.2 Eyes (Vision + Visual Expression)

Reference capabilities to preserve:
- Perceive screenshots/images
- Express state through visual identity

Android-only translation:
- Vision input:
  - CaptureManager (screenshot/import/camera)
  - VisionEngine interface (offline first, cloud optional behind flag)
- Visual expression:
  - Compose/Canvas avatar module (phase 1)
  - Optional OpenGL particle avatar (phase 2)

### 4.3 Brain (Intent + Register + Response)

Reference capabilities to preserve:
- Intent classification
- Register selection
- Memory-grounded response
- Tool-call planning and execution

Android-only translation:
- Orchestrator remains AgentRuntime
- Add these interfaces:
  - IIntentClassifier
  - IRegisterSelector
  - IResponsePlanner
  - IToolCallPlanner
- Local model path for production target (Slice 7), fake/stub retained for dev mode

### 4.4 Memory and Learning

Reference capabilities to preserve:
- Episodic memory
- Semantic recall
- Preference adaptation

Android-only translation:
- Room/SQLite episodes and preferences
- Optional vector index module (local embedding cache)
- Retention and compaction jobs via WorkManager

---

## 5. De-Webification Rules (Keep It Android)

Anything currently represented as WebView/web shell becomes native UI/state:
- Replace WebView control surface with Compose screens
- Keep WebView only as temporary fallback behind debug flag
- Any remote desktop/VM concept becomes optional RemoteBridge module, never required for core user flow

Launch criteria for Android-only claim:
- First-run setup, chat, voice, tools, and memory all work with airplane mode (except explicitly online tools)
- No mandatory dependency on localhost desktop services

---

## 6. Current Gap Snapshot (Today)

Already present:
- Event bus and runtime skeleton
- Compose chat shell
- Domain events for voice/tools/tasks
- Fake conversation engine

Missing for full Agent Lee parity:
- Native control surface matching reference
- Tool executors and approval workflow wired end-to-end
- Voice loop implementation and barge-in
- Vision lane
- Memory retrieval and preference adaptation
- Foreground service + overlay bubble
- Local model integration

---

## 7. What We Start With (Execution Order)

### Sprint 0 (2-3 days): Lock UI and contracts

1. Define Android design tokens from reference screenshots
2. Implement PresenceLauncherScreen and ControlSurfaceScreen skeletons in Compose
3. Freeze event contracts for hands/eyes/brain (no runtime behavior change yet)

Exit criteria:
- App shows native launcher + native sovereign control surface with realistic state mocks

### Sprint 1 (4-6 days): Hands lane baseline

1. Implement ToolRegistry + 6 baseline tools
2. Add ApprovalService and Tier B confirmation flow
3. Wire task cards and tool logs into UI

Exit criteria:
- User triggers a tool task from UI and sees audited progress end-to-end

### Sprint 2 (4-6 days): Voice lane baseline

1. Implement VoiceLoop with STT/TTS
2. Add voice button behavior in composer
3. Add barge-in and speaking state transitions

Exit criteria:
- Voice in -> response streamed -> TTS out, with interrupt support

### Sprint 3 (4-6 days): Eyes + memory baseline

1. Add image ingest path and VisionEngine interface
2. Add Room episodic storage + retrieval in context assembly
3. Add Memory tab in bottom nav (Data)

Exit criteria:
- Agent can reference recent episodes and process at least one image workflow

### Sprint 4 (4-5 days): Service + overlay + hardening

1. Foreground service and overlay bubble
2. Permission hardening and startup resilience
3. Android-only acceptance verification

Exit criteria:
- Runtime persists with overlay after activity closes; no desktop dependency

---

## 8. Immediate Build Backlog (Start Now)

P0 items:
- Native Compose Control Surface implementation (replace web-like shell)
- ToolRegistry + ApprovalService wiring
- VoiceLoop interface implementation scaffold

P1 items:
- Memory DAO and retrieval adapter
- Vision ingest and placeholder analyzer
- Bubble service implementation

P2 items:
- Avatar expression engine refinement
- Register-aware response tuning
- Local model performance optimization

---

## 8.5 Sprint 0 Contract Lock (Kotlin)

These contracts are frozen before runtime implementation so model/runtime/tool backends can be swapped later without UI refactors.

### A. Composer and Conversation Contract

```kotlin
package com.leeway.agentlee.contracts

enum class MicState { IDLE, LISTENING, PROCESSING }
enum class VisionState { IDLE, CAPTURING, ANALYZING }
enum class ComposerMode { CHAT, TASK, VOICE, VISION }

data class DraftAttachment(
  val id: String,
  val uri: String,
  val mimeType: String,
  val source: String
)

data class ComposerState(
  val text: String = "",
  val micState: MicState = MicState.IDLE,
  val visionState: VisionState = VisionState.IDLE,
  val mode: ComposerMode = ComposerMode.CHAT,
  val draftAttachments: List<DraftAttachment> = emptyList()
)

sealed interface ComposerIntent {
  data class UpdateText(val value: String) : ComposerIntent
  data object SendText : ComposerIntent
  data object StartMic : ComposerIntent
  data object StopMic : ComposerIntent
  data class AttachImage(val uri: String, val mimeType: String) : ComposerIntent
  data class ConfirmTool(val toolCallId: String, val approved: Boolean) : ComposerIntent
}
```

### B. Agent Runtime Contract

```kotlin
package com.leeway.agentlee.contracts

import kotlinx.coroutines.flow.Flow

sealed interface AgentEvent {
  data class UserUtterance(val id: String, val text: String, val timestamp: Long) : AgentEvent
  data class AssistantMessage(val id: String, val text: String, val timestamp: Long) : AgentEvent
  data class ToolCallProposed(val call: ToolCall) : AgentEvent
  data class ToolCallResult(val result: ToolResult) : AgentEvent
  data class VisionFrameReceived(val frameId: String, val source: String, val timestamp: Long) : AgentEvent
  data class AudioPartial(val text: String, val timestamp: Long) : AgentEvent
  data class AudioFinal(val text: String, val timestamp: Long) : AgentEvent
  data class AuditLogEvent(val id: String, val message: String, val timestamp: Long) : AgentEvent
  data class Error(val code: String, val message: String, val recoverable: Boolean) : AgentEvent
}

interface AgentController {
  fun events(): Flow<AgentEvent>
  suspend fun submitUserText(text: String)
  suspend fun submitUserAudio(bytes: ByteArray, sampleRateHz: Int, channels: Int)
  suspend fun submitVisionInput(imageBytes: ByteArray, mimeType: String, source: String)
  suspend fun approveToolCall(id: String, approved: Boolean)
}
```

### C. Hands Contract (Tool Registry + Dispatcher)

```kotlin
package com.leeway.agentlee.contracts

enum class ToolRiskLevel { LOW, MEDIUM, HIGH }
enum class ToolCategory { FILES, SYSTEM, PHONE, ACCESSIBILITY, NETWORK, MEMORY, VISION, AUDIO }
enum class ToolCallStatus { PROPOSED, RUNNING, SUCCESS, FAILED, CANCELED, DENIED }

data class ToolSpec(
  val name: String,
  val description: String,
  val inputSchemaJson: String,
  val requiresApproval: Boolean,
  val riskLevel: ToolRiskLevel,
  val category: ToolCategory
)

data class ToolCall(
  val id: String,
  val toolName: String,
  val argsJson: String,
  val originAgent: String,
  val timestamp: Long
)

data class ToolResult(
  val id: String,
  val status: ToolCallStatus,
  val resultJson: String? = null,
  val error: String? = null
)

interface ToolRegistry {
  fun register(spec: ToolSpec)
  fun list(): List<ToolSpec>
  fun findByName(name: String): ToolSpec?
}

interface ToolDispatcher {
  suspend fun dispatch(call: ToolCall): ToolResult
}
```

---

## 9. Acceptance Tests For Android-Only Promise

1. Fresh install on Android 12+ device
2. Complete permission onboarding in-app
3. Send text prompt and receive streamed response without desktop bridge
4. Run files.list task with approval and audit log entry
5. Use voice input and get spoken response; interrupt with barge-in
6. Close activity; confirm overlay/service continue
7. Disable network; verify core loop still works

---

## 10. Build Decision

Use existing Slice plan as backbone, but execute with this extraction mapping:
- UI exactness from workspace dumps and screenshot set
- Functional parity via hands/eyes/brain interfaces
- Android-only runtime policy enforced at architecture and test levels

---

## 11. Proof & Safety Invariant (Execution Gate)

### 11.1 Prove-First Rule

Proof is not the same as permission. A tool call is considered provable only when a ProofBundle contains sufficient on-device evidence and policy returns ALLOW.

### 11.2 Non-Negotiable Invariant

ToolDispatcher.dispatch(call) is never called unless ToolExecutionGate returns Authorized(proof).

### 11.3 Evidence Model

Evidence types (initial baseline):
- USER_APPROVAL
- PERMISSION_GRANTED
- APP_INSTALLED
- FOREGROUND_APP
- INPUT_SCHEMA_VALID
- RATE_LIMIT_OK
- DEVICE_STATE_OK
- SCREEN_CAPTURE_HASH
- ACCESSIBILITY_SNAPSHOT_HASH

Proof bundle requirements:
- Every executed tool call must include proof bundle in tool result
- Every executed or denied call must append audit entry with proof bundle
- UI must display missing evidence before execution

### 11.4 Policy Decisions

Policy engine output:
- ALLOW
- DENY
- NEED_USER_APPROVAL
- NEED_MORE_EVIDENCE

### 11.5 Default Matrix (Risk x Evidence)

Risk LOW (Tier A):
- Required: INPUT_SCHEMA_VALID, RATE_LIMIT_OK, DEVICE_STATE_OK
- Add PERMISSION_GRANTED when tool requires Android permission

Risk MEDIUM (Tier B):
- LOW requirements
- plus USER_APPROVAL

Risk HIGH (Tier C):
- MEDIUM requirements
- plus FOREGROUND_APP
- plus optional SCREEN_CAPTURE_HASH or ACCESSIBILITY_SNAPSHOT_HASH when relevant to tool category

### 11.6 Tool Category Additions

FILES:
- add PERMISSION_GRANTED when SAF/media permissions are needed

PHONE:
- add APP_INSTALLED when targeting external apps

ACCESSIBILITY:
- default to HIGH risk
- require USER_APPROVAL each run and context evidence

NETWORK:
- require RATE_LIMIT_OK and allowlist/domain policy pass evidence

### 11.7 Runtime Event Requirements

Control Surface and timeline must receive:
- ToolCallProposed(call, requiredEvidence, proofSoFar)
- ToolAuthorizationUpdated(callId, decision, proofSoFar, missingEvidence)
- ToolCallDenied(callId, reason, proofBundle)
- ToolCallExecuted(callId, proofBundle, result)

### 11.8 Verification Tests (Must Pass)

Enforcement status rule:
- Proof policy is considered enforced only when CI executes the test suite and includes ToolExecutionGate tests.

Unit tests:
- gate denies if HIGH risk approval missing
- gate denies when schema evidence missing
- gate allows LOW risk with preflight evidence
- audit log always includes proof bundle for executed calls

Instrumentation (next slice):
- OpenApp tool does not execute without app-installed + schema evidence
- OpenApp tool requires approval where policy requires it

### 11.9 Distribution Profile Default

Current default profile: SIDELOAD

Sideload baseline:
- enforce full proof gate
- allow optional advanced tools behind explicit user approval

If distribution changes to PLAY:
- stricter defaults apply
- accessibility/overlay automation tools default to DENY until explicit policy-safe mode is enabled
