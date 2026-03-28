/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.RATELIMITERROR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = RateLimitError module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\RateLimitError.ts
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
 * Error thrown when rate limit is exceeded
 * 
 * Captures:
 * - Retry after time
 * - Current limit
 * - Reset time
 * 
 * @example
 * ```typescript
 * throw new RateLimitError(
 *   'API',
 *   60000,  // Retry after 60 seconds
 *   { limit: 100, remaining: 0 }
 * );
 * ```
 */
export class RateLimitError extends DomainError {
  constructor(
    resource: string,
    retryAfterMs?: number,
    context?: {
      limit?: number;
      remaining?: number;
      reset?: Date;
    }
  ) {
    const message = retryAfterMs
      ? `Rate limit exceeded for ${resource}. Retry after ${retryAfterMs}ms`
      : `Rate limit exceeded for ${resource}`;

    super('RATE_LIMIT_ERROR', message, {
      resource,
      retryAfterMs,
      ...context,
    });
  }

  /**
   * Get retry-after time in milliseconds
   */
  getRetryAfterMs(): number | undefined {
    return this.context?.retryAfterMs as number | undefined;
  }

  /**
   * Get reset time
   */
  getResetTime(): Date | undefined {
    return this.context?.reset as Date | undefined;
  }
}
