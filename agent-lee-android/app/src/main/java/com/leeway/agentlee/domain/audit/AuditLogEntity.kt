package com.leeway.agentlee.domain.audit

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "audit_logs")
data class AuditLogEntity(
    @PrimaryKey val callId: String,
    val toolName: String,
    val timestamp: Long,
    val decision: String,
    val proofBundleJson: String,
    val resultJson: String?,
    val error: String?
)
