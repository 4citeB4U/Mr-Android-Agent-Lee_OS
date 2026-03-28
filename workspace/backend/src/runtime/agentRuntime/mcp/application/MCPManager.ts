/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: MCP.TRANSPORT.MCPMANAGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = MCPManager module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\mcp\application\MCPManager.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { MCPServerConfigType } from "../../core/config/AppConfig.js";
import { DomainError } from "../../core/errors/DomainError.js";
import { IEventBus } from "../../core/interfaces/IEventBus.js";
import { ILogger } from "../../core/interfaces/ILogger.js";
import { IProcessManager } from "../../core/interfaces/IProcessManager.js";
import { ITracer } from "../../core/interfaces/ITracer.js";
import { Option } from "../../core/types/Option.js";
import { Result } from "../../core/types/Result.js";
import {
    MCPConnectionError,
    MCPDiscoveryError,
    MCPServerNotFoundError,
} from "../domain/errors/MCPError.js";
import { IMCPManager } from "../domain/IMCPManager.js";
import { IMCPServerConnection } from "../domain/IMCPServerConnection.js";
import { IMCPToolRegistry } from "../domain/IMCPToolRegistry.js";
import { MCPServer } from "../domain/MCPServer.js";
import { MCPTool } from "../domain/MCPTool.js";
import { IToolRegistry } from "../../tools/domain/interfaces/IToolRegistry.js";
import { MCPToolAdapter } from "./MCPToolAdapter.js";
import { MCPServerConnection } from "./MCPServerConnection.js";

/**
 * MCP Manager - Orchestrates Model Context Protocol server connections
 *
 * Manages the lifecycle of MCP servers:
 * - Loads server configurations from config file
 * - Establishes connections to servers (stdio or HTTP)
 * - Discovers and registers tools from connected servers
 * - Handles graceful connection/disconnection
 *
 * @example
 * ```typescript
 * const manager = new MCPManager(
 *   configLoader,
 *   processManager,
 *   toolRegistry,
 *   logger,
 *   tracer,
 *   eventBus
 * );
 *
 * // Initialize from config
 * await manager.initialize();
 *
 * // Connect all configured servers
 * await manager.connectAll();
 *
 * // Tools are automatically discovered and registered
 * const tools = toolRegistry.list();
 *
 * // Disconnect when done
 * await manager.disconnectAll();
 * ```
 */
export class MCPManager implements IMCPManager {
  private connections: Map<string, IMCPServerConnection> = new Map();
  private servers: MCPServer[] = [];
  private runtimeToolsByServer: Map<string, string[]> = new Map();

  /**
   * Create a new MCP Manager
   *
   * @param servers - MCP server configurations (keyed by server ID)
   * @param processManager - Manages MCP server processes
   * @param toolRegistry - Registry for discovered MCP tools
   * @param logger - Logger for operational events
   * @param tracer - Tracer for distributed tracing
   * @param eventBus - Event bus for domain events
   */
  constructor(
    private readonly servers_config: Record<string, MCPServerConfigType>,
    private readonly processManager: IProcessManager,
    private readonly toolRegistry: IMCPToolRegistry,
    private readonly runtimeToolRegistry: IToolRegistry | null,
    private readonly logger: ILogger,
    private readonly tracer: ITracer,
    private readonly eventBus: IEventBus,
  ) {}

  private async unregisterRuntimeTools(serverId: string): Promise<void> {
    if (!this.runtimeToolRegistry) {
      return;
    }

    const names = this.runtimeToolsByServer.get(serverId) || [];
    for (const toolName of names) {
      const result = await this.runtimeToolRegistry.unregister(toolName);
      if (result.isFailure()) {
        this.logger.debug(`Runtime MCP tool cleanup skipped for ${toolName}`, {
          serverId,
          toolName,
          error: result.getError().message,
        });
      }
    }
    this.runtimeToolsByServer.delete(serverId);
  }

