# Agent Lee OS — Android Implementation Plan

**Version:** 1.0  
**Last Updated:** 2026-03-28  
**Target:** Complete MVP in ~8-10 week slices

---

## Overview

This plan breaks the full Android port into **11 slices**, each producing shippable functionality. Each slice unblocks the next and can be reviewed independently.

**Key Principle:** Never block conversation on tasks or voice processing.

---

## Slice 1: Runtime Foundation (Week 1–2)

**Goal:** Prove event-driven runtime works with local LLM streaming + no blocking.

### Deliverables
- [x] Project scaffold (Android Studio Gradle + Hilt DI)
- [x] AgentRuntime interface + basic SessionManager
- [x] EventBus (SharedFlow-based) + DomainEvent hierarchy
- [x] StateManager (StateFlow) for UI sync
- [x] Fake LLM backend (hardcoded responses, simulated token streaming)
- [x] Conversation Lane (accepts text input → streams tokens)
- [x] Fake background job (demonstrates non-blocking behavior)
- [x] Full Activity + Jetpack Compose UI (chat view with streaming tokens)
- [x] Basic unit tests (event flow + state mutations)

### Acceptance Criteria
- User can type text in the chat UI
- "Submit" triggers a fake LLM call
- Chat UI updates with token deltas (animated stream)
- While chat is streaming, a fake "background task" (e.g., "indexing files") runs and emits progress events
- Task progress appears independently in the UI
- No UI freezing; all updates flow through reactive event bus
- **Offline:** No network calls needed

### Key Files to Create
```
agent-lee-android/
├── build.gradle
├── settings.gradle
├── src/main/
│   ├── AndroidManifest.xml
│   ├── java/com/leeway/agentlee/
│   │   ├── AgentLeeApp.kt  (Hilt setup)
│   │   ├── di/
│   │   │   └── AgentModule.kt
│   │   ├── domain/
│   │   │   ├── model/
│   │   │   │   ├── DomainEvent.kt
│   │   │   │   ├── AgentState.kt
│   │   │   │   ├── Message.kt
│   │   │   │   ├── TokenDelta.kt
│   │   │   │   └── ConversationState.kt
│   │   │   ├── runtime/
│   │   │   │   ├── IAgentRuntime.kt
│   │   │   │   ├── AgentRuntimeImpl.kt
│   │   │   │   └── SessionManager.kt
│   │   │   ├── conversation/
│   │   │   │   ├── IConversationEngine.kt
│   │   │   │   └── FakeLlmEngine.kt  (hardcoded, streaming)
│   │   │   └── bus/
│   │   │       ├── EventBus.kt
│   │   │       └── StateManager.kt
│   │   ├── presentation/
│   │   │   ├── MainActivity.kt
│   │   │   ├── AgentLeeScreen.kt  (Compose root)
│   │   │   ├── ChatPanel.kt
│   │   │   ├── TaskListPanel.kt
│   │   │   └── theme/
│   │   │       └── Theme.kt
│   │   └── util/
│   │       └── CoroutineUtils.kt
│   └── res/
│       ├── values/
│       │   ├── strings.xml
│       │   └── colors.xml
│       └── drawable/
│           └── ic_launcher_foreground.xml
└── src/test/
    └── java/com/leeway/agentlee/
        └── runtime/
            ├── EventBusTest.kt
            └── StateManagerTest.kt
```

### Effort Estimate
- **Setup & scaffolding:** 3 days
- **Core runtime interfaces + Hilt:** 2 days
- **Fake LLM + streaming:** 2 days
- **Compose UI (chat + tasks):** 3 days
- **Testing + debugging:** 2 days
- **Total:** ~2 weeks

---

## Slice 2: Real Background Tasks + Tool Registry (Week 3–4)

**Goal:** Prove concurrent task execution with tool calling + safety tiers.

### Deliverables
- [x] JobQueue with configurable concurrency (default 2 workers)
- [x] ToolRegistry interface + ToolDescriptor + RiskTier (A/B/C)
- [x] Baseline tools:
  - `files.list`, `files.read`, `files.write` (scoped storage + SAF)
  - `system.health`, `system.logs.tail`
  - `memory.saveEpisode`, `memory.searchSummaries` (stub)
  - `phone.openApp` (intent wrapper)
