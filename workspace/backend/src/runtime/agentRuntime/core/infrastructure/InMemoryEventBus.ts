/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.INMEMORYEVENTBUS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = InMemoryEventBus module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\infrastructure\InMemoryEventBus.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { IEventBus, DomainEvent, EventHandler } from '../interfaces/IEventBus.js';
import { ILogger } from '../interfaces/ILogger.js';

/**
 * In-memory event bus implementation
 * 
 * Provides pub/sub messaging for loose coupling between vertical slices.
 * Handlers are executed in parallel for performance, with error isolation
 * to prevent one handler failure from affecting others.
 * 
 * Key features:
 * - Type-safe event handlers
 * - Async handler support (executed in parallel)
 * - Error isolation (handlers don't crash each other)
 * - Logging for debugging
 * - High performance (1000+ events/sec)
 * 
 * @example
 * ```typescript
 * const eventBus = new InMemoryEventBus(logger);
 * 
 * // Subscribe
 * eventBus.subscribe('plugin.loaded', async (event) => {
 *   console.log(`Plugin ${event.payload.name} loaded`);
 * });
 * 
 * // Publish
 * await eventBus.publish({
 *   eventName: 'plugin.loaded',
 *   occurredAt: new Date(),
 *   payload: { name: 'weather', version: '1.0.0' }
 * });
 * ```
 */
export class InMemoryEventBus implements IEventBus {
  /**
   * Map of event names to sets of handlers
   * Using Set ensures no duplicate handlers
   */
  private readonly handlers = new Map<string, Set<EventHandler>>();

  constructor(private readonly logger: ILogger) {}

  /**
   * Publish an event to all subscribers
   * 
   * Handlers are executed in parallel for performance. If a handler throws,
   * the error is logged but does not prevent other handlers from executing.
   * 
   * @param event - The event to publish
   */
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.eventName);

    if (!handlers || handlers.size === 0) {
      this.logger.debug(`No handlers for event: ${event.eventName}`, {
        eventName: event.eventName,
      });
      return;
    }

    this.logger.debug(`Publishing event: ${event.eventName}`, {
      eventName: event.eventName,
      handlerCount: handlers.size,
    });

    // Execute all handlers in parallel with error isolation
    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        // Log error but don't let it crash other handlers
        this.logger.error(
          `Event handler failed for ${event.eventName}`,
          error instanceof Error ? error : new Error(String(error)),
          { eventName: event.eventName }
        );
      }
    });

    // Wait for all handlers to complete (or fail)
    await Promise.all(promises);
  }

  /**
   * Subscribe to events with a specific name
   * 
   * The same handler can only be subscribed once per event name.
   * 
   * @param eventName - Name of events to subscribe to
   * @param handler - Function to handle the event
   */
  subscribe<T>(eventName: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    this.handlers.get(eventName)!.add(handler as EventHandler);

    this.logger.debug(`Subscribed to event: ${eventName}`, {
      eventName,
      handlerCount: this.handlers.get(eventName)!.size,
    });
  }

  /**
   * Unsubscribe from events
   * 
   * Removes the specific handler for the given event name. If the handler
   * was not subscribed, this is a no-op.
   * 
   * @param eventName - Name of events to unsubscribe from
   * @param handler - The handler to remove
   */
  unsubscribe<T>(eventName: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      this.logger.debug(`Unsubscribed from event: ${eventName}`, {
        eventName,
        remainingHandlers: handlers.size,
      });

      // Clean up empty sets
      if (handlers.size === 0) {
        this.handlers.delete(eventName);
      }
    }
  }
}
