package com.leeway.agentlee.domain.safety

import com.google.gson.JsonObject
import com.google.gson.JsonArray
import com.leeway.agentlee.domain.model.EvidenceItem
import com.leeway.agentlee.domain.model.EvidenceType
import com.leeway.agentlee.domain.model.PolicyDecision
import com.leeway.agentlee.domain.model.ProofBundle
import com.leeway.agentlee.domain.model.RiskTier
import com.leeway.agentlee.domain.model.ToolCall
import com.leeway.agentlee.domain.model.ToolCategory
import com.leeway.agentlee.domain.model.ToolDescriptor
import kotlinx.coroutines.test.runTest
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ToolExecutionGateTest {

    private fun descriptor(name: String, tier: RiskTier, permission: String? = null): ToolDescriptor {
        return ToolDescriptor(
            name = name,
            description = "test",
            category = ToolCategory.SYSTEM,
            inputSchema = JsonObject(),
            riskTier = tier,
            requiresPermission = permission
        )
    }

    private fun descriptorWithCategory(name: String, tier: RiskTier, category: ToolCategory): ToolDescriptor {
        return ToolDescriptor(
            name = name,
            description = "test",
            category = category,
            inputSchema = JsonObject(),
            riskTier = tier
        )
    }

    private fun descriptorWithRequiredArg(name: String, tier: RiskTier, requiredField: String): ToolDescriptor {
        val schema = JsonObject().apply {
            add("required", JsonArray().apply { add(requiredField) })
        }
        return ToolDescriptor(
            name = name,
            description = "test",
            category = ToolCategory.SYSTEM,
            inputSchema = schema,
            riskTier = tier
        )
    }

    private fun call(name: String): ToolCall {
        return ToolCall(name = name, args = JsonObject())
    }

    @Test
    fun `ToolExecutionGate denies if approval missing for risk HIGH`() = runTest {
        val resolver = StaticToolDescriptorResolver(mapOf("danger.tool" to descriptor("danger.tool", RiskTier.C)))
        val preflight = ToolPreflight { listOf(baseSchemaEvidence(), baseDeviceStateEvidence()) }

        val gate = DefaultToolExecutionGate(
            preflight = preflight,
            policyEngine = DefaultToolPolicyEngine(),
            resolver = resolver,
            approvalProvider = NoopApprovalEvidenceProvider()
        )

        val result = gate.authorizeOrExplain(call("danger.tool"))
        assertTrue(result is AuthorizationResult.NotAuthorized)
        val denied = result as AuthorizationResult.NotAuthorized
        assertTrue(denied.missing.contains(EvidenceType.USER_APPROVAL))
    }

    @Test
    fun `policy requests approval first when approval and other evidence are both missing`() {
        val policy = DefaultToolPolicyEngine()
        val call = ToolCall(name = "danger.tool", args = JsonObject())
        val descriptor = descriptor("danger.tool", RiskTier.C)
        val proof = ProofBundle(toolCallId = call.id, items = listOf(baseSchemaEvidence(), baseDeviceStateEvidence()))

        val decision = policy.evaluate(call, descriptor, proof)
        assertEquals(PolicyDecision.NEED_USER_APPROVAL, decision.decision)
        assertTrue(decision.missingEvidence.contains(EvidenceType.USER_APPROVAL))
        assertTrue(decision.missingEvidence.contains(EvidenceType.RATE_LIMIT_OK))
    }

    @Test
    fun `after approval high risk still requests missing non-approval evidence`() {
        val policy = DefaultToolPolicyEngine()
        val call = ToolCall(name = "danger.tool", args = JsonObject())
        val descriptor = descriptor("danger.tool", RiskTier.C)
        val proofWithApproval = ProofBundle(
            toolCallId = call.id,
            items = listOf(baseSchemaEvidence(), baseDeviceStateEvidence(), approvalEvidence())
        )

        val decision = policy.evaluate(call, descriptor, proofWithApproval)
        assertEquals(PolicyDecision.NEED_MORE_EVIDENCE, decision.decision)
        assertTrue(decision.missingEvidence.contains(EvidenceType.RATE_LIMIT_OK))
        assertTrue(!decision.missingEvidence.contains(EvidenceType.USER_APPROVAL))
    }

    @Test
    fun `ToolExecutionGate denies if schema invalid`() = runTest {
        val resolver = StaticToolDescriptorResolver(
            mapOf("safe.tool" to descriptorWithRequiredArg("safe.tool", RiskTier.A, "target"))
        )
        val preflight = DefaultToolPreflight(
            resolver = resolver,
            permissionProvider = AllowAllPermissionEvidenceProvider(),
            appPresenceProvider = AllowAllAppPresenceEvidenceProvider(),
            rateLimitProvider = AllowAllRateLimitEvidenceProvider(),
            deviceStateProvider = ReadyDeviceStateEvidenceProvider(),
            argumentValidator = MinimalJsonSchemaValidator()
        )

        val gate = DefaultToolExecutionGate(
            preflight = preflight,
            policyEngine = DefaultToolPolicyEngine(),
            resolver = resolver,
            approvalProvider = AlwaysApproveEvidenceProvider()
        )

        val invalidCall = ToolCall(name = "safe.tool", args = JsonObject())
        val result = gate.authorizeOrExplain(invalidCall)
        assertTrue(result is AuthorizationResult.NotAuthorized)
        val denied = result as AuthorizationResult.NotAuthorized
        assertTrue(denied.missing.contains(EvidenceType.INPUT_SCHEMA_VALID))
    }

    @Test
    fun `ToolExecutionGate allows safe LOW tools with preflight evidence only`() = runTest {
        val resolver = StaticToolDescriptorResolver(mapOf("safe.tool" to descriptor("safe.tool", RiskTier.A)))
        val preflight = ToolPreflight { listOf(baseSchemaEvidence(), baseRateLimitEvidence(), baseDeviceStateEvidence()) }

        val gate = DefaultToolExecutionGate(
            preflight = preflight,
            policyEngine = DefaultToolPolicyEngine(),
            resolver = resolver,
            approvalProvider = NoopApprovalEvidenceProvider()
        )

        val result = gate.authorizeOrExplain(call("safe.tool"))
        assertTrue(result is AuthorizationResult.Authorized)
    }

    @Test
    fun `Audit log always contains ProofBundle for executed calls`() = runTest {
        val resolver = StaticToolDescriptorResolver(mapOf("safe.tool" to descriptor("safe.tool", RiskTier.A)))
        val preflight = ToolPreflight { listOf(baseSchemaEvidence(), baseRateLimitEvidence(), baseDeviceStateEvidence()) }
        val gate = DefaultToolExecutionGate(
            preflight = preflight,
            policyEngine = DefaultToolPolicyEngine(),
            resolver = resolver,
            approvalProvider = NoopApprovalEvidenceProvider()
        )

        val audit = InMemoryToolAuditLogger()
        val dispatcher = createGateEnforcedDispatcher(
            gate = gate,
            auditLogger = audit
        ) { call, _ ->
            com.leeway.agentlee.domain.model.ToolResult(
                callId = call.id,
                ok = true,
                data = JsonObject()
            )
        }

        val result = dispatcher.dispatch(call("safe.tool"))
        assertTrue(result.ok)
        assertTrue(result.proofBundle != null)

        val logged = audit.snapshot()
        assertEquals(1, logged.size)
        assertEquals(result.callId, logged.first().third.callId)
        assertTrue(logged.first().third.proofBundle != null)
    }

    @Test
    fun `Accessibility tools are denied without explicit approval`() = runTest {
        val resolver = StaticToolDescriptorResolver(
            mapOf("access.tool" to descriptorWithCategory("access.tool", RiskTier.A, ToolCategory.ACCESSIBILITY))
        )
        val preflight = ToolPreflight { listOf(baseSchemaEvidence(), baseRateLimitEvidence(), baseDeviceStateEvidence()) }
        val gate = DefaultToolExecutionGate(
            preflight = preflight,
            policyEngine = DefaultToolPolicyEngine(),
            resolver = resolver,
            approvalProvider = NoopApprovalEvidenceProvider()
        )

        val result = gate.authorizeOrExplain(call("access.tool"))
        assertTrue(result is AuthorizationResult.NotAuthorized)
        val denied = result as AuthorizationResult.NotAuthorized
        assertTrue(denied.missing.contains(EvidenceType.USER_APPROVAL))
    }

    @Test
    fun `PHONE tool requires APP_INSTALLED evidence when targetApp is requested`() = runTest {
        val resolver = StaticToolDescriptorResolver(
            mapOf("phone.openApp" to descriptorWithCategory("phone.openApp", RiskTier.A, ToolCategory.PHONE))
        )
        val args = JsonObject().apply { addProperty("targetApp", "com.example.missing") }
        val call = ToolCall(name = "phone.openApp", args = args)

        val preflight = ToolPreflight { listOf(baseSchemaEvidence(), baseDeviceStateEvidence()) }
        val gate = DefaultToolExecutionGate(
            preflight = preflight,
            policyEngine = DefaultToolPolicyEngine(),
            resolver = resolver,
            approvalProvider = NoopApprovalEvidenceProvider()
        )

        val result = gate.authorizeOrExplain(call)
        assertTrue(result is AuthorizationResult.NotAuthorized)
        val denied = result as AuthorizationResult.NotAuthorized
        assertTrue(denied.missing.contains(EvidenceType.APP_INSTALLED))
    }

    private fun baseSchemaEvidence(): EvidenceItem {
        return EvidenceItem(
            type = EvidenceType.INPUT_SCHEMA_VALID,
            payloadJson = "{\"valid\":true}",
            capturedAtMs = System.currentTimeMillis(),
            source = "preflight"
        )
    }

    private fun baseRateLimitEvidence(): EvidenceItem {
        return EvidenceItem(
            type = EvidenceType.RATE_LIMIT_OK,
            payloadJson = "{\"ok\":true}",
            capturedAtMs = System.currentTimeMillis(),
            source = "system"
        )
    }

    private fun baseDeviceStateEvidence(): EvidenceItem {
        return EvidenceItem(
            type = EvidenceType.DEVICE_STATE_OK,
            payloadJson = "{\"ok\":true}",
            capturedAtMs = System.currentTimeMillis(),
            source = "system"
        )
    }

    private fun approvalEvidence(): EvidenceItem {
        return EvidenceItem(
            type = EvidenceType.USER_APPROVAL,
            payloadJson = "{\"approved\":true}",
            capturedAtMs = System.currentTimeMillis(),
            source = "user"
        )
    }

}
