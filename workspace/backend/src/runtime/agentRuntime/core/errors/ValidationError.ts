/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.VALIDATIONERROR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ValidationError module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\ValidationError.ts
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
 * Error thrown when input validation fails
 * 
 * @example
 * ```typescript
 * if (!isValidEmail(email)) {
 *   throw new ValidationError('INVALID_EMAIL', 'Email format is invalid', { email });
 * }
 * ```
 */
export class ValidationError extends DomainError {
  constructor(code: string, message: string, context?: Record<string, unknown>) {
    super(code, message, context);
  }
}
