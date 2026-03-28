/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CONVERSATIONHISTORY.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ConversationHistory module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\domain\value-objects\ConversationHistory.ts
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
 * ConversationHistory value object
 *
 * Immutable conversation history that tracks messages exchanged between
 * user and assistant. Provides methods for appending, truncating, and
 * token count estimation.
 *
 * @example
 * ```typescript
 * let history = ConversationHistory.empty();
 * history = history.append({ role: 'user', content: 'Hello' });
 * history = history.append({ role: 'assistant', content: 'Hi there!' });
 *
 * console.log(history.toMessages()); // [userMsg, assistantMsg]
 * console.log(history.getTokenCount()); // ~8
 * ```
 */

import { Message } from "../interfaces/IAgentTypes.js";

/**
 * Token count estimation heuristic
 * Rough approximation: ~4 characters per token
 */
const CHARS_PER_TOKEN = 4;

export class ConversationHistory {
  private constructor(private readonly messages: ReadonlyArray<Message>) {}

  /**
   * Create an empty conversation history
   *
   * @returns Empty ConversationHistory
   */
  static empty(): ConversationHistory {
    return new ConversationHistory([]);
  }

  /**
   * Create history from existing messages
   *
   * @param messages - Array of messages
   * @returns ConversationHistory with the provided messages
   */
  static from(messages: Message[]): ConversationHistory {
    return new ConversationHistory([...messages]);
  }

  /**
   * Append a message to the history (immutable)
   *
   * Returns a new ConversationHistory with the message added.
   * Does not modify the original.
   *
   * @param message - Message to append
   * @returns New ConversationHistory with message added
   */
  append(message: Message): ConversationHistory {
    return new ConversationHistory([...this.messages, message]);
  }

  /**
   * Truncate history to keep only the last N messages
   *
   * Useful for context window management - keeps recent messages
   * and discards older ones.
   *
   * @param maxMessages - Maximum number of messages to keep
   * @returns New ConversationHistory with truncated messages
   */
  truncate(maxMessages: number): ConversationHistory {
    if (maxMessages <= 0) {
      return ConversationHistory.empty();
    }

    if (maxMessages >= this.messages.length) {
      return this; // No truncation needed
    }

    const truncated = this.messages.slice(-maxMessages);
    return new ConversationHistory(truncated);
  }

  /**
   * Get all messages as an array
   *
   * @returns Array of messages (defensive copy)
   */
  toMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Estimate token count for all messages
   *
   * Uses a simple heuristic: ~4 characters per token.
   * This is a rough approximation - actual tokenization depends on the model.
   *
   * @returns Estimated token count
   */
  getTokenCount(): number {
    const totalChars = this.messages.reduce(
      (sum, msg) => sum + (msg.content?.length || 0),
      0,
    );
    return Math.ceil(totalChars / CHARS_PER_TOKEN);
  }

  /**
   * Get the number of messages in the history
   *
   * @returns Message count
   */
  get length(): number {
    return this.messages.length;
  }

  /**
   * Check if history is empty
   *
   * @returns true if no messages
   */
  isEmpty(): boolean {
    return this.messages.length === 0;
  }
}
