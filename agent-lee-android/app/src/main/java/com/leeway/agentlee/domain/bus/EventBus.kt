package com.leeway.agentlee.domain.bus

import com.leeway.agentlee.domain.model.AgentState
import com.leeway.agentlee.domain.model.AgentStatus
import com.leeway.agentlee.domain.model.DomainEvent
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow

/**
 * Single source of truth for all domain events.
 * All lanes (Conversation, Tasks, Voice) emit to this bus.
 * UI subscribes once and updates via StateManager.
 */
interface IEventBus {
    val events: Flow<DomainEvent>
    suspend fun emit(event: DomainEvent)
}

class EventBus : IEventBus {
    private val mutableEvents = MutableSharedFlow<DomainEvent>(replay = 0, extraBufferCapacity = 100)
    
    override val events: Flow<DomainEvent> = mutableEvents.asSharedFlow()
    
    override suspend fun emit(event: DomainEvent) {
        mutableEvents.emit(event)
    }
}

/**
 * Manages the reactive state for UI consumption.
 * Subscribes to EventBus and reduces events to AgentState.
 */
interface IStateManager {
    val state: StateFlow<AgentState>
    suspend fun initialize()
}

class StateManager(private val eventBus: IEventBus) : IStateManager {
    private val mutableState = kotlinx.coroutines.flow.MutableStateFlow(AgentState())
    
    override val state: StateFlow<AgentState> = mutableState
    
    // Track conversation tokens being accumulated
    private var accumulatedMessage = StringBuilder()
    
    override suspend fun initialize() {
        eventBus.events.collect { event ->
            reduce(event)
        }
    }
    
    private fun reduce(event: DomainEvent) {
        val currentState = mutableState.value
        
        val newState = when (event) {
            is DomainEvent.AgentStatusChanged -> {
                currentState.copy(status = event.status)
            }
            is DomainEvent.AgentEmotionUpdated -> {
                currentState.copy(emotion = event.emotion)
            }
            is DomainEvent.PermissionStatusChanged -> {
                val newPerms = currentState.permissionsMap.toMutableMap()
                newPerms[event.permission] = event.granted
                currentState.copy(permissionsMap = newPerms)
            }
            is DomainEvent.ConversationTokenDelta -> {
                accumulatedMessage.append(event.token)
                currentState.copy(
                    currentConversation = currentState.currentConversation.copy(
                        currentStreamingMessage = accumulatedMessage.toString(),
                        isStreaming = true
                    )
                )
            }
            is DomainEvent.ConversationMessageFinal -> {
                accumulatedMessage.clear()
                currentState.copy(
                    currentConversation = currentState.currentConversation.copy(
                        messages = currentState.currentConversation.messages + event.message,
                        isStreaming = false,
                        currentStreamingMessage = ""
                    )
                )
            }
            is DomainEvent.TaskStarted -> {
                currentState.copy(status = AgentStatus.WORKING)
            }
            is DomainEvent.TaskProgress -> {
                val taskId = event.taskId
                val updatedTasks = currentState.activeTasks.toMutableMap()
                updatedTasks[taskId] = com.leeway.agentlee.domain.model.TaskProgress(
                    event.percent,
                    event.message
                )
                currentState.copy(activeTasks = updatedTasks)
            }
            is DomainEvent.TaskCompleted -> {
                val updatedTasks = currentState.activeTasks.toMutableMap()
                updatedTasks.remove(event.taskId)
                val newStatus = if (updatedTasks.isEmpty()) AgentStatus.IDLE else AgentStatus.WORKING
                currentState.copy(activeTasks = updatedTasks, status = newStatus)
            }
            is DomainEvent.TaskFailed,
            is DomainEvent.TaskCanceled -> {
                val event2 = event as? DomainEvent.TaskFailed ?: event as DomainEvent.TaskCanceled
                val taskId = when (event2) {
                    is DomainEvent.TaskFailed -> event2.taskId
                    is DomainEvent.TaskCanceled -> event2.taskId
                    else -> return
                }
                val updatedTasks = currentState.activeTasks.toMutableMap()
                updatedTasks.remove(taskId)
                val newStatus = if (updatedTasks.isEmpty()) AgentStatus.IDLE else AgentStatus.WORKING
                currentState.copy(activeTasks = updatedTasks, status = newStatus)
            }
            is DomainEvent.SttFinal -> {
                currentState.copy(status = AgentStatus.THINKING)
            }
            is DomainEvent.TtsStarted -> {
                currentState.copy(status = AgentStatus.SPEAKING)
            }
            is DomainEvent.TtsCompleted -> {
                currentState.copy(status = AgentStatus.IDLE)
            }
            is DomainEvent.SttPartial -> {
                currentState.copy(status = AgentStatus.LISTENING)
            }
            // All other events: keep state unchanged (they may be audit-only)
            else -> currentState
        }
        
        mutableState.value = newState
    }
}
