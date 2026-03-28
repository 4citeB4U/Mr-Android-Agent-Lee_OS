/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ITRACER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ITracer module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\interfaces\ITracer.ts
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
 * Span interface for distributed tracing
 * 
 * Represents a single unit of work in a distributed trace. Spans can have
 * attributes, events, and status to describe the operation being traced.
 */
export interface ISpan {
  /**
   * Set an attribute on this span
   * 
   * @param key - Attribute name
   * @param value - Attribute value (string, number, or boolean)
   */
  setAttribute(key: string, value: string | number | boolean): void;

  /**
   * Add an event to this span
   * 
   * @param name - Event name
   * @param attributes - Optional event attributes
   */
  addEvent(name: string, attributes?: Record<string, unknown>): void;

  /**
   * Set the status of this span
   * 
   * @param status - 'ok' for success, 'error' for failure
   * @param message - Optional status message
   */
  setStatus(status: 'ok' | 'error', message?: string): void;

  /**
   * End this span, recording its completion time
   */
  end(): void;
}

/**
 * Tracer interface for creating and managing spans
 * 
 * Provides methods for instrumenting code with distributed tracing.
 * Compatible with OpenTelemetry standards.
 * 
 * @example
 * ```typescript
 * await tracer.span('loadPlugin', async (span) => {
 *   span.setAttribute('plugin.name', name);
 *   const plugin = await loadFromDisk(path);
 *   span.setStatus('ok');
 *   return plugin;
 * });
 * ```
 */
export interface ITracer {
  /**
   * Create a new span and execute a function within its context
   * 
   * The span will automatically end when the function completes, whether
   * it succeeds or throws an error.
   * 
   * @param name - Span name describing the operation
   * @param fn - Function to execute within the span
   * @returns The function's return value
   */
  span<T>(name: string, fn: (span: ISpan) => T | Promise<T>): Promise<T>;

  /**
   * Create a child span within the current context
   * 
   * @param name - Span name describing the operation
   * @param fn - Function to execute within the child span
   * @returns The function's return value
   */
  childSpan<T>(name: string, fn: (span: ISpan) => T | Promise<T>): Promise<T>;
}
