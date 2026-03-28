package com.leeway.agentlee.domain.model

import java.util.UUID

// ==================== IDs ====================

@JvmInline
value class JobId(val value: String) {
    companion object {
        fun random() = JobId(UUID.randomUUID().toString())
    }
}

@JvmInline
value class TaskId(val value: String) {
    companion object {
        fun random() = TaskId(UUID.randomUUID().toString())
    }
}

@JvmInline
value class SpeechJobId(val value: String) {
    companion object {
        fun random() = SpeechJobId(UUID.randomUUID().toString())
    }
}

// ==================== Agent State ====================

enum class AgentStatus {
    INITIALIZING, IDLE, LISTENING, THINKING, SPEAKING, WORKING, ERROR, SHUTDOWN
}

data class AgentState(
    val status: AgentStatus = AgentStatus.INITIALIZING,
    val currentConversation: ConversationState = ConversationState.empty(),
    val activeTasks: Map<TaskId, TaskProgress> = emptyMap(),
    val emotion: EmotionState = EmotionState.neutral(),
    val isServiceRunning: Boolean = false,
    val permissionsMap: Map<String, Boolean> = emptyMap(),
    val audioCapture: Boolean = false
)

// ==================== Conversation ====================

data class Message(
    val role: String,  // "user", "assistant", "system"
    val content: String,
    val timestamp: Long = System.currentTimeMillis()
)

data class ConversationState(
    val messages: List<Message> = emptyList(),
    val isStreaming: Boolean = false,
    val currentStreamingMessage: String = ""
) {
    companion object {
        fun empty() = ConversationState()
    }
}

data class TokenDelta(
    val token: String,
    val timestamp: Long = System.currentTimeMillis(),
    val confidence: Float = 1.0f
)

data class ContextSnapshot(
    val recentMessages: List<Message> = emptyList(),
    val memorySummaries: List<String> = emptyList(),
    val systemPrompt: String = ""
) {
    companion object {
        fun empty() = ContextSnapshot()
    }
}

// ==================== Voice ====================

data class TranscriptDelta(
    val text: String,
    val isFinal: Boolean,
    val confidence: Float = 1.0f
)

// ==================== Tasks ====================

data class TaskProgress(
    val percent: Float = 0.0f,
    val message: String = "",
    val startedAt: Long = System.currentTimeMillis()
)

enum class JobPriority {
    LOW, NORMAL, HIGH
}

// ==================== Emotion ====================

data class EmotionState(
    val label: String = "neutral",
    val valence: Float = 0.0f,  // -1.0 (negative) to 1.0 (positive)
    val arousal: Float = 0.5f,  // 0.0 (calm) to 1.0 (excited)
    val intensity: Float = 0.5f,  // 0.0 to 1.0
    val visualColor: Int = 0xFF808080.toInt(),  // ARGB grey
    val aniHash: String = "neutral"
) {
    companion object {
        fun neutral() = EmotionState(
            label = "neutral",
            valence = 0.0f,
            arousal = 0.5f,
            intensity = 0.5f,
            visualColor = 0xFF808080.toInt(),
            aniHash = "neutral"
        )
    }
}

// ==================== User Input ====================

sealed class UserInput {
    data class Text(val content: String) : UserInput()
    data class Speech(val transcript: String, val confidence: Float = 1.0f) : UserInput()
}

// ==================== Inline JSON Type ====================

typealias JsonObject = com.google.gson.JsonObject
typealias JsonSchema = com.google.gson.JsonObject
