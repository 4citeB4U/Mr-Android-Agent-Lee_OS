package com.leeway.agentlee.domain.bus

import com.leeway.agentlee.domain.model.AgentStatus
import com.leeway.agentlee.domain.model.DomainEvent
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test
import kotlin.test.assertEquals

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
        advanceUntilIdle()
        
        eventBus.emit(DomainEvent.AgentStatusChanged(System.currentTimeMillis(), AgentStatus.IDLE))
        eventBus.emit(DomainEvent.AgentStatusChanged(System.currentTimeMillis(), AgentStatus.LISTENING))

        advanceUntilIdle()
        job.cancel()
        
        assertEquals(2, received.size)
        assertEquals(AgentStatus.IDLE, (received[0] as DomainEvent.AgentStatusChanged).status)
        assertEquals(AgentStatus.LISTENING, (received[1] as DomainEvent.AgentStatusChanged).status)
    }
    
    @Test
    fun `multiple subscribers receive same event`() = runTest {
        val sub1 = mutableListOf<DomainEvent>()
        val sub2 = mutableListOf<DomainEvent>()
        
        val job1 = launch { eventBus.events.collect { sub1.add(it) } }
        val job2 = launch { eventBus.events.collect { sub2.add(it) } }
        advanceUntilIdle()
        
        val event = DomainEvent.ConversationTokenDelta(System.currentTimeMillis(), "hello")
        eventBus.emit(event)

        advanceUntilIdle()
        
        assertEquals(1, sub1.size)
        assertEquals(1, sub2.size)
        
        job1.cancel()
        job2.cancel()
    }
}
