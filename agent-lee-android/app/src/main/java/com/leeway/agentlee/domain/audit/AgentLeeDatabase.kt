package com.leeway.agentlee.domain.audit

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(entities = [AuditLogEntity::class], version = 1, exportSchema = false)
abstract class AgentLeeDatabase : RoomDatabase() {
    abstract fun auditLogDao(): AuditLogDao
}
