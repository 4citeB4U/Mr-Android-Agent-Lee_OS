/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ITOOL.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ITool module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\domain\interfaces\ITool.ts
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
 * ITool - Interface for tools that can be invoked by agents
 * 
 * A tool is a capability that an agent can use to perform actions or retrieve information.
 * Tools have a name, description, parameter schema, and execute method.
 * 
 * Tools follow the Dependency Inversion Principle - this interface is the abstraction
 * that both the tool registry and agent session depend on.
 * 
 * @example
 * ```typescript
 * class WeatherTool implements ITool {
 *   readonly name = 'get_weather';
 *   readonly description = 'Get current weather for a location';
 *   readonly schema = {
 *     type: 'object',
 *     properties: {
 *       location: { type: 'string', description: 'City name' },
 *     },
 *     required: ['location'],
 *   };
 * 
 *   async execute(parameters: unknown): Promise<Result<ToolResult, Error>> {
 *     const { location } = parameters as { location: string };
 *     const weather = await fetchWeather(location);
 *     return Result.ok(ToolResult.success(weather));
 *   }
 * }
 * ```
 */

import { Result } from '../../../core/types/Result.js';
import { JSONSchema } from '../types/JSONSchema.js';
import { ToolResult } from '../value-objects/ToolResult.js';

export interface ITool {
  /**
   * Unique tool name
   * 
   * Must be unique across all registered tools.
   * Convention: lowercase with underscores (e.g., 'get_weather', 'send_email')
   */
  readonly name: string;

  /**
   * Human-readable description of what the tool does
   * 
   * This is used by the LLM to understand when to use the tool.
   * Should be clear and concise.
   */
  readonly description: string;

  /**
   * JSON Schema for tool parameters
   * 
   * Defines the shape and validation rules for parameters.
   * Parameters are validated against this schema before execution.
   */
  readonly schema: JSONSchema;

  /**
   * Execute the tool with given parameters
   * 
   * Parameters are pre-validated against the schema before this method is called.
   * The tool should perform its action and return a result.
   */
  execute(parameters: unknown): Promise<Result<ToolResult, Error>>;
}
