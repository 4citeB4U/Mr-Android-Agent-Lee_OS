/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENT_CONTEXT_MEMORYEXTRACTOR_TS.MAIN_MEMORYEXTRACTOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = MemoryExtractor module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\context\MemoryExtractor.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

/**
 * Memory extractor for context management
 *
 * Extracts important memories from conversation history using AI analysis.
 * Integrates with ModelSelector (PBI-2.1) for optimal model selection.
 */

import { aiService } from "../../../../services/ai.js";
import { IEventBus } from "../../core/interfaces/IEventBus.js";
import { ITracer } from "../../core/interfaces/ITracer.js";
import { ModelSelector } from "../model-selection/ModelSelector.js";
import { MemoryExtractedEvent } from "./events.js";
import { ExtractedMemory, Message } from "./types.js";

/**
 * Prompt for memory extraction
 */
const EXTRACTION_PROMPT = `Analyze the following conversation and extract key information in the following categories:

1. **Facts**: Concrete information, preferences, or attributes
2. **Decisions**: Choices that were made or confirmed
3. **Preferences**: User likes, dislikes, or preferred approaches
4. **TODOs**: Tasks, action items, or future work mentioned
5. **Learnings**: Insights, patterns, or lessons from the conversation

For each memory, provide:
- The content (clear, concise description)
- The type (fact/decision/preference/todo/learning)
- Confidence level (high/medium/low)

Format your response as a list of memories, one per line:
[TYPE:CONFIDENCE] Content

Example:
[fact:high] User prefers TypeScript over JavaScript
[decision:high] Decided to implement ModelSelector first
[todo:medium] Review Phase 0 event bus documentation
[preference:high] Prefers async/await over callbacks

Only extract memories that are significant and worth remembering. Skip casual conversation and temporary context.`;

/**
 * MemoryExtractor class
 *
 * Extracts structured memories from conversation history using AI.
 *
 * @example
 * ```typescript
 * const extractor = new MemoryExtractor(modelSelector, client, tracer, eventBus);
 *
 * const memories = await extractor.extractFromHistory(messages, 'session-123');
 * console.log(`Extracted ${memories.length} memories`);
 * ```
 */
export class MemoryExtractor {
  constructor(
    private readonly modelSelector: ModelSelector,
    private readonly tracer: ITracer,
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * Extract memories from conversation history
   *
   * @param messages - Array of messages from the conversation
   * @param sessionId - Optional session ID for event tracking
   * @returns Array of extracted memories
   */
  async extractFromHistory(
    messages: Message[],
    sessionId?: string,
  ): Promise<ExtractedMemory[]> {
    return this.tracer.span("memory.extraction", async (span) => {
      span.setAttribute("messageCount", messages.length);
      if (sessionId) {
        span.setAttribute("sessionId", sessionId);
      }

      try {
        // Handle empty history
        if (messages.length === 0) {
          span.setAttribute("extractedCount", 0);
          span.setAttribute("skipped", "empty-history");
          span.setStatus("ok");
          return [];
        }

        // Use AI to analyze and extract memories
        const aiResponse = await this.analyzeWithAI(messages);

        // Parse the AI response into structured memories
        const memories = this.parseMemories(aiResponse);

        // Add span attributes for metrics
        span.setAttribute("extractedCount", memories.length);
        const typeCounts = this.countByType(memories);
        Object.entries(typeCounts).forEach(([type, count]) => {
          span.setAttribute(`type.${type}`, count);
        });

        // Publish event
        if (sessionId) {
          await this.eventBus.publish(
            new MemoryExtractedEvent(sessionId, memories, messages.length),
          );
        }

        span.setStatus("ok");
        return memories;
      } catch (error) {
        span.setStatus(
          "error",
          error instanceof Error ? error.message : String(error),
        );
        span.setAttribute("extractedCount", 0);
        // Return empty array on error rather than throwing
        // This ensures the system degrades gracefully
        return [];
      }
    });
  }

  /**
   * Analyze conversation with AI to extract memories
   *
   * @param messages - Conversation messages
   * @returns AI response text with extracted memories
   */
  private async analyzeWithAI(messages: Message[]): Promise<string> {
    return this.tracer.childSpan(
      "memory.extraction.ai-analysis",
      async (span) => {
        // Format conversation for analysis
        const conversationText = this.formatConversation(messages);
        span.setAttribute("conversationLength", conversationText.length);

        // Call aiService directly — system prompt prepended to user content
        const fullPrompt = `${EXTRACTION_PROMPT}\n\n---CONVERSATION---\n${conversationText}`;
        const response = await aiService.process(fullPrompt);

        span.setAttribute("responseLength", response.length);
        span.setStatus("ok");

        return response;
      },
    );
  }

  /**
   * Format conversation messages into a readable text block
   *
   * @param messages - Messages to format
   * @returns Formatted conversation text
   */
  private formatConversation(messages: Message[]): string {
    const lines: string[] = [];

    for (const message of messages) {
      const role = message.role.toUpperCase();
      const timestamp = message.timestamp
        ? `[${message.timestamp.toISOString()}] `
        : "";
      lines.push(`${timestamp}${role}: ${message.content}`);
    }

    return lines.join("\n\n");
  }

  /**
   * Parse AI response into structured memories
   *
   * Expected format: [type:confidence] content
   * Example: [fact:high] User prefers TypeScript
   *
   * @param aiResponse - Raw AI response text
   * @returns Array of structured memories
   */
  private parseMemories(aiResponse: string): ExtractedMemory[] {
    const memories: ExtractedMemory[] = [];
    const lines = aiResponse.split("\n");

    const memoryPattern = /^\[(\w+):(\w+)\]\s*(.+)$/;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue; // Skip empty lines and headers
      }

      const match = trimmed.match(memoryPattern);
      if (!match) {
        continue; // Skip lines that don't match the pattern
      }

      const [, type, confidence, content] = match;

      // Validate type
      const validTypes = ["fact", "decision", "preference", "todo", "learning"];
      if (!validTypes.includes(type.toLowerCase())) {
        continue;
      }

      // Validate confidence
      const confidenceMap: Record<string, number> = {
        high: 0.9,
        medium: 0.6,
        low: 0.3,
      };
      const normalizedConfidence = confidence.toLowerCase();
      const confidenceScore = confidenceMap[normalizedConfidence];
      if (confidenceScore === undefined) {
        continue;
      }

      memories.push({
        content: content.trim(),
        type: type.toLowerCase() as ExtractedMemory["type"],
        confidence: confidenceScore,
        timestamp: new Date(),
      });
    }

    return memories;
  }

  /**
   * Count memories by type for metrics
   *
   * @param memories - Memories to count
   * @returns Count by type
   */
  private countByType(memories: ExtractedMemory[]): Record<string, number> {
    const counts: Record<string, number> = {
      fact: 0,
      decision: 0,
      preference: 0,
      todo: 0,
      learning: 0,
    };

    for (const memory of memories) {
      counts[memory.type]++;
    }

    return counts;
  }
}
