/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENTSTATE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = AgentState module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\communication\domain\AgentState.ts
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
 * AgentState - Types for agent state introspection
 * 
 * Pure types, no I/O.
 */

export type AgentStatus =
  | 'spawning'
  | 'idle'
  | 'thinking'
  | 'tool-calling'
  | 'tool-waiting'
  | 'responding'
  | 'paused'
  | 'error'
  | 'completed';

export interface AgentMetrics {
  /** Total tokens used */
  tokensUsed: number;
  /** Token limit for session */
  tokenLimit: number;
  /** Total messages exchanged */
  messageCount: number;
  /** Total tool calls made */
  toolCallCount: number;
  /** Execution time in ms */
  executionTimeMs: number;
  /** Last activity timestamp */
  lastActivity: number;
  /** Estimated cost in USD */
  costEstimate: number;
}

export interface AgentState {
  /** Agent/session ID */
  agentId: string;
  /** Current status */
  status: AgentStatus;
  /** Human-readable current action */
  currentAction?: string;
  /** Current tool being executed */
  currentTool?: string;
  /** Progress estimate 0-1 */
  progress?: number;
  /** Performance metrics */
  metrics: AgentMetrics;
  /** Number of pending steering injections */
  pendingInjections: number;
  /** Health status */
  health: 'healthy' | 'degraded' | 'error';
  /** Recent errors */
  errors: string[];
  /** When this state was last updated */
  updatedAt: number;
}

export type StateChangeCallback = (agentId: string, state: AgentState) => void;

export const INITIAL_METRICS: AgentMetrics = {
  tokensUsed: 0,
  tokenLimit: 128000,
  messageCount: 0,
  toolCallCount: 0,
  executionTimeMs: 0,
  lastActivity: Date.now(),
  costEstimate: 0,
};
