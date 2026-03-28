package com.leeway.agentlee.domain.runtime

import com.google.gson.JsonObject
import com.leeway.agentlee.domain.bus.IEventBus
import com.leeway.agentlee.domain.model.DomainEvent
import com.leeway.agentlee.domain.model.EvidenceItem
import com.leeway.agentlee.domain.model.EvidenceType
import com.leeway.agentlee.domain.model.PolicyDecision
import com.leeway.agentlee.domain.model.ToolCall
import com.leeway.agentlee.domain.safety.AuthorizationResult
import com.leeway.agentlee.domain.safety.AuthorizedToolDispatcher
import com.leeway.agentlee.domain.safety.ToolExecutionGate

class ToolCallOrchestrator(
    private val eventBus: IEventBus,
    private val gate: ToolExecutionGate,
    private val dispatcher: AuthorizedToolDispatcher
) {
    private data class PendingToolCall(
        val call: ToolCall,
        val evidence: MutableList<EvidenceItem> = mutableListOf()
    )

    private val pendingCalls = linkedMapOf<String, PendingToolCall>()

    suspend fun propose(call: ToolCall) {
        val authorization = gate.evaluate(call)
        val requiredEvidence = when (authorization) {
            is AuthorizationResult.Authorized -> emptyList()
            is AuthorizationResult.NotAuthorized -> authorization.missing
        }
        val proof = when (authorization) {
            is AuthorizationResult.Authorized -> authorization.proof
            is AuthorizationResult.NotAuthorized -> authorization.proofSoFar
        }

        eventBus.emit(
            DomainEvent.ToolCallProposed(
                timestamp = System.currentTimeMillis(),
                call = call,
                requiredEvidence = requiredEvidence,
                proofSoFar = proof
            )
        )

        handleAuthorization(call, authorization)
    }

    suspend fun resolveApproval(callId: String, approved: Boolean) {
        val pending = pendingCalls[callId] ?: return
        if (!approved) {
            eventBus.emit(
                DomainEvent.ToolCallDenied(
                    timestamp = System.currentTimeMillis(),
                    callId = callId,
                    reason = "User denied tool execution",
                    proofBundle = gate.evaluate(pending.call, pending.evidence).let {
                        when (it) {
                            is AuthorizationResult.Authorized -> it.proof
                            is AuthorizationResult.NotAuthorized -> it.proofSoFar
                        }
                    }
                )
            )
            pendingCalls.remove(callId)
            return
        }

        pending.evidence.removeAll { it.type == EvidenceType.USER_APPROVAL }
        pending.evidence.add(
            EvidenceItem(
                type = EvidenceType.USER_APPROVAL,
                payloadJson = JsonObject().apply { addProperty("approved", true) }.toString(),
                capturedAtMs = System.currentTimeMillis(),
                source = "user"
            )
        )
        reEvaluate(callId)
    }

    suspend fun retry(callId: String) {
        if (pendingCalls.containsKey(callId)) {
            reEvaluate(callId)
        }
    }

    suspend fun onPermissionsUpdated() {
        pendingCalls.keys.toList().forEach { reEvaluate(it) }
    }

    private suspend fun reEvaluate(callId: String) {
        val pending = pendingCalls[callId] ?: return
        handleAuthorization(pending.call, gate.evaluate(pending.call, pending.evidence), isRetry = true)
    }

    private suspend fun handleAuthorization(
        call: ToolCall,
        authorization: AuthorizationResult,
        isRetry: Boolean = false
    ) {
        when (authorization) {
            is AuthorizationResult.Authorized -> {
                pendingCalls.remove(call.id)
                val result = dispatcher.dispatchAuthorized(call, authorization.proof)
                eventBus.emit(
                    DomainEvent.ToolCallExecuted(
                        timestamp = System.currentTimeMillis(),
                        callId = call.id,
                        proofBundle = authorization.proof,
                        result = result
                    )
                )
            }
            is AuthorizationResult.NotAuthorized -> {
                val pending = pendingCalls.getOrPut(call.id) { PendingToolCall(call) }
                if (isRetry) {
                    pending.evidence.clear()
                    pending.evidence.addAll(
                        authorization.proofSoFar.items.filterNot {
                            it.source == "preflight" || it.source == "system"
                        }
                    )
                }

                eventBus.emit(
                    DomainEvent.ToolAuthorizationUpdated(
                        timestamp = System.currentTimeMillis(),
                        callId = call.id,
                        decision = authorization.decision,
                        proofSoFar = authorization.proofSoFar,
                        missingEvidence = authorization.missing,
                        reason = authorization.reason
                    )
                )

                if (authorization.decision == PolicyDecision.DENY) {
                    pendingCalls.remove(call.id)
                    eventBus.emit(
                        DomainEvent.ToolCallDenied(
                            timestamp = System.currentTimeMillis(),
                            callId = call.id,
                            reason = authorization.reason,
                            proofBundle = authorization.proofSoFar
                        )
                    )
                }
            }
        }
    }
}
