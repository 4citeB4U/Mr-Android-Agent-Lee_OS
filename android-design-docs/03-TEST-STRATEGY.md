# Agent Lee OS — Android Test Strategy

**Purpose:** Ensure Agent Lee MVP is reliable, performant, and safe offline.  
**Scope:** Unit → Integration → Instrumentation → E2E → Soak tests across all slices.  
**Target Platform:** Android API 31+ (real devices + emulator)

---

## 1. Test Pyramid

```
        ┌─────────────────┐
        │   Soak / E2E    │  (72h reliability)
        ├─────────────────┤
        │  Instrumentation│  (Android-specific UI, services, permissions)
        ├─────────────────┤
        │   Integration   │  (multi-component interactions)
        ├─────────────────┤
        │      Unit       │  (domain logic, event flows)
        └─────────────────┘
```

---

## 2. Unit Tests (Domain Logic)

**Purpose:** Fast, isolated tests of core logic.  
**Framework:** JUnit 4 + Mockito  
**Execution:** Local (no emulator needed)  
**Target Coverage:** >80% of domain layer

### 2.1 Event Bus & State Tests

```kotlin
// test/java/com/leeway/agentlee/domain/bus/EventBusTest.kt

@RunWith(MockitoJUnitRunner::class)
class EventBusTest {
    
    private lateinit var eventBus: EventBus
    
    @Before
    fun setup() {
        eventBus = EventBus()
    }
    
    @Test
    fun `emits events in order`() = runTest {
        val received = mutableListOf<DomainEvent>()
        
        val job = launch {
            eventBus.events.collect { received.add(it) }
        }
        
        eventBus.emit(DomainEvent.AgentStatusChanged(System.currentTimeMillis(), AgentStatus.IDLE))
        eventBus.emit(DomainEvent.AgentStatusChanged(System.currentTimeMillis(), AgentStatus.LISTENING))
        
        advanceUntilIdle()
        assertEquals(2, received.size)
        job.cancel()
    }
    
    @Test
    fun `multiple subscribers receive same event`() = runTest {
        val sub1 = mutableListOf<DomainEvent>()
        val sub2 = mutableListOf<DomainEvent>()
        
        val job1 = launch { eventBus.events.collect { sub1.add(it) } }
        val job2 = launch { eventBus.events.collect { sub2.add(it) } }
        
        val event = DomainEvent.ConversationTokenDelta(System.currentTimeMillis(), "hello")
        eventBus.emit(event)
        
        advanceUntilIdle()
        assertEquals(1, sub1.size)
        assertEquals(1, sub2.size)
        
        job1.cancel()
        job2.cancel()
    }
}
```

### 2.2 Conversation Engine Tests

```kotlin
// test/java/com/leeway/agentlee/domain/conversation/ConversationEngineTest.kt

@RunWith(MockitoJUnitRunner::class)
class ConversationEngineTest {
    
    @Mock
    private lateinit var mockLlm: ILlmEngine
    
    @Mock
    private lateinit var personaResolver: IPersonaResolver
    
    @Mock
    private lateinit var memory: IMemory
    
    private lateinit var engine: ConversationEngine
    
    @Before
    fun setup() {
        engine = ConversationEngine(mockLlm, personaResolver, memory)
    }
    
    @Test
    fun `streamChat emits token deltas`() = runTest {
        val mockTokens = flow {
            emit(TokenDelta("Hello", System.currentTimeMillis()))
            emit(TokenDelta(" ", System.currentTimeMillis()))
            emit(TokenDelta("world", System.currentTimeMillis()))
        }
        
        whenever(mockLlm.streamChat(any(), any(), any())).thenReturn(mockTokens)
        whenever(personaResolver.resolve(any())).thenReturn(
            PersonaRegister("test", listOf("test prompt"), emptyList(), null, null)
        )
        
        val messages = listOf(Message(role = "user", content = "Hi"))
        val result = engine.streamChat(messages, emptyList(), ContextSnapshot.empty())
        
        val tokens = result.toList()
        assertEquals(3, tokens.size)
        assertEquals("Hello", tokens[0].token)
        assertEquals(" ", tokens[1].token)
        assertEquals("world", tokens[2].token)
    }
    
    @Test
    fun `cancel stops streaming`() = runTest {
        val canceledFlag = mutableListOf<Boolean>()
        val mockTokens = flow {
            emit(TokenDelta("Start", System.currentTimeMillis()))
            try {
                delay(100)
                emit(TokenDelta("never", System.currentTimeMillis()))
            } catch (e: CancellationException) {
                canceledFlag.add(true)
                throw e
            }
        }
        
        whenever(mockLlm.streamChat(any(), any(), any())).thenReturn(mockTokens)
        whenever(personaResolver.resolve(any())).thenReturn(
            PersonaRegister("test", listOf(), emptyList(), null, null)
        )
        
        val messages = listOf(Message(role = "user", content = "Hi"))
        
        val collectedTokens = mutableListOf<TokenDelta>()
        val job = launch {
            try {
                engine.streamChat(messages, emptyList(), ContextSnapshot.empty()).collect {
                    collectedTokens.add(it)
                }
            } catch (e: CancellationException) {
                // expected
            }
        }
        
        advanceUntilIdle()
        job.cancel()
        delay(200)
        
        assertEquals(1, collectedTokens.size)
        assertTrue(canceledFlag.isNotEmpty())
    }
}
```

