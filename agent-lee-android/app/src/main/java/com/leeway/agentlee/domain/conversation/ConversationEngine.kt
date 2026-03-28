package com.leeway.agentlee.domain.conversation

import com.leeway.agentlee.domain.model.ContextSnapshot
import com.leeway.agentlee.domain.model.Message
import com.leeway.agentlee.domain.model.TokenDelta
import com.leeway.agentlee.domain.model.ToolDescriptor
import kotlinx.coroutines.flow.Flow

/**
 * Conversation engine interface.
 * Streams tokens from LLM backend (will be real llama.cpp in Slice 7).
 */
interface IConversationEngine {
    suspend fun streamChat(
        messages: List<Message>,
        toolDescriptors: List<ToolDescriptor>,
        context: ContextSnapshot
    ): Flow<TokenDelta>
    
    suspend fun cancel()
    fun getSystemPrompt(): String
}

/**
 * Fake LLM for Slice 1 (MVP).
 * Generates deterministic responses with token streaming.
 * Will be replaced by LlamaEngine in Slice 7.
 */
class FakeLlmEngine : IConversationEngine {
    private var isCanceled = false
    
    private val responses = mapOf(
        "hello" to "Hello! I'm Agent Lee, your local AI assistant. How can I help you today?",
        "what" to "That's a great question! Let me think about that for a moment and provide you with a helpful response.",
        "time" to "I don't have access to real-time clock data in this context, but you can check your device's system time.",
        "default" to "I understand your question. Let me consider that and provide a thoughtful response based on what you've asked."
    )
    
    override suspend fun streamChat(
        messages: List<Message>,
        toolDescriptors: List<ToolDescriptor>,
        context: ContextSnapshot
    ): Flow<TokenDelta> {
        return kotlinx.coroutines.flow.flow {
            isCanceled = false
            
            // Get user's last message
            val lastMessage = messages.lastOrNull()?.content?.lowercase() ?: ""
            
            // Select response based on keyword matching
            val responseText = responses.entries.firstOrNull { lastMessage.contains(it.key) }?.value
                ?: responses["default"]!!
            
            // Stream tokens with small delays to simulate LLM latency
            val tokens = responseText.split(Regex("\\s+"))
            for (token in tokens) {
                if (isCanceled) break
                
                // Emit word + space
                emit(TokenDelta(token, System.currentTimeMillis()))
                emit(TokenDelta(" ", System.currentTimeMillis()))
                
                // Simulate token generation time
                kotlinx.coroutines.delay(50)
            }
        }
    }
    
    override suspend fun cancel() {
        isCanceled = true
    }
    
    override fun getSystemPrompt(): String {
        return """
            You are Agent Lee, a local-first AI assistant running on Android.
            You are helpful, respectful, and always transparent about your limitations.
            You run entirely offline and value the user's privacy.
            Keep responses concise unless asked for more detail.
        """.trimIndent()
    }
}
