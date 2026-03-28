package com.leeway.agentlee.domain.audit

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface AuditLogDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: AuditLogEntity)

    @Query("SELECT * FROM audit_logs ORDER BY timestamp DESC")
    suspend fun getAll(): List<AuditLogEntity>

    @Query("SELECT * FROM audit_logs ORDER BY timestamp DESC")
    fun observeAll(): Flow<List<AuditLogEntity>>
}