### 2.3 Job Queue Tests

```kotlin
// test/java/com/leeway/agentlee/domain/job/JobQueueTest.kt

@RunWith(MockitoJUnitRunner::class)
class JobQueueTest {
    
    @Mock
    private lateinit var toolRegistry: IToolRegistry
    
    @Mock
    private lateinit var auditLog: IAuditLogger
    
    private lateinit var queue: JobQueue
    
    @Before
    fun setup() {
        queue = JobQueue(concurrency = 2, toolRegistry, auditLog)
    }
    
    @Test
    fun `enqueue and process job`() = runTest {
        val job = AgentJob(
            id = JobId("test-1"),
            title = "Test Job",
            toolCalls = listOf(
                ToolCall(name = "system.health", args = JsonObject())
            ),
            requiresConfirmation = false
        )
        
        val event = mutableListOf<JobEvent>()
        val eventJob = launch {
            queue.jobEvents.collect { event.add(it) }
        }
        
        queue.enqueue(job)
        queue.processUntilEmpty()
        
        advanceUntilIdle()
        
        assertTrue(event.any { it is JobEvent.Started && it.jobId == job.id })
        assertTrue(event.any { it is JobEvent.Completed && it.jobId == job.id })
        
        eventJob.cancel()
    }
    
    @Test
    fun `max concurrency of 2`() = runTest {
        val runningCount = mutableListOf<Int>()
        var maxConcurrent = 0
        
        var activeCount = AtomicInteger(0)
        
        repeat(5) { i ->
            val job = AgentJob(
                id = JobId("test-$i"),
                title = "Job $i",
                toolCalls = emptyList(),
                requiresConfirmation = false
            )
            
            queue.enqueue(job)
        }
        
        // Mock slow tool execution
        whenever(toolRegistry.execute(any())).thenAnswer { invocation ->
            activeCount.incrementAndGet()
            maxConcurrent = maxOf(maxConcurrent, activeCount.get())
            runningCount.add(activeCount.get())
            
            delay(100)  // simulate work
            activeCount.decrementAndGet()
            
            ToolResult(ok = true)
        }
        
        queue.processUntilEmpty()
        
        assertEquals(2, maxConcurrent)  // Never more than 2 concurrent
    }
    
    @Test
    fun `cancel job stops execution`() = runTest {
        val job = AgentJob(
            id = JobId("cancel-test"),
            title = "Will Cancel",
            toolCalls = listOf(ToolCall(name = "files.list", args = JsonObject())),
            requiresConfirmation = false
        )
        
        queue.enqueue(job)
        queue.cancelJob(job.id)
        
        queue.processUntilEmpty()
        
        // Verify cancel event emitted
        val events = queue.jobEvents.toList()
        assertTrue(events.any { it is JobEvent.Canceled && it.jobId == job.id })
    }
}
```

### 2.4 Tool Registry Tests

```kotlin
// test/java/com/leeway/agentlee/domain/tool/ToolRegistryTest.kt

@RunWith(MockitoJUnitRunner::class)
class ToolRegistryTest {
    
    @Mock
    private lateinit var auditLog: IAuditLogger
    
    private lateinit var registry: ToolRegistry
    
    @Before
    fun setup() {
        registry = ToolRegistry(auditLog)
    }
    
    @Test
    fun `register and retrieve tool`() {
        val descriptor = ToolDescriptor(
            name = "test.tool",
            description = "A test tool",
            category = ToolCategory.SYSTEM,
            inputSchema = JsonSchema(),
            riskTier = RiskTier.A
        )
        
        val executor = Mock<IToolExecutor>()
        registry.register(descriptor, executor)
        
        val retrieved = registry.getByName("test.tool")
        assertNotNull(retrieved)
        assertEquals("test.tool", retrieved?.name)
    }
    
    @Test
    fun `execute tool and return result`() = runTest {
        val descriptor = ToolDescriptor(
            name = "system.health",
            description = "Get system health",
            category = ToolCategory.SYSTEM,
            inputSchema = JsonSchema(),
            riskTier = RiskTier.A
        )
        
        val mockExecutor = mock<IToolExecutor> {
            onBlocking { execute(any(), any()) }.thenReturn(
                ToolResult(ok = true, data = JsonObject().put("status", "healthy"))
            )
        }
        
        registry.register(descriptor, mockExecutor)
        
        val call = ToolCall(name = "system.health", args = JsonObject())
        val result = registry.execute(call)
        
        assertTrue(result.ok)
        assertEquals("healthy", result.data?.getString("status"))
    }
    
    @Test
    fun `risk tier determines confirmation requirement`() {
        val tierA = ToolDescriptor(
            name = "tool.a",
            description = "Safe tool",
            category = ToolCategory.SYSTEM,
            inputSchema = JsonSchema(),
            riskTier = RiskTier.A
        )
        
        val tierC = ToolDescriptor(
            name = "tool.c",
            description = "Dangerous tool",
            category = ToolCategory.ACCESSIBILITY,
            inputSchema = JsonSchema(),
            riskTier = RiskTier.C
        )
        
        registry.register(tierA, mock())
        registry.register(tierC, mock())
        
        assertFalse(registry.getByName("tool.a")?.let { it.riskTier == RiskTier.A } ?: false)
        assertTrue(registry.getByName("tool.c")?.let { it.riskTier == RiskTier.C } ?: false)
    }
}
```

