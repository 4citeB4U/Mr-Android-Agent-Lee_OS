package com.leeway.agentlee.domain.safety

import com.google.gson.JsonObject
import com.leeway.agentlee.domain.model.EvidenceItem
import com.leeway.agentlee.domain.model.EvidenceType
import com.leeway.agentlee.domain.model.PolicyDecision
import com.leeway.agentlee.domain.model.ProofBundle
import com.leeway.agentlee.domain.model.RiskTier
import com.leeway.agentlee.domain.model.ToolCall
import com.leeway.agentlee.domain.model.ToolCategory
import com.leeway.agentlee.domain.model.ToolDescriptor
import com.leeway.agentlee.domain.model.ToolResult

/**
 * Invariant: A tool executor must never execute unless gate authorization succeeds.
 */
interface AuthorizedToolDispatcher {
    suspend fun authorize(call: ToolCall): AuthorizationResult
    suspend fun dispatchAuthorized(call: ToolCall, proof: ProofBundle): ToolResult
    suspend fun dispatch(call: ToolCall): ToolResult
}

interface ToolDescriptorResolver {
    fun resolve(call: ToolCall): ToolDescriptor?
}

/**
 * Raw execution path is intentionally kept internal.
 */
internal interface RawToolDispatcher {
    suspend fun dispatch(call: ToolCall, proof: ProofBundle): ToolResult
}

internal interface ToolExecutor {
    suspend fun execute(call: ToolCall, proof: ProofBundle): ToolResult
}

fun interface ToolPreflight {
    suspend fun collectEvidence(call: ToolCall): List<EvidenceItem>
}

data class PolicyEvaluation(
    val decision: PolicyDecision,
    val reason: String,
    val missingEvidence: List<EvidenceType> = emptyList()
)

interface ToolPolicyEngine {
    fun evaluate(call: ToolCall, descriptor: ToolDescriptor?, proof: ProofBundle): PolicyEvaluation
}

interface ApprovalEvidenceProvider {
    suspend fun requestApproval(call: ToolCall, descriptor: ToolDescriptor?): EvidenceItem?
}

sealed class AuthorizationResult {
    data class Authorized(val proof: ProofBundle) : AuthorizationResult()
    data class NotAuthorized(
        val decision: PolicyDecision,
        val reason: String,
        val missing: List<EvidenceType>,
        val proofSoFar: ProofBundle
    ) : AuthorizationResult()
}

interface ToolExecutionGate {
    suspend fun evaluate(call: ToolCall, additionalEvidence: List<EvidenceItem> = emptyList()): AuthorizationResult
    suspend fun authorizeOrExplain(call: ToolCall): AuthorizationResult
}

interface ToolAuditLogger {
    suspend fun append(call: ToolCall, proof: ProofBundle, result: ToolResult)
}

interface PermissionEvidenceProvider {
    fun hasPermission(permission: String): Boolean
}

interface AppPresenceEvidenceProvider {
    fun isInstalled(packageOrAppName: String): Boolean
}

interface RateLimitEvidenceProvider {
    fun isAllowed(call: ToolCall): Boolean
}

interface DeviceStateEvidenceProvider {
    fun isReady(): Boolean
}

interface ToolArgumentValidator {
    fun isValid(args: JsonObject, inputSchema: JsonObject): Boolean
}

class DefaultToolExecutionGate(
    private val preflight: ToolPreflight,
    private val policyEngine: ToolPolicyEngine,
    private val resolver: ToolDescriptorResolver,
    private val approvalProvider: ApprovalEvidenceProvider
) : ToolExecutionGate {

    override suspend fun evaluate(call: ToolCall, additionalEvidence: List<EvidenceItem>): AuthorizationResult {
        val descriptor = resolver.resolve(call)
        val preflightEvidence = preflight.collectEvidence(call)
        val proof = ProofBundle(toolCallId = call.id, items = (preflightEvidence + additionalEvidence).distinct())

        val evaluation = policyEngine.evaluate(call, descriptor, proof)
        return when (evaluation.decision) {
            PolicyDecision.ALLOW -> AuthorizationResult.Authorized(proof)
            PolicyDecision.DENY,
            PolicyDecision.NEED_MORE_EVIDENCE,
            PolicyDecision.NEED_USER_APPROVAL -> AuthorizationResult.NotAuthorized(
                decision = evaluation.decision,
                reason = evaluation.reason,
                missing = evaluation.missingEvidence,
                proofSoFar = proof
            )
        }
    }

    override suspend fun authorizeOrExplain(call: ToolCall): AuthorizationResult {
        val first = evaluate(call)
        return when (first) {
            is AuthorizationResult.Authorized -> first
            is AuthorizationResult.NotAuthorized -> {
                val descriptor = resolver.resolve(call)
                if (first.decision != PolicyDecision.NEED_USER_APPROVAL) {
                    return first
                }

                val approvalEvidence = approvalProvider.requestApproval(call, descriptor)
                if (approvalEvidence == null) {
                    AuthorizationResult.NotAuthorized(
                        decision = PolicyDecision.NEED_USER_APPROVAL,
                        reason = "User approval missing",
                        missing = listOf(EvidenceType.USER_APPROVAL),
                        proofSoFar = first.proofSoFar
                    )
                } else {
                    evaluate(call, listOf(approvalEvidence))
                }
            }
        }
    }
}

