/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENTRUNTIME_SUB_AGENTS_EVENTS_TS.MAIN_AGENTS_EVENTS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = events module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\sub-agents\events.ts
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
 * Events for sub-agent lifecycle
 */

import { DomainEvent } from "../core/interfaces/IEventBus.js";

/**
 * Payload for SubAgentSpawned event
 */
export interface SubAgentSpawnedPayload {
  agentId: string;
  model: string;
  task: string;
  sessionId?: string;
}

/**
 * Event published when a sub-agent is spawned
 */
export class SubAgentSpawnedEvent implements DomainEvent<SubAgentSpawnedPayload> {
  readonly eventName = "sub-agent.spawned";
  readonly occurredAt: Date;
  readonly payload: SubAgentSpawnedPayload;

  constructor(
    agentId: string,
    model: string,
    task: string,
    sessionId?: string,
  ) {
    this.occurredAt = new Date();
    this.payload = {
      agentId,
      model,
      task,
      sessionId,
    };
  }
}

/**
 * Payload for SubAgentCompleted event
 */
export interface SubAgentCompletedPayload {
  agentId: string;
  success: boolean;
  durationMs?: number;
  error?: string;
}

/**
 * Event published when a sub-agent completes its task
 */
export class SubAgentCompletedEvent implements DomainEvent<SubAgentCompletedPayload> {
  readonly eventName = "sub-agent.completed";
  readonly occurredAt: Date;
  readonly payload: SubAgentCompletedPayload;

  constructor(
    agentId: string,
    success: boolean,
    durationMs?: number,
    error?: string,
  ) {
    this.occurredAt = new Date();
    this.payload = {
      agentId,
      success,
      durationMs,
      error,
    };
  }
}

/**
 * Payload for SubAgentFailed event
 */
export interface SubAgentFailedPayload {
  agentId: string;
  error: string;
  task: string;
}

/**
 * Event published when a sub-agent fails
 */
export class SubAgentFailedEvent implements DomainEvent<SubAgentFailedPayload> {
  readonly eventName = "sub-agent.failed";
  readonly occurredAt: Date;
  readonly payload: SubAgentFailedPayload;

  constructor(agentId: string, error: string, task: string) {
    this.occurredAt = new Date();
    this.payload = {
      agentId,
      error,
      task,
    };
  }
}