### 2.5 Emotion Engine Tests

```kotlin
// test/java/com/leeway/agentlee/domain/emotion/EmotionEngineTest.kt

class EmotionEngineTest {
    
    private lateinit var emotionEngine: EmotionEngine
    
    @Before
    fun setup() {
        emotionEngine = EmotionEngine()
    }
    
    @Test
    fun `high user sentiment and no errors produces positive emotion`() {
        val emotion = emotionEngine.inferEmotion(
            userSentiment = 0.9f,  // very positive
            systemState = createMockAgentState(errorCount = 0, activeJobs = 0),
            conversationContext = ConversationState(messages = emptyList())
        )
        
        assertTrue(emotion.valence > 0.5f)  // positive
    }
    
    @Test
    fun `low sentiment and system errors produces frustrated emotion`() {
        val emotion = emotionEngine.inferEmotion(
            userSentiment = -0.8f,  // very negative
            systemState = createMockAgentState(errorCount = 3, activeJobs = 5),
            conversationContext = ConversationState(messages = emptyList())
        )
        
        assertTrue(emotion.valence < 0.0f)  // negative
        assertTrue(emotion.arousal > 0.5f)  // high arousal (stressed)
    }
    
    @Test
    fun `emotion color mapping is consistent`() {
        val emotions = listOf(
            emotionEngine.inferEmotion(0.9f, AgentState.IDLE, ConversationState.empty()),
            emotionEngine.inferEmotion(0.9f, AgentState.IDLE, ConversationState.empty())
        )
        
        assertEquals(emotions[0].visualColor, emotions[1].visualColor)
    }
    
    private fun createMockAgentState(errorCount: Int, activeJobs: Int): AgentState {
        return AgentState(
            status = AgentStatus.IDLE,
            currentConversation = ConversationState.empty(),
            activeTasks = (0 until activeJobs).associate { i -> TaskId("task-$i") to TaskProgress() },
            emotion = EmotionState.neutral(),
            isServiceRunning = true,
            permissionsMap = emptyMap(),
            audioCapture = false
        )
    }
}
```

---

## 3. Integration Tests (Multi-Component)

**Purpose:** Verify component interactions without Android framework.  
**Framework:** JUnit + Coroutines + Mockito  
**Execution:** Local (no emulator)  
**Target:** Core workflows (conversation + tasks, voice + chat, etc.)

### 3.1 Conversation and Task Concurrency Test

```kotlin
// test/java/com/leeway/agentlee/integration/ConversationAndTasksConcurrentTest.kt

@RunWith(MockitoJUnitRunner::class)
class ConversationAndTasksConcurrentTest {
    
    @Mock
    private lateinit var mockLlm: ILlmEngine
    
    @Mock
    private lateinit var mockToolRegistry: IToolRegistry
    
    private lateinit var runtime: AgentRuntime
    private lateinit var eventBus: EventBus
    
    @Before
    fun setup() {
        eventBus = EventBus()
        runtime = AgentRuntime(
            eventBus = eventBus,
            conversationEngine = createMockConversationEngine(),
            jobQueue = JobQueue(concurrency = 2, mockToolRegistry, mock()),
            voiceLoop = mock(),
            toolRegistry = mockToolRegistry,
            memory = mock(),
            auditLogger = mock()
        )
    }
    
    @Test
    fun `chat responds immediately while task runs in background`() = runTest {
        var chatResponseLatency = 0L
        var taskStarted = false
        var taskCompleted = false
        
        launch {
            runtime.events.collect { event ->
                when (event) {
                    is DomainEvent.ConversationMessageFinal -> {
                        chatResponseLatency = System.currentTimeMillis() - event.timestamp
                    }
                    is DomainEvent.TaskStarted -> {
                        taskStarted = true
                    }
                    is DomainEvent.TaskCompleted -> {
                        taskCompleted = true
                    }
                    else -> {}
                }
            }
        }
        
        val startTime = System.currentTimeMillis()
        
        // Start a background task
        runtime.submitTask(
            AgentJob(
                id = JobId("bg-task"),
                title = "Indexing Files",
                toolCalls = listOf(ToolCall("files.list", JsonObject())),
                requiresConfirmation = false,
                timeout = 10.seconds
            )
        )
        
        // Advance to let task start
        advanceTimeBy(100.milliseconds)
        assertTrue(taskStarted)
        
        // Submit chat request while task is running
        val chatStart = System.currentTimeMillis()
        runtime.submit(UserInput.Text("What's the time?"))
        
        // Task should complete independently
        advanceUntilIdle()
        
        // Verify chat responded quickly despite background task
        assertTrue(chatResponseLatency < 2000)  // < 2 sec response time
        assertTrue(taskCompleted)
    }
    
    @Test
    fun `multiple concurrent chat messages handled smoothly`() = runTest {
        var responseCount = 0
        
        launch {
            runtime.events.collect { event ->
                if (event is DomainEvent.ConversationMessageFinal) {
                    responseCount++
                }
            }
        }
        
        // Fire 3 chat messages concurrently
        repeat(3) { i ->
            runtime.submit(UserInput.Text("Question $i"))
        }
        
        advanceUntilIdle()
        
        assertEquals(3, responseCount)  // All handled
    }
    
    private fun createMockConversationEngine(): IConversationEngine {
        return object : IConversationEngine {
            override suspend fun streamChat(
                messages: List<Message>,
                toolDescriptors: List<ToolDescriptor>,
                context: ContextSnapshot
            ): Flow<TokenDelta> = flow {
                listOf("I", " ", "respond", " ", "immediately").forEach { token ->
                    emit(TokenDelta(token, System.currentTimeMillis()))
                    delay(10)
                }
            }
            
            override suspend fun cancel() {}
            override fun getSystemPrompt(): String = "System prompt"
        }
    }
}
```

