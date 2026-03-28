/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.IEVENTBUS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IEventBus module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\interfaces\IEventBus.ts
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
 * Domain event base interface
 * 
 * Represents something that happened in the domain. Events are immutable
 * and represent facts about the past.
 */
export interface DomainEvent<T = unknown> {
  /** Unique event name (e.g., 'plugin.loaded') */
  readonly eventName: string;

  /** Timestamp when the event occurred */
  readonly occurredAt: Date;

  /** Event payload data */
  readonly payload: T;
}

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (
  event: DomainEvent<T>
) => void | Promise<void>;

/**
 * Event bus interface for pub/sub messaging
 * 
 * Enables loose coupling between vertical slices through domain events.
 * Implementations should handle async handlers and error isolation
 * (one handler failure should not affect others).
 * 
 * @example
 * ```typescript
 * // Subscribe to events
 * eventBus.subscribe('plugin.loaded', async (event) => {
 *   console.log(`Plugin ${event.payload.name} loaded`);
 * });
 * 
 * // Publish events
 * await eventBus.publish({
 *   eventName: 'plugin.loaded',
 *   occurredAt: new Date(),
 *   payload: { name: 'weather', version: '1.0.0' }
 * });
 * ```
 */
export interface IEventBus {
  /**
   * Publish an event to all subscribers
   * 
   * @param event - The event to publish
   */
  publish<T>(event: DomainEvent<T>): Promise<void>;

  /**
   * Subscribe to events with a specific name
   * 
   * @param eventName - Name of events to subscribe to
   * @param handler - Function to handle the event
   */
  subscribe<T>(eventName: string, handler: EventHandler<T>): void;

  /**
   * Unsubscribe from events
   * 
   * @param eventName - Name of events to unsubscribe from
   * @param handler - The handler to remove
   */
  unsubscribe<T>(eventName: string, handler: EventHandler<T>): void;
}
