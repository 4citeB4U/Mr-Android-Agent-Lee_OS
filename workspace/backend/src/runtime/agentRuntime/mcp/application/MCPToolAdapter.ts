/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: MCP.TRANSPORT.MCPTOOLADAPTER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=wrench

5WH:
WHAT = MCPToolAdapter module
WHY = Adapts discovered MCP tools into Agent Lee's primary tool registry
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\mcp\application\MCPToolAdapter.ts
WHEN = 2026
HOW = Wraps an MCP connection behind the ITool interface so runtime sessions can execute MCP tools directly

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { Result } from "../../core/types/Result.js";
import type { IMCPServerConnection } from "../domain/IMCPServerConnection.js";
import type { MCPTool } from "../domain/MCPTool.js";
import type { ITool } from "../../tools/domain/interfaces/ITool.js";
import {
  isJSONSchema,
  type JSONSchema,
} from "../../tools/domain/types/JSONSchema.js";
import { ToolResult } from "../../tools/domain/value-objects/ToolResult.js";

export class MCPToolAdapter implements ITool {
  constructor(
    private readonly connection: IMCPServerConnection,
    private readonly tool: MCPTool,
  ) {}

  get name(): string {
    return `mcp:${this.tool.namespacedName}`;
  }

  get description(): string {
    return this.tool.description || `MCP tool ${this.tool.namespacedName}`;
  }

  get schema(): JSONSchema {
    if (isJSONSchema(this.tool.schema)) {
      return this.tool.schema;
    }

    return {
      type: "object",
      properties: {},
      additionalProperties: true,
    };
  }

  async execute(parameters: unknown): Promise<Result<ToolResult, Error>> {
    const args =
      parameters && typeof parameters === "object" && !Array.isArray(parameters)
        ? (parameters as Record<string, unknown>)
        : {};

    const result = await this.connection.callTool(this.tool.name, args);
    if (result.isFailure()) {
      return Result.fail(result.getError());
    }

    return Result.ok(ToolResult.success(result.getValue()));
  }
}
