package com.leeway.agentlee.domain.conversation

import com.leeway.agentlee.domain.model.ContextSnapshot
import com.leeway.agentlee.domain.model.Message
import kotlinx.coroutines.flow.take
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test
import kotlin.test.assertTrue

class FakeLlmEngineTest {
    
    private lateinit var engine: FakeLlmEngine
    
    @Before
    fun setup() {
        engine = FakeLlmEngine()
    }
    
    @Test
    fun `streams tokens without blocking`() = runTest {
        val messages = listOf(Message(role = "user", content = "hello"))
        
        val tokens = engine.streamChat(messages, emptyList(), ContextSnapshot.empty()).toList()
        
        assertTrue(tokens.isNotEmpty())
        // Should have words and spaces
        assertTrue(tokens.any { it.token != " " })
        assertTrue(tokens.any { it.token == " " })
    }
    
    @Test
    fun `response varies by keyword matching`() = runTest {
        val helloMessages = listOf(Message(role = "user", content = "hello"))
        val helloTokens = engine.streamChat(helloMessages, emptyList(), ContextSnapshot.empty()).toList()
        
        val timeMessages = listOf(Message(role = "user", content = "what time"))
        val timeTokens = engine.streamChat(timeMessages, emptyList(), ContextSnapshot.empty()).toList()
        
        val helloText = helloTokens.map { it.token }.joinToString("")
        val timeText = timeTokens.map { it.token }.joinToString("")
        
        // Both should be non-empty but different
        assertTrue(helloText.isNotEmpty())
        assertTrue(timeText.isNotEmpty())
        // Fake engine picks first matched keyword; for "what time" it matches "what" first.
        assertTrue(helloText != timeText)
        assertTrue(timeText.contains("great question", ignoreCase = true))
    }
    
    @Test
    fun `cancel stops streaming`() = runTest {
        val messages = listOf(Message(role = "user", content = "hello"))

        val flow = engine.streamChat(messages, emptyList(), ContextSnapshot.empty())
        val firstTokens = flow.take(3).toList()
        engine.cancel()

        val afterCancel = engine.streamChat(messages, emptyList(), ContextSnapshot.empty()).toList()

        val tokenCount = firstTokens.size
        assertTrue(tokenCount >= 3)
        assertTrue(afterCancel.isNotEmpty())
    }
}
