# Agent Lee OS — Android Technical Design Document

**Status:** Draft for Review  
**Date:** 2026-03-28  
**Target:** Native Android App (API 31+)  
**Decision Lock:** Event-stream runtime + Foreground Service + Overlay Bubble  

---

## 1. Architecture Overview

### 1.1 System Layers (Vertical)

```
┌─────────────────────────────────────────────────────┐
│         UI Layer (Jetpack Compose)                  │
│  ┌─────────────────────────────────────────────┐    │
│  │ Full App Activity │ Overlay Bubble Service   │   │
│  │ Chat / Tasks / Settings / Logs               │   │
│  └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│          Event Bus + State Store                    │
│  (SharedFlow<DomainEvent> + atomic State)          │
├─────────────────────────────────────────────────────┤
│      Agent Runtime Service (Foreground)             │
│  (Session / Conversation / Tasks / Voice)          │
├─────────────────────────────────────────────────────┤
│    Subsystems (Pluggable via Interfaces)           │
│  ├─ Conversation Lane (LLM + token streaming)      │
│  ├─ Task Workers (concurrent jobs)                 │
│  ├─ Voice Loop (STT + VAD + TTS)                   │
│  ├─ Tool Registry (MCP-like, local-only)           │
│  ├─ Memory (Room/SQLite + local inference)         │
│  └─ Persona + Emotion Engine                       │
├─────────────────────────────────────────────────────┤
│        Hardware / OS Bindings                       │
│  ├─ Microphone + Audio Manager                     │
│  ├─ Accessibility Service                          │
│  ├─ File System / Scoped Storage                   │
│  └─ Intent Router                                  │
└─────────────────────────────────────────────────────┘
```

### 1.2 The Three-Lane Runtime

**Lane A — Conversation (Always Responsive)**
- Accepts text and speech input
- Calls LLM streaming endpoint
- Emits `conversation.delta` events (token by token)
- never blocks on tool execution
- can emit immediate short responses while tasks run

**Lane B — Task Workers (Background Jobs)**
- Job queue with configurable concurrency (default 2)
- Each job: `queued → running → awaiting_confirmation → running → completed/failed/canceled`
- Tool calls are unit-of-work within jobs
- Progress events emitted to event bus
- Can be interrupted/canceled by user or system

**Lane C — Voice Loop (Always Available)**
- Continuous mic input + VAD (voice activity detection)
- Wake word / name-call listening (always on or push-to-talk)
- Transcription via Vosk (streaming partial → final)
- Text handed to Lane A
- TTS output non-blocking
- Barge-in: user speech stops active TTS immediately

**Shared — Event Bus + State**
- Single `Flow<DomainEvent>` published by all lanes
- Atomic `StateManager<AgentState>` for UI consistency
- Events include: state changes, emotion updates, task progress, tool calls, approval requests, audit events

---

## 2. Core Components & Interfaces

### 2.1 AgentRuntime (Main Orchestrator)

```kotlin
// Singleton, owned by ForegroundService
interface IAgentRuntime {
    suspend fun initialize(context: Context)
    suspend fun start()
    suspend fun stop()
    fun submit(input: UserInput): JobId  // text or speech
    fun submitTask(taskDef: TaskDefinition): TaskId
    fun cancelTask(taskId: TaskId)
    fun interrupt()  // Stop speaking, pause jobs
    
    fun onPermissionsChanged(perms: Map<String, Boolean>)
    
    val events: Flow<DomainEvent>
    val state: StateFlow<AgentState>
}

data class AgentState(
    val status: AgentStatus,  // idle, listening, thinking, speaking, working, error
    val currentConversation: ConversationState,
    val activeTasks: Map<TaskId, TaskProgress>,
    val emotion: EmotionState,
    val isServiceRunning: Boolean,
    val permissionsMap: Map<String, Boolean>,
    val audioCapture: Boolean  // mic is recording
)

enum class AgentStatus {
    INITIALIZING, IDLE, LISTENING, THINKING, SPEAKING, WORKING, ERROR, SHUTDOWN
}
```

### 2.2 Conversation Lane (ConversationEngine)