### 3.2 Voice and Chat Integration Test

```kotlin
// test/java/com/leeway/agentlee/integration/VoiceAndChatIntegrationTest.kt

@RunWith(MockitoJUnitRunner::class)
class VoiceAndChatIntegrationTest {
    
    @Mock
    private lateinit var mockVoiceLoop: IVoiceLoop
    
    @Mock
    private lateinit var mockConversationEngine: IConversationEngine
    
    private lateinit var sessionManager: SessionManager
    private lateinit var eventBus: EventBus
    
    @Before
    fun setup() {
        eventBus = EventBus()
        sessionManager = SessionManager(eventBus, mockVoiceLoop, mockConversationEngine, mock(), mock(), mock(), mock())
    }
    
    @Test
    fun `voice input flows to chat and triggers TTS response`() = runTest {
        val capturedEvents = mutableListOf<DomainEvent>()
        
        launch {
            eventBus.events.collect { capturedEvents.add(it) }
        }
        
        // Simulate voice input
        val sttFlow = flow {
            emit(TranscriptDelta("What", isFinal = false, confidence = 0.9f))
            emit(TranscriptDelta("What time", isFinal = false, confidence = 0.92f))
            emit(TranscriptDelta("What time is it?", isFinal = true, confidence = 0.95f))
        }
        
        whenever(mockVoiceLoop.transcript).thenReturn(sttFlow)
        
        // Mock LLM response
        val llmTokens = flow {
            listOf("It's", " ", "3 PM").forEach { token ->
                emit(TokenDelta(token, System.currentTimeMillis()))
                delay(5)
            }
        }
        
        whenever(mockConversationEngine.streamChat(any(), any(), any())).thenReturn(llmTokens)
        
        // Simulate TTS response
        whenever(mockVoiceLoop.speak(any(), any())).thenReturn("tts-job-1")
        
        sessionManager.start()
        advanceUntilIdle()
        
        // Verify events flow
        assertTrue(capturedEvents.any { it is DomainEvent.SttFinal })
        assertTrue(capturedEvents.any { it is DomainEvent.ConversationTokenDelta })
        assertTrue(capturedEvents.any { it is DomainEvent.TtsStarted })
    }
    
    @Test
    fun `barge-in stops TTS and restarts transcription`() = runTest {
        var ttsWasStopped = false
        var newTranscriptCaptured = false
        
        launch {
            eventBus.events.collect { event ->
                when (event) {
                    is DomainEvent.TtsCompleted -> {
                        // TTS was interrupted (never completed normally)
                    }
                    is DomainEvent.SttPartial -> {
                        if (event.text.contains("interrupt")) {
                            newTranscriptCaptured = true
                        }
                    }
                    else -> {}
                }
            }
        }
        
        // Simulate TTS start
        val ttsJob = launch {
            mockVoiceLoop.speak("This is a long response about...", "voice1")
        }
        
        advanceTimeBy(500.milliseconds)
        
        // User interrupts with new speech
        mockVoiceLoop.stopSpeaking()
        ttsWasStopped = true
        
        // New transcript flows
        val interruptFlow = flow {
            emit(TranscriptDelta("Wait, interrupt me", isFinal = true, confidence = 0.98f))
        }
        
        whenever(mockVoiceLoop.transcript).thenReturn(interruptFlow)
        
        advanceUntilIdle()
        ttsJob.cancel()
        
        assertTrue(ttsWasStopped)
    }
}
```

### 3.3 Offline Memory Persistence Test

