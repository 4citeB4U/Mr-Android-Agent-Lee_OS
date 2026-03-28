/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SESSIONSTARTEDEVENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SessionStartedEvent module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\domain\events\SessionStartedEvent.ts
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
 * SessionStartedEvent - Published when a session starts
 * 
 * Indicates that an agent session has been successfully created and is ready
 * to accept messages.
 */

import { DomainEvent } from '../../../core/interfaces/IEventBus.js';
import { SessionId } from '../value-objects/SessionId.js';

/**
 * Payload for SessionStartedEvent
 */
export interface SessionStartedPayload {
  /** Session identifier */
  sessionId: SessionId;

  /** Model used for this session */
  model: string;

  /** Temperature setting */
  temperature?: number;

  /** Max tokens setting */
  maxTokens?: number;
}

/**
 * SessionStartedEvent
 * 
 * Published when an agent session successfully starts.
 */
export class SessionStartedEvent implements DomainEvent<SessionStartedPayload> {
  readonly eventName = 'agent.session.started';
  readonly occurredAt: Date;

  constructor(public readonly payload: SessionStartedPayload) {
    this.occurredAt = new Date();
  }
}
