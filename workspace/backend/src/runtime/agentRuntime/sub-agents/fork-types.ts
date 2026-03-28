/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.FORK_TYPES.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = fork-types module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\sub-agents\fork-types.ts
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
 * Types for fork capability (context cloning)
 */

/**
 * Context mode for forking
 * - exact: byte-identical copy of conversation history (KV cache hit)
 * - summary: compacted approximation of context
 */
export type ContextMode = 'exact' | 'summary';

/**
 * Options for forking a session
 */
export interface ForkOptions {
  /**
   * Task description for the forked agent
   */
  task: string;

  /**
   * Parent session ID to clone context from
   */
  parentSessionId: string;

  /**
   * Context mode: 'exact' or 'summary'
   */
  contextMode: ContextMode;

  /**
   * SDK session ID to clone from (required for exact mode)
   */
  sourceSessionId?: string;

  /**
   * Number of recent messages to clone when using 'recent' strategy
   * Default: 10
   */
  recentCount?: number;

  /**
   * Whether to auto-integrate the result back into the parent session
   * Default: true
   */
  autoIntegrate?: boolean;

  /**
   * Optional model to use (auto-selected if not provided)
   */
  model?: string;

  /**
   * Keep the forked agent alive after completion (default: false)
   */
  keepAlive?: boolean;

  /**
   * Timeout in seconds (default: 1800)
   */
  timeout?: number;
}

/**
 * Result of forking a session
 */
export interface ForkResult {
  /**
   * ID of the forked agent
   */
  forkId: string;

  /**
   * Response from the forked agent (undefined in non-blocking mode)
   */
  response?: string;

  /**
   * Number of messages cloned from parent context
   */
  contextUsed: number;

  /**
   * Whether the fork spawn succeeded
   */
  success: boolean;

  /**
   * Duration in milliseconds (spawn time, not completion time)
   */
  durationMs?: number;

  /**
   * Context mode used (exact or summary)
   */
  contextMode?: ContextMode;

  /**
   * Model used by the forked agent
   */
  model?: string;
}

/**
 * Represents a transcript entry in a session
 * This now uses TranscriptEntry from SessionTranscript instead of SessionMessage
 */
export interface SessionMessage {
  /**
   * Role of the message sender
   */
  role: 'user' | 'assistant' | 'system';

  /**
   * Content of the message
   */
  content: string;

  /**
   * Timestamp when the message was created
   */
  timestamp?: Date;
}
