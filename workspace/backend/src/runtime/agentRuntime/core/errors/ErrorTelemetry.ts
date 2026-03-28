/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ERRORTELEMETRY.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ErrorTelemetry module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\ErrorTelemetry.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { IEventBus } from '../interfaces/IEventBus.js';
import { ILogger } from '../interfaces/ILogger.js';
import { ErrorEvent } from './ErrorEvent.js';

/**
 * Centralized error telemetry service
 * 
 * Responsibilities:
 * - Emit error events for monitoring
 * - Aggregate errors for debugging
 * - Track error rates
 * - Log errors consistently
 * 
 * @example
 * ```typescript
 * const telemetry = new ErrorTelemetry(eventBus, logger);
 * 
 * // Record an error
 * await telemetry.recordError(
 *   error,
 *   'PluginLoader',
 *   true,
 *   'Retrying'
 * );
 * 
 * // Get error stats
 * const stats = telemetry.getStats();
 * ```
 */
export class ErrorTelemetry {
  private errorCounts = new Map<string, number>();
  private lastErrors = new Map<string, Date>();
  private totalErrors = 0;

  constructor(
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  /**
   * Record an error occurrence
   */
  async recordError(
    error: Error,
    source: string,
    recoverable = false,
    recoveryAction?: string
  ): Promise<void> {
    // Create error event
    const event = ErrorEvent.create(error, source, recoverable, recoveryAction);

    // Update counters
    const errorCode = event.payload.code;
    this.errorCounts.set(errorCode, (this.errorCounts.get(errorCode) || 0) + 1);
    this.lastErrors.set(errorCode, new Date());
    this.totalErrors++;

    // Emit event
    await this.eventBus.publish(event);

    // Log based on severity
    this.logError(event);
  }

  /**
   * Record a recoverable error with automatic recovery action
   */
  async recordRecoverableError(
    error: Error,
    source: string,
    recoveryAction: string
  ): Promise<void> {
    await this.recordError(error, source, true, recoveryAction);
  }

  /**
   * Record a critical error
   */
  async recordCriticalError(error: Error, source: string): Promise<void> {
    const event = ErrorEvent.create(error, source, false);
    event.payload.severity = 'critical';

    await this.eventBus.publish(event);
    this.logger.error(`CRITICAL ERROR in ${source}`, error, event.payload.context);
  }

  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    byCode: Record<string, number>;
    recent: Array<{ code: string; lastOccurred: Date }>;
  } {
    const byCode: Record<string, number> = {};
    this.errorCounts.forEach((count, code) => {
      byCode[code] = count;
    });

    const recent: Array<{ code: string; lastOccurred: Date }> = [];
    this.lastErrors.forEach((date, code) => {
      recent.push({ code, lastOccurred: date });
    });

    // Sort recent by date (most recent first)
    recent.sort((a, b) => b.lastOccurred.getTime() - a.lastOccurred.getTime());

    return {
      total: this.totalErrors,
      byCode,
      recent: recent.slice(0, 10), // Last 10 errors
    };
  }

  /**
   * Check if error is recurring (happened recently)
   */
  isRecurring(errorCode: string, withinMs = 60000): boolean {
    const lastOccurrence = this.lastErrors.get(errorCode);
    if (!lastOccurrence) {
      return false;
    }

    const timeSinceMs = Date.now() - lastOccurrence.getTime();
    return timeSinceMs < withinMs;
  }

  /**
   * Get error count for specific code
   */
  getErrorCount(errorCode: string): number {
    return this.errorCounts.get(errorCode) || 0;
  }

  /**
   * Reset statistics (useful for testing)
   */
  reset(): void {
    this.errorCounts.clear();
    this.lastErrors.clear();
    this.totalErrors = 0;
  }

  /**
   * Log error based on severity
   */
  private logError(event: ErrorEvent): void {
    const { severity, message, source, code, recoveryAction } = event.payload;

    const context = {
      code,
      source,
      recoveryAction,
      ...event.payload.context,
    };

    switch (severity) {
      case 'critical':
        this.logger.error(`CRITICAL: ${message}`, new Error(message), context);
        break;
      case 'error':
        this.logger.error(message, new Error(message), context);
        break;
      case 'warning':
        this.logger.warn(message, context);
        break;
      case 'info':
        this.logger.info(message, context);
        break;
    }
  }
}