```kotlin
interface IConversationEngine {
    suspend fun streamChat(
        messages: List<Message>,
        toolDescriptors: List<ToolDescriptor>,
        context: ContextSnapshot
    ): Flow<TokenDelta>  // emits on demand
    
    suspend fun cancel()
    fun getSystemPrompt(): String
}

// Implementation uses:
// - ILlmEngine (llama.cpp)
// - IPersonaResolver (maps persona register to prompt modifier)
// - IMemoryRetriever (fetch relevant context)
data class TokenDelta(
    val token: String,
    val timestamp: Long,
    val confidence: Float = 1.0f
)
```

### 2.3 Voice Loop (VoiceService)

```kotlin
interface IVoiceLoop {
    suspend fun initialize(context: Context)
    suspend fun start()
    suspend fun stop()
    
    // STT (input ear)
    val transcript: Flow<TranscriptDelta>
    fun setWakeWordEnabled(enabled: Boolean)
    
    // TTS (output mouth)
    suspend fun speak(text: String, voiceId: String): SpeechJobId
    fun stopSpeaking(jobId: SpeechJobId? = null)
    fun isSpeaking(): Boolean
    
    val events: Flow<VoiceEvent>  // partial, final, started, stopped, error, emotion_signal
}

data class TranscriptDelta(
    val text: String,
    val isFinal: Boolean,
    val confidence: Float
)

sealed class VoiceEvent {
    data class SttPartial(val text: String) : VoiceEvent()
    data class SttFinal(val text: String) : VoiceEvent()
    data class SttError(val error: Throwable) : VoiceEvent()
    data class TtsStarted(val jobId: SpeechJobId) : VoiceEvent()
    data class TtsChunk(val jobId: SpeechJobId, val audioBytes: ByteArray) : VoiceEvent()
    data class TtsCompleted(val jobId: SpeechJobId) : VoiceEvent()
    data class TtsError(val jobId: SpeechJobId, val error: Throwable) : VoiceEvent()
    data class WakeWordDetected(val keyword: String, val confidence: Float) : VoiceEvent()
    data class EmotionSignal(val sentiment: Float)  // -1.0 to 1.0
}
```

### 2.4 Task Workers (JobQueue)

```kotlin
interface IJobQueue {
    suspend fun enqueue(job: AgentJob): JobId
    suspend fun processUntilEmpty()  // main loop
    
    fun cancelJob(jobId: JobId)
    fun pauseJob(jobId: JobId)
    fun resumeJob(jobId: JobId)
    
    val jobEvents: Flow<JobEvent>
}

data class AgentJob(
    val id: JobId,
    val title: String,
    val toolCalls: List<ToolCall>,
    val requiresConfirmation: Boolean,
    val priority: JobPriority = JobPriority.NORMAL,
    val timeout: Duration = 5.minutes
)

sealed class JobEvent {
    data class Started(val jobId: JobId, val title: String) : JobEvent()
    data class ToolStarted(val jobId: JobId, val toolName: String, val callId: String) : JobEvent()
    data class ToolProgress(val jobId: JobId, val callId: String, val progress: Float) : JobEvent()
    data class ToolCompleted(val jobId: JobId, val callId: String, val result: ToolResult) : JobEvent()
    data class ToolError(val jobId: JobId, val callId: String, val error: Throwable) : JobEvent()
    data class AwaitingConfirmation(val jobId: JobId, val message: String) : JobEvent()
    data class Completed(val jobId: JobId) : JobEvent()
    data class Failed(val jobId: JobId, val error: Throwable) : JobEvent()
    data class Canceled(val jobId: JobId) : JobEvent()
}
```

### 2.5 Tool Registry (MCP-like, Local-Only)

```kotlin
interface IToolRegistry {
    fun register(descriptor: ToolDescriptor, executor: IToolExecutor)
    fun getAll(): List<ToolDescriptor>
    fun getByName(name: String): ToolDescriptor?
    
    suspend fun execute(call: ToolCall): ToolResult
}

data class ToolDescriptor(
    val name: String,
    val description: String,
    val category: ToolCategory,  // files, system, phone, accessibility, network, memory
    val inputSchema: JsonSchema,
    val riskTier: RiskTier,  // A (auto), B (confirm), C (triple-confirm)
    val requiresPermission: String? = null,
    val isOnlineOnly: Boolean = false
)

interface IToolExecutor {
    suspend fun execute(args: JsonObject, auditLog: IAuditLogger): ToolResult
}

data class ToolResult(
    val ok: Boolean,
    val data: JsonObject? = null,
    val error: String? = null,
    val logs: List<String> = emptyList(),
    val executionTimeMs: Long = 0
)

enum class RiskTier { A, B, C }
enum class ToolCategory { FILES, SYSTEM, PHONE, ACCESSIBILITY, NETWORK, MEMORY }
```

