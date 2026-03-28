/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SESSIONENDEDEVENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SessionEndedEvent module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\domain\events\SessionEndedEvent.ts
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
 * SessionEndedEvent - Published when a session ends
 * 
 * Indicates that an agent session has been closed and resources cleaned up.
 */

import { DomainEvent } from '../../../core/interfaces/IEventBus.js';
import { SessionId } from '../value-objects/SessionId.js';

/**
 * Payload for SessionEndedEvent
 */
export interface SessionEndedPayload {
  /** Session identifier */
  sessionId: SessionId;

  /** Number of messages exchanged during the session */
  messageCount: number;

  /** Session duration in milliseconds */
  durationMs: number;
}

/**
 * SessionEndedEvent
 * 
 * Published when an agent session is successfully ended.
 */
export class SessionEndedEvent implements DomainEvent<SessionEndedPayload> {
  readonly eventName = 'agent.session.ended';
  readonly occurredAt: Date;

  constructor(public readonly payload: SessionEndedPayload) {
    this.occurredAt = new Date();
  }
}
