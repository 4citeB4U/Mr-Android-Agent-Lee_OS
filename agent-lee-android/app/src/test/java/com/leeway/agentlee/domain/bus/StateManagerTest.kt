package com.leeway.agentlee.domain.bus

import com.leeway.agentlee.domain.model.AgentStatus
import com.leeway.agentlee.domain.model.DomainEvent
import com.leeway.agentlee.domain.model.Message
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class StateManagerTest {
    
    private lateinit var eventBus: EventBus
    private lateinit var stateManager: StateManager
    
    @Before
    fun setup() {
        eventBus = EventBus()
        stateManager = StateManager(eventBus)
    }
    
    @Test
    fun `reduces status change event`() = runTest {
        val job = launch {
            stateManager.initialize()
        }
        advanceUntilIdle()
        
        eventBus.emit(
            DomainEvent.AgentStatusChanged(System.currentTimeMillis(), AgentStatus.THINKING)
        )

        advanceUntilIdle()
        
        assertEquals(AgentStatus.THINKING, stateManager.state.value.status)
        
        job.cancel()
    }
    
    @Test
    fun `accumulates token deltas into streaming message`() = runTest {
        val job = launch {
            stateManager.initialize()
        }
        advanceUntilIdle()
        
        eventBus.emit(DomainEvent.ConversationTokenDelta(System.currentTimeMillis(), "Hello"))
        eventBus.emit(DomainEvent.ConversationTokenDelta(System.currentTimeMillis(), " "))
        eventBus.emit(DomainEvent.ConversationTokenDelta(System.currentTimeMillis(), "world"))

        advanceUntilIdle()
        
        val state = stateManager.state.value
        assertEquals("Hello world", state.currentConversation.currentStreamingMessage)
        assertTrue(state.currentConversation.isStreaming)
        
        job.cancel()
    }
    
    @Test
    fun `final message clears streaming state`() = runTest {
        val job = launch {
            stateManager.initialize()
        }
        advanceUntilIdle()
        
        eventBus.emit(DomainEvent.ConversationTokenDelta(System.currentTimeMillis(), "Test"))
        advanceUntilIdle()
        
        val finalMsg = Message(role = "assistant", content = "Test")
        eventBus.emit(DomainEvent.ConversationMessageFinal(System.currentTimeMillis(), finalMsg))

        advanceUntilIdle()
        
        val state = stateManager.state.value
        assertEquals(1, state.currentConversation.messages.size)
        assertEquals("", state.currentConversation.currentStreamingMessage)
        assertFalse(state.currentConversation.isStreaming)
        
        job.cancel()
    }
    
    @Test
    fun `permission changes are tracked`() = runTest {
        val job = launch {
            stateManager.initialize()
        }
        advanceUntilIdle()
        
        eventBus.emit(
            DomainEvent.PermissionStatusChanged(System.currentTimeMillis(), "RECORD_AUDIO", true)
        )
        eventBus.emit(
            DomainEvent.PermissionStatusChanged(System.currentTimeMillis(), "SYSTEM_ALERT_WINDOW", false)
        )

        advanceUntilIdle()
        
        val state = stateManager.state.value
        assertEquals(true, state.permissionsMap["RECORD_AUDIO"])
        assertEquals(false, state.permissionsMap["SYSTEM_ALERT_WINDOW"])
        
        job.cancel()
    }
}