### 2.6 Memory System (Room + Retrieval)

```kotlin
interface IMemory {
    // Queries
    suspend fun getCurrentSession(): SessionRecord
    suspend fun searchEpisodes(query: String, limit: Int = 5): List<EpisodeSummary>
    suspend fun getTinyPersonaPolicy(): String  // Always-loaded few KB
    
    // Writes (append-only episodic)
    suspend fun recordEpisode(content: String, tags: List<String>)  // stores raw log if opt-in
    suspend fun summarizeAndArchive(sessionId: String, summary: String)
    
    // Reflection / Dreams
    suspend fun getIdleReflectionPrompt(): String?
    suspend fun recordReflection(content: String)
}

@Entity
data class SessionRecord(
    @PrimaryKey val id: String,
    val startTime: Long,
    val endTime: Long? = null,
    val summaryIdsInOrder: List<String> = emptyList(),  // cross-refs
    val taskCount: Int = 0,
    val toolInvocations: Int = 0
)

@Entity
data class EpisodeSummary(
    @PrimaryKey val id: String,
    val sessionId: String,
    val timestamp: Long,
    val summary: String,  // concise summary
    val tags: List<String>,
    val emotionLabel: String?,
    val toolsInvoked: List<String> = emptyList(),
    val rawLogPath: String? = null  // if opt-in enabled
)

@Entity
data class AuditLogEntry(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val timestamp: Long,
    val eventType: String,  // tool_called, approval_requested, approval_granted, file_written, etc
    val details: String,  // JSON or redacted text
    val riskTier: String,
    val result: String  // success, denied, error, etc
)
```

### 2.7 Persona + Emotion

```kotlin
interface IPersonaResolver {
    fun resolve(category: String): PersonaRegister
}

data class PersonaRegister(
    val label: String,  // e.g., "hiphop_poetic", "mentor_calm"
    val prompts: List<String>,  // prepended to system prompt
    val responsePatterns: List<ResponsePattern>,
    val voiceHintId: String?,  // TTS voice preference
    val visualHintCss: String?  // color + animation
)

interface IEmotionEngine {
    fun inferEmotion(
        userSentiment: Float,  // -1.0 to 1.0
        systemState: AgentState,
        conversationContext: ConversationState
    ): EmotionState
}

data class EmotionState(
    val label: String,  // e.g., "determined", "confused", "celebratory"
    val valence: Float,  // -1.0 (negative) to 1.0 (positive)
    val arousal: Float,  // 0.0 (calm) to 1.0 (excited)
    val intensity: Float,  // 0.0 to 1.0
    val visualColor: Int,  // ARGB
    val aniHash: String  // animation identifier
)
```

---

## 3. Event Bus & Domain Events

All events routed through a shared `Flow<DomainEvent>`:

