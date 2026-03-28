/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.REGISTERMEMORY.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = registerMemory module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\composition\registerMemory.ts
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
 * Register memory services (in-memory only — no DuckDB)
 * Wires compaction, search, and memory tools.
 */

import { ILogger } from "../core/interfaces/ILogger.js";
import { MemorySearch } from "../memory/search/MemorySearch.js";
import { SaveMemoryTool } from "../memory/tools/SaveMemoryTool.js";
import { SearchMemoryTool } from "../memory/tools/SearchMemoryTool.js";
import { IToolRegistry } from "../tools/domain/interfaces/IToolRegistry.js";
import { Container, Tokens } from "./Container.js";

export async function registerMemory(): Promise<void> {
  const logger = Container.resolve<ILogger>(Tokens.ILogger);

  const memorySearch = new MemorySearch(logger);
  const saveMemoryTool = new SaveMemoryTool(memorySearch);
  const searchMemoryTool = new SearchMemoryTool(memorySearch);

  // Register memory tools with tool registry
  try {
    const toolRegistry = Container.resolve<IToolRegistry>(Tokens.IToolRegistry);
    await toolRegistry.register(saveMemoryTool);
    await toolRegistry.register(searchMemoryTool);
    logger.debug("Memory tools registered (save, search)");
  } catch {
    logger.warn("Tool registry not available — memory tools not registered");
  }
}
