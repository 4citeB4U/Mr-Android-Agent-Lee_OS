package com.leeway.agentlee.presentation

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.leeway.agentlee.domain.model.AgentStatus
import com.leeway.agentlee.domain.runtime.IAgentRuntime
import com.leeway.agentlee.presentation.viewmodel.AgentUiState
import com.leeway.agentlee.presentation.viewmodel.AgentViewModel

@Composable
fun AgentLeeScreen(
    runtime: IAgentRuntime,
    onNavigateToAudit: () -> Unit = {}
) {
    val viewModel: AgentViewModel = viewModel { AgentViewModel(runtime) }
    val uiState by viewModel.uiState.collectAsState()
    
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header with status
            StatusHeader(uiState, onNavigateToAudit = onNavigateToAudit)

            ProofPanel(
                uiState = uiState,
                onProposeDemoTool = viewModel::proposeDemoToolCall,
                onApprove = viewModel::approveToolCall,
                onDeny = viewModel::denyToolCall,
                onRetry = viewModel::retryToolCall
            )
            
            // Chat area
            ChatArea(uiState)
            
            // Input area
            InputArea { message ->
                viewModel.sendMessage(message)
            }
        }
    }
}

@Composable
fun ProofPanel(
    uiState: AgentUiState,
    onProposeDemoTool: () -> Unit,
    onApprove: (String) -> Unit,
    onDeny: (String) -> Unit,
    onRetry: (String) -> Unit
) {
    val auth = uiState.toolAuth
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 4.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text("Proof Panel", style = MaterialTheme.typography.titleMedium)

            // Tool call status
            Text(
                text = auth.call?.let { "Pending: ${it.name}" } ?: "No pending tool call",
                style = MaterialTheme.typography.bodyMedium
            )

            // Decision + reason (deterministic operator console output)
            if (auth.decision != null) {
                val decisionColor = when (auth.decision) {
                    com.leeway.agentlee.domain.model.PolicyDecision.ALLOW -> MaterialTheme.colorScheme.primary
                    com.leeway.agentlee.domain.model.PolicyDecision.DENY -> MaterialTheme.colorScheme.error
                    else -> MaterialTheme.colorScheme.secondary
                }
                Text(
                    text = "Decision: ${auth.decision}",
                    style = MaterialTheme.typography.bodySmall,
                    color = decisionColor
                )
                if (auth.decisionReason.isNotBlank()) {
                    Text(
                        text = "Reason: ${auth.decisionReason}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Missing evidence (deterministic list)
            if (auth.missingEvidence.isNotEmpty()) {
                Text(
                    text = "Missing: ${auth.missingEvidence.joinToString { it.name }}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
            }

            // Deny reason
            if (auth.deniedReason != null) {
                Text(
                    text = "Denied: ${auth.deniedReason}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
            }

            // Proof-so-far evidence list
            val proofItems = auth.proofSoFar?.items
            if (!proofItems.isNullOrEmpty()) {
                Text(
                    text = "Evidence collected (${proofItems.size}):",
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.padding(top = 4.dp)
                )
                proofItems.forEach { item ->
                    Text(
                        text = "  ✓ ${item.type.name} [${item.source}]",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            // Execution confirmed
            if (auth.executed) {
                Text(
                    text = "✓ Executed — proof locked in audit log",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            // Action buttons
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(onClick = onProposeDemoTool) {
                    Text("Propose Tool")
                }

                val callId = auth.call?.id
                if (callId != null) {
                    Button(onClick = { onApprove(callId) }) {
                        Text("Approve")
                    }
                    Button(onClick = { onDeny(callId) }) {
                        Text("Deny")
                    }
                    Button(onClick = { onRetry(callId) }) {
                        Text("Retry")
                    }
                }
            }
        }
    }
}

@Composable
fun StatusHeader(uiState: AgentUiState, onNavigateToAudit: () -> Unit = {}) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
        ) {
            Text(
                text = "Agent Lee",
                style = MaterialTheme.typography.headlineSmall
            )
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
            ) {
                Text(
                    text = uiState.status.name,
                    style = MaterialTheme.typography.labelSmall,
                    color = when (uiState.status) {
                        AgentStatus.IDLE -> MaterialTheme.colorScheme.primary
                        AgentStatus.THINKING -> MaterialTheme.colorScheme.secondary
                        AgentStatus.SPEAKING -> MaterialTheme.colorScheme.tertiary
                        else -> MaterialTheme.colorScheme.onSurface
                    }
                )
                androidx.compose.material3.TextButton(onClick = onNavigateToAudit) {
                    Text("Audit Log", style = MaterialTheme.typography.labelSmall)
                }
            }
        }
    }
}

@Composable
fun ChatArea(uiState: AgentUiState) {
    LazyColumn(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp)
    ) {
        items(uiState.messages.size) { index ->
            val message = uiState.messages[index]
            ChatMessage(message.role, message.content)
        }
        
        // Show streaming message if any
        if (uiState.currentStreamingMessage.isNotEmpty()) {
            item {
                ChatMessage("assistant", uiState.currentStreamingMessage, isStreaming = true)
            }
        }
    }
}

@Composable
fun ChatMessage(role: String, content: String, isStreaming: Boolean = false) {
    val isUser = role == "user"
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(4.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isUser) {
                MaterialTheme.colorScheme.primary
            } else {
                MaterialTheme.colorScheme.secondaryContainer
            }
        )
    ) {
        Text(
            text = content,
            modifier = Modifier.padding(12.dp),
            color = if (isUser) {
                MaterialTheme.colorScheme.onPrimary
            } else {
                MaterialTheme.colorScheme.onSecondaryContainer
            }
        )
    }
}

@Composable
fun InputArea(onSendMessage: (String) -> Unit) {
    var inputText by remember { mutableStateOf("") }
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp)
    ) {
        OutlinedTextField(
            value = inputText,
            onValueChange = { inputText = it },
            modifier = Modifier
                .fillMaxWidth(0.8f)
                .height(56.dp),
            placeholder = { Text("Ask me anything...") },
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
            keyboardActions = KeyboardActions(onSend = {
                if (inputText.isNotBlank()) {
                    onSendMessage(inputText)
                    inputText = ""
                }
            }),
            singleLine = true
        )
        
        Button(
            onClick = {
                if (inputText.isNotBlank()) {
                    onSendMessage(inputText)
                    inputText = ""
                }
            },
            modifier = Modifier
                .padding(start = 8.dp)
                .height(56.dp)
        ) {
            Text("Send")
        }
    }
}
