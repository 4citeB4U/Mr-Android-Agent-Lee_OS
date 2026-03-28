/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: MCP.TRANSPORT.MCPSERVERCONNECTION.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = MCPServerConnection module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\mcp\application\MCPServerConnection.ts
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
import { MCPConnectionError, MCPToolError, MCPDisconnectError } from '../domain/errors/MCPError.js';
import { MCPServer } from '../domain/MCPServer.js';
import { MCPTool } from '../domain/MCPTool.js';
import { IMCPServerConnection, ConnectionStatus } from '../domain/IMCPServerConnection.js';
import { ILogger } from '../../core/interfaces/ILogger.js';
import { ITracer } from '../../core/interfaces/ITracer.js';
import { IProcessManager } from '../../core/interfaces/IProcessManager.js';

// MCP SDK imports
// See: docs/implementation/MCP_API_REFERENCE.md for API patterns
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

/**
 * Concrete implementation of IMCPServerConnection for connecting to MCP servers.
 * 
 * Supports both stdio and HTTP transports:
 * - stdio: Local MCP servers via command-line processes
 * - HTTP: Remote MCP servers via Streamable HTTP/SSE
 * 
 * This class wraps the MCP SDK Client and provides:
 * - Connection lifecycle management (connect, disconnect, reconnect)
 * - Tool discovery (listTools)
 * - Tool execution (callTool)
 * - Full tracing and error handling
 * 
 * @example
 * ```typescript
 * const connection = new MCPServerConnection(
 *   server,
 *   processManager,
 *   logger,
 *   tracer
 * );
 * 
 * const result = await connection.connect();
 * if (result.isSuccess()) {
 *   const tools = await connection.listTools();
 * }
 * ```
 */
export class MCPServerConnection implements IMCPServerConnection {
  private client?: Client;
  private transport?: StdioClientTransport | StreamableHTTPClientTransport;
  private _status: ConnectionStatus = ConnectionStatus.Disconnected;
  
  constructor(
    private readonly server: MCPServer,
    _processManager: IProcessManager, // Reserved for future use (reconnection logic)
    private readonly logger: ILogger,
    private readonly tracer: ITracer
  ) {}
  
  get serverId(): string {
    return this.server.id;
  }
  
  get status(): ConnectionStatus {
    return this._status;
  }
  
  /**
   * Connect to the MCP server.
   * 
   * For stdio transport, spawns the server process and establishes
   * stdin/stdout communication.
   * 
   * For HTTP transport, establishes Streamable HTTP/SSE connection
   * to a remote MCP server.
   * 
   * @returns Result.ok() on success, Result.fail() with MCPConnectionError on failure
   */
  async connect(): Promise<Result<void, MCPConnectionError>> {
    return await this.tracer.span('MCPServerConnection.connect', async (span) => {
      try {
        span.setAttribute('mcp.server.id', this.serverId);
        span.setAttribute('mcp.server.transport', this.server.transport);
        
        this._status = ConnectionStatus.Connecting;
        
        // Handle stdio transport
        if (this.server.transport === 'stdio') {
          // Validate stdio config
          if (!this.server.config.command) {
            this._status = ConnectionStatus.Failed;
            span.setStatus('error', 'stdio transport requires command');
            return Result.fail(
              new MCPConnectionError('stdio transport requires command', { serverId: this.serverId })
            );
          }
          
          // Create stdio transport
          // See: MCP SDK docs - StdioClientTransport spawns child process
          this.transport = new StdioClientTransport({
            command: this.server.config.command,
            args: this.server.config.args,
            env: this.server.config.env
          });
          
        } else if (this.server.transport === 'http') {
          // Validate HTTP config
          if (!this.server.config.url) {
            this._status = ConnectionStatus.Failed;
            span.setStatus('error', 'http transport requires url');
            return Result.fail(
              new MCPConnectionError('http transport requires url', { serverId: this.serverId })
            );
          }
          
          // Create HTTP transport
          // See: MCP SDK docs - StreamableHTTPClientTransport for SSE-based communication
          const requestInit: RequestInit = {};
          if (this.server.config.headers) {
            requestInit.headers = this.server.config.headers;
          }
          
          this.transport = new StreamableHTTPClientTransport(
            new URL(this.server.config.url),
            requestInit.headers ? { requestInit } : undefined
          );
          
        } else {
          // Unknown transport
          this._status = ConnectionStatus.Failed;
          span.setStatus('error', `Unknown transport: ${this.server.transport}`);
          return Result.fail(
            new MCPConnectionError(
              `Unknown transport: ${this.server.transport}`,
              { serverId: this.serverId }
            )
          );
        }
        
        // Create MCP client
        // See: MCP SDK docs - Client manages protocol communication
        this.client = new Client(
          {
            name: 'openclaw-lite',
            version: '0.1.0'
          },
          {
            capabilities: {}
          }
        );
        
        // Connect client to transport (establishes MCP protocol handshake)
        await this.client.connect(this.transport);
        
        this._status = ConnectionStatus.Connected;
        this.logger.info(`MCP server connected: ${this.serverId}`, {
          serverId: this.serverId,
          transport: this.server.transport,
          ...(this.server.transport === 'http' && { url: this.server.config.url })
        });
        
        span.setStatus('ok');
        return Result.ok(undefined);
        
      } catch (error: any) {
        this._status = ConnectionStatus.Failed;
        this.logger.error(`MCP connection failed: ${this.serverId}`, error, {
          serverId: this.serverId
        });
        
        span.setStatus('error', error.message);
        span.setAttribute('error.message', error.message);
        
        return Result.fail(
          new MCPConnectionError(
            `Failed to connect to MCP server: ${error.message}`,
            { serverId: this.serverId, originalError: error.message }
          )
        );
      }
    });
  }
  
