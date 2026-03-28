/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: MCP.TRANSPORT.IMCPTOOLREGISTRY.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IMCPToolRegistry module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\mcp\domain\IMCPToolRegistry.ts
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
import { MCPTool } from './MCPTool.js';

/**
 * MCP Tool Registry Interface
 * 
 * Registry for MCP-provided tools. Maintains a mapping of namespaced
 * tool names to tool definitions, organized by server.
 * 
 * Tool names are namespaced as "serverId:toolName" to prevent collisions
 * between servers providing tools with the same name.
 * 
 * @example
 * ```typescript
 * const registry = Container.resolve<IMCPToolRegistry>(Tokens.IMCPToolRegistry);
 * 
 * // Register tools from a server
 * registry.register([tool1, tool2]);
 * 
 * // Get a specific tool
 * const tool = registry.get('filesystem:read_file');
 * 
 * // Unregister all tools from a server
 * registry.unregister('filesystem');
 * ```
 */
export interface IMCPToolRegistry {
  /**
   * Register tools from a server
   */
  register(tools: MCPTool[]): Result<void, DomainError>;
  
  /**
   * Unregister all tools from a specific server
   */
  unregister(serverId: string): Result<void, DomainError>;
  
  /**
   * Get a tool by its namespaced name (e.g., "filesystem:read_file")
   */
  get(namespacedName: string): Option<MCPTool>;
  
  /**
   * Get all registered tools
   */
  getAll(): MCPTool[];
  
  /**
   * Get all tools from a specific server
   */
  getByServer(serverId: string): MCPTool[];
  
  /**
   * Clear all registered tools
   */
  clear(): void;
}
