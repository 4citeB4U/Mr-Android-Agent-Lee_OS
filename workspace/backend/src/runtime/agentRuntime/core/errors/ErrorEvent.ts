/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ERROREVENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ErrorEvent module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\ErrorEvent.ts
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
 * Event emitted when an error occurs
 * 
 * Used for error tracking, monitoring, and debugging
 */
export interface ErrorEventPayload {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Error severity */
  severity: 'info' | 'warning' | 'error' | 'critical';
  /** Where the error occurred */
  source: string;
  /** Structured context */
  context?: Record<string, unknown>;
  /** Stack trace */
  stack?: string;
  /** Timestamp */
  timestamp: Date;
  /** Whether error is recoverable */
  recoverable: boolean;
  /** Recovery action taken (if any) */
  recoveryAction?: string;
}

/**
 * Domain event for error occurrences
 * 
 * @example
 * ```typescript
 * const event = ErrorEvent.create(
 *   error,
 *   'PluginOrchestrator',
 *   true,
 *   'Retrying with exponential backoff'
 * );
 * 
 * await eventBus.publish(event);
 * ```
 */
export class ErrorEvent {
  static readonly EVENT_NAME = 'error.occurred';

  constructor(
    public readonly eventName: string,
    public readonly occurredAt: Date,
    public readonly payload: ErrorEventPayload
  ) {}

  /**
   * Create ErrorEvent from an Error instance
   */
  static create(
    error: Error,
    source: string,
    recoverable = false,
    recoveryAction?: string
  ): ErrorEvent {
    const payload: ErrorEventPayload = {
      code: (error as any).code || 'UNKNOWN_ERROR',
      message: error.message,
      severity: ErrorEvent.inferSeverity(error),
      source,
      context: (error as any).context,
      stack: error.stack,
      timestamp: new Date(),
      recoverable,
      recoveryAction,
    };

    return new ErrorEvent(this.EVENT_NAME, new Date(), payload);
  }

  /**
   * Infer severity from error type
   */
  private static inferSeverity(error: Error): 'info' | 'warning' | 'error' | 'critical' {
    const message = error.message.toLowerCase();

    // Critical errors
    if (
      message.includes('fatal') ||
      message.includes('crash') ||
      message.includes('corrupt')
    ) {
      return 'critical';
    }

    // Warnings
    if (
      message.includes('deprecated') ||
      message.includes('rate limit') ||
      message.includes('timeout')
    ) {
      return 'warning';
    }

    // Info
    if (message.includes('not found') || message.includes('missing')) {
      return 'info';
    }

    // Default to error
    return 'error';
  }
}