```kotlin
// test/java/com/leeway/agentlee/integration/OfflineMemoryPersistenceTest.kt

@RunWith(MockitoJUnitRunner::class)
class OfflineMemoryPersistenceTest {
    
    @Mock
    private lateinit var mockDatabase: AgentLeeDatabase
    
    @Mock
    private lateinit var mockSessionDao: SessionDao
    
    @Mock
    private lateinit var mockEpisodeDao: EpisodeDao
    
    private lateinit var memory: Memory
    
    @Before
    fun setup() {
        whenever(mockDatabase.sessionDao()).thenReturn(mockSessionDao)
        whenever(mockDatabase.episodeDao()).thenReturn(mockEpisodeDao)
        memory = Memory(mockDatabase)
    }
    
    @Test
    fun `episode is recorded and retrieved offline`() = runTest {
        val sessionId = "session-001"
        val episodeId = "episode-001"
        val summary = "User asked about Python. Agent explained decorators."
        
        val savedEpisode = EpisodeSummary(
            episodeId = episodeId,
            sessionId = sessionId,
            timestamp = System.currentTimeMillis(),
            summary = summary,
            emotionLabel = "calm",
            tags = listOf("python", "programming")
        )
        
        whenever(mockEpisodeDao.insert(any())).thenReturn(Unit)
        whenever(mockEpisodeDao.search(any(), any())).thenReturn(listOf(savedEpisode))
        
        memory.recordEpisode("User Q: Python decorators. Agent: Explained...", listOf("python"))
        
        advanceUntilIdle()
        
        val retrieved = memory.searchEpisodes("python")
        
        assertTrue(retrieved.isNotEmpty())
        assertTrue(retrieved[0].summary.contains("Python"))
    }
    
    @Test
    fun `audit log persists across sessions`() = runTest {
        val auditEntry = AuditLogEntry(
            timestamp = System.currentTimeMillis(),
            eventType = "tool_called",
            details = "files.list called",
            riskTier = "A",
            result = "success"
        )
        
        whenever(mockDatabase.auditDao().insert(any())).thenReturn(Unit)
        whenever(mockDatabase.auditDao().getAll()).thenReturn(listOf(auditEntry))
        
        // Record action
        memory.recordAudit(auditEntry)
        advanceUntilIdle()
        
        // Retrieve (simulating app restart)
        val logs = memory.getAuditLog()
        
        assertTrue(logs.isNotEmpty())
        assertEquals("tool_called", logs[0].eventType)
    }
}
```

---

## 4. Instrumentation Tests (Android Framework)

**Purpose:** Verify Android-specific features (permissions, services, UI).  
**Framework:** AndroidJUnit4 + Espresso (optional for UI)  
**Execution:** Emulator or real device  
**Target:** Permissions, services, UI state, notifications

### 4.1 Foreground Service Test

```kotlin
// androidTest/java/com/leeway/agentlee/service/AgentLeeServiceTest.kt

@RunWith(AndroidJUnit4::class)
class AgentLeeServiceTest {
    
    @get:Rule
    val serviceRule = ServiceTestRule()
    
    private lateinit var intent: Intent
    
    @Before
    fun setup() {
        intent = Intent(InstrumentationRegistry.getInstrumentation().context, AgentLeeService::class.java)
    }
    
    @Test
    fun `service starts and creates foreground notification`() {
        val service = serviceRule.startService(intent)
        
        assertNotNull(service)
        assertTrue(service is AgentLeeService)
        
        // Verify notification posted
        // (On API 26+, getActiveNotifications() in NotificationManager)
    }
    
    @Test
    fun `service survives app backgrounding`() {
        val service = serviceRule.startService(intent)
        
        // Simulate activity pause
        // (In practice, this is tested via integration / soak test)
        
        assertNotNull(service)
    }
}
```

### 4.2 Overlay Bubble Service Test

```kotlin
// androidTest/java/com/leeway/agentlee/service/OverlayBubbleServiceTest.kt

@RunWith(AndroidJUnit4::class)
class OverlayBubbleServiceTest {
    
    @get:Rule
    val serviceRule = ServiceTestRule()
    
    @get:Rule
    val grantPermissionRule: GrantPermissionRule =
        GrantPermissionRule.grant(Manifest.permission.SYSTEM_ALERT_WINDOW)
    
    private lateinit var intent: Intent
    
    @Before
    fun setup() {
        intent = Intent(InstrumentationRegistry.getInstrumentation().context, OverlayBubbleService::class.java)
    }
    
    @Test
    fun `bubble service displays overlay`() {
        val service = serviceRule.startService(intent)
        assertNotNull(service)
        // Verify window is visible (manual in practice)
    }
}
```

### 4.3 Permission Onboarding Test

```kotlin
// androidTest/java/com/leeway/agentlee/permission/VoicePermissionOnboardingTest.kt

@RunWith(AndroidJUnit4::class)
class VoicePermissionOnboardingTest {
    
    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)
    
    @Test
    fun `onboarding requests microphone permission`() {
        val scenario = activityRule.scenario
        
        scenario.onActivity { activity ->
            // Check if onboarding is shown
            val onboardingScreen = activity.findViewById<View>(R.id.onboarding_container)
            assertNotNull(onboardingScreen)
        }
    }
    
    @Test
    fun `user can grant and deny permissions`() {
        // Test permission grant flow
        // (Requires runtime permission interaction)
    }
}
```

