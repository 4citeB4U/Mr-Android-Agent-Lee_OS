package com.leeway.agentlee.domain.audit

import com.google.gson.Gson
import com.leeway.agentlee.domain.model.ToolCall
import com.leeway.agentlee.domain.model.ToolResult
import com.leeway.agentlee.domain.model.ProofBundle
import com.leeway.agentlee.domain.safety.ToolAuditLogger

class RoomToolAuditLogger(
    private val dao: AuditLogDao,
    private val gson: Gson
) : ToolAuditLogger {
    override suspend fun append(call: ToolCall, proof: ProofBundle, result: ToolResult) {
        dao.insert(
            AuditLogEntity(
                callId = call.id,
                toolName = call.name,
                timestamp = System.currentTimeMillis(),
                decision = if (result.ok) "EXECUTED" else "DENIED",
                proofBundleJson = gson.toJson(proof),
                resultJson = gson.toJson(result),
                error = result.error
            )
        )
    }
}
