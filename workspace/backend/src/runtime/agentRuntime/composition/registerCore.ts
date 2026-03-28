/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.REGISTERCORE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = registerCore module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\composition\registerCore.ts
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
 * Register core infrastructure services
 * Logger, EventBus, Platform, PlatformPaths, ProcessManager, NullTracer
 */

import { Container, Tokens } from './Container.js';
import { ConsoleLogger, LogLevel } from '../core/infrastructure/ConsoleLogger.js';
import { InMemoryEventBus } from '../core/infrastructure/InMemoryEventBus.js';
import { Platform } from '../core/infrastructure/Platform.js';
import { PlatformPaths } from '../core/infrastructure/PlatformPaths.js';
import { ProcessManager } from '../core/infrastructure/ProcessManager.js';
import { NullTracer } from '../core/infrastructure/NullTracer.js';
import { ILogger } from '../core/interfaces/ILogger.js';
import { IEventBus } from '../core/interfaces/IEventBus.js';
import { IPlatform } from '../core/interfaces/IPlatform.js';
import { IPlatformPaths } from '../core/interfaces/IPlatformPaths.js';
import { IProcessManager } from '../core/interfaces/IProcessManager.js';
import { ITracer } from '../core/interfaces/ITracer.js';

export function registerCore(logLevel: LogLevel = LogLevel.INFO): void {
  const logger = new ConsoleLogger(logLevel);
  Container.registerInstance<ILogger>(Tokens.ILogger, logger);

  const eventBus = new InMemoryEventBus(logger);
  Container.registerInstance<IEventBus>(Tokens.IEventBus, eventBus);

  const platform = new Platform();
  Container.registerInstance<IPlatform>(Tokens.IPlatform, platform);

  const platformPaths = new PlatformPaths(platform);
  Container.registerInstance<IPlatformPaths>(Tokens.IPlatformPaths, platformPaths);

  const tracer = new NullTracer();
  Container.registerInstance<ITracer>(Tokens.ITracer, tracer);
}

export function registerCoreWithTracing(): void {
  const platform = Container.resolve<IPlatform>(Tokens.IPlatform);
  const logger = Container.resolve<ILogger>(Tokens.ILogger);
  const tracer = Container.resolve<ITracer>(Tokens.ITracer);

  const processManager = new ProcessManager(platform, logger, tracer);
  Container.registerInstance<IProcessManager>(Tokens.IProcessManager, processManager);
}
