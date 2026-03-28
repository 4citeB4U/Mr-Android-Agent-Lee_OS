/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.NOTFOUNDERROR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = NotFoundError module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\NotFoundError.ts
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
 * Error thrown when a requested resource cannot be found
 * 
 * @example
 * ```typescript
 * if (!plugin) {
 *   throw new NotFoundError('PLUGIN_NOT_FOUND', `Plugin ${name} not found`, { name });
 * }
 * ```
 */
export class NotFoundError extends DomainError {
  constructor(code: string, message: string, context?: Record<string, unknown>) {
    super(code, message, context);
  }
}