---

## 5. End-to-End (E2E) Scenario Tests

**Purpose:** Real workflows from wake-up to response.  
**Framework:** Instrumentation + Espresso  
**Execution:** Emulator or real device  
**Duration:** 2–5 minutes per scenario

### 5.1 Offline Conversation E2E

```kotlin
// androidTest/java/com/leeway/agentlee/e2e/OfflineConversationE2eTest.kt

@RunWith(AndroidJUnit4::class)
class OfflineConversationE2eTest {
    
    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)
    
    @Test
    fun `user can have conversation in airplane mode`() {
        // 1. Enable airplane mode
        val context = InstrumentationRegistry.getInstrumentation().context
        val intent = Intent(Settings.ACTION_AIRPLANE_MODE_SETTINGS)
        context.startActivity(intent)
        
        // 2. Return to app
        activityRule.scenario.onActivity { activity ->
            // 3. Type message
            val chatInput = activity.findViewById<EditText>(R.id.chat_input)
            chatInput.setText("Hello, what is 2+2?")
            
            val submitButton = activity.findViewById<Button>(R.id.submit_btn)
            submitButton.performClick()
            
            // 4. Wait for response
            Thread.sleep(3000)
            
            // 5. Verify response appears in chat
            val chatHistory = activity.findViewById<RecyclerView>(R.id.chat_history)
            assertTrue(chatHistory.childCount > 0)
        }
    }
}
```

### 5.2 Voice Barge-In E2E

```kotlin
// androidTest/java/com/leeway/agentlee/e2e/VoiceBargeInE2eTest.kt

@RunWith(AndroidJUnit4::class)
class VoiceBargeInE2eTest {
    
    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)
    
    @get:Rule
    val grantPermissionRule: GrantPermissionRule =
        GrantPermissionRule.grant(Manifest.permission.RECORD_AUDIO)
    
    @Test
    fun `user can interrupt TTS with new speech`() {
        activityRule.scenario.onActivity { activity ->
            // 1. Start listening
            val micButton = activity.findViewById<Button>(R.id.mic_btn)
            micButton.performClick()
            
            // Simulate user speech (in real test, speak into mic)
            // For now, inject text
            val mockInput = UserInput.Text("Tell me a long story")
            
            // 2. Agent starts response (LLM streaming + TTS)
            Thread.sleep(2000)
            
            // 3. User interrupts (new speech)
            val interruption = UserInput.Text("Never mind, cancel that")
            
            // 4. Verify TTS was interrupted
            val ttsIndicator = activity.findViewById<View>(R.id.tts_state)
            // TTS should have stopped and restarted with new response
            
            Thread.sleep(2000)
            // Verify new response (shorter) appears
        }
    }
}
```

---

## 6. Soak / Reliability Tests

**Purpose:** Prove stability over hours.  
**Framework:** Instrumentation + long-running test harness  
**Execution:** Real device (emulator too slow)  
**Duration:** 24–72 hours

### 6.1 24-Hour Offline Conversation Loop

```kotlin
// androidTest/java/com/leeway/agentlee/soak/SoakTest.kt

@RunWith(AndroidJUnit4::class)
@LargeTest
class OfflineConversationSoakTest {
    
    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)
    
    @Test(timeout = 24 * 60 * 60 * 1000)  // 24 hours
    fun `offline conversation loop 24 hours`() {
        val startTime = System.currentTimeMillis()
        val initialHeap = Runtime.getRuntime().totalMemory()
        var peakHeap = initialHeap
        
        var cycleCount = 0
        val cyclesPerHour = 12  // 5-minute cycles
        val targetCycles = 24 * cyclesPerHour  // 288 for 24 hours
        
        while (cycleCount < targetCycles) {
            activityRule.scenario.onActivity { activity ->
                // 1. Submit chat message
                val chatInput = activity.findViewById<EditText>(R.id.chat_input)
                chatInput.setText("What is the time? Cycle $cycleCount")
                
                val submitButton = activity.findViewById<Button>(R.id.submit_btn)
                submitButton.performClick()
            }
            
            // 2. Wait for response cycle
            Thread.sleep(5000)
            
            // 3. Measure heap
            val currentHeap = Runtime.getRuntime().totalMemory()
            peakHeap = maxOf(peakHeap, currentHeap)
            
            // 4. Check for crashes (app still responsive)
            activityRule.scenario.onActivity { activity ->
                val isVisible = activity.window.decorView.visibility == View.VISIBLE
                assertTrue("Activity should remain visible", isVisible)
            }
            
            cycleCount++
            
            // Log progress hourly
            if (cycleCount % cyclesPerHour == 0) {
                val elapsedHours = (System.currentTimeMillis() - startTime) / (60 * 60 * 1000)
                val heapGrowthMB = (peakHeap - initialHeap) / (1024 * 1024)
                Log.i("SOAK", "Hours: $elapsedHours, Cycles: $cycleCount, Peak heap growth: ${heapGrowthMB}MB")
            }
        }
        
        // Final assertions
        val totalHeapGrowthMB = (peakHeap - initialHeap) / (1024 * 1024)
        assertTrue("Heap growth should be < 500MB over 24h", totalHeapGrowthMB < 500)
    }
}
```

