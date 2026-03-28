/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.REGISTERTOOLS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = registerTools module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\composition\registerTools.ts
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
 * Register tool system components
 * InMemoryToolRegistry, ToolExecutor, LLMCommandEvaluator, PermissionGuard
 */

import * as path from "path";
import { IEventBus } from "../core/interfaces/IEventBus.js";
import { ILogger } from "../core/interfaces/ILogger.js";
import { IPlatformPaths } from "../core/interfaces/IPlatformPaths.js";
import { ITracer } from "../core/interfaces/ITracer.js";
import { ToolInvoker } from "../tools/application/ToolExecutor.js";
import { PermissionGuard } from "../tools/builtin/CommandSafetyGuard.js";
import { ExecTool } from "../tools/builtin/ExecTool.js";
import { IPermissionGuard } from "../tools/builtin/IPermissionGuard.js";
import { LLMCommandEvaluator } from "../tools/builtin/LLMCommandEvaluator.js";
import { IToolRegistry } from "../tools/domain/interfaces/IToolRegistry.js";
import { InMemoryToolRegistry } from "../tools/infrastructure/InMemoryToolRegistry.js";
import { ToolOutputFileManager } from "../tools/infrastructure/ToolOutputFileManager.js";
import { Container, Tokens } from "./Container.js";

export function registerTools(): void {
  const workspaceRoot = process.cwd();

  let toolRegistryInstance: InMemoryToolRegistry | undefined;
  Container.registerFactory<IToolRegistry>(Tokens.IToolRegistry, (c) => {
    if (!toolRegistryInstance) {
      const logger = c.resolve<ILogger>(Tokens.ILogger);
      const eventBus = c.resolve<IEventBus>(Tokens.IEventBus);
      toolRegistryInstance = new InMemoryToolRegistry(logger, eventBus);
    }
    return toolRegistryInstance;
  });

  let toolExecutorInstance: ToolInvoker | undefined;
  Container.registerFactory<ToolInvoker>(Tokens.ToolInvoker, (c) => {
    if (!toolExecutorInstance) {
      const logger = c.resolve<ILogger>(Tokens.ILogger);
      const tracer = c.resolve<ITracer>(Tokens.ITracer);
      const registry = c.resolve<IToolRegistry>(Tokens.IToolRegistry);
      let outputFileManager: ToolOutputFileManager | undefined;
      try {
        const platformPaths = c.resolve<IPlatformPaths>(Tokens.IPlatformPaths);
        const outputDir = path.join(platformPaths.getDataDir(), "tool-outputs");
        outputFileManager = new ToolOutputFileManager(outputDir, logger);
        outputFileManager.cleanupStale();
      } catch {
        /* skip */
      }
      toolExecutorInstance = new ToolInvoker(
        registry,
        logger,
        tracer,
        outputFileManager,
      );
    }
    return toolExecutorInstance;
  });

  Container.registerFactory<IPermissionGuard>(Tokens.IPermissionGuard, (c) => {
    const logger = c.resolve<ILogger>(Tokens.ILogger);
    const llmEvaluator = new LLMCommandEvaluator(logger);
    return new PermissionGuard(
      logger,
      llmEvaluator,
      { workingDirectory: workspaceRoot, workspacePath: workspaceRoot },
      [],
      llmEvaluator,
    );
  });
}

export async function initializeTools(): Promise<void> {
  const workspaceRoot = process.cwd();
  const logger = Container.resolve<ILogger>(Tokens.ILogger);
  const registry = Container.resolve<IToolRegistry>(Tokens.IToolRegistry);

  let permissionGuard: IPermissionGuard | undefined;
  try {
    permissionGuard = Container.resolve<IPermissionGuard>(
      Tokens.IPermissionGuard,
    );
  } catch {
    /* optional */
  }

  const execTool = new ExecTool(workspaceRoot, permissionGuard, undefined);
  const result = await registry.register(execTool);
  if (result.isFailure()) {
    logger.warn("Failed to register exec tool");
  } else {
    logger.debug("Built-in exec tool registered");
  }
}
