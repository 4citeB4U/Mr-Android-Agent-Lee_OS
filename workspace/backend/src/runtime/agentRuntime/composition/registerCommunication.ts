/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.REGISTERCOMMUNICATION.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = registerCommunication module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\composition\registerCommunication.ts
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
 * Register communication layer services
 *
 * Wires MessageBroker, AgentStateManager, SteeringManager, SharedState,
 * Coordination, and ProgressReporter into the DI container.
 */

import type { IMessageBroker } from "../communication/domain/IMessageBroker.js";
import type { ISteeringManager } from "../communication/domain/ISteeringManager.js";
import { AgentStateManager } from "../communication/infrastructure/AgentStateManager.js";
import { Coordination } from "../communication/infrastructure/Coordination.js";
import { MessageBroker } from "../communication/infrastructure/MessageBroker.js";
import { ProgressReporter } from "../communication/infrastructure/ProgressReporter.js";
import { SharedState } from "../communication/infrastructure/SharedState.js";
import { SteeringManager } from "../communication/infrastructure/SteeringManager.js";
import { ILogger } from "../core/interfaces/ILogger.js";
import { Container, Tokens } from "./Container.js";

export function registerCommunication(): void {
  const logger = Container.resolve<ILogger>(Tokens.ILogger);

  // MessageBroker — central routing hub
  const broker = new MessageBroker(logger);
  Container.registerInstance<IMessageBroker>(Tokens.IMessageBroker, broker);

  // AgentStateManager — tracks agent state transitions
  const stateManager = new AgentStateManager(logger);
  Container.registerInstance<AgentStateManager>(
    Tokens.AgentStateManager,
    stateManager,
  );

  // SteeringManager — mid-execution message injection
  const steeringManager = new SteeringManager(logger);
  Container.registerInstance<ISteeringManager>(
    Tokens.ISteeringManager,
    steeringManager,
  );

  // SharedState — in-memory key-value store shared across agents
  const sharedState = new SharedState();
  Container.registerInstance<SharedState>(Tokens.SharedState, sharedState);

  // Coordination — locks, barriers, counters
  const coordination = new Coordination();
  Container.registerInstance<Coordination>(Tokens.Coordination, coordination);

  // ProgressReporter — bridges agent progress to parent via broker
  const progressReporter = new ProgressReporter(broker, stateManager, logger);
  Container.registerInstance<ProgressReporter>(
    Tokens.ProgressReporter,
    progressReporter,
  );

  logger.debug("Communication services registered");
}