  private async registerRuntimeTools(
    connection: IMCPServerConnection,
    tools: MCPTool[],
  ): Promise<void> {
    if (!this.runtimeToolRegistry) {
      return;
    }

    await this.unregisterRuntimeTools(connection.serverId);

    const registeredNames: string[] = [];
    for (const tool of tools) {
      const adapter = new MCPToolAdapter(connection, tool);
      const result = await this.runtimeToolRegistry.register(adapter);
      if (result.isSuccess()) {
        registeredNames.push(adapter.name);
        continue;
      }

      this.logger.warn(`Failed to register runtime MCP tool ${adapter.name}`, {
        serverId: connection.serverId,
        toolName: adapter.name,
        error: result.getError().message,
      });
    }

    if (registeredNames.length > 0) {
      this.runtimeToolsByServer.set(connection.serverId, registeredNames);
    }
  }

  /**
   * Initialize MCP manager from configuration
   *
   * Loads server configurations and creates connection instances.
   * Does not establish connections - call connectAll() to connect.
   *
   * @returns Result.ok on success, Result.fail if config loading fails
   * @throws Never - all errors returned as Result
   */
  async initialize(): Promise<Result<void, DomainError>> {
    return await this.tracer.span("MCPManager.initialize", async (span) => {
      try {
        // Use inline servers config
        if (
          !this.servers_config ||
          Object.keys(this.servers_config).length === 0
        ) {
          this.logger.info("No MCP servers configured");
          return Result.ok(undefined);
        }

        // Create server entities
        for (const [id, serverConfig] of Object.entries(this.servers_config)) {
          // Determine transport type from config
          const transport = serverConfig.url ? "http" : "stdio";

          const server = MCPServer.create({
            id,
            name: id, // Use server ID as name
            transport,
            config: serverConfig,
          });

          this.servers.push(server);

          // Create connection
          const connection = new MCPServerConnection(
            server,
            this.processManager,
            this.logger,
            this.tracer,
          );

          this.connections.set(id, connection);
        }

        this.logger.info(
          `Initialized ${this.servers.length} MCP server configurations`,
          {
            serverCount: this.servers.length,
            serverIds: this.servers.map((s) => s.id),
          },
        );

        span.setAttribute("mcp.servers.count", this.servers.length);
        span.setStatus("ok");

        return Result.ok(undefined);
      } catch (error: any) {
        span.setStatus("error", error.message);

        return Result.fail(
          new MCPConnectionError(
            `Failed to initialize MCP manager: ${error.message}`,
          ),
        );
      }
    });
  }

  /**
   * Connect to all configured MCP servers
   *
   * Establishes connections to all servers in parallel and discovers
   * tools from successfully connected servers.
   *
   * @returns Result.ok on success (even if some servers fail to connect)
   * @throws Never - all errors returned as Result
   *
   * Events:
   * - mcp.tools.discovered - after tool discovery completes
   */
  async connectAll(): Promise<Result<void, DomainError>> {
    return await this.tracer.span("MCPManager.connectAll", async (span) => {
      try {
        span.setAttribute("mcp.servers.count", this.connections.size);

        // Connect all servers (parallel)
        const results = await Promise.allSettled(
          Array.from(this.connections.values()).map((conn) => conn.connect()),
        );

        // Count successes and failures
        let connected = 0;
        let failed = 0;

        for (const result of results) {
          if (result.status === "fulfilled" && result.value.isSuccess()) {
            connected++;
          } else {
            failed++;
          }
        }

        this.logger.info(
          `MCP server connection results: ${connected} connected, ${failed} failed`,
          {
            connected,
            failed,
            total: this.connections.size,
          },
        );

        span.setAttribute("mcp.servers.connected", connected);
        span.setAttribute("mcp.servers.failed", failed);

        // Discover tools from connected servers
        await this.discoverTools();

        span.setStatus("ok");
        return Result.ok(undefined);
      } catch (error: any) {
        span.setStatus("error", error.message);

        return Result.fail(
          new MCPConnectionError(
            `Failed to connect all servers: ${error.message}`,
          ),
        );
      }
    });
  }

  /**
   * Disconnect from a specific MCP server
   *
   * Closes the connection and unregisters all tools from this server.
   *
   * @param serverId - ID of the server to disconnect
   * @returns Result.ok on success, Result.fail if server not found
   * @throws Never - all errors returned as Result
   */
  async disconnect(serverId: string): Promise<Result<void, DomainError>> {
    return await this.tracer.span("MCPManager.disconnect", async (span) => {
      span.setAttribute("mcp.server.id", serverId);

      const connection = this.connections.get(serverId);
      if (!connection) {
        return Result.fail(new MCPServerNotFoundError(serverId));
      }

      const result = await connection.disconnect();

      // Unregister tools from this server
      this.toolRegistry.unregister(serverId);
      await this.unregisterRuntimeTools(serverId);

      span.setStatus("ok");
      return result;
    });
  }

