/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: MCP.TRANSPORT.IMCPMANAGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IMCPManager module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\mcp\domain\IMCPManager.ts
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
import { Option } from '../../core/types/Option.js';
import { DomainError } from '../../core/errors/DomainError.js';
import { IMCPServerConnection } from './IMCPServerConnection.js';
import { MCPTool } from './MCPTool.js';

/**
 * MCP Manager Interface
 * 
 * Orchestrates MCP server lifecycle and tool discovery.
 * Manages multiple server connections and aggregates their tools.
 * 
 * @example
 * ```typescript
 * const manager = Container.resolve<IMCPManager>(Tokens.IMCPManager);
 * 
 * await manager.initialize();
 * await manager.connectAll();
 * const tools = await manager.discoverTools();
 * await manager.disconnectAll();
 * ```
 */
export interface IMCPManager {
  /**
   * Initialize manager from configuration
   * Loads server configs but does not connect
   */
  initialize(): Promise<Result<void, DomainError>>;
  
  /**
   * Connect to all configured servers
   * Automatically discovers tools after connection
   */
  connectAll(): Promise<Result<void, DomainError>>;
  
  /**
   * Disconnect a specific server
   * @param serverId - Server ID to disconnect
   */
  disconnect(serverId: string): Promise<Result<void, DomainError>>;
  
  /**
   * Disconnect all servers
   * Typically called during shutdown
   */
  disconnectAll(): Promise<Result<void, DomainError>>;
  
  /**
   * Get connection for a specific server
   * @param serverId - Server ID
   * @returns Option.some if found, Option.none otherwise
   */
  getConnection(serverId: string): Option<IMCPServerConnection>;
  
  /**
   * Get all server connections
   */
  getAllConnections(): IMCPServerConnection[];
  
  /**
   * Discover tools from all connected servers
   * Registers tools in the tool registry
   */
  discoverTools(): Promise<Result<MCPTool[], DomainError>>;
}
