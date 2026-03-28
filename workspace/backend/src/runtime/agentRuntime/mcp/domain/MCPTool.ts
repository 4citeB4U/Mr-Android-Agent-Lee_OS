/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: MCP.TRANSPORT.MCPTOOL.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = MCPTool module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\mcp\domain\MCPTool.ts
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
 * MCP Tool - Represents a tool provided by an MCP server
 * 
 * Tools from MCP servers are namespaced with their server ID to avoid
 * collisions (e.g., "weather-service:get_forecast").
 * 
 * @example
 * ```typescript
 * const tool = MCPTool.create('weather-service', {
 *   name: 'get_forecast',
 *   description: 'Get weather forecast',
 *   inputSchema: { type: 'object', properties: { ... } }
 * });
 * 
 * console.log(tool.namespacedName); // "weather-service:get_forecast"
 * ```
 */
export class MCPTool {
  /**
   * Create a new MCP tool instance
   * 
   * @param serverId - ID of the MCP server providing this tool
   * @param name - Tool name (without namespace)
   * @param namespacedName - Fully qualified name: "serverId:name"
   * @param description - Human-readable tool description
   * @param schema - JSON schema for tool input parameters
   */
  constructor(
    public readonly serverId: string,
    public readonly name: string,
    public readonly namespacedName: string, // "serverId:name"
    public readonly description: string,
    public readonly schema: Record<string, unknown>
  ) {}
  
  /**
   * Create an MCP tool from server tool data
   * 
   * Automatically generates the namespaced name by combining
   * server ID and tool name.
   * 
   * @param serverId - ID of the MCP server
   * @param toolData - Tool metadata from server
   * @returns New MCPTool instance
   */
  static create(serverId: string, toolData: {
    name: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
  }): MCPTool {
    return new MCPTool(
      serverId,
      toolData.name,
      `${serverId}:${toolData.name}`,
      toolData.description || '',
      toolData.inputSchema || {}
    );
  }
}