```kotlin
sealed class DomainEvent {
    abstract val timestamp: Long
    
    // Agent state
    data class AgentStatusChanged(override val timestamp: Long, val status: AgentStatus) : DomainEvent()
    data class AgentEmotionUpdated(override val timestamp: Long, val emotion: EmotionState) : DomainEvent()
    data class PermissionStatusChanged(override val timestamp: Long, val permission: String, val granted: Boolean) : DomainEvent()
    
    // Conversation
    data class ConversationTokenDelta(override val timestamp: Long, val token: String) : DomainEvent()
    data class ConversationMessageFinal(override val timestamp: Long, val message: Message) : DomainEvent()
    data class ConversationError(override val timestamp: Long, val error: Throwable) : DomainEvent()
    
    // Voice
    data class SttPartial(override val timestamp: Long, val text: String, val confidence: Float) : DomainEvent()
    data class SttFinal(override val timestamp: Long, val text: String) : DomainEvent()
    data class TtsStarted(override val timestamp: Long, val jobId: String) : DomainEvent()
    data class TtsCompleted(override val timestamp: Long, val jobId: String) : DomainEvent()
    data class WakeWordDetected(override val timestamp: Long, val keyword: String, val confidence: Float) : DomainEvent()
    
    // Tasks & Tools
    data class TaskStarted(override val timestamp: Long, val taskId: String, val title: String) : DomainEvent()
    data class TaskProgress(override val timestamp: Long, val taskId: String, val percent: Float, val message: String) : DomainEvent()
    data class TaskCompleted(override val timestamp: Long, val taskId: String) : DomainEvent()
    data class TaskFailed(override val timestamp: Long, val taskId: String, val error: Throwable) : DomainEvent()
    
    data class ToolStarted(override val timestamp: Long, val jobId: String, val toolName: String, val callId: String) : DomainEvent()
    data class ToolCompleted(override val timestamp: Long, val jobId: String, val toolName: String, val callId: String, val result: ToolResult) : DomainEvent()
    data class ToolError(override val timestamp: Long, val jobId: String, val toolName: String, val callId: String, val error: Throwable) : DomainEvent()
    
    // Approvals
    data class ApprovalRequested(override val timestamp: Long, val approvalId: String, val message: String, val riskTier: RiskTier) : DomainEvent()
    data class ApprovalGiven(override val timestamp: Long, val approvalId: String) : DomainEvent()
    data class ApprovalDenied(override val timestamp: Long, val approvalId: String) : DomainEvent()
    
    // Audit
    data class AuditAppended(override val timestamp: Long, val entry: AuditLogEntry) : DomainEvent()
}
```

---

## 4. Wind-Down Flows

### 4.1 Concurrency Model (Coroutines)

```
AgentRuntime (Service) runs:
  └─ sessionManager.start()
      ├─ conversationEngine.listen(inputFlow) — Lane A
      │   └─ lllmEngine.streamChat() (cancelable)
      ├─ jobQueue.processUntilEmpty() — Lane B
      │   └─ toolRegistry.execute() (cancelable per job)
      ├─ voiceLoop.start() — Lane C
      │   ├─ sttEngine.transcribe() (always listening)
      │   └─ ttsEngine.speak() (non-blocking queue)
      └─ eventBus.publish()
          └─ uiStateManager.reduce()
```

All lanes feed the event bus; UI subscribes once via `StateFlow<AgentState>`.

### 4.2 Interrupt Flow

User speaks while TTS is active:
1. VoiceLoop detects speech (VAD triggers SttPartial)
2. VoiceLoop emits `TtsInterrupted` event
3. SpeakJob stops immediately
4. ConversationEngine receives new transcript
5. Lane A generates new response
6. TTS picks up new audio

### 4.3 Offline Boundary

All critical subsystems have "offline modes":
- LLM: llama.cpp always local
- STT: Vosk always local
- TTS: Android TTS always local
- Tools: File/system tools always local; network.fetch optional + audited
- Memory: Room always local; remote sync optional

---

## 5. Android-Specific Bindings

### 5.1 Permissions Model

```kotlin
data class PermissionState(
    val microphone: Boolean = false,
    val overlay: Boolean = false,  // draw over other apps
    val notification: Boolean = false,  // for foreground service
    val notificationAccess: Boolean? = null,  // optional, for reading notifications
    val accessibility: Boolean? = null,  // optional core, gated; day 1 required
    val fileRead: Boolean = false,
    val fileWrite: Boolean = false,
    val locations: Map<String, Boolean> = emptyMap()  // per-directory FS access
)
```

Onboarding flow requests:
1. Microphone (critical)
2. Overlay (critical for bubble)
3. Notification (required by foreground service)
4. Accessibility (day 1; high risk; must provide rationale + diagnostics)
5. Optional: notification access

### 5.2 Foreground Service (Always-On)

