/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: MCP.TRANSPORT.IMCPSERVERCONNECTION.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IMCPServerConnection module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\mcp\domain\IMCPServerConnection.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { Result } from '../../core/types/Result.js';
import { DomainError } from '../../core/errors/DomainError.js';
import { MCPTool } from './MCPTool.js';

/**
 * Connection status for MCP servers
 */
export enum ConnectionStatus {
  /** Not connected */
  Disconnected = 'disconnected',
  
  /** Establishing initial connection */
  Connecting = 'connecting',
  
  /** Successfully connected and ready */
  Connected = 'connected',
  
  /** Attempting to reconnect after disconnection */
  Reconnecting = 'reconnecting',
  
  /** Connection failed (after retries exhausted) */
  Failed = 'failed'
}

/**
 * MCP Server Connection Interface
 * 
 * Manages connection to a single MCP server and tool invocation.
 * Supports both stdio (subprocess) and HTTP transports.
 * 
 * @example
 * ```typescript
 * const connection = new MCPServerConnection(server, ...);
 * 
 * await connection.connect();
 * const tools = await connection.listTools();
 * const result = await connection.callTool('weatherTool', { city: 'NYC' });
 * await connection.disconnect();
 * ```
 */
export interface IMCPServerConnection {
  /** Server identifier */
  readonly serverId: string;
  
  /** Current connection status */
  readonly status: ConnectionStatus;
  
  /**
   * Establish connection to the server
   * Starts subprocess (stdio) or validates HTTP endpoint
   */
  connect(): Promise<Result<void, DomainError>>;
  
  /**
   * Close connection to the server
   * Terminates subprocess (stdio) or cleans up HTTP client
   */
  disconnect(): Promise<Result<void, DomainError>>;
  
  /**
   * List all tools provided by this server
   * Must be connected before calling
   */
  listTools(): Promise<Result<MCPTool[], DomainError>>;
  
  /**
   * Invoke a tool on this server
   * 
   * @param name - Tool name (without namespace prefix)
   * @param args - Tool arguments matching the tool's schema
   */
  callTool(name: string, args: Record<string, unknown>): Promise<Result<unknown, DomainError>>;
  
  /**
   * Check if currently connected
   */
  isConnected(): boolean;
}
