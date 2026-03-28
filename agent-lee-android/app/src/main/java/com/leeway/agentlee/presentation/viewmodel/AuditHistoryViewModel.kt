package com.leeway.agentlee.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.gson.Gson
import com.leeway.agentlee.domain.audit.AuditLogDao
import com.leeway.agentlee.domain.audit.AuditLogEntity
import com.leeway.agentlee.domain.model.EvidenceItem
import com.leeway.agentlee.domain.model.ProofBundle
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProofItemDisplay(
    val type: String,
    val source: String,
    val capturedAtMs: Long,
    val payloadPreview: String
)

data class AuditHistoryEntry(
    val entity: AuditLogEntity,
    val proofItems: List<ProofItemDisplay>
)

data class AuditHistoryUiState(
    val entries: List<AuditHistoryEntry> = emptyList(),
    val expandedCallId: String? = null
)

@HiltViewModel
class AuditHistoryViewModel @Inject constructor(
    private val dao: AuditLogDao,
    private val gson: Gson
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuditHistoryUiState())
    val uiState: StateFlow<AuditHistoryUiState> = _uiState

    private val _shareEvents = MutableSharedFlow<String>(extraBufferCapacity = 1)
    val shareEvents = _shareEvents.asSharedFlow()

    init {
        dao.observeAll()
            .onEach { entities ->
                _uiState.value = _uiState.value.copy(entries = entities.map { toDisplayEntry(it) })
            }
            .launchIn(viewModelScope)
    }

    fun toggleExpand(callId: String) {
        val current = _uiState.value.expandedCallId
        _uiState.value = _uiState.value.copy(
            expandedCallId = if (current == callId) null else callId
        )
    }

    fun prepareShareJson() {
        viewModelScope.launch {
            val all = dao.getAll()
            val json = gson.toJson(all)
            _shareEvents.emit(json)
        }
    }

    private fun toDisplayEntry(entity: AuditLogEntity): AuditHistoryEntry {
        val proofItems = try {
            val bundle = gson.fromJson(entity.proofBundleJson, ProofBundle::class.java)
            bundle?.items?.map { item: EvidenceItem ->
                ProofItemDisplay(
                    type = item.type.name,
                    source = item.source,
                    capturedAtMs = item.capturedAtMs,
                    payloadPreview = item.payloadJson.take(80)
                )
            } ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
        return AuditHistoryEntry(entity = entity, proofItems = proofItems)
    }
}
