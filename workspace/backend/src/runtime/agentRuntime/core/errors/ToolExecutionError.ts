/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.TOOLEXECUTIONERROR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ToolExecutionError module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\ToolExecutionError.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { DomainError } from './DomainError.js';

/**
 * Error thrown when tool execution fails
 * 
 * Captures:
 * - Tool name
 * - Tool parameters
 * - Execution error details
 * 
 * @example
 * ```typescript
 * throw new ToolExecutionError(
 *   'read_file',
 *   { path: '/missing/file.txt' },
 *   'File not found'
 * );
 * ```
 */
export class ToolExecutionError extends DomainError {
  constructor(
    toolName: string,
    parameters: Record<string, unknown>,
    reason: string,
    innerError?: Error
  ) {
    super('TOOL_EXECUTION_ERROR', `Tool '${toolName}' failed: ${reason}`, {
      toolName,
      parameters,
      innerError: innerError?.message,
    });
  }
}

/**
 * Error thrown when tool parameters are invalid
 */
export class ToolParameterError extends DomainError {
  constructor(toolName: string, parameterName: string, reason: string) {
    super(
      'TOOL_PARAMETER_ERROR',
      `Invalid parameter '${parameterName}' for tool '${toolName}': ${reason}`,
      {
        toolName,
        parameterName,
      }
    );
  }
}

/**
 * Error thrown when tool is not found
 */
export class ToolNotFoundError extends DomainError {
  constructor(toolName: string) {
    super('TOOL_NOT_FOUND', `Tool '${toolName}' not found in registry`, {
      toolName,
    });
  }
}