  /**
   * Disconnect from the MCP server.
   * 
   * Closes the MCP client connection and cleans up resources.
   * Safe to call multiple times.
   * 
   * @returns Result.ok() on success, Result.fail() with MCPDisconnectError on failure
   */
  async disconnect(): Promise<Result<void, MCPDisconnectError>> {
    return await this.tracer.span('MCPServerConnection.disconnect', async (span) => {
      try {
        span.setAttribute('mcp.server.id', this.serverId);
        
        if (this.client) {
          await this.client.close();
          this.client = undefined;
          this.transport = undefined;
        }
        
        this._status = ConnectionStatus.Disconnected;
        this.logger.info(`MCP server disconnected: ${this.serverId}`, {
          serverId: this.serverId
        });
        
        span.setStatus('ok');
        return Result.ok(undefined);
        
      } catch (error: any) {
        span.setStatus('error', error.message);
        span.setAttribute('error.message', error.message);
        
        return Result.fail(
          new MCPDisconnectError(
            `Failed to disconnect from MCP server: ${error.message}`,
            { serverId: this.serverId }
          )
        );
      }
    });
  }
  
  /**
   * List all tools available from this MCP server.
   * 
   * @returns Result containing array of MCPTool objects, or MCPToolError on failure
   */
  async listTools(): Promise<Result<MCPTool[], MCPToolError>> {
    return await this.tracer.span('MCPServerConnection.listTools', async (span) => {
      span.setAttribute('mcp.server.id', this.serverId);
      
      if (!this.isConnected()) {
        span.setStatus('error', 'Server not connected');
        return Result.fail(
          new MCPToolError('Server not connected', { serverId: this.serverId })
        );
      }
      
      try {
        // Call MCP SDK's listTools method
        const response = await this.client!.listTools();
        
        // Transform MCP SDK tool format to domain model
        const tools = response.tools.map(tool => 
          MCPTool.create(this.serverId, {
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          })
        );
        
        this.logger.debug(`Listed ${tools.length} tools from ${this.serverId}`, {
          serverId: this.serverId,
          toolCount: tools.length
        });
        
        span.setAttribute('mcp.tools.count', tools.length);
        span.setStatus('ok');
        
        return Result.ok(tools);
        
      } catch (error: any) {
        span.setStatus('error', error.message);
        span.setAttribute('error.message', error.message);
        
        return Result.fail(
          new MCPToolError(
            `Failed to list tools: ${error.message}`,
            { serverId: this.serverId }
          )
        );
      }
    });
  }
  
  /**
   * Call a tool on this MCP server.
   * 
   * @param name - Tool name (without server prefix)
   * @param args - Tool arguments matching the tool's input schema
   * @returns Result containing tool response, or MCPToolError on failure
   */
  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<Result<unknown, MCPToolError>> {
    return await this.tracer.span('MCPServerConnection.callTool', async (span) => {
      span.setAttribute('mcp.server.id', this.serverId);
      span.setAttribute('mcp.tool.name', name);
      
      if (!this.isConnected()) {
        span.setStatus('error', 'Server not connected');
        return Result.fail(
          new MCPToolError('Server not connected', { serverId: this.serverId })
        );
      }
      
      try {
        // Call MCP SDK's callTool method
        const result = await this.client!.callTool({ name, arguments: args });
        
        this.logger.debug(`Called tool ${name} on ${this.serverId}`, {
          serverId: this.serverId,
          toolName: name
        });
        
        span.setStatus('ok');
        // Return the content array from the MCP response
        return Result.ok(result.content);
        
      } catch (error: any) {
        span.setStatus('error', error.message);
        span.setAttribute('error.message', error.message);
        
        return Result.fail(
          new MCPToolError(
            `Tool call failed: ${error.message}`,
            { serverId: this.serverId, toolName: name }
          )
        );
      }
    });
  }
  
  /**
   * Check if currently connected to the MCP server.
   * 
   * @returns true if connected, false otherwise
   */
  isConnected(): boolean {
    return this._status === ConnectionStatus.Connected && !!this.client;
  }
}
