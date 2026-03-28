/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.REGISTERSCHEDULER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = registerScheduler module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\composition\registerScheduler.ts
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
 * Register scheduler services
 *
 * Wires FileSchedulerStore, OpenClawStyleOrchestrator, and SchedulerService
 * into the DI container.
 */

import * as path from "path";
import { IEventBus } from "../core/interfaces/IEventBus.js";
import { ILogger } from "../core/interfaces/ILogger.js";
import { SchedulerService } from "../scheduler/application/SchedulerService.js";
import type { ISchedulerStore } from "../scheduler/domain/ISchedulerStore.js";
import { FileSchedulerStore } from "../scheduler/infrastructure/FileSchedulerStore.js";
import { OpenClawStyleOrchestrator } from "../sub-agents/OpenClawStyleOrchestrator.js";
import { SubAgentManager } from "../sub-agents/SubAgentManager.js";
import { Container, Tokens } from "./Container.js";

export async function registerScheduler(dataDir?: string): Promise<void> {
  const logger = Container.resolve<ILogger>(Tokens.ILogger);
  const eventBus = Container.resolve<IEventBus>(Tokens.IEventBus);
  const subAgentManager = Container.resolve<SubAgentManager>(
    Tokens.SubAgentManager,
  );

  // Resolve data directory for persistent scheduler jobs
  const schedulerDataDir = dataDir
    ? path.join(dataDir, "scheduler")
    : path.join(process.cwd(), "backend", "data", "scheduler");

  // FileSchedulerStore — loads persisted jobs from disk
  const store = new FileSchedulerStore(schedulerDataDir);
  await store.load();
  Container.registerInstance<ISchedulerStore>(Tokens.ISchedulerStore, store);

  // OpenClawStyleOrchestrator — wraps SubAgentManager
  const orchestrator = new OpenClawStyleOrchestrator(subAgentManager);
  Container.registerInstance<OpenClawStyleOrchestrator>(
    Tokens.OpenClawStyleOrchestrator,
    orchestrator,
  );

  // SchedulerService — arms timers and manages job lifecycle
  const schedulerService = new SchedulerService(store, orchestrator, eventBus);
  schedulerService.start();
  Container.registerInstance<SchedulerService>(
    Tokens.SchedulerService,
    schedulerService,
  );

  logger.debug("Scheduler services registered and started");
}