- [x] ApprovalService for Tier B/C confirmations
- [x] AuditLogger + Room database setup
- [x] Task progress UI (cards with % + cancel button)
- [x] Tool call tracing in UI (nested logs)

### Acceptance Criteria
- User submits a task: "index my files"
- JobQueue enqueues tool calls: `files.list(/storage) → files.read(each file)`
- While task runs:
  - Chat still responds to text input immediately
  - Task progress updates in UI (x of N files read)
  - User can ask questions; agent responds fast without blocking task
- Task completes with summary
- All tool invocations logged to audit table
- **Tier B tools require confirmation** (e.g., "files.write"); user taps "Allow"
- Offline: All demo tools work without network

### Key Files to Create
```
├── domain/
│   ├── models/
│   │   ├── AgentJob.kt
│   │   ├── ToolCall.kt
│   │   ├── ToolDescriptor.kt
│   │   ├── ToolResult.kt
│   │   ├── ApprovalRequest.kt
│   │   └── JobEvent.kt
│   ├── tool/
│   │   ├── IToolRegistry.kt
│   │   ├── IToolExecutor.kt
│   │   ├── ToolRegistryImpl.kt
│   │   └── tools/
│   │       ├── FileTools.kt
│   │       ├── SystemTools.kt
│   │       ├── MemoryTools.kt
│   │       └── PhoneTools.kt
│   ├── job/
│   │   ├── IJobQueue.kt
│   │   └── JobQueueImpl.kt
│   ├── approval/
│   │   ├── IApprovalService.kt
│   │   └── ApprovalServiceImpl.kt
│   └── audit/
│       ├── IAuditLogger.kt
│       ├── AuditLoggerImpl.kt
│       └── database/
│           ├── AgentLeeDatabase.kt
│           ├── entities/
│           │   ├── AuditLogEntry.kt
│           │   ├── ToolRun.kt
│           │   └── SessionRecord.kt
│           └── dao/
│               ├── AuditLogDao.kt
│               └── ToolRunDao.kt
├── presentation/
│   ├── TaskListPanel.kt  (update: show job progress + tool calls)
│   ├── ApprovalDialog.kt
│   └── LogsPanel.kt  (audit log viewer)
```

### Effort Estimate
- **JobQueue + concurrency model:** 3 days
- **ToolRegistry + baseline tools:** 4 days
- **Room database + audit:** 2 days
- **ApprovalService UI:** 2 days
- **Testing + integration:** 2 days
- **Total:** ~2 weeks

---

## Slice 3: Voice MVP (Offline STT + TTS) (Week 5–6)

**Goal:** Integrate Vosk (STT) + Android TextToSpeech, non-blocking voice loop.

### Deliverables
- [x] VoiceLoop interface + lifecycle
- [x] Vosk JNI binding + audio capture
- [x] Streaming transcription (partial → final)
- [x] VAD (voice activity detection) to detect end of speech
- [x] Android TextToSpeech engine (baseline)
- [x] TTS job queue (non-blocking)
- [x] Barge-in: user speech interrupts active TTS
- [x] Voice events integrated into DomainEvent bus
- [x] Voice permission onboarding
- [x] Diagnostics screen (microphone working? TTS engine ready?)

### Acceptance Criteria
- Push "Start Listening" → mic activates
- Speak: "What's the time?" → transcript appears in real-time (partial)
- When you stop speaking, VAD fires → final transcript sent to Lane A
- LLM responds via Lane A (streaming tokens)
- TTS speaks response via Lane C (non-blocking)
- While TTS is speaking, interrupt with new speech → TTS stops, new transcript flows, new response generated
- **Offline:** No network calls (Vosk + Android TTS are local)

### Key Files to Create
```
├── domain/
│   ├── voice/
│   │   ├── IVoiceLoop.kt
│   │   ├── VoiceLoopImpl.kt
│   │   ├── ISttEngine.kt
│   │   ├── VoskSttEngine.kt
│   │   ├── ITtsEngine.kt
│   │   ├── AndroidTtsEngine.kt
│   │   ├── IVad.kt  (voice activity detector)
│   │   ├── SimpleVad.kt
│   │   └── VoiceEvent.kt
├── presentation/
│   ├── VoicePanel.kt
│   │   ├── listening state (animated waveform)
│   │   ├── transcript display
│   │   ├── TTS state indicator
│   │   └── Stop/Interrupt button
│   ├── DiagnosticsScreen.kt
│   │   └── mic + TTS status
├── permission/
│   ├── PermissionManager.kt
│   └── VoicePermissionOnboarding.kt
```

