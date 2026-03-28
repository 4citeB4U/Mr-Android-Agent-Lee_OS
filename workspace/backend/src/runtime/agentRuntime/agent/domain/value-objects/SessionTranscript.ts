/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SESSIONTRANSCRIPT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SessionTranscript module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\domain\value-objects\SessionTranscript.ts
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
 * SessionTranscript value object
 *
 * Immutable, append-only rich transcript that captures typed session events
 * beyond just user/assistant messages. Records tool calls, reasoning steps,
 * system events, and other session interactions for comprehensive session history.
 *
 * @example
 * ```typescript
 * let transcript = SessionTranscript.empty();
 * transcript = transcript.append({
 *   type: 'user_message',
 *   content: 'Hello',
 *   timestamp: new Date().toISOString()
 * });
 * transcript = transcript.append({
 *   type: 'assistant_message',
 *   content: 'Hi there!',
 *   timestamp: new Date().toISOString()
 * });
 *
 * console.log(transcript.toMessages()); // Convert back to Message[] format
 * console.log(transcript.forContext()); // Get entries for fork context
 * ```
 */

import { Message } from "../interfaces/IAgentTypes.js";

/**
 * Tool request information for assistant messages
 */
export interface ToolRequest {
  toolCallId: string;
  name: string;
  arguments?: unknown;
}

/**
 * Rich transcript entry types that capture various session events
 */
export type TranscriptEntry =
  | { type: "user_message"; content: string; timestamp: string }
  | {
      type: "assistant_message";
      content: string;
      toolCalls?: ToolRequest[];
      timestamp: string;
    }
  | { type: "assistant_reasoning"; content: string; timestamp: string }
  | {
      type: "tool_start";
      toolCallId: string;
      toolName: string;
      arguments?: unknown;
      timestamp: string;
    }
  | {
      type: "tool_complete";
      toolCallId: string;
      success: boolean;
      result?: string;
      timestamp: string;
    }
  | { type: "system_message"; content: string; timestamp: string };

export class SessionTranscript {
  private constructor(
    private readonly entries: ReadonlyArray<TranscriptEntry>,
  ) {}

  /**
   * Create an empty session transcript
   *
   * @returns Empty SessionTranscript
   */
  static empty(): SessionTranscript {
    return new SessionTranscript([]);
  }

  /**
   * Create transcript from existing entries
   *
   * @param entries - Array of transcript entries
   * @returns SessionTranscript with the provided entries
   */
  static from(entries: TranscriptEntry[]): SessionTranscript {
    return new SessionTranscript([...entries]);
  }

  /**
   * Append an entry to the transcript (immutable)
   *
   * Returns a new SessionTranscript with the entry added.
   * Does not modify the original.
   *
   * @param entry - Transcript entry to append
   * @returns New SessionTranscript with entry added
   */
  append(entry: TranscriptEntry): SessionTranscript {
    return new SessionTranscript([...this.entries, entry]);
  }

  /**
   * Get all entries as an array
   *
   * @returns Array of transcript entries (defensive copy)
   */
  getEntries(): TranscriptEntry[] {
    return [...this.entries];
  }

  /**
   * Get the number of entries in the transcript
   *
   * @returns Entry count
   */
  get length(): number {
    return this.entries.length;
  }

  /**
   * Check if transcript is empty
   *
   * @returns true if no entries
   */
  isEmpty(): boolean {
    return this.entries.length === 0;
  }

  /**
   * Convert transcript back to flat Message[] format for backward compatibility
   *
   * Conversion rules:
   * - user_message → user role
   * - assistant_message → assistant role
   * - tool results + system_message → system role
   * - assistant_reasoning → skip (not included in messages)
   * - tool_start → skip (tool calls without results)
   *
   * @returns Array of messages compatible with ICopilotClient
   */
  toMessages(): Message[] {
    const messages: Message[] = [];

    for (const entry of this.entries) {
      switch (entry.type) {
        case "user_message":
          messages.push({
            role: "user",
            content: entry.content,
          });
          break;

        case "assistant_message":
          messages.push({
            role: "assistant",
            content: entry.content,
          });
          break;

        case "system_message":
          messages.push({
            role: "system",
            content: entry.content,
          });
          break;

        case "tool_complete":
          // Only include successful tool completions as system messages
          if (entry.success && entry.result) {
            messages.push({
              role: "system",
              content: `Tool execution result: ${entry.result}`,
            });
          }
          break;

        // Skip reasoning and tool_start entries for message conversion
        case "assistant_reasoning":
        case "tool_start":
        default:
          break;
      }
    }

    return messages;
  }

  /**
   * Get entries relevant for fork context
   *
   * Returns entries that should be included when forking sessions:
   * - user_message: Essential for understanding user requests
   * - assistant_message: Essential for understanding assistant responses
   * - assistant_reasoning: Provides insight into thought process
   * - tool_start: Shows what tools were called (but not results)
   * - system_message: Important system-level context
   *
   * Excludes:
   * - tool_complete: Tool calls without results prevent confusion
   *
   * @returns Array of relevant transcript entries for context
   */
  forContext(): TranscriptEntry[] {
    return this.entries.filter(
      (entry) =>
        entry.type === "user_message" ||
        entry.type === "assistant_message" ||
        entry.type === "assistant_reasoning" ||
        entry.type === "tool_start" ||
        entry.type === "system_message",
    );
  }
}
