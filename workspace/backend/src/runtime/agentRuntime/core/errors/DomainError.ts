/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.DOMAINERROR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = DomainError module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\DomainError.ts
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
 * Base class for all domain errors
 * 
 * Provides structured error information with error codes and optional context.
 * All domain-specific errors should extend this class.
 * 
 * @example
 * ```typescript
 * class UserNotFoundError extends DomainError {
 *   constructor(userId: string) {
 *     super('USER_NOT_FOUND', `User ${userId} not found`, { userId });
 *   }
 * }
 * ```
 */
export abstract class DomainError extends Error {
  /**
   * @param code - Machine-readable error code (e.g., 'INVALID_INPUT')
   * @param message - Human-readable error message
   * @param context - Optional structured context data
   */
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize error to JSON for logging/transport
   */
  toJSON(): {
    name: string;
    code: string;
    message: string;
    context?: Record<string, unknown>;
  } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
    };
  }
}