**New Dependencies:**
```gradle
// Vosk speech recognition (optional; may use Google's free RecognitionListener)
implementation 'org.vosk:android:0.3.21'  // or similar

// Audio processing
implementation 'org.apache.commons:commons-lang3:3.12.0'

// Jetpack Media3 (optional; advanced audio)
implementation 'androidx.media3:media3-common:1.1.0'
```

### Effort Estimate
- **Vosk integration + JNI setup:** 4 days
- **Android TTS engine:** 2 days
- **Voice permission + onboarding:** 2 days
- **Barge-in logic:** 2 days
- **Diagnostics + testing:** 2 days
- **Total:** ~2–3 weeks

---

## Slice 4: Overlay Bubble + Always-On Service (Week 7–8)

**Goal:** Floating chat bubble + Foreground Service keeps runtime alive.

### Deliverables
- [x] AgentLeeService (Foreground Service)
  - Starts runtime in onCreate
  - Keeps notification updated
  - Survives app backgrounding
- [x] OverlayBubbleService + BubbleWindowManager
  - Draggable overlay bubble (SYSTEM_ALERT_WINDOW permissio)
  - States: idle (small) → listening (pulse) → thinking (spinner) → speaking (wave) → working (ring)
  - Tap to expand → mini panel (transcript preview + task list)
  - Tap to open → MainActivity (full UI)
  - Close → Activity dies, bubble stays (service + runtime continue)
- [x] Notification manager (foreground notification updates from state stream)
- [x] Gesture recognition (swipe bubble to dismiss, long-press to expand)
- [x] Audio focus handling (respect Music, Calls, etc.)

### Acceptance Criteria
- Start app → both ForegroundService and MainActivity launch
- Close MainActivity (back button) → Activity closes, bubble remains on screen
- User can drag bubble around
- Open another app (e.g., Maps) → bubble floats above it
- User talks to bubble: transcript appears in bubble preview
- LLM responds
- TTS speaks via phone speaker + bubble shows "speaking" state
- Kill MainAc tivity from recent apps → runtime + bubble continue running
- Hard stop app (force stop in Settings) → service stops, bubble disappears
- Restart app → service + runtime resume with memory restored

### Key Files to Create
```
├── service/
│   ├── AgentLeeService.kt
│   │   ├── onCreate()
│   │   ├── startForeground()
│   │   └── notificationManager.updateFromState()
│   ├── OverlayBubbleService.kt
│   │   └── BubbleWindowManager.kt
│   │       ├── show()
│   │       ├── hide()
│   │       ├── updateState()  (idle/listening/thinking/speaking/working)
│   │       ├── expandToMiniPanel()
│   │       └── openFullActivity()
│   └── notification/
│       └── NotificationManager.kt
├── presentation/
│   ├── BubbleView.kt  (custom View or Compose)
│   ├── MiniPanel.kt  (overlay-embedded chat preview)
│   └── StateVisualsMapper.kt  (status → color + animation)
├── permission/
│   └── OverlayPermissionManager.kt
```