```kotlin
class AgentLeeService : Service() {
    private lateinit var runtime: IAgentRuntime
    private val job = Job()
    private val scope = CoroutineScope(Dispatchers.Main + job)
    
    override fun onCreate() {
        super.onCreate()
        startForeground(
            NOTIFICATION_ID,
            createNotification()  // persistent, always updating
        )
        scope.launch { runtime.initialize(this@AgentLeeService) }
    }
    
    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }
    
    // Updates notification icon/text based on AgentState
    private fun updateNotificationFromState(state: AgentState) {
        val notif = createNotification(
            state.status,
            state.emotion.label,
            state.activeTasks.size
        )
        NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, notif)
    }
}
```

### 5.3 Overlay Bubble Service

```kotlin
class OverlayBubbleService : Service() {
    private lateinit var bubbleWindow: BubbleWindowManager
    
    override fun onCreate() {
        super.onCreate()
        bubbleWindow = BubbleWindowManager(this, runtime)
        bubbleWindow.show()
    }
    
    override fun onDestroy() {
        bubbleWindow.hide()
    }
}
```

**BubbleWindowManager Features:**
- Draggable view via `WindowManager.LayoutParams`
- States: idle (small) → listening (pulse) → thinking (spinner) → speaking (wave) → working (progress ring)
- Tap to expand → mini panel (transcript preview + task list)
- Tap to open → Full Activity
- Close → Activity goes away, bubble persists (runtime continues)

### 5.4 Full Activity (Main UI)

```kotlin
class AgentLeeActivity : ComponentActivity() {
    private val runtime: IAgentRuntime by inject()  // from DI
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AgentLeeScreen(runtime)  // Jetpack Compose
        }
    }
}
```

**Compose Layout:**
```
┌─────────────────────────────┐
│ Header: Status + Emotion    │
├─────────────────────────────┤
│  Chat Area (streaming)      │  ← token deltas animated
│                             │
│  [Mic button]     [⚙️ cfg]  │
├─────────────────────────────┤
│ Tasks Panel (if active)     │  ← job progress + cancel buttons
├─────────────────────────────┤
│ Tabs: Chat | Tasks | Logs | │
│       Settings  | Memory    │
└─────────────────────────────┘
```

---

## 6. Threat Model & Safety

### 6.1 Risk Tiers

| Tier | Example Tools | Behavior | Confirmation |
|------|---------------|----------|---------------|
| A | memory.saveEpisode, system.health | Safe, reversible | None (user-trusted) |
| B | files.write (non-system), phone.draftSms | Potentially sensitive | Confirm each time (or user policy) |
| C | phone.unlock, wipe.device, enable.dev_mode | Destructive | Triple-confirm + explicit phrase |

### 6.2 Approval Flow

```kotlin
interface IApprovalService {
    suspend fun requestApproval(
        id: String,
        message: String,
        riskTier: RiskTier,
        options: List<String> = listOf("Allow", "Deny")
    ): ApprovalResult
}

data class ApprovalResult(
    val approved: Boolean,
    val confirmPhrase: String? = null  // for Tier C
)
```

### 6.3 Audit Log (Append-Only)

Every tool call + approval decision logged:
```json
{
  "timestamp": "2026-03-28T14:32:15Z",
  "event_type": "tool_called",
  "tool_name": "files.write",
  "risk_tier": "B",
  "args_redacted": { "path": "/storage/emulated/0/Documents/***", "size_bytes": "12345" },
  "result": "awaiting_approval",
  "user_approved": true,
  "execution_time_ms": 234
}
```

---

## 7. Performance Budgets

| Component | Budget | Notes |
|-----------|--------|-------|
| LLM token latency | < 1 sec per token | streaming; assumes llama.cpp optimized |
| STT latency (streaming partial) | < 200 ms | Vosk streaming |
| TTS latency | < 500 ms to first audio | Android TTS |
| Wake word detection | < 1 sec after speech | Porcupine or similar KWS |
| Tool execution (files.read) | < 2 sec | local FS |
| Task queue processing | 2 concurrent jobs | tunable |
| Memory query (semantic search) | < 500 ms | embeddings cache |
| Event bus roundtrip (publish → UI update) | < 50 ms | local coroutines |

---

## 8. Offline / Online Matrix

