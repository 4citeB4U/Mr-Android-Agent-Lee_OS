/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.TOOLUNREGISTEREDEVENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ToolUnregisteredEvent module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\domain\events\ToolUnregisteredEvent.ts
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
 * ToolUnregisteredEvent - Published when a tool is unregistered
 * 
 * This event allows other parts of the system to react to tools
 * being removed from the registry.
 * 
 * @example
 * ```typescript
 * eventBus.subscribe<ToolUnregisteredPayload>(
 *   'tool.unregistered',
 *   async (event) => {
 *     console.log(`Tool unregistered: ${event.payload.toolName}`);
 *   }
 * );
 * ```
 */

import { DomainEvent } from '../../../core/interfaces/IEventBus.js';

export interface ToolUnregisteredPayload {
  /**
   * Name of the unregistered tool
   */
  toolName: string;
}

export class ToolUnregisteredEvent
  implements DomainEvent<ToolUnregisteredPayload>
{
  readonly eventId: string;
  readonly eventName = 'tool.unregistered';
  readonly occurredAt: Date;

  constructor(public readonly payload: ToolUnregisteredPayload) {
    this.eventId = `tool-unregistered-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}`;
    this.occurredAt = new Date();
  }
}
