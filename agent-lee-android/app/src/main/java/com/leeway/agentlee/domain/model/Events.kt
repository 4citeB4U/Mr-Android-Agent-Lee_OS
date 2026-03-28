package com.leeway.agentlee.domain.model

/**
 * All domain events published to the event bus.
 * UI state manager subscribes once and reduces these to AgentState.
 */
sealed class DomainEvent {
    abstract val timestamp: Long

    // ==================== Agent State Events ====================
    data class AgentStatusChanged(override val timestamp: Long, val status: AgentStatus) : DomainEvent()
    data class AgentEmotionUpdated(override val timestamp: Long, val emotion: EmotionState) : DomainEvent()
    data class PermissionStatusChanged(override val timestamp: Long, val permission: String, val granted: Boolean) :
        DomainEvent()

    // ==================== Conversation Events ====================
    data class ConversationTokenDelta(override val timestamp: Long, val token: String) : DomainEvent()
    data class ConversationMessageFinal(override val timestamp: Long, val message: Message) : DomainEvent()
    data class ConversationError(override val timestamp: Long, val error: Throwable) : DomainEvent()

    // ==================== Voice Input (STT) Events ====================
    data class SttPartial(override val timestamp: Long, val text: String, val confidence: Float) : DomainEvent()
    data class SttFinal(override val timestamp: Long, val text: String) : DomainEvent()
    data class SttError(override val timestamp: Long, val error: Throwable) : DomainEvent()

    // ==================== Voice Output (TTS) Events ====================
    data class TtsStarted(override val timestamp: Long, val jobId: String) : DomainEvent()
    data class TtsChunk(override val timestamp: Long, val jobId: String, val audioBytes: ByteArray) : DomainEvent()
    data class TtsCompleted(override val timestamp: Long, val jobId: String) : DomainEvent()
    data class TtsError(override val timestamp: Long, val jobId: String, val error: Throwable) : DomainEvent()

    // ==================== Wake Word Events ====================
    data class WakeWordDetected(override val timestamp: Long, val keyword: String, val confidence: Float) :
        DomainEvent()

    // ==================== Task Events ====================
    data class TaskStarted(override val timestamp: Long, val taskId: TaskId, val title: String) : DomainEvent()
    data class TaskProgress(override val timestamp: Long, val taskId: TaskId, val percent: Float, val message: String) :
        DomainEvent()
    data class TaskCompleted(override val timestamp: Long, val taskId: TaskId) : DomainEvent()
    data class TaskFailed(override val timestamp: Long, val taskId: TaskId, val error: Throwable) : DomainEvent()
    data class TaskCanceled(override val timestamp: Long, val taskId: TaskId) : DomainEvent()

    // ==================== Tool Events ====================
    data class ToolStarted(override val timestamp: Long, val jobId: JobId, val toolName: String, val callId: String) :
        DomainEvent()

    data class ToolCompleted(
        override val timestamp: Long,
        val jobId: JobId,
        val toolName: String,
        val callId: String,
        val result: ToolResult
    ) : DomainEvent()

    data class ToolError(
        override val timestamp: Long,
        val jobId: JobId,
        val toolName: String,
        val callId: String,
        val error: Throwable
    ) : DomainEvent()

    data class ToolCallProposed(
        override val timestamp: Long,
        val call: ToolCall,
        val requiredEvidence: List<EvidenceType>,
        val proofSoFar: ProofBundle
    ) : DomainEvent()

    data class ToolAuthorizationUpdated(
        override val timestamp: Long,
        val callId: String,
        val decision: PolicyDecision,
        val proofSoFar: ProofBundle,
        val missingEvidence: List<EvidenceType>,
        val reason: String = ""
    ) : DomainEvent()

    data class ToolCallDenied(
        override val timestamp: Long,
        val callId: String,
        val reason: String,
        val proofBundle: ProofBundle
    ) : DomainEvent()

    data class ToolCallExecuted(
        override val timestamp: Long,
        val callId: String,
        val proofBundle: ProofBundle,
        val result: ToolResult
    ) : DomainEvent()

    // ==================== Approval Events ====================
    data class ApprovalRequested(
        override val timestamp: Long,
        val approvalId: String,
        val message: String,
        val riskTier: RiskTier
    ) : DomainEvent()

    data class ApprovalGiven(override val timestamp: Long, val approvalId: String) : DomainEvent()
    data class ApprovalDenied(override val timestamp: Long, val approvalId: String) : DomainEvent()

    // ==================== Audit Events ====================
    data class AuditAppended(override val timestamp: Long, val entry: AuditLogEntry) : DomainEvent()
}

// ==================== Tool Types ====================

enum class RiskTier { A, B, C }

enum class ToolCategory { FILES, SYSTEM, PHONE, ACCESSIBILITY, NETWORK, MEMORY }

enum class EvidenceType {
    USER_APPROVAL,
    PERMISSION_GRANTED,
    APP_INSTALLED,
    FOREGROUND_APP,
    INPUT_SCHEMA_VALID,
    RATE_LIMIT_OK,
    DEVICE_STATE_OK,
    SCREEN_CAPTURE_HASH,
    ACCESSIBILITY_SNAPSHOT_HASH
}

data class EvidenceItem(
    val type: EvidenceType,
    val payloadJson: String,
    val capturedAtMs: Long,
    val source: String,
    val hash: String? = null
)

data class ProofBundle(
    val toolCallId: String,
    val items: List<EvidenceItem>,
    val createdAtMs: Long = System.currentTimeMillis()
)

enum class PolicyDecision {
    ALLOW,
    DENY,
    NEED_USER_APPROVAL,
    NEED_MORE_EVIDENCE
}

data class ToolDescriptor(
    val name: String,
    val description: String,
    val category: ToolCategory,
    val inputSchema: JsonObject,
    val riskTier: RiskTier,
    val requiresPermission: String? = null,
    val isOnlineOnly: Boolean = false
)

data class ToolCall(
    val id: String = JobId.random().value,
    val name: String,
    val args: JsonObject,
    val correlationId: String = "",
    val originAgent: String = "agent-lee-runtime",
    val timestamp: Long = System.currentTimeMillis()
)

data class ToolResult(
    val callId: String,
    val ok: Boolean,
    val data: JsonObject? = null,
    val error: String? = null,
    val logs: List<String> = emptyList(),
    val executionTimeMs: Long = 0,
    val proofBundle: ProofBundle? = null
)

// ==================== Audit Log ====================

data class AuditLogEntry(
    val id: Long = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val eventType: String,
    val details: String,
    val riskTier: String = "A",
    val result: String = "success"
)