| Feature | Offline | Online |
|---------|---------|--------|
| Chat (LLM inference) | ✅ llama.cpp | ✅ llama.cpp (same) |
| STT (transcription) | ✅ Vosk | ✅ Vosk (same) |
| TTS baseline | ✅ Android TTS | ✅ Android TTS (same) |
| TTS premium (Gemini) | ❌ N/A | ✅ optional (fallback to baseline) |
| Wake word | ✅ KWS local | ✅ KWS local (same) |
| Memory recall | ✅ Room queries | ✅ Room + remote sync (optional) |
| Tool: files.read/write | ✅ | ✅ |
| Tool: system.health | ✅ | ✅ |
| Tool: network.fetch | ❌ (audit fails) | ✅ (audited) |
| Tool: phone.openApp | ✅ (intents work) | ✅ |
| Tool: notifications.read | ✅ (if permission) | ✅ |
| Remote sync (memory) | ❌ (skipped gracefully) | ✅ optional |
| Accessibility automation | ✅ local | ✅ local (same) |

---

## 9. Integration Points (llama.cpp + Vosk + Android TTS)

### 9.1 llama.cpp JNI Binding

```cmake
# android/CMakeLists.txt

add_library(llama SHARED
    src/llama.cpp
    src/llama-util.h
    ... (core files)
)

add_library(llama-jni SHARED
    src/jni/llama_jni.cpp  # our wrapper
)

target_link_libraries(llama-jni PRIVATE llama)
```

```kotlin
// LlamaEngine.kt
class LlamaEngine(context: Context) : ILlmEngine {
    private val lib = LlamaNative()  // JNI binding
    
    fun loadModel(assetPath: String) {
        val modelFile = copyAssetToCache(context, assetPath)
        lib.loadModel(modelFile.absolutePath)
    }
    
    override suspend fun streamChat(
        messages: List<Message>,
        toolDescriptors: List<ToolDescriptor>,
        context: ContextSnapshot
    ): Flow<TokenDelta> = flow {
        val prompt = composePrompt(messages, toolDescriptors, context)
        val stream = lib.inferStream(prompt, maxTokens = 2048)
        
        stream.collect { token ->
            emit(TokenDelta(token.text, System.currentTimeMillis()))
        }
    }
}

// JNI wrapper (in your C++/Kotlin bridge)
external fun loadModel(path: String): Boolean
external fun inferStream(prompt: String, maxTokens: Int): Flow<TokenResult>
```

### 9.2 Vosk Integration

```kotlin
class VoskSttEngine(context: Context) : IVoskStt {
    private val speechRecognizer = SpeechRecognizer.create(context, null)
    private val recognitionListener = CustomRecognitionListener()
    
    fun startListening() {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        }
        speechRecognizer.startListening(intent)
    }
    
    private inner class CustomRecognitionListener : RecognitionListener {
        override fun onResults(results: Bundle) {
            val matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            val bestMatch = matches?.firstOrNull() ?: ""
            transcriptFlow.emit(TranscriptDelta(bestMatch, isFinal = true))
        }
        
        override fun onPartialResults(partialResults: Bundle) {
            val partial = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: ""
            transcriptFlow.emit(TranscriptDelta(partial, isFinal = false))
        }
    }
}
```

### 9.3 Android TextToSpeech

```kotlin
class AndroidTtsEngine(context: Context) : ITtsEngine {
    private val tts = TextToSpeech(context) { status ->
        if (status == TextToSpeech.SUCCESS) {
            tts.language = Locale.getDefault()
            tts.setPitch(1.0f)
            tts.setSpeechRate(1.0f)
        }
    }
    
    override suspend fun speak(text: String, voiceId: String): SpeechJobId {
        val jobId = UUID.randomUUID().toString()
        
        ttsFlow.emit(VoiceEvent.TtsStarted(jobId))
        
        tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String) {}
            override fun onDone(utteranceId: String) {
                ttsFlow.emit(VoiceEvent.TtsCompleted(jobId))
            }
            override fun onError(utteranceId: String, errorCode: Int) {
                ttsFlow.emit(VoiceEvent.TtsError(jobId, Exception("TTS error: $errorCode")))
            }
        })
        
        tts.speak(text, TextToSpeech.QUEUE_ADD, null, jobId)
        return jobId
    }
}
```