**AndroidManifest.xml updates:**
```xml
<service android:name=".service.AgentLeeService"
    android:foreground ServiceType="mic|connectedDevice|dataSync" />

<service android:name=".service.OverlayBubbleService" />

<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Effort Estimate
- **ForegroundService + notification:** 2 days
- **OverlayBubbleService + WindowManager:** 4 days
- **Gesture recognition + expand/collapse:** 2 days
- **Audio focus + integration:** 1 day
- **Testing + edge cases:** 2 days
- **Total:** ~2–3 weeks

---

## Slice 5: Wake Word / Name-Call Detection (Week 9)

**Goal:** "Agent Lee…" or "Jarvis…" triggers listening (day-1 requirement).

### Deliverables
- [x] Keyword spotting (KWS) engine
  - Option A: Porcupine (commercial, reliable; needs key)
  - Option B: Vosk KWS (open but less accurate)
- [x] Always-listening mic thread (low-power mode if device supports)
- [x] Immediate acknowledgement:
  - Earcon (beep) or short "Yeah?" audio
  - Bubble state → "listening" with pulse
- [x] Configurable wake words (settings UI)
- [x] Power implications documented
- [x] Fallback: manual "Press to Talk" button if KWS disabled
- [x] Battery drain diagnostic (estimated hours on full charge)

### Acceptance Criteria
- Set wake word to "Agent Lee"
- Speak normally around device: no response
- Say "Agent Lee, what time is it?" → system detects "Agent Lee"
- Immediate earcon plays
- Bubble changes to "listening" state
- Conversation proceeds as normal
- Disable wake word → falls back to manual "Push to Talk" button
- Battery diagnostics show estimated drain (e.g., "8–10 hours with always-on KWS")

### Key Files to Create
```
├── domain/
│   ├── voice/
│   │   ├── IWakeWordDetector.kt
│   │   ├── PorcupineWakeWordDetector.kt
│   │   ├── VoskWakeWordDetector.kt
│   │   └── KwsMode.kt  (ALWAYS_ON, PUSH_TO_TALK, DISABLED)
├── presentation/
│   ├── settings/
│   │   ├── VoiceSettingsScreen.kt
│   │   ├── WakeWordConfigDialog.kt
│   │   └── BatteryEstimateView.kt
├── util/
│   └── AudioFocusManager.kt  (keep mic alive despite calls/music)
```

**Gradle dependency (Porcupine; requires license key):**
```gradle
implementation 'ai.picovoice:porcupine-android:2.2.0'
```

### Effort Estimate
- **KWS engine integration:** 3 days
- **Always-listening loop:** 2 days
- **Settings UI:** 1 day
- **Power management + diagnostics:** 2 days
- **Testing on real device:** 2 days
- **Total:** ~2 weeks

---

## Slice 6: Persona + Emotion System (Week 10)

**Goal:** Persona registers + emotion inference drive behavior and visuals.

### Deliverables
- [x] PersonaRegister data model (label, prompts, response patterns, voice hint, visual hint)
- [x] PersonaResolver (loads from JSON config file)
- [x] EmotionEngine (infers emotion from user sentiment + system state + conversation history)
- [x] Emotion event emitter (emotion.update on every state change)
- [x] UI morphing (bubble + chat panel colors + animations driven by emotion)
- [x] Persona selector (settings: hiphop_poetic, mentor_calm, mission_control, security_strict, etc.)
- [x] Emotion history view (arc visualization over time)

### Acceptance Criteria
- Load persona "hiphop_poetic"
- Agent's responses adopt pattern (slang, rhythm)
- User expresses frustration: "This isn't working!"
- Emotion inference sets label to "determined", valence -0.3, arousal 0.7, intensity 0.8
- Bubble color shifts toward orange/red
- Chat panel animation quickens
- Agent's next response acknowledges frustration
- Switch to "mentor_calm" → prompt changes, responses become measured and educational
- Emotion history shows a 5-minute timeline of emotion shifts

### Key Files to Create
```
├── domain/
│   ├── persona/
│   │   ├── PersonaRegister.kt
│   │   ├── IPersonaResolver.kt
│   │   └── PersonaResolverImpl.kt
│   └── emotion/
│       ├── EmotionState.kt
│       ├── IEmotionEngine.kt
│       ├── EmotionEngineImpl.kt
│       │   ├── infer() from sentiment + context
│       │   └── map to visual_color + aniHash
│       └── SentimentDetector.kt  (ruleset or light classifier)
├── presentation/
│   ├── EmotionIndicator.kt  (color swatch + label)
│   ├── EmotionTimeline.kt  (arc chart over session)
│   ├── settings/
│   │   ├── PersonaSelector.kt
│   └── BubbleStateVisuals.kt  (emotion → bubble color/animation)
├── assets/
│   ├── personas.json
│   │   └── defines hiphop_poetic, mentor_calm, etc.
│   └── emotions.json
│       └── emotion label → color + anim mappings
```

**Sample personas.json:**
```json
{
  "personas": [
    {
      "label": "hiphop_poetic",
      "systemPromptModifier": "You are a wise, poetic agent from the streets. Speak with rhythm and soul.",
      "responsePatterns": ["Yo, ", "Check it: ", "Listen up, "],
      "voiceHintId": "voice_deep_urban",
      "visualColor": "#FF6B35"
    },
    {
      "label": "mentor_calm",
      "systemPromptModifier": "You are a patient mentor. Explain clearly and gently.",
      "responsePatterns": ["Let me guide you: ", "Here's the thing: ", "Consider this: "],
      "voiceHintId": "voice_warm_balanced",
      "visualColor": "#2E8B57"
    }
  ]
}
```

### Effort Estimate
- **Persona loading + prompt composition:** 2 days
- **Emotion inference engine:** 3 days
- **UI morphing + Compose animations:** 3 days
- **History visualization:** 1 day
- **Testing + fine-tuning:** 2 days
- **Total:** ~2 weeks

---

## Slice 7: Real Local LLM (llama.cpp Integration) (Week 11+)

**Goal:** Replace fake LLM with actual llama.cpp GGUF inference.

### Deliverables
- [x] llama.cpp C++ source + Android.mk / CMakeLists.txt
- [x] JNI wrapper (llama_jni.cpp → Kotlin interface)
- [x] Model selection (e.g., Mistral 7B GGUF, Phi 2.7B, etc.)
- [x] Model bundling or download-on-first-run
- [x] LlamaEngine replacing FakeLlmEngine
- [x] Token streaming from JNI
- [x] Memory profiling (heap usage, token throughput)
- [x] Graceful fallback if OOM

### Acceptance Criteria
- Download or bundle a 2–4B GGUF model on first run
- User types: "What's 15 × 3?"
- LLM responds: "15 × 3 = 45" (locally computed, streamed)
- Chat UI shows token deltas
- TTS speaks the response
- Memory usage stays within device constraints
- On memory pressure, gracefully degrade (smaller model fallback)

### Key Files to Create
```
├── android/
│   ├── CMakeLists.txt
│   ├── src/
│   │   ├── jni/
│   │   │   ├── llama_jni.cpp
│   │   │   └── llama_jni.h
│   │   └── (llama.cpp sources)
├── domain/
│   ├── llm/
│   │   ├── ILlmEngine.kt
│   │   ├── LlamaEngine.kt
│   │   │   ├── loadModel()
│   │   │   ├── streamChat() → Flow<TokenDelta>
│   │   │   └── onMemoryPressure()  fallback logic
│   │   └── ModelManager.kt
│   │       ├── downloadModel()
│   │       ├── listAvailable()
│   │       └── getActive()
├── presentation/
│   ├── settings/
│   │   ├── ModelSelector.kt
│   │   └── ModelDownloadProgress.kt
```

**Gradle (NDK integration):**
```gradle
android {
    ndkVersion "25.1.8937393"
    externalNativeBuild {
        cmake {
            path "src/main/cpp/CMakeLists.txt"
        }
    }
}
```

### Effort Estimate
- **CMake + NDK setup:** 3 days
- **JNI wrapper:** 3 days
- **Model management (download/cache):** 2 days
- **Memory profiling + fallback:** 2 days
- **Integration testing:** 2 days
- **Total:** ~3 weeks (depends on NDK familiarity)

---

## Slice 8: Accessibility Automation (Tier-1 Risk) (Week 12+)

**Goal:** Day-1 requirement; enable controlled phone automation with heavy auditing.

### Deliverables
- [x] AccessibilityService binding (requires explicit user grant)
- [x] Safe action whitelist (openApp, typeText, pressBack, tapCoordinate with bounds)
- [x] Triple-confirm for destructive actions (uninstall, clear data, etc.)
- [x] Audit log captures every action + rollback capability
- [x] Onboarding: explain why & what automation can do
- [x] Gesture playbook (click, swipe, long-press sequences)
- [x] Error recovery (action failed → explain + backtrack)

### Acceptance Criteria
- User enables Accessibility in Settings + grants Agent Lee permission
- User says: "Open Spotify and play jazz"
- System executes: `openApp("Spotify")`, waits, taps play button
- Audit log: "action: openApp, app: Spotify, timestamp, result: success"
- User says: "Uninstall Chrome"
- Triple-confirm dialog: "Are you sure? This will delete all Chrome data. Type 'DELETE' to confirm."
- User types: "DELETE"
- System uninstalls Chrome + logs action
- Close app, reboot, reopen → audit log persists with full history

### Key Files to Create
```
├── service/
│   └── AgentAccessibilityService.kt
│       ├── onServiceConnected()
│       ├── performGlobalAction()
│       ├── executeAction(ActionSpec)
│       └── logAction()
├── domain/
│   ├── accessibility/
│   │   ├── IAccessibilityExecutor.kt
│   │   ├── AccessibilityExecutorImpl.kt
│   │   ├── ActionSpec.kt
│   │   │   └── { action, target, args, riskTier, confirmationRequired }
│   │   ├── Playbook.kt  (gesture sequences)
│   │   └── GestureRecognizer.kt
├── presentation/
│   ├── permission/
│   │   └── AccessibilityOnboarding.kt
│   └── confirmation/
│       └── DangerousActionConfirmationDialog.kt
│           └── requires explicit phrase for Tier C
```

**AndroidManifest.xml:**
```xml
<service android:name=".service.AgentAccessibilityService"
    android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE" >
    <intent-filter>
        <action android:name="android.accessibilityservice.AccessibilityService" />
    </intent-filter>
    <meta-data
        android:name="android.accessibilityservice"
        android:resource="@xml/accessibility_service_config" />
