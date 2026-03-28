/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.REGISTERAGENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = registerAgent module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\composition\registerAgent.ts
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
 * Register agent session services
 * No CopilotClient — uses aiService via AgentSessionManager.
 */

import { IAgentSessionManager } from "../agent/domain/interfaces/IAgentSessionManager.js";
import { AgentSessionManager } from "../application/AgentSessionManager.js";
import { IEventBus } from "../core/interfaces/IEventBus.js";
import { ILogger } from "../core/interfaces/ILogger.js";
import { ITracer } from "../core/interfaces/ITracer.js";
import { IToolRegistry } from "../tools/domain/interfaces/IToolRegistry.js";
import { Container, Tokens } from "./Container.js";

export function registerAgent(): void {
  const logger = Container.resolve<ILogger>(Tokens.ILogger);
  const tracer = Container.resolve<ITracer>(Tokens.ITracer);
  const eventBus = Container.resolve<IEventBus>(Tokens.IEventBus);
  const toolRegistry = Container.resolve<IToolRegistry>(Tokens.IToolRegistry);

  Container.registerInstance<IAgentSessionManager>(
    Tokens.IAgentSessionManager,
    new AgentSessionManager(toolRegistry, logger, tracer, eventBus),
  );

  logger.debug("Agent session manager registered");
}
