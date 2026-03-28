/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.TOOLREGISTEREDEVENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ToolRegisteredEvent module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\domain\events\ToolRegisteredEvent.ts
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
 * ToolRegisteredEvent - Published when a tool is registered
 */

import { DomainEvent } from '../../../core/interfaces/IEventBus.js';

export interface ToolRegisteredPayload {
  /**
   * Name of the registered tool
   */
  toolName: string;

  /**
   * Description of the tool
   */
  description: string;
}

export class ToolRegisteredEvent
  implements DomainEvent<ToolRegisteredPayload>
{
  readonly eventId: string;
  readonly eventName = 'tool.registered';
  readonly occurredAt: Date;

  constructor(public readonly payload: ToolRegisteredPayload) {
    this.eventId = `tool-registered-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}`;
    this.occurredAt = new Date();
  }
}