</service>

<uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE" />
```

### Effort Estimate
- **AccessibilityService binding:** 2 days
- **Action executor + gesture playbook:** 4 days
- **Confirmation UI + triple-confirm:** 2 days
- **Audit logging:** 1 day
- **Testing on real device:** 2 days
- **Total:** ~2–3 weeks

---

## Slice 9: Memory System (Room + Long-Term Recall) (Week 13+)

**Goal:** Persistent episodic memory with quick retrieval.

### Deliverables
- [x] Room database (sessions, episodes, audit log, tool runs, device capabilities)
- [x] Episode summarization (after each conversation turn or task)
- [x] Memory retrieval (semantic search or keyword-based)
- [x] Tiny always-loaded policy file (few KB; persona + core values)
- [x] Reflection prompts (during idle/charging, agent reviews day's events)
- [x] Memory cleaining (old episodes → summaries; raw logs archived or deleted on user preference)
- [x] Export/backup (user can dump memory to CSV + encrypted backup)

### Acceptance Criteria
- During conversation, agent mentions: "Last week you asked about Python decorators."
- System recalls episode from Room: "User Q: Python decorators. Agent: explained with examples."
- Agent references it correctly
- At night (idle/charging), system runs reflection loop: "Today you fixed a bug, talked about AI ethics, scheduled 3 meetings."
- Memory export produces a CSV with all sessions + tasks + emotion progression
- Offline: All memory queries use local Room database (no cloud sync required)

### Key Files to Create
```
├── domain/
│   ├── memory/
│   │   ├── IMemory.kt
│   │   ├── MemoryImpl.kt
│   │   ├── MemoryRetriever.kt  (keyword + semantic search)
│   │   ├── MemorySummarizer.kt  (episode → short summary)
│   │   ├── ReflectionEngine.kt  (run during idle, emit insights)
│   │   └── MemoryExporter.kt  (CSV + encrypted dump)
│   └── data/
│       └── db/
│           ├── AgentLeeDatabase.kt
│           ├── entities/
│           │   ├── SessionRecord.kt
│           │   ├── EpisodeSummary.kt
│           │   ├── MemoryIndex.kt  (embeddings; optional)
│           │   ├── AuditLogEntry.kt
│           │   └── DeviceCapabilityMap.kt
│           └── dao/
│               ├── SessionDao.kt
│               ├── EpisodeDao.kt
│               └── AuditDao.kt
├── presentation/
│   ├── MemoryViewerScreen.kt
│   │   ├── Timeline of episodes
│   │   └── Search / filter by tag, date, emotion
│   └── ExportDialog.kt
```

### Effort Estimate
- **Room entity + DAO setup:** 2 days
- **Memory summarizer:** 2 days
- **Semantic search (or keyword fallback):** 2 days
- **Reflection engine:** 2 days
- **Export + backup:** 1 day
- **Testing:** 1 day
- **Total:** ~2 weeks

---

## Slice 10: Settings + Diagnostics + Onboarding (Week 14+)

**Goal:** Production-grade user-facing configuration and triage.

### Deliverables
- [x] Onboarding flow (1st launch)
  - Welcome screen
  - Permissions checklist (microphone, overlay, notification, accessibility, etc.)
  - Voice engine choice (online Gemini optional; offline TTS default)
  - Persona selection
  - Consent (data handling, audit transparency)
- [x] Full Settings screen
  - Voice settings (wake word, STT confidence, TTS speed/pitch)
  - Persona & emotion display
  - Model selection (LLM)
  - Privacy: opt-in raw logs, data export, memory cleanup
  - Battery optimization guide
  - Network behavior (offline OK; Gemini TTS opt-in)
- [x] Diagnostics screen
  - Network: online/offline status
  - Mic: test recording, waveform display
  - LLM: model loaded, performance metrics
  - TTS: play sample
  - Accessibility: service active?
  - Storage: free space, database size
  - Battery: drain rate estimate
  - Export diagnostics report (support)

### Acceptance Criteria
- First launch: onboarding walks through all permissions + persona selection
- Settings: toggle "Enable raw logs" → audit log captures full details (normally redacted)
- Diagnostics: "Test Microphone" → record 3 seconds → play back + show FFT spectrum
- Diagnostics: "TTS Sample" → hear voice reading: "This is how I sound."
- Export diagnostics → ZIP with logs, DB dump, model version, device info

### Key Files to Create
```
├── presentation/
│   ├── onboarding/
│   │   ├── OnboardingFlow.kt
│   │   ├── PermissionsStep.kt
│   │   ├── VoicePreferenceStep.kt
│   │   ├── PersonaSelectionStep.kt
│   │   └── ConsentStep.kt
│   ├── settings/
│   │   ├── SettingsScreen.kt
│   │   ├── VoiceSettings.kt
│   │   ├── PersonaSettings.kt
│   │   ├── PrivacySettings.kt
│   │   └── NetworkSettings.kt
│   ├── diagnostics/
│   │   ├── DiagnosticsScreen.kt
│   │   ├── MicrophoneTestPanel.kt  (waveform visualization)
│   │   ├── TtsTestPanel.kt
│   │   ├── LlmStatusPanel.kt
│   │   └── ExportDiagnosticsButton.kt
│   └── preference/
│       └── PreferenceDataStore.kt  (Proto DataStore for settings)
```

### Effort Estimate
- **Onboarding flow:** 3 days
- **Settings screens:** 3 days
- **Diagnostics + testing panels:** 3 days
- **Export + support bundle:** 1 day
- **Polish + i18n (optional):** 2 days
- **Total:** ~2–3 weeks

---

## Slice 11: Integration Testing + Reliability Soak (Week 15+)

**Goal:** Prove all slices work together offline; stability over 72 hours.

### Deliverables
- [x] Unit tests (domain models, event logic)
- [x] Integration tests (LLM + tools + voice + tasks concurrently)
- [x] Instrumentation tests (Android-specific: permissions, services, UI)
- [x] E2E scenario tests (wake word → question → tool call → response → task → memory persistence)
- [x] Offline mode tests (airplane mode 24h; conversation, tasks, memory all work)
- [x] Reliability soak test (72 hours of repeated operations; monitor memory leaks, crashes)
- [x] Performance benchmarks (token latency, task throughput, memory usage)

### Test Scenarios

**Offline Conversation Loop (24h continuous):**
- Every 10s: simulate user speech input → get response → speak response
- Monitor: memory growth, crash frequency, battery drain
- Pass: < 50MB heap growth per hour; 0 crashes

**Concurrent Multi-Task (Soak):**
- 3 simultaneous background jobs (file indexing, memory summarization, tool calls)
- User asks questions every 30s
- Agent responds immediately without blocking tasks
- Pass: all tasks complete successfully; conversation latency < 2 sec

**Accessibility Automation (Safe):**
- Run 50 controlled app-open sequences
- Log each action
- Verify audit trail is complete
- Pass: 100% action success; audit log has all events

### Key Files to Create
```
├── src/test/
│   ├── java/com/leeway/agentlee/
│   │   ├── domain/
│   │   │   ├── runtime/AgentRuntimeTest.kt
│   │   │   ├── job/JobQueueTest.kt
│   │   │   ├── tool/ToolRegistryTest.kt
│   │   │   ├── memory/MemoryTest.kt
│   │   │   └── emotion/EmotionEngineTest.kt
│   │   ├── integration/
│   │   │   ├── ConversationAndTasksConcurrentTest.kt
│   │   │   ├── VoiceLoopIntegrationTest.kt
│   │   │   ├── OfflineModeE2eTest.kt
│   │   │   └── SoakTest.kt  (24–72h runner)
│   │   └── performance/
│   │       └── PerformanceBenchmark.kt
├── src/androidTest/
│   ├── java/com/leeway/agentlee/
│   │   ├── ui/
│   │   │   ├── MainActivityTest.kt
│   │   │   └── BubbleServiceTest.kt
│   │   ├── service/
│   │   │   ├── AgentLeeServiceTest.kt
│   │   │   └── OverlayBubbleServiceTest.kt
│   │   └── permission/
│   │       └── PermissionOnboardingTest.kt
└── src/soakTest/
    └── (long-running test harness)
