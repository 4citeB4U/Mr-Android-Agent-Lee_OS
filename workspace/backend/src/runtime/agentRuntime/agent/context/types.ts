/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENT_CONTEXT_TYPES_TS.MAIN_TYPES.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = types module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\context\types.ts
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
 * Types for context management system
 */

/**
 * Configuration for creating a smart compaction session
 */
export interface SessionConfig {
  /**
   * Model to use for the session
   */
  model: string;

  /**
   * System prompt to guide the model
   */
  systemPrompt?: string;

  /**
   * Temperature for response generation (0.0 - 1.0)
   */
  temperature?: number;

  /**
   * Maximum tokens in response
   */
  maxTokens?: number;

  /**
   * Enable infinite sessions (context auto-compaction)
   */
  infiniteSessions?: {
    enabled?: boolean;
    backgroundCompactionThreshold?: number;
    bufferExhaustionThreshold?: number;
  };

  /**
   * Working directory for the session
   */
  workingDirectory?: string;

  /**
   * Skill directories to load
   */
  skillDirectories?: string[];

  /**
   * MCP server configurations
   */
  mcpServers?: Record<string, unknown>;

  /**
   * Tool names to exclude
   */
  excludedTools?: string[];

  /**
   * Session ID for tracking
   */
  sessionId?: string;
}

/**
 * Session event from Copilot SDK
 * These events are emitted by the SDK during session lifecycle
 */
export interface SessionEvent {
  /**
   * Event type
   */
  type: 'compaction-started' | 'compaction-complete' | 'session-created' | 'session-closed';

  /**
   * Session ID
   */
  sessionId: string;

  /**
   * Event timestamp
   */
  timestamp: Date;

  /**
   * Additional event data
   */
  data?: Record<string, unknown>;
}

/**
 * Context event names
 */
export enum ContextEvents {
  COMPACTION_STARTED = 'context.compaction.started',
  COMPACTION_COMPLETE = 'context.compaction.complete',
  COMPACTION_TRIGGERED = 'context.compaction.triggered',
  MEMORY_EXTRACTED = 'context.memory.extracted',
  MEMORY_WRITTEN = 'context.memory.written',
  SESSION_CREATED = 'context.session.created',
}

/**
 * Message in conversation history
 */
export interface Message {
  /**
   * Message role
   */
  role: 'user' | 'assistant' | 'system';

  /**
   * Message content
   */
  content: string;

  /**
   * Message timestamp
   */
  timestamp?: Date;
}

/**
 * Extracted memory from conversation
 */
export interface ExtractedMemory {
  /**
   * Memory content
   */
  content: string;

  /**
   * Type of memory
   */
  type: 'fact' | 'decision' | 'preference' | 'todo' | 'learning';

  /**
   * When the memory was extracted
   */
  timestamp: Date;

  /**
   * Confidence level
   */
  confidence: number;
}

/**
 * Result of compaction process
 */
export interface CompactionResult {
  /**
   * Whether compaction succeeded
   */
  success: boolean;

  /**
   * New session ID created for the compacted context
   */
  newSessionId: string;

  /**
   * Number of messages before compaction
   */
  messagesBefore: number;

  /**
   * Number of messages after compaction
   */
  messagesAfter: number;

  /**
   * Summary generated for the compacted session
   */
  summary: string;
}
