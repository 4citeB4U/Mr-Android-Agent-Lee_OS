/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: MCP.TRANSPORT.MCPERROR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = MCPError module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\mcp\domain\errors\MCPError.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { DomainError } from '../../../core/errors/DomainError.js';

/**
 * MCP Connection Error
 * 
 * Thrown when connection to an MCP server fails.
 * Includes stdio transport errors and HTTP connection failures.
 * 
 * @example
 * ```typescript
 * throw new MCPConnectionError(
 *   'Failed to spawn MCP server process',
 *   { command: 'node', args: ['server.js'] }
 * );
 * ```
 */
export class MCPConnectionError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('MCP_CONNECTION_FAILED', message, context);
  }
}

/**
 * MCP Server Not Found Error
 * 
 * Thrown when attempting to access a server that doesn't exist
 * in the configuration or hasn't been initialized.
 * 
 * @example
 * ```typescript
 * throw new MCPServerNotFoundError('filesystem-server');
 * ```
 */
export class MCPServerNotFoundError extends DomainError {
  constructor(serverId: string, context?: Record<string, unknown>) {
    super('MCP_SERVER_NOT_FOUND', `MCP server not found: ${serverId}`, context);
  }
}

/**
 * MCP Tool Error
 * 
 * Thrown when tool execution fails on the MCP server.
 * Includes validation errors, runtime errors, and server-side errors.
 * 
 * @example
 * ```typescript
 * throw new MCPToolError(
 *   'Tool execution failed: Invalid parameters',
 *   { toolName: 'read_file', error: 'File not found' }
 * );
 * ```
 */
export class MCPToolError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('MCP_TOOL_ERROR', message, context);
  }
}

/**
 * MCP Disconnect Error
 * 
 * Thrown when disconnection from an MCP server fails.
 * Includes cleanup errors and process termination failures.
 * 
 * @example
 * ```typescript
 * throw new MCPDisconnectError(
 *   'Failed to terminate MCP server process',
 *   { serverId: 'filesystem', signal: 'SIGTERM' }
 * );
 * ```
 */
export class MCPDisconnectError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('MCP_DISCONNECT_FAILED', message, context);
  }
}

/**
 * MCP Discovery Error
 * 
 * Thrown when tool discovery fails on an MCP server.
 * Includes communication errors and protocol violations.
 * 
 * @example
 * ```typescript
 * throw new MCPDiscoveryError(
 *   'Failed to list tools: Protocol error',
 *   { serverId: 'filesystem', error: 'Invalid response' }
 * );
 * ```
 */
export class MCPDiscoveryError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('MCP_DISCOVERY_FAILED', message, context);
  }
}