### 9.4 Wake Word Detection (Porcupine or Vosk KWS)

```kotlin
// If using Porcupine (commercial, but reliable):
class PorcupineWakeWord(context: Context) : IWakeWordDetector {
    private val porcupine = Porcupine.create(
        context,
        accessKey = "YOUR_ACCESS_KEY",  // env var
        keywords = arrayOf("jarvis", "alexa")  // load from config
    )
    
    fun startDetection() {
        audioRecorder.startRecording { audioFrame ->
            val keywordIndex = porcupine.process(audioFrame)
            if (keywordIndex >= 0) {
                wakeWordFlow.emit(WakeWordDetected(keywords[keywordIndex], 0.99f))
            }
        }
    }
}
```

---

## 10. Data Model (Room Entities)

```kotlin
@Entity
data class SessionRecord(
    @PrimaryKey val sessionId: String,
    val userId: String?,
    val startTimestamp: Long,
    val endTimestamp: Long?,
    val summaryEpisodeIds: List<String> = emptyList(),
    val toolCallCount: Int = 0,
    val errorCount: Int = 0
)

@Entity
data class EpisodeSummary(
    @PrimaryKey val episodeId: String,
    val sessionId: String,
    val timestamp: Long,
    val summary: String,  // concise, NL
    val emotionLabel: String?,
    val personaRegister: String?,
    val tags: List<String> = emptyList(),
    val rawLogPath: String? = null  // if enabled
)

@Entity
data class MemoryIndex(
    @PrimaryKey val indexId: String,
    val episodeId: String,
    val embedding: ByteArray,  // optional; compressed float32 vector
    val score: Float?
)

@Entity
data class AuditLogEntry(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val timestamp: Long,
    val eventType: String,  // tool_invoked, approval_requested, file_modified, etc.
    val actorId: String = "user",
    val actionDetails: String,  // JSON or redacted text
    val riskTier: String,  // A, B, C
    val result: String,  // success, denied, error, etc.
    val executionTimeMs: Long? = null
)

@Entity
data class DeviceCapabilityMap(
    @PrimaryKey val capabilityId: String,  // "mic_working", "gpu_available", etc.
    val supported: Boolean,
    val timestamp: Long,
    val notes: String? = null
)

@Entity
data class ToolRun(
    @PrimaryKey val runId: String,
    val jobId: String?,
    val toolName: String,
    val timestamp: Long,
    val durationMs: Long?,
    val status: String,  // success, error, denied, timeout
    val inputSummary: String?,
    val outputSummary: String?
)
```

---

## 11. Dependency Injection (Hilt)

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object AgentModule {
    
    @Singleton
    @Provides
    fun provideAgentRuntime(
        context: Context,
        conversation: IConversationEngine,
        voiceLoop: IVoiceLoop,
        jobQueue: IJobQueue,
        toolRegistry: IToolRegistry,
        memory: IMemory,
        auditLog: IAuditLogger
    ): IAgentRuntime = AgentRuntimeImpl(
        context, conversation, voiceLoop, jobQueue, toolRegistry, memory, auditLog
    )
    
    @Singleton
    @Provides
    fun provideLlmEngine(context: Context): ILlmEngine = LlamaEngine(context)
    
    @Singleton
    @Provides
    fun provideVoiceLoop(context: Context, tts: ITtsEngine): IVoiceLoop = VoiceLoopImpl(context, tts)
    
    @Singleton
    @Provides
    fun provideTtsEngine(context: Context): ITtsEngine = AndroidTtsEngine(context)
    
    @Singleton
    @Provides
    fun provideToolRegistry(context: Context, auditLog: IAuditLogger): IToolRegistry =
        ToolRegistryImpl(context, auditLog)
    
    @Singleton
    @Provides
    fun provideMemory(context: Context, db: AgentLeeDatabase): IMemory = MemoryImpl(context, db)
    
    @Singleton
    @Provides
    fun provideDatabase(context: Context): AgentLeeDatabase = Room.databaseBuilder(
        context, AgentLeeDatabase::class.java, "agent_lee_db"
    ).build()
}
```

---

## 12. Offline/Online Diagnostics

**Diagnostics Screen (in Settings tab):**
```
┌──────────────────────────────┐
│ Network Status: Offline      │
├──────────────────────────────┤
│ ✅ LLM (llama.cpp)           │ always local
│ ✅ STT (Vosk)                │ always local
│ ✅ TTS (Android)             │ always local
│ ❌ TTS Premium (Gemini)      │ requires network
│ ✅ Memory (Room)             │ local
│ ❌ Memory Sync               │ requires network
│ ✅ Files (scoped storage)    │ local
│ ❌ Network tools             │ requires internet
│ ⚠️  Accessibility Service   │ installed, not active
│ ✅ Notification Access       │ granted
│ ❌ Location Access           │ denied
├──────────────────────────────┤
│ [Force Refresh Diagnostics] │
│ [Export Diagnostics Report] │
└──────────────────────────────┘
```

---

## 13. Security & Audit

### 13.1 Secrets (API keys)

Store in Android Keystore:
```kotlin
private fun saveApiKey(alias: String, key: String) {
    val keyStore = KeyStore.getInstance("AndroidKeyStore")
    keyStore.load(null)
    
    // If key exists, delete first
    if (keyStore.containsAlias(alias)) keyStore.deleteEntry(alias)
    
    val spec = KeyGenParameterSpec.Builder(
        alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
    ).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_PKCS1).build()
    
    // Store encrypted key...
}
```

### 13.2 Sensitive Redaction in Logs

```kotlin
fun redactPaths(path: String): String {
    val userHome = System.getProperty("user.home")
    return path.replace(userHome, "~")
}