/**
 * Wrapper that enforces the safety invariant for every tool call.
 */
internal class GateEnforcedToolDispatcher(
    private val gate: ToolExecutionGate,
    private val delegate: RawToolDispatcher,
    private val auditLogger: ToolAuditLogger
) : AuthorizedToolDispatcher {
    override suspend fun authorize(call: ToolCall): AuthorizationResult = gate.authorizeOrExplain(call)

    override suspend fun dispatchAuthorized(call: ToolCall, proof: ProofBundle): ToolResult {
        val result = delegate.dispatch(call, proof).copy(proofBundle = proof)
        auditLogger.append(call, proof, result)
        return result
    }

    override suspend fun dispatch(call: ToolCall): ToolResult {
        return when (val auth = authorize(call)) {
            is AuthorizationResult.Authorized -> {
                dispatchAuthorized(call, auth.proof)
            }
            is AuthorizationResult.NotAuthorized -> {
                val denied = ToolResult(
                    callId = call.id,
                    ok = false,
                    error = "Denied: ${auth.reason}",
                    proofBundle = auth.proofSoFar,
                    logs = listOf("missing_evidence=${auth.missing.joinToString(",")}")
                )
                auditLogger.append(call, auth.proofSoFar, denied)
                denied
            }
        }
    }
}

fun createGateEnforcedDispatcher(
    gate: ToolExecutionGate,
    auditLogger: ToolAuditLogger,
    executor: suspend (ToolCall, ProofBundle) -> ToolResult
): AuthorizedToolDispatcher {
    val raw = object : RawToolDispatcher {
        override suspend fun dispatch(call: ToolCall, proof: ProofBundle): ToolResult {
            return executor(call, proof)
        }
    }
    return GateEnforcedToolDispatcher(gate, raw, auditLogger)
}

/**
 * SIDELOAD baseline policy matrix for immediate enforcement.
 */
class DefaultToolPolicyEngine : ToolPolicyEngine {
    override fun evaluate(call: ToolCall, descriptor: ToolDescriptor?, proof: ProofBundle): PolicyEvaluation {
        val provided = proof.items.map { it.type }.toSet()

        val required = mutableSetOf(EvidenceType.INPUT_SCHEMA_VALID)

        if (descriptor?.requiresPermission != null) {
            required.add(EvidenceType.PERMISSION_GRANTED)
        }

        if (descriptor?.category == ToolCategory.PHONE && call.args.has("targetApp")) {
            required.add(EvidenceType.APP_INSTALLED)
        }

        val effectiveRisk = if (descriptor?.category == ToolCategory.ACCESSIBILITY) {
            RiskTier.C
        } else {
            descriptor?.riskTier ?: RiskTier.C
        }

        when (effectiveRisk) {
            RiskTier.A -> {
                // LOW baseline: schema (+ permission when needed).
            }
            RiskTier.B -> {
                required.add(EvidenceType.USER_APPROVAL)
            }
            RiskTier.C -> {
                required.add(EvidenceType.USER_APPROVAL)
                required.add(EvidenceType.RATE_LIMIT_OK)
            }
        }

        val missing = required.filterNot { provided.contains(it) }
        if (missing.isEmpty()) {
            return PolicyEvaluation(PolicyDecision.ALLOW, "Evidence complete")
        }

        return if (missing.contains(EvidenceType.USER_APPROVAL)) {
            PolicyEvaluation(
                decision = PolicyDecision.NEED_USER_APPROVAL,
                reason = "Explicit approval required",
                missingEvidence = missing.distinct()
            )
        } else {
            PolicyEvaluation(
                decision = PolicyDecision.NEED_MORE_EVIDENCE,
                reason = "Additional evidence required",
                missingEvidence = missing.distinct()
            )
        }
    }
}

