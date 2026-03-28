/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.REGISTERMCP.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = registerMCP module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\composition\registerMCP.ts
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
 * Register MCP services for Agent Lee
 * Uses Agent Lee-native port configuration instead of ConfigLoader.
 */

import { AppConfig } from "../core/config/AppConfig.js";
import { IEventBus } from "../core/interfaces/IEventBus.js";
import { ILogger } from "../core/interfaces/ILogger.js";
import { IPlatformPaths } from "../core/interfaces/IPlatformPaths.js";
import { IProcessManager } from "../core/interfaces/IProcessManager.js";
import { ITracer } from "../core/interfaces/ITracer.js";
import { MCPManager } from "../mcp/application/MCPManager.js";
import { MCPToolRegistry } from "../mcp/application/MCPToolRegistry.js";
import { IMCPManager } from "../mcp/domain/IMCPManager.js";
import { IMCPToolRegistry } from "../mcp/domain/IMCPToolRegistry.js";
import { IToolRegistry } from "../tools/domain/interfaces/IToolRegistry.js";
import { Container, Tokens } from "./Container.js";

export function registerMCP(): void {
  const logger = Container.resolve<ILogger>(Tokens.ILogger);
  const tracer = Container.resolve<ITracer>(Tokens.ITracer);
  const eventBus = Container.resolve<IEventBus>(Tokens.IEventBus);
  const processManager = Container.resolve<IProcessManager>(
    Tokens.IProcessManager,
  );
  const platformPaths = Container.resolve<IPlatformPaths>(
    Tokens.IPlatformPaths,
  );

  Container.registerInstance<IMCPToolRegistry>(
    Tokens.IMCPToolRegistry,
    new MCPToolRegistry(logger),
  );

  const toolRegistry = Container.resolve<IMCPToolRegistry>(
    Tokens.IMCPToolRegistry,
  );
  const runtimeToolRegistry = Container.resolve<IToolRegistry>(Tokens.IToolRegistry);

  // Get MCP server config from AppConfig if registered
  let appConfig: AppConfig | undefined;
  try {
    appConfig = Container.resolve<AppConfig>(Tokens.AppConfig);
  } catch {
    /* no config registered */
  }

  Container.registerInstance<IMCPManager>(
    Tokens.IMCPManager,
    new MCPManager(
      appConfig?.mcp?.servers ?? {},
      processManager,
      toolRegistry,
      runtimeToolRegistry,
      logger,
      tracer,
      eventBus,
    ),
  );
}
