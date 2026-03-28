/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENT_DOMAIN_INTERFACES_ITOOLEXECUTOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IToolExecutor module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\domain\interfaces\IToolExecutor.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { Result } from '../../../core/types/Result.js';
import { DomainError } from '../../../core/errors/DomainError.js';

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
  /** Tool name */
  toolName: string;
  
  /** Tool arguments */
  args: Record<string, unknown>;
  
  /** Tool source (plugin or mcp) */
  source: 'plugin' | 'mcp';
  
  /** Plugin/server ID */
  pluginId: string;
  
  /** Execution timestamp */
  timestamp: Date;
  
  /** User/session context */
  sessionId?: string;
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  /** Execution success */
  success: boolean;
  
  /** Tool output */
  output: unknown;
  
  /** Execution duration (ms) */
  durationMs: number;
  
  /** Error if failed */
  error?: string;
}

/**
 * Tool executor
 * 
 * Routes tool execution to appropriate handler (plugin vs MCP)
 * with proper tracing and error handling.
 */
export interface IToolExecutor {
  /**
   * Execute a tool by name
   * 
   * @param toolName - Tool name
   * @param args - Tool arguments
   * @returns Tool execution result
   */
  execute(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<Result<ToolExecutionResult, DomainError>>;
  
  /**
   * Check if tool exists
   * 
   * @param toolName - Tool name
   */
  hasTool(toolName: string): Promise<boolean>;
  
  /**
   * Get available tools
   * 
   * @returns List of tool names
   */
  getAvailableTools(): Promise<string[]>;
}
