/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.TIMEOUTERROR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = TimeoutError module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\TimeoutError.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { DomainError } from './DomainError.js';

/**
 * Error thrown when an operation times out
 * 
 * Captures:
 * - Operation name
 * - Timeout duration
 * - Elapsed time
 * 
 * @example
 * ```typescript
 * throw new TimeoutError(
 *   'API request',
 *   5000,  // 5 second timeout
 *   4893   // 4.893 seconds elapsed
 * );
 * ```
 */
export class TimeoutError extends DomainError {
  constructor(operation: string, timeoutMs: number, elapsedMs?: number) {
    const message = `Operation '${operation}' timed out after ${timeoutMs}ms`;
    super('TIMEOUT_ERROR', message, {
      operation,
      timeoutMs,
      elapsedMs,
    });
  }

  /**
   * Get timeout duration in milliseconds
   */
  getTimeoutMs(): number {
    return this.context?.timeoutMs as number;
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsedMs(): number | undefined {
    return this.context?.elapsedMs as number | undefined;
  }
}