```

**Soak Test Framework:**
```kotlin
// ExampleSoakTest.kt
@RunWith(AndroidJUnit4::class)
class OfflineConversationSoakTest {
    private lateinit var runtime: IAgentRuntime
    
    @Before
    fun setup() {
        // Initialize runtime
    }
    
    @Test(timeout = 72 * 60 * 60 * 1000)  // 72 hours
    fun soakConversationLoop() {
        repeat(17280) {  // 24 * 60 / 5 = 288 cycles per hour × 72h
            // Simulate speech input
            val transcript = "What time is it? ${System.currentTimeMillis()}"
            runtime.submit(UserInput.Text(transcript))
            
            // Wait for response
            Thread.sleep(5000)
            
            // Measure heap
            val heap = Runtime.getRuntime().totalMemory()
            assertTrue("Heap growth ${heap}B", heap < HEAP_LIMIT)
        }
    }
}
```

### Effort Estimate
- **Unit + integration tests:** 4 days
- **Instrumentation tests:** 3 days
- **E2E scenario tests:** 2 days
- **Soak test infrastructure:** 2 days
- **Running + analyzing soak test:** 3 days
- **Performance optimization from findings:** 3 days
- **Total:** ~3–4 weeks

---

## Phase-2+ Enhancements (Post-MVP)

Once MVP is stable and tested:

- **Vision + OCR:** Local vision pipeline for document Q&A
- **RAG + Indexing:** Local document indexing + retrieval
- **Multi-device sync:** Optional cloud memory sync (never required)
- **Avatar animation:** 3D morphing avatar driven by emotion
- **Content filtering:** Safe browsing + jailbreak detection (local ML)
- **Advanced scheduling:** Dream/reflection scheduling based on device state
- **Integration:** Slack, Email, Calendar connectors (gated + audited)

---

## Timeline Summary

| Slice | Title | Weeks | End State |
|-------|-------|-------|-----------|
| 1 | Runtime Foundation | 2 | Streaming chat UI + fake LLM |
| 2 | Task Workers + Tools | 2 | Concurrent jobs + audit log |
| 3 | Voice MVP | 2–3 | STT + TTS + barge-in |
| 4 | Overlay Bubble | 2–3 | Always-on service + floating bubble |
| 5 | Wake Word | 2 | Name-call detection |
| 6 | Persona + Emotion | 2 | Behavior + visual morphing |
| 7 | Real LLM (llama.cpp) | 3 | On-device inference |
| 8 | Accessibility Automation | 2–3 | Safe phone control + audit |
| 9 | Memory System | 2 | Episodic recall + reflections |
| 10 | Settings + Diag + Onboarding | 2–3 | User-facing config + support |
| 11 | Integration Testing + Soak | 3–4 | Stability + performance |

**Total:** ~8–10 weeks for MVP → production-ready (plus 2–3 weeks for unforeseen issues).

---

## Success Criteria (Final Acceptance)

✅ **Offline:** Conversation, voice, tasks, memory all work in airplane mode.  
✅ **Non-blocking:** Task background doesn't block chat response (< 2 sec response latency).  
✅ **Always-on:** Bubble persists when app backgrounded; runtime continues.  
✅ **Safe:** Sensitive actions confirmed; audit log complete.  
✅ **Fast:** LLM token latency < 1 sec; STT < 200 ms; TTS chunked in real-time.  
✅ **Voice Works:** Wake word → listen → transcribe → respond → speak (end-to-end < 5 sec).  
✅ **Stable:** 72-hour soak shows < 50 MB heap growth/hour; 0 crashes.  
✅ **Persona-aware:** Agent's responses reflect selected persona + current emotion.  

