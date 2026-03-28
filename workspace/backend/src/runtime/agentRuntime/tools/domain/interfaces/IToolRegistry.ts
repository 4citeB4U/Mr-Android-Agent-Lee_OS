/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ITOOLREGISTRY.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IToolRegistry module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\domain\interfaces\IToolRegistry.ts
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
 * IToolRegistry - Interface for tool storage and retrieval
 * 
 * The tool registry manages the collection of available tools.
 * It provides methods for registering, unregistering, and querying tools.
 */

import { Result } from '../../../core/types/Result.js';
import { ITool } from './ITool.js';

export interface IToolRegistry {
  /**
   * Register a tool
   */
  register(tool: ITool): Promise<Result<void, Error>>;

  /**
   * Unregister a tool by name
   */
  unregister(toolName: string): Promise<Result<void, Error>>;

  /**
   * Get a tool by name
   */
  get(toolName: string): Promise<Result<ITool | null, Error>>;

  /**
   * List all registered tools
   */
  list(): Promise<Result<ITool[], Error>>;
}