class DefaultToolPreflight(
    private val resolver: ToolDescriptorResolver,
    private val permissionProvider: PermissionEvidenceProvider,
    private val appPresenceProvider: AppPresenceEvidenceProvider,
    private val rateLimitProvider: RateLimitEvidenceProvider,
    private val deviceStateProvider: DeviceStateEvidenceProvider,
    private val argumentValidator: ToolArgumentValidator
) : ToolPreflight {
    override suspend fun collectEvidence(call: ToolCall): List<EvidenceItem> {
        val descriptor = resolver.resolve(call)
        val now = System.currentTimeMillis()
        val evidence = mutableListOf<EvidenceItem>()

        if (descriptor != null && argumentValidator.isValid(call.args, descriptor.inputSchema)) {
            evidence.add(
                EvidenceItem(
                    type = EvidenceType.INPUT_SCHEMA_VALID,
                    payloadJson = "{\"valid\":true}",
                    capturedAtMs = now,
                    source = "preflight"
                )
            )
        }

        if (descriptor?.requiresPermission != null && permissionProvider.hasPermission(descriptor.requiresPermission)) {
            evidence.add(
                EvidenceItem(
                    type = EvidenceType.PERMISSION_GRANTED,
                    payloadJson = "{\"permission\":\"${descriptor.requiresPermission}\"}",
                    capturedAtMs = now,
                    source = "system"
                )
            )
        }

        if (descriptor?.category == ToolCategory.PHONE) {
            val target = call.args.get("targetApp")?.asString
            if (!target.isNullOrBlank() && appPresenceProvider.isInstalled(target)) {
                evidence.add(
                    EvidenceItem(
                        type = EvidenceType.APP_INSTALLED,
                        payloadJson = "{\"target\":\"$target\"}",
                        capturedAtMs = now,
                        source = "preflight"
                    )
                )
            }
        }

        if (rateLimitProvider.isAllowed(call)) {
            evidence.add(
                EvidenceItem(
                    type = EvidenceType.RATE_LIMIT_OK,
                    payloadJson = "{\"allowed\":true}",
                    capturedAtMs = now,
                    source = "system"
                )
            )
        }

        if (deviceStateProvider.isReady()) {
            evidence.add(
                EvidenceItem(
                    type = EvidenceType.DEVICE_STATE_OK,
                    payloadJson = "{\"ready\":true}",
                    capturedAtMs = now,
                    source = "system"
                )
            )
        }

        return evidence
    }
}

class MinimalJsonSchemaValidator : ToolArgumentValidator {
    override fun isValid(args: JsonObject, inputSchema: JsonObject): Boolean {
        // Deterministic baseline: enforce required field presence only.
        val requiredElement = inputSchema.get("required") ?: return true
        if (!requiredElement.isJsonArray) return false

        return requiredElement.asJsonArray.all { req ->
            req.isJsonPrimitive && req.asString.isNotBlank() && args.has(req.asString)
        }
    }
}

class InMemoryToolAuditLogger : ToolAuditLogger {
    private val entries = mutableListOf<Triple<ToolCall, ProofBundle, ToolResult>>()

    override suspend fun append(call: ToolCall, proof: ProofBundle, result: ToolResult) {
        entries.add(Triple(call, proof, result))
    }

    fun snapshot(): List<Triple<ToolCall, ProofBundle, ToolResult>> = entries.toList()
}

class StaticToolDescriptorResolver(
    private val descriptors: Map<String, ToolDescriptor>
) : ToolDescriptorResolver {
    override fun resolve(call: ToolCall): ToolDescriptor? = descriptors[call.name]
}

class NoopApprovalEvidenceProvider : ApprovalEvidenceProvider {
    override suspend fun requestApproval(call: ToolCall, descriptor: ToolDescriptor?): EvidenceItem? = null
}

class AlwaysApproveEvidenceProvider : ApprovalEvidenceProvider {
    override suspend fun requestApproval(call: ToolCall, descriptor: ToolDescriptor?): EvidenceItem {
        return EvidenceItem(
            type = EvidenceType.USER_APPROVAL,
            payloadJson = JsonObject().apply { addProperty("approved", true) }.toString(),
            capturedAtMs = System.currentTimeMillis(),
            source = "user"
        )
    }
}

class AllowAllPermissionEvidenceProvider : PermissionEvidenceProvider {
    override fun hasPermission(permission: String): Boolean = true
}

class AllowAllAppPresenceEvidenceProvider : AppPresenceEvidenceProvider {
    override fun isInstalled(packageOrAppName: String): Boolean = true
}

class AllowAllRateLimitEvidenceProvider : RateLimitEvidenceProvider {
    override fun isAllowed(call: ToolCall): Boolean = true
}

class ReadyDeviceStateEvidenceProvider : DeviceStateEvidenceProvider {
    override fun isReady(): Boolean = true
}
