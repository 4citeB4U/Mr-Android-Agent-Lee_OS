package com.leeway.agentlee.presentation

import android.content.Intent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.leeway.agentlee.presentation.viewmodel.AuditHistoryEntry
import com.leeway.agentlee.presentation.viewmodel.AuditHistoryViewModel
import com.leeway.agentlee.presentation.viewmodel.ProofItemDisplay
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuditHistoryScreen(onBack: () -> Unit) {
    val viewModel: AuditHistoryViewModel = hiltViewModel()
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel.shareEvents.collect { json ->
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "application/json"
                putExtra(Intent.EXTRA_SUBJECT, "Agent Lee Audit Log")
                putExtra(Intent.EXTRA_TEXT, json)
            }
            context.startActivity(Intent.createChooser(intent, "Export Audit Log"))
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Audit History") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = viewModel::prepareShareJson) {
                        Icon(Icons.Default.Share, contentDescription = "Export audit log as JSON")
                    }
                }
            )
        }
    ) { padding ->
        if (uiState.entries.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No audit entries yet.\nPropose and execute a tool call to populate the audit trail.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(8.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                items(uiState.entries, key = { it.entity.callId }) { entry ->
                    AuditEntryCard(
                        entry = entry,
                        expanded = uiState.expandedCallId == entry.entity.callId,
                        onToggle = { viewModel.toggleExpand(entry.entity.callId) }
                    )
                }
            }
        }
    }
}

@Composable
private fun AuditEntryCard(
    entry: AuditHistoryEntry,
    expanded: Boolean,
    onToggle: () -> Unit
) {
    val executed = entry.entity.decision == "EXECUTED"
    val decisionColor = if (executed) Color(0xFF2E7D32) else Color(0xFFC62828)
    val dateLabel = remember(entry.entity.timestamp) {
        SimpleDateFormat("MMM d HH:mm:ss", Locale.getDefault()).format(Date(entry.entity.timestamp))
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onToggle),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            // Header row: tool name + timestamp
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = entry.entity.toolName,
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.weight(1f)
                )
                Text(text = dateLabel, style = MaterialTheme.typography.labelSmall)
            }

            // Decision badge + summary
            Row(
                modifier = Modifier.padding(top = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(color = decisionColor, shape = MaterialTheme.shapes.small) {
                    Text(
                        text = entry.entity.decision,
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
                if (entry.entity.error != null) {
                    Text(
                        text = entry.entity.error,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                } else {
                    Text(
                        text = "${entry.proofItems.size} evidence items",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Expanded detail: evidence items + result JSON
            if (expanded) {
                Divider(modifier = Modifier.padding(vertical = 8.dp))
                ProofItemsSection(proofItems = entry.proofItems)

                if (entry.entity.resultJson != null) {
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    ResultSection(resultJson = entry.entity.resultJson)
                }
            }
        }
    }
}

@Composable
private fun ProofItemsSection(proofItems: List<ProofItemDisplay>) {
    Text(
        text = "Evidence (${proofItems.size} items)",
        style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.primary
    )
    if (proofItems.isEmpty()) {
        Text(
            text = "  No evidence collected",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.error
        )
    } else {
        proofItems.forEach { item ->
            Column(modifier = Modifier.padding(start = 8.dp, top = 4.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("• ${item.type}", style = MaterialTheme.typography.bodySmall)
                    Text(
                        text = "[${item.source}]",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Text(
                    text = item.payloadPreview,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = 12.dp)
                )
                Text(
                    text = SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault())
                        .format(Date(item.capturedAtMs)),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.outline,
                    modifier = Modifier.padding(start = 12.dp)
                )
            }
        }
    }
}

@Composable
private fun ResultSection(resultJson: String) {
    Text(
        text = "Result",
        style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.primary
    )
    Text(
        text = resultJson.take(400) + if (resultJson.length > 400) "…" else "",
        style = MaterialTheme.typography.labelSmall,
        modifier = Modifier.padding(start = 8.dp, top = 4.dp),
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
}
