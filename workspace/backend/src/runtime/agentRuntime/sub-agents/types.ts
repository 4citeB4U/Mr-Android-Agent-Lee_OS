/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENTRUNTIME_SUB_AGENTS_TYPES_TS.MAIN_AGENTS_TYPES.MAIN

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
WHERE = backend\src\runtime\agentRuntime\sub-agents\types.ts
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
 * Types for sub-agent management
 */

/**
 * Options for spawning a sub-agent
 */
export interface SpawnOptions {
  /**
   * Task description for the sub-agent
   */
  task: string;

  /**
   * Optional model to use (auto-selected if not provided)
   */
  model?: string;

  /**
   * Optional agent ID (generated if not provided)
   */
  agentId?: string;

  /**
   * Optional label for identifying the session
   */
  label?: string;

  /**
   * Keep the agent alive after completion (default: false)
   */
  keepAlive?: boolean;

  /**
   * Timeout in seconds (default: 1800)
   */
  timeout?: number;

  /**
   * Clone context from an existing SDK session instead of starting fresh.
   * The cloned session has byte-identical conversation history, enabling
   * LLM provider KV cache hits for the shared prefix.
   */
  cloneFromSessionId?: string;
}

/**
 * Information about an active sub-agent
 */
export interface AgentInfo {
  /**
   * Unique agent ID
   */
  agentId: string;

  /**
   * Model being used by this agent
   */
  model: string;

  /**
   * Timestamp when the agent was spawned
   */
  spawned: Date;

  /**
   * Current status of the agent
   */
  status: "running" | "completed" | "failed" | "not_found";

  /**
   * Task description
   */
  task: string;

  /**
   * Session ID in the Copilot SDK
   */
  sessionId?: string;

  /**
   * Response from the sub-agent (populated when completed)
   */
  response?: string;

  /**
   * Duration in milliseconds (populated when completed)
   */
  durationMs?: number;

  /**
   * Error message (populated when failed)
   */
  error?: string;

  /**
   * Parent session ID (if spawned from another agent)
   */
  parentSessionId?: string;

  /**
   * Wall-clock timeout handle (internal use only — cleared on completion/failure)
   * @internal
   */
  _timeoutHandle?: ReturnType<typeof setTimeout>;
}

/**
 * Result of spawning a sub-agent (non-blocking)
 */
export interface SpawnResult {
  /**
   * Agent ID
   */
  agentId: string;

  /**
   * Session ID created for this agent
   */
  sessionId: string;

  /**
   * Current status
   */
  status: "running" | "completed" | "failed";

  /**
   * Model selected for this agent
   */
  model: string;

  /**
   * Task description
   */
  task: string;

  /**
   * Response from the sub-agent (populated when completed)
   */
  response?: string;

  /**
   * Whether the spawn/execution succeeded
   */
  success?: boolean;

  /**
   * Duration in milliseconds
   */
  durationMs?: number;

  /**
   * Fork ID alias (same as agentId, set when used via ForkableSession)
   */
  forkId?: string;

  /**
   * Context summary used during fork (set when contextMode='summary')
   */
  contextUsed?: string;
}
