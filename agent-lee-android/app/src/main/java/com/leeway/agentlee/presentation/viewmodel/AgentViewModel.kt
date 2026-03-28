package com.leeway.agentlee.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.leeway.agentlee.domain.model.AgentStatus
import com.leeway.agentlee.domain.model.DomainEvent
import com.leeway.agentlee.domain.model.EvidenceType
import com.leeway.agentlee.domain.model.Message
import com.leeway.agentlee.domain.model.PolicyDecision
import com.leeway.agentlee.domain.model.ProofBundle
import com.leeway.agentlee.domain.model.ToolCall
import com.leeway.agentlee.domain.model.UserInput
import com.leeway.agentlee.domain.runtime.DemoToolFactory
import com.leeway.agentlee.domain.runtime.IAgentRuntime
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class ToolAuthUiState(
    val call: ToolCall? = null,
    val decision: PolicyDecision? = null,
    val missingEvidence: List<EvidenceType> = emptyList(),
    val proofSoFar: ProofBundle? = null,
    val deniedReason: String? = null,
    val decisionReason: String = "",
    val executed: Boolean = false
)

data class AgentUiState(
    val status: AgentStatus = AgentStatus.IDLE,
    val messages: List<Message> = emptyList(),
    val currentStreamingMessage: String = "",
    val isStreaming: Boolean = false,
    val toolAuth: ToolAuthUiState = ToolAuthUiState()
)

class AgentViewModel(private val runtime: IAgentRuntime) : ViewModel() {
    
    private val mutableUiState = MutableStateFlow(AgentUiState())
    val uiState: StateFlow<AgentUiState> = mutableUiState
    
    init {
        viewModelScope.launch {
            runtime.events.collect { event ->
                reduce(event)
            }
        }
    }
    
    fun sendMessage(text: String) {
        viewModelScope.launch {
            runtime.submit(UserInput.Text(text))
        }
    }

    fun proposeDemoToolCall() {
        viewModelScope.launch {
            runtime.submitToolCall(DemoToolFactory.openSettingsCall())
        }
    }

    fun approveToolCall(callId: String) {
        runtime.resolveToolApproval(callId, true)
    }

    fun denyToolCall(callId: String) {
        runtime.resolveToolApproval(callId, false)
    }

    fun retryToolCall(callId: String) {
        runtime.retryToolCall(callId)
    }
    
    private fun reduce(event: DomainEvent) {
        val currentState = mutableUiState.value
        
        val newState = when (event) {
            is DomainEvent.AgentStatusChanged -> {
                currentState.copy(status = event.status)
            }
            is DomainEvent.ConversationTokenDelta -> {
                currentState.copy(
                    currentStreamingMessage = currentState.currentStreamingMessage + event.token,
                    isStreaming = true
                )
            }
            is DomainEvent.ConversationMessageFinal -> {
                currentState.copy(
                    messages = currentState.messages + event.message,
                    currentStreamingMessage = "",
                    isStreaming = false
                )
            }
            is DomainEvent.ToolCallProposed -> {
                currentState.copy(
                    toolAuth = ToolAuthUiState(
                        call = event.call,
                        missingEvidence = event.requiredEvidence,
                        proofSoFar = event.proofSoFar,
                        executed = false
                    )
                )
            }
            is DomainEvent.ToolAuthorizationUpdated -> {
                currentState.copy(
                    toolAuth = currentState.toolAuth.copy(
                        decision = event.decision,
                        missingEvidence = event.missingEvidence,
                        proofSoFar = event.proofSoFar,
                        deniedReason = null,
                        decisionReason = event.reason,
                        executed = false
                    )
                )
            }
            is DomainEvent.ToolCallDenied -> {
                currentState.copy(
                    toolAuth = currentState.toolAuth.copy(
                        deniedReason = event.reason,
                        proofSoFar = event.proofBundle,
                        executed = false
                    )
                )
            }
            is DomainEvent.ToolCallExecuted -> {
                currentState.copy(
                    toolAuth = currentState.toolAuth.copy(
                        proofSoFar = event.proofBundle,
                        executed = true,
                        deniedReason = null,
                        missingEvidence = emptyList(),
                        decision = PolicyDecision.ALLOW
                    )
                )
            }
            else -> currentState
        }
        
        mutableUiState.value = newState
    }
}