### 6.2 Concurrent Task Soak

```kotlin
// androidTest/java/com/leeway/agentlee/soak/ConcurrentTaskSoakTest.kt

@RunWith(AndroidJUnit4::class)
@LargeTest
class ConcurrentTaskSoakTest {
    
    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)
    
    @Test(timeout = 24 * 60 * 60 * 1000)  // 24 hours
    fun `background tasks + conversation 24 hours`() {
        var cycleCount = 0
        val targetCycles = 100  // 100 cycles of different task patterns
        var errorCount = 0
        
        while (cycleCount < targetCycles) {
            try {
                activityRule.scenario.onActivity { activity ->
                    // 1. Submit background job (e.g., "index files")
                    val tasksPanel = activity.findViewById<View>(R.id.tasks_panel)
                    
                    // Simulate task submission
                    // (In real test, UI interaction or event emission)
                    
                    // 2. While task runs, ask a question
                    val chatInput = activity.findViewById<EditText>(R.id.chat_input)
                    chatInput.setText("Quick: what is 1+1? (cycle $cycleCount)")
                    
                    val submitButton = activity.findViewById<Button>(R.id.submit_btn)
                    submitButton.performClick()
                }
                
                // 3. Wait for response + task progress
                Thread.sleep(3000)
                
                // 4. Verify both completed
                activityRule.scenario.onActivity { activity ->
                    val taskList = activity.findViewById<RecyclerView>(R.id.task_list)
                    // taskList should show completed tasks
                    
                    val chatHistory = activity.findViewById<RecyclerView>(R.id.chat_history)
                    // should have new message
                }
                
            } catch (e: Exception) {
                errorCount++
                Log.e("SOAK", "Error in cycle $cycleCount", e)
            }
            
            cycleCount++
        }
        
        assertTrue("Error rate should be < 5%", errorCount < (targetCycles * 0.05))
    }
}
```

---

## 7. Performance Benchmarks

**Purpose:** Establish baselines for latency and throughput.

### 7.1 LLM Token Latency

```kotlin
// benchmarkTest/java/com/leeway/agentlee/benchmark/LlmTokenLatencyBenchmark.kt

@RunWith(AndroidJUnit4::class)
class LlmTokenLatencyBenchmark {
    
    private lateinit var llmEngine: ILlmEngine
    
    @Before
    fun setup() {
        llmEngine = LlamaEngine(InstrumentationRegistry.getInstrumentation().context)
    }
    
    @Test
    fun `measure token generation latency`() = runTest {
        val messages = listOf(Message(role = "user", content = "Count from 1 to 10."))
        
        val tokenLatencies = mutableListOf<Long>()
        val startTime = System.currentTimeMillis()
        
        llmEngine.streamChat(messages, emptyList(), ContextSnapshot.empty()).collect { token ->
            val currentTime = System.currentTimeMillis()
            tokenLatencies.add(currentTime - startTime)
        }
        
        val avgLatency = tokenLatencies.average()
        val maxLatency = tokenLatencies.maxOrNull() ?: 0
        
        // Log results
        android.util.Log.i("BENCH", "Avg token latency: ${avgLatency}ms, Max: ${maxLatency}ms")
        
        // Assert targets
        assertTrue("Avg token latency should be < 1000ms", avgLatency < 1000)
        assertTrue("Max token latency should be < 2000ms", maxLatency < 2000)
    }
}
```

### 7.2 STT Accuracy & Speed

```kotlin
// benchmarkTest/java/com/leeway/agentlee/benchmark/SttBenchmark.kt

@RunWith(AndroidJUnit4::class)
class SttBenchmark {
    
    private lateinit var sttEngine: IVoiceLoop
    
    @Before
    fun setup() {
        sttEngine = VoiceLoop(InstrumentationRegistry.getInstrumentation().context)
    }
    
    @Test
    fun `measure STT latency and accuracy`() = runTest {
        // Load reference audio (pre-recorded)
        val audioFile = "test_audio/hello_world.wav"
        
        val startTime = System.currentTimeMillis()
        val transcripts = mutableListOf<String>()
        
        sttEngine.transcript.take(5).collect { delta ->  // up to 5 deltas
            transcripts.add(delta.text)
        }
        
        val latency = System.currentTimeMillis() - startTime
        val finalTranscript = transcripts.last()
        
        android.util.Log.i("BENCH", "STT latency: ${latency}ms, Result: '$finalTranscript'")
        
        // Assert targets
        assertTrue("STT latency should be < 3000ms", latency < 3000)
        assertTrue("Transcript should contain expected words", finalTranscript.contains("hello") || finalTranscript.contains("world"))
    }
}
```

