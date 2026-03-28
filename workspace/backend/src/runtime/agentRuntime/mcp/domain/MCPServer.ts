/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: MCP.TRANSPORT.MCPSERVER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = MCPServer module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\mcp\domain\MCPServer.ts
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
 * MCP Server configuration
 * 
 * Defines connection parameters for Model Context Protocol servers.
 * Supports both stdio (process) and HTTP transports.
 */
export interface MCPServerConfig {
  // stdio config
  /** Command to execute for stdio transport */
  command?: string;
  
  /** Command-line arguments for stdio transport */
  args?: string[];
  
  /** Environment variables for stdio transport */
  env?: Record<string, string>;
  
  // http config
  /** Base URL for HTTP transport */
  url?: string;
  
  /** HTTP headers for HTTP transport */
  headers?: Record<string, string>;
  
  // common
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Enable automatic reconnection */
  reconnect?: boolean;
  
  /** Delay between reconnection attempts (ms) */
  reconnectDelay?: number;
  
  /** Maximum number of reconnection attempts */
  maxReconnectAttempts?: number;
}

/**
 * MCP Server - Represents a Model Context Protocol server
 * 
 * Encapsulates server metadata and connection configuration.
 * Servers can use stdio (subprocess) or HTTP transport.
 * 
 * @example
 * ```typescript
 * const server = MCPServer.create({
 *   id: 'weather-service',
 *   name: 'Weather Service',
 *   transport: 'stdio',
 *   config: {
 *     command: 'node',
 *     args: ['weather-mcp-server.js']
 *   }
 * });
 * ```
 */
export class MCPServer {
  /**
   * Create a new MCP server instance
   * 
   * @param id - Unique server identifier
   * @param name - Human-readable server name
   * @param transport - Connection transport type
   * @param config - Server-specific configuration
   */
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly transport: 'stdio' | 'http',
    public readonly config: MCPServerConfig
  ) {}
  
  /**
   * Create an MCP server from configuration data
   * 
   * @param data - Server configuration
   * @returns New MCPServer instance
   */
  static create(data: {
    id: string;
    name: string;
    transport: 'stdio' | 'http';
    config: MCPServerConfig;
  }): MCPServer {
    return new MCPServer(data.id, data.name, data.transport, data.config);
  }
}
