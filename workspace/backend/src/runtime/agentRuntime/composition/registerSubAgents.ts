/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.REGISTERSUBAGENTS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = registerSubAgents module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\composition\registerSubAgents.ts
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
 * Register sub-agent services
 * No ICopilotClient — uses ModelSelector + aiService via SubAgentManager.
 */

import { SmartCompactionSession } from "../agent/context/SmartCompactionSession.js";
import { ModelSelector } from "../agent/model-selection/ModelSelector.js";
import { IEventBus } from "../core/interfaces/IEventBus.js";
import { ILogger } from "../core/interfaces/ILogger.js";
import { ITracer } from "../core/interfaces/ITracer.js";
import { ForkableSession } from "../sub-agents/ForkableSession.js";
import { SubAgentManager } from "../sub-agents/SubAgentManager.js";
import { Container, Tokens } from "./Container.js";

export async function registerSubAgents(): Promise<void> {
  const logger = Container.resolve<ILogger>(Tokens.ILogger);
  const tracer = Container.resolve<ITracer>(Tokens.ITracer);
  const eventBus = Container.resolve<IEventBus>(Tokens.IEventBus);

  // ModelSelector — no args (GLM-only routing)
  const modelSelector = new ModelSelector();
  Container.registerInstance<ModelSelector>(
    Tokens.ModelSelector,
    modelSelector,
  );

  // SmartCompactionSession — new constructor: (tracer, eventBus, modelSelector)
  const compactionSession = new SmartCompactionSession(
    tracer,
    eventBus,
    modelSelector,
  );
  Container.registerInstance<SmartCompactionSession>(
    Tokens.SmartCompactionSession,
    compactionSession,
  );

  // SubAgentManager
  const subAgentManager = new SubAgentManager(
    modelSelector,
    logger,
    tracer,
    eventBus,
  );
  Container.registerInstance<SubAgentManager>(
    Tokens.SubAgentManager,
    subAgentManager,
  );

  // ForkableSession
  const forkableSession = new ForkableSession(subAgentManager, logger, tracer);
  Container.registerInstance<ForkableSession>(
    Tokens.ForkableSession,
    forkableSession,
  );

  logger.debug("Sub-agent services registered");
}