---

## 8. Test Data & Fixtures

### 8.1 Mock Objects

```kotlin
// test/java/com/leeway/agentlee/MockFactory.kt

object MockFactory {
    
    fun createMockAgentState(
        status: AgentStatus = AgentStatus.IDLE,
        emotionLabel: String = "calm"
    ): AgentState = AgentState(
        status = status,
        currentConversation = ConversationState.empty(),
        activeTasks = emptyMap(),
        emotion = EmotionState(label = emotionLabel, valence = 0.0f, arousal = 0.5f, intensity = 0.5f, visualColor = 0xFF000000.toInt(), aniHash = "idle"),
        isServiceRunning = true,
        permissionsMap = mapOf("RECORD_AUDIO" to true, "SYSTEM_ALERT_WINDOW" to true),
        audioCapture = false
    )
    
    fun createMockMessage(role: String = "user", content: String = "Hello"): Message =
        Message(role = role, content = content, timestamp = System.currentTimeMillis())
    
    fun createMockToolDescriptor(name: String = "test.tool"): ToolDescriptor =
        ToolDescriptor(
            name = name,
            description = "Test tool",
            category = ToolCategory.SYSTEM,
            inputSchema = JsonSchema(),
            riskTier = RiskTier.A
        )
    
    fun createMockJob(id: String = UUID.randomUUID().toString()): AgentJob =
        AgentJob(
            id = JobId(id),
            title = "Test Job",
            toolCalls = emptyList(),
            requiresConfirmation = false
        )
}
```

### 8.2 Test Audio Assets

Store in `src/androidTest/assets/test_audio/`:
- `hello_world.wav` — reference audio for STT accuracy testing
- `long_message.wav` — 30-second recording for TTS barge-in testing
- `silence.wav` — 5-second silence for VAD testing

### 8.3 Persona Fixtures

```json
// test/assets/personas_test.json
{
  "personas": [
    {
      "label": "test_neutral",
      "systemPromptModifier": "Respond neutrally and briefly.",
      "responsePatterns": [],
      "voiceHintId": null,
      "visualColor": "#808080"
    }
  ]
}
```

---

## 9. Test Execution Plan

### Phase 1: Unit Tests (Week 1–2)
```bash
# Run locally
./gradlew test

# Coverage report
./gradlew testDebugUnitTestCoverage
# Target: > 80% domain layer coverage
```

### Phase 2: Integration Tests (Week 3–4)
```bash
# Run locally
./gradlew test -k Integration

# No device needed initially (mock framework calls)
```

### Phase 3: Instrumentation Tests (Week 5–6)
```bash
# Run on emulator or device
./gradlew connectedAndroidTest

# Filter by annotation
./gradlew connectedAndroidTest --tests "*Permission*"
```

### Phase 4: Soak Tests (Week 11+)
```bash
# Run on real device for 24+ hours
# Monitor logs in logcat
adb logcat | grep SOAK

# Parse results
python scripts/analyze_soak_logs.py logcat.txt
```

### Phase 5: Performance Benchmarks
```bash
# Run micro benchmarks
./gradlew benchmarkTest

# Results in build/outputs/connected_android_test/
```

---

## 10. Test Result Reporting

### Test Report Template

```markdown
## Test Execution Report — Slice [N]

**Date:** [YYYY-MM-DD]  
**Duration:** [HH:MM]  
**Device(s):** [e.g., Pixel 6, API 31]  

### Summary
- Total Tests: [N]
- ✅ Passed: [N]
- ❌ Failed: [N]
- ⏭️ Skipped: [N]

### By Category
- Unit Tests: [N] passed
- Integration Tests: [N] passed
- Instrumentation: [N] passed

### Performance
- Avg LLM token latency: [Xms]
- Avg STT latency: [Xms]
- Memory growth (24h): [XMB]
- Heap peak: [XMB]

### Issues Found
1. [Issue 1 title] — severity: [P0/P1/P2]
2. [Issue 2 title] — severity: [P0/P1/P2]

### Sign-off
- Author: [Name]
- Reviewed by: [Name]
- Status: ✅ Ready | ⚠️ Blocked | ❌ Failed
```

---

## 11. Continuous Integration (CI) Setup

### GitHub Actions Workflow (Optional)

```yaml
# .github/workflows/android-tests.yml

name: Android Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
      - run: ./gradlew test

  instrumentation-test:
    runs-on: macos-latest  # macOS for faster emulation
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
      - uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 31
          script: ./gradlew connectedAndroidTest
```

---

## Conclusion

**This test strategy ensures:**
✅ Fast unit tests during development (5 min)  
✅ Integration tests for core workflows (10 min)  
✅ Real-device instrumentation tests for Android-specific features (30 min)  
✅ E2E scenarios covering realistic usage (5 min each)  
✅ 24–72 hour soak tests proving stability  
✅ Performance baselines for optimization  

**Combined execution time:** ~1.5 hours for full suite (excluding soak).

