/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: MCP.TRANSPORT.MCPTOOLREGISTRY.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = MCPToolRegistry module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\mcp\application\MCPToolRegistry.ts
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
import { IMCPToolRegistry } from '../domain/IMCPToolRegistry.js';
import { MCPTool } from '../domain/MCPTool.js';
import { ILogger } from '../../core/interfaces/ILogger.js';

/**
 * MCP Tool Registry Implementation
 * 
 * In-memory registry for MCP-provided tools. Maintains a map of
 * namespaced tool names to tool definitions.
 * 
 * Tools are indexed by their namespaced name ("serverId:toolName") to
 * prevent collisions between servers.
 * 
 * @example
 * ```typescript
 * const registry = new MCPToolRegistry(logger);
 * 
 * // Register tools from a server
 * registry.register([tool1, tool2]);
 * 
 * // Get a specific tool
 * const tool = registry.get('filesystem:read_file');
 * 
 * // Get all tools from a server
 * const serverTools = registry.getByServer('filesystem');
 * ```
 */
export class MCPToolRegistry implements IMCPToolRegistry {
  private tools: Map<string, MCPTool> = new Map();
  
  /**
   * Create a new MCP tool registry
   * @param logger - Logger for operational events
   */
  constructor(private readonly logger: ILogger) {}
  
  /**
   * Register tools from an MCP server
   * @param tools - Array of tools to register
   */
  register(tools: MCPTool[]): Result<void, DomainError> {
    for (const tool of tools) {
      this.tools.set(tool.namespacedName, tool);
      this.logger.debug(`Registered MCP tool: ${tool.namespacedName}`, {
        serverId: tool.serverId,
        toolName: tool.name
      });
    }
    
    this.logger.info(`Registered ${tools.length} MCP tools`, {
      totalTools: this.tools.size
    });
    
    return Result.ok(undefined);
  }
  
  unregister(serverId: string): Result<void, DomainError> {
    const toRemove: string[] = [];
    
    for (const [namespacedName, tool] of this.tools.entries()) {
      if (tool.serverId === serverId) {
        toRemove.push(namespacedName);
      }
    }
    
    for (const namespacedName of toRemove) {
      this.tools.delete(namespacedName);
      this.logger.debug(`Unregistered MCP tool: ${namespacedName}`);
    }
    
    this.logger.info(`Unregistered ${toRemove.length} tools from server ${serverId}`, {
      serverId,
      removedCount: toRemove.length
    });
    
    return Result.ok(undefined);
  }
  
  get(namespacedName: string): Option<MCPTool> {
    const tool = this.tools.get(namespacedName);
    return tool ? Option.some(tool) : Option.none();
  }
  
  getAll(): MCPTool[] {
    return Array.from(this.tools.values());
  }
  
  getByServer(serverId: string): MCPTool[] {
    return Array.from(this.tools.values()).filter(
      tool => tool.serverId === serverId
    );
  }
  
  clear(): void {
    const count = this.tools.size;
    this.tools.clear();
    this.logger.info(`Cleared ${count} MCP tools from registry`);
  }
}