fun redactApiKeys(text: String): String {
    return text.replace(Regex("(key|token)=\\S+"), "$1=***")
}
```

---

## 14. Build & Deployment

### 14.1 Gradle Configuration

```gradle
android {
    namespace "com.leeway.agentlee"
    compileSdk 34
    
    ndkVersion "25.1.8937393"  // for JNI
    
    defaultConfig {
        minSdk 31
        targetSdk 34
    }
    
    buildFeatures {
        compose = true
    }
    
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.0"
    }
}

dependencies {
    // Core
    implementation "androidx.core:core:1.10.1"
    implementation "androidx.appcompat:appcompat:1.6.1"
    
    // Compose
    implementation "androidx.compose.ui:ui:1.5.0"
    implementation "androidx.compose.material3:material3:1.1.0"
    
    // Room
    implementation "androidx.room:room-runtime:2.5.2"
    kapt "androidx.room:room-compiler:2.5.2"
    
    // Coroutines
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.0"
    
    // Hilt
    implementation "com.google.dagger:hilt-android:2.46"
    kapt "com.google.dagger:hilt-compiler:2.46"
    
    // TensorFlow Lite (optional)
    implementation "org.tensorflow:tensorflow-lite:2.12.0"
    
    // Testing
    testImplementation "junit:junit:4.13.2"
    androidTestImplementation "androidx.test:runner:1.5.2"
}
```

---

## 15. Known Constraints & Future Work

### 15.1 Day-1 Limitations

- **Screen-off wake word:** Requires additional power considerations; may be throttled by OEM policies on some devices.
- **GPU acceleration:** Not guaranteed; fallback to CPU inference for llama.cpp.
- **Battery drain:** Always-on listening + inference will drain faster; document best practices (plug-in during heavy work).
- **Accessibility automation:** High-risk surface; gated behind confirmation + audit log.

### 15.2 Phase-2+ Enhancements

- Local vision pipeline + OCR
- Local RAG for document Q&A
- Cross-device cloud sync (optional; never blocking local)
- Multi-turn voice (reduce latency per turn)
- Advanced emotion visuals (3D avatar morphing)

---

## 16. Conclusion

This design delivers:
✅ **Local-first, always responsive** conversation via 3-lane event-driven runtime  
✅ **Non-blocking voice** with barge-in and interrupt support  
✅ **Full offline** capability (LLM + STT + TTS on-device)  
✅ **Persistent overlay bubble** keeping Agent Lee "alive" across apps  
✅ **Real safety + audit** model for sensitive operations  
✅ **Persona + emotion** wired into behavior, not cosmetics  

**Next Phase:** Implement Slice 1 (Runtime Foundation) until streaming chat + fake job works offline.

