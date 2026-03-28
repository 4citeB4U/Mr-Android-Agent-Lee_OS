/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CONVERSATIONMESSAGE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ConversationMessage module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\conversation\ConversationMessage.ts
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
 * ConversationMessage - Types for conversation indexing
 * 
 * Pure types, no I/O.
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  /** Unique message ID */
  id: string;
  /** Session this message belongs to */
  sessionId: string;
  /** Message role */
  role: MessageRole;
  /** Message text content */
  content: string;
  /** Approximate token count */
  tokenCount: number;
  /** Model used (for assistant messages) */
  model?: string;
  /** Whether message contains tool calls */
  hasToolCalls: boolean;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** When the message was created */
  createdAt: Date;
}

export interface BufferConfig {
  /** Max messages before auto-flush (default: 10) */
  maxMessages: number;
  /** Max time between flushes in ms (default: 300000 = 5 min) */
  flushIntervalMs: number;
}

export const DEFAULT_BUFFER_CONFIG: BufferConfig = {
  maxMessages: 10,
  flushIntervalMs: 300000,
};
