package com.leeway.agentlee.domain.runtime

import com.leeway.agentlee.domain.bus.IEventBus
import com.leeway.agentlee.domain.conversation.IConversationEngine
import com.leeway.agentlee.domain.model.AgentStatus
import com.leeway.agentlee.domain.model.ContextSnapshot
import com.leeway.agentlee.domain.model.ConversationState
import com.leeway.agentlee.domain.model.DomainEvent
import com.leeway.agentlee.domain.model.JobId
import com.leeway.agentlee.domain.model.Message
import com.leeway.agentlee.domain.model.ToolCall
import com.leeway.agentlee.domain.model.UserInput
import com.leeway.agentlee.domain.safety.MutablePermissionEvidenceProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch

/**
 * Main orchestrator for Agent Lee runtime.
 * Manages Lanes A (Conversation), B (Tasks), C (Voice).
 * Single point of orchestration across all subsystems.
 */
interface IAgentRuntime {
    val events: Flow<DomainEvent>
    
    suspend fun initialize()
    suspend fun start()
    suspend fun stop()
    
    fun submit(input: UserInput): JobId
    fun submitToolCall(call: ToolCall): JobId
    fun resolveToolApproval(callId: String, approved: Boolean)
    fun retryToolCall(callId: String)
    fun onPermissionsChanged(perms: Map<String, Boolean>)
}

class AgentRuntimeImpl(
    private val eventBus: IEventBus,
    private val conversationEngine: IConversationEngine,
    private val toolCallOrchestrator: ToolCallOrchestrator,
    private val permissionEvidenceProvider: MutablePermissionEvidenceProvider
) : IAgentRuntime {
    
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var conversationState = ConversationState.empty()
    
    override val events: Flow<DomainEvent> = eventBus.events
    
    override suspend fun initialize() {
        // Emit initialization status
        eventBus.emit(
            DomainEvent.AgentStatusChanged(
                System.currentTimeMillis(),
                AgentStatus.INITIALIZING
            )
        )
        
        // In a real scenario, load models, initialize subsystems, etc.
        // For Slice 1, we just load the fake LLM
    }
    
    override suspend fun start() {
        eventBus.emit(
            DomainEvent.AgentStatusChanged(
                System.currentTimeMillis(),
                AgentStatus.IDLE
            )
        )
    }
    
    override suspend fun stop() {
        conversationEngine.cancel()
        eventBus.emit(
            DomainEvent.AgentStatusChanged(
                System.currentTimeMillis(),
                AgentStatus.SHUTDOWN
            )
        )
    }
    
    override fun submit(input: UserInput): JobId {
        val jobId = JobId.random()
        
        scope.launch {
            try {
                when (input) {
                    is UserInput.Text -> handleTextInput(input.content, jobId)
                    is UserInput.Speech -> handleTextInput(input.transcript, jobId)
                }
            } catch (e: Exception) {
                eventBus.emit(
                    DomainEvent.ConversationError(
                        System.currentTimeMillis(),
                        e
                    )
                )
            }
        }
        
        return jobId
    }

    override fun submitToolCall(call: ToolCall): JobId {
        val jobId = JobId.random()
        scope.launch {
            toolCallOrchestrator.propose(call)
        }
        return jobId
    }

    override fun resolveToolApproval(callId: String, approved: Boolean) {
        scope.launch {
            toolCallOrchestrator.resolveApproval(callId, approved)
        }
    }

    override fun retryToolCall(callId: String) {
        scope.launch {
            toolCallOrchestrator.retry(callId)
        }
    }
    
    override fun onPermissionsChanged(perms: Map<String, Boolean>) {
        perms.forEach { (permission, granted) ->
            permissionEvidenceProvider.update(permission, granted)
            scope.launch {
                eventBus.emit(
                    DomainEvent.PermissionStatusChanged(
                        System.currentTimeMillis(),
                        permission,
                        granted
                    )
                )
            }
        }

        scope.launch {
            toolCallOrchestrator.onPermissionsUpdated()
        }
    }
    
    private suspend fun handleTextInput(userText: String, jobId: JobId) {
        // 1. Add user message to conversation
        val userMessage = Message(role = "user", content = userText)
        conversationState = conversationState.copy(
            messages = conversationState.messages + userMessage
        )
        
        // Emit user message (optional; normally only assistant messages)
        // 2. Change status to thinking
        eventBus.emit(
            DomainEvent.AgentStatusChanged(
                System.currentTimeMillis(),
                AgentStatus.THINKING
            )
        )
        
        // 3. Call conversation engine to stream response
        val tokenStream = conversationEngine.streamChat(
            conversationState.messages,
            emptyList(),  // No tools in Slice 1
            ContextSnapshot.empty()
        )
        
        var assistantMessage = StringBuilder()
        
        // 4. Emit token deltas as they arrive
        tokenStream.collect { token ->
            assistantMessage.append(token.token)
            
            eventBus.emit(
                DomainEvent.ConversationTokenDelta(
                    System.currentTimeMillis(),
                    token.token
                )
            )
        }
        
        // 5. When all tokens received, emit final message
        val finalMessage = Message(
            role = "assistant",
            content = assistantMessage.toString().trim()
        )
        conversationState = conversationState.copy(
            messages = conversationState.messages + finalMessage
        )
        
        eventBus.emit(
            DomainEvent.ConversationMessageFinal(
                System.currentTimeMillis(),
                finalMessage
            )
        )
        
        // 6. Return to idle
        eventBus.emit(
            DomainEvent.AgentStatusChanged(
                System.currentTimeMillis(),
                AgentStatus.IDLE
            )
        )
    }
}
