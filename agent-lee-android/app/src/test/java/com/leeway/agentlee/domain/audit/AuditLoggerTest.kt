package com.leeway.agentlee.domain.audit

import com.google.gson.Gson
import com.leeway.agentlee.domain.model.EvidenceItem
import com.leeway.agentlee.domain.model.EvidenceType
import com.leeway.agentlee.domain.model.ProofBundle
import com.leeway.agentlee.domain.model.ToolCall
import com.leeway.agentlee.domain.model.ToolResult
import com.google.gson.JsonObject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class AuditLoggerTest {

    /** Minimal in-memory DAO — no Room infrastructure needed. */
    private class FakeAuditLogDao : AuditLogDao {
        val inserted = mutableListOf<AuditLogEntity>()

        override suspend fun insert(entry: AuditLogEntity) {
            inserted.add(entry)
        }

        override suspend fun getAll(): List<AuditLogEntity> =
            inserted.sortedByDescending { it.timestamp }

        override fun observeAll(): Flow<List<AuditLogEntity>> = flowOf(inserted)
    }

    // ──────────────────────────────────────────────────
    // 1. EXECUTED result is stored correctly
    // ──────────────────────────────────────────────────

    @Test
    fun `append executed result stores EXECUTED decision and proof JSON`() = runTest {
        val dao = FakeAuditLogDao()
        val gson = Gson()
        val logger = RoomToolAuditLogger(dao, gson)

        val call = ToolCall(id = "c1", name = "system.health", args = JsonObject())
        val item = EvidenceItem(
            type = EvidenceType.INPUT_SCHEMA_VALID,
            payloadJson = "{\"valid\":true}",
            capturedAtMs = 1_000L,
            source = "preflight"
        )
        val proof = ProofBundle(toolCallId = "c1", items = listOf(item))
        val result = ToolResult(callId = "c1", ok = true, data = JsonObject(), proofBundle = proof)

        logger.append(call, proof, result)

        assertEquals(1, dao.inserted.size)
        val entity = dao.inserted[0]
        assertEquals("c1", entity.callId)
        assertEquals("system.health", entity.toolName)
        assertEquals("EXECUTED", entity.decision)
        assertNull(entity.error)

        // Proof bundle must round-trip through Gson
        val decoded = gson.fromJson(entity.proofBundleJson, ProofBundle::class.java)
        assertEquals(1, decoded.items.size)
        assertEquals(EvidenceType.INPUT_SCHEMA_VALID, decoded.items[0].type)
        assertEquals("preflight", decoded.items[0].source)
    }

    // ──────────────────────────────────────────────────
    // 2. DENIED result is stored correctly
    // ──────────────────────────────────────────────────

    @Test
    fun `append denied result stores DENIED decision and error`() = runTest {
        val dao = FakeAuditLogDao()
        val gson = Gson()
        val logger = RoomToolAuditLogger(dao, gson)

        val call = ToolCall(id = "c2", name = "phone.call", args = JsonObject())
        val proof = ProofBundle(toolCallId = "c2", items = emptyList())
        val result = ToolResult(callId = "c2", ok = false, error = "User denied tool", proofBundle = proof)

        logger.append(call, proof, result)

        assertEquals(1, dao.inserted.size)
        val entity = dao.inserted[0]
        assertEquals("c2", entity.callId)
        assertEquals("DENIED", entity.decision)
        assertEquals("User denied tool", entity.error)
    }

    // ──────────────────────────────────────────────────
    // 3. getAll returns entries sorted by time descending
    // ──────────────────────────────────────────────────

    @Test
    fun `getAll returns entries sorted by timestamp descending`() = runTest {
        val dao = FakeAuditLogDao()
        val gson = Gson()

        // Insert directly with known timestamps
        for (i in 1..3) {
            val proof = ProofBundle(toolCallId = "c$i", items = emptyList(), createdAtMs = i * 1_000L)
            dao.inserted.add(
                AuditLogEntity(
                    callId = "c$i",
                    toolName = "tool.$i",
                    timestamp = i * 1_000L,
                    decision = "EXECUTED",
                    proofBundleJson = gson.toJson(proof),
                    resultJson = null,
                    error = null
                )
            )
        }

        val all = dao.getAll()
        assertEquals(3, all.size)
        // Newest first
        assertEquals("c3", all[0].callId)
        assertEquals("c2", all[1].callId)
        assertEquals("c1", all[2].callId)
    }

    // ──────────────────────────────────────────────────
    // 4. Multiple evidence items all round-trip correctly
    // ──────────────────────────────────────────────────

    @Test
    fun `proof bundle with multiple evidence types survives Gson round-trip`() = runTest {
        val dao = FakeAuditLogDao()
        val gson = Gson()
        val logger = RoomToolAuditLogger(dao, gson)

        val items = listOf(
            EvidenceItem(EvidenceType.INPUT_SCHEMA_VALID, "{}", 100L, "preflight"),
            EvidenceItem(EvidenceType.PERMISSION_GRANTED, "{\"perm\":\"READ\"}", 101L, "system"),
            EvidenceItem(EvidenceType.USER_APPROVAL, "{\"approved\":true}", 102L, "user")
        )
        val call = ToolCall(id = "c3", name = "files.read", args = JsonObject())
        val proof = ProofBundle(toolCallId = "c3", items = items)
        val result = ToolResult(callId = "c3", ok = true, proofBundle = proof)

        logger.append(call, proof, result)

        val decoded = gson.fromJson(dao.inserted[0].proofBundleJson, ProofBundle::class.java)
        assertEquals(3, decoded.items.size)
        assertEquals(EvidenceType.INPUT_SCHEMA_VALID, decoded.items[0].type)
        assertEquals(EvidenceType.PERMISSION_GRANTED, decoded.items[1].type)
        assertEquals(EvidenceType.USER_APPROVAL, decoded.items[2].type)
    }
}