  /**
   * Disconnect from all MCP servers
   *
   * Closes all connections and clears the tool registry.
   * Typically called during graceful shutdown.
   *
   * @returns Result.ok on success, Result.fail on connection errors
   * @throws Never - all errors returned as Result
   */
  async disconnectAll(): Promise<Result<void, DomainError>> {
    return await this.tracer.span("MCPManager.disconnectAll", async (span) => {
      try {
        await Promise.all(
          Array.from(this.connections.values()).map((conn) =>
            conn.disconnect(),
          ),
        );

        // Clear tool registry
        this.toolRegistry.clear();
        for (const serverId of Array.from(this.runtimeToolsByServer.keys())) {
          await this.unregisterRuntimeTools(serverId);
        }

        this.logger.info("Disconnected all MCP servers");

        span.setStatus("ok");
        return Result.ok(undefined);
      } catch (error: any) {
        span.setStatus("error", error.message);

        return Result.fail(
          new MCPConnectionError(
            `Failed to disconnect all servers: ${error.message}`,
          ),
        );
      }
    });
  }

  /**
   * Get a specific MCP server connection
   *
   * @param serverId - ID of the server
   * @returns Option.some with connection if found, Option.none otherwise
   */
  getConnection(serverId: string): Option<IMCPServerConnection> {
    const connection = this.connections.get(serverId);
    return connection ? Option.some(connection) : Option.none();
  }

  /**
   * Get all MCP server connections
   *
   * @returns Array of all connection instances
   */
  getAllConnections(): IMCPServerConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Discover tools from all connected MCP servers
   *
   * Queries each connected server for available tools and registers
   * them in the tool registry. Automatically called by connectAll().
   *
   * @returns Result containing discovered tools, or error
   * @throws Never - all errors returned as Result
   *
   * Events:
   * - mcp.discovery.started - before discovery begins
   * - mcp.server.tools.discovered - for each server's tools
   * - mcp.discovery.completed - after all tools discovered
   * - mcp.tools.discovered - after registration complete
   */
  async discoverTools(): Promise<Result<MCPTool[], DomainError>> {
    return await this.tracer.span("MCPManager.discoverTools", async (span) => {
      try {
        const allTools: MCPTool[] = [];

        // Add event for discovery start
        span.addEvent("mcp.discovery.started", {
          "server.count": this.connections.size,
        });

        for (const connection of this.connections.values()) {
          if (!connection.isConnected()) {
            continue;
          }

          const toolsResult = await connection.listTools();
          if (toolsResult.isSuccess()) {
            const tools = toolsResult.getValue();
            allTools.push(...tools);

            // Add event for each server's tools discovered
            span.addEvent("mcp.server.tools.discovered", {
              "server.id": connection.serverId,
              "tools.count": tools.length,
            });

            // Register in tool registry
            this.toolRegistry.register(tools);
            await this.registerRuntimeTools(connection, tools);
          } else {
            this.logger.warn(
              `Failed to discover tools from ${connection.serverId}`,
              {
                serverId: connection.serverId,
                error: toolsResult.getError().message,
              },
            );
          }
        }

        this.logger.info(
          `Discovered ${allTools.length} tools from MCP servers`,
          {
            toolCount: allTools.length,
          },
        );

        // Publish event
        await this.eventBus.publish({
          eventName: "mcp.tools.discovered",
          occurredAt: new Date(),
          payload: { count: allTools.length },
        });

        // Add event for discovery completion
        span.addEvent("mcp.discovery.completed", {
          "tools.total": allTools.length,
        });

        span.setAttribute("mcp.tools.count", allTools.length);
        span.setStatus("ok");

        return Result.ok(allTools);
      } catch (error: any) {
        span.setStatus("error", error.message);

        return Result.fail(
          new MCPDiscoveryError(`Failed to discover tools: ${error.message}`),
        );
      }
    });
  }
}
