package com.leeway.agentlee.domain.runtime

import com.google.gson.JsonObject
import com.leeway.agentlee.domain.bus.EventBus
import com.leeway.agentlee.domain.model.DomainEvent
import com.leeway.agentlee.domain.model.EvidenceItem
import com.leeway.agentlee.domain.model.EvidenceType
import com.leeway.agentlee.domain.model.PolicyDecision
import com.leeway.agentlee.domain.model.ProofBundle
import com.leeway.agentlee.domain.model.RiskTier
import com.leeway.agentlee.domain.model.ToolCall
import com.leeway.agentlee.domain.model.ToolCategory
import com.leeway.agentlee.domain.model.ToolDescriptor
import com.leeway.agentlee.domain.model.ToolResult
import com.leeway.agentlee.domain.safety.AuthorizationResult
import com.leeway.agentlee.domain.safety.AuthorizedToolDispatcher
import com.leeway.agentlee.domain.safety.DefaultToolExecutionGate
import com.leeway.agentlee.domain.safety.DefaultToolPolicyEngine
import com.leeway.agentlee.domain.safety.StaticToolDescriptorResolver
import com.leeway.agentlee.domain.safety.ToolExecutionGate
import com.leeway.agentlee.domain.safety.ToolPreflight
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ToolCallOrchestratorTest {

    @Test
    fun `proposed tool call with missing approval emits authorization update and does not execute`() = runTest {
        val eventBus = EventBus()
        val received = mutableListOf<DomainEvent>()
        val collector = launch { eventBus.events.collect { received.add(it) } }
        advanceUntilIdle()

        val resolver = StaticToolDescriptorResolver(
            mapOf("system.secure" to descriptor("system.secure", RiskTier.B, ToolCategory.SYSTEM))
        )
        val gate = DefaultToolExecutionGate(
            preflight = ToolPreflight { listOf(schemaEvidence()) },
            policyEngine = DefaultToolPolicyEngine(),
            resolver = resolver,
            approvalProvider = com.leeway.agentlee.domain.safety.NoopApprovalEvidenceProvider()
        )
        val dispatcher = RecordingDispatcher()
        val orchestrator = ToolCallOrchestrator(eventBus, gate, dispatcher)

        orchestrator.propose(ToolCall(name = "system.secure", args = JsonObject()))
        advanceUntilIdle()

        assertEquals(0, dispatcher.dispatchCount)
        assertTrue(received.any { it is DomainEvent.ToolCallProposed })
        val update = received.filterIsInstance<DomainEvent.ToolAuthorizationUpdated>().last()
        assertEquals(PolicyDecision.NEED_USER_APPROVAL, update.decision)
        collector.cancel()
    }

    @Test
    fun `approval then retry leads to executed event`() = runTest {
        val eventBus = EventBus()
        val received = mutableListOf<DomainEvent>()
        val collector = launch { eventBus.events.collect { received.add(it) } }
        advanceUntilIdle()

        val resolver = StaticToolDescriptorResolver(
            mapOf("system.secure" to descriptor("system.secure", RiskTier.B, ToolCategory.SYSTEM))
        )
        val gate = DefaultToolExecutionGate(
            preflight = ToolPreflight { listOf(schemaEvidence()) },
            policyEngine = DefaultToolPolicyEngine(),
            resolver = resolver,
            approvalProvider = com.leeway.agentlee.domain.safety.NoopApprovalEvidenceProvider()
        )
        val dispatcher = RecordingDispatcher()
        val orchestrator = ToolCallOrchestrator(eventBus, gate, dispatcher)
        val call = ToolCall(name = "system.secure", args = JsonObject())

        orchestrator.propose(call)
        advanceUntilIdle()
        orchestrator.resolveApproval(call.id, true)
        advanceUntilIdle()

        assertEquals(1, dispatcher.dispatchCount)
        assertTrue(received.any { it is DomainEvent.ToolCallExecuted && it.callId == call.id })
        collector.cancel()
    }

    private fun descriptor(name: String, tier: RiskTier, category: ToolCategory): ToolDescriptor {
        return ToolDescriptor(
            name = name,
            description = "test",
            category = category,
            inputSchema = JsonObject(),
            riskTier = tier
        )
    }

    private fun schemaEvidence(): EvidenceItem {
        return EvidenceItem(
            type = EvidenceType.INPUT_SCHEMA_VALID,
            payloadJson = "{\"valid\":true}",
            capturedAtMs = System.currentTimeMillis(),
            source = "preflight"
        )
    }

    private class RecordingDispatcher : AuthorizedToolDispatcher {
        var dispatchCount: Int = 0

        override suspend fun authorize(call: ToolCall): AuthorizationResult {
            throw UnsupportedOperationException("authorize is not used by runtime orchestrator")
        }

        override suspend fun dispatchAuthorized(call: ToolCall, proof: ProofBundle): ToolResult {
            dispatchCount++
            return ToolResult(callId = call.id, ok = true, data = JsonObject(), proofBundle = proof)
        }

        override suspend fun dispatch(call: ToolCall): ToolResult {
            throw UnsupportedOperationException("dispatch is not used by runtime orchestrator")
        }
    }
}
