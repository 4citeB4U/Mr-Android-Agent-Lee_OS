/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.PLUGINERROR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = PluginError module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\PluginError.ts
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
 * Error thrown when plugin operations fail
 * 
 * @example
 * ```typescript
 * if (!manifest.version) {
 *   throw new PluginError('INVALID_MANIFEST', 'Plugin manifest missing version', { path });
 * }
 * ```
 */
export class PluginError extends DomainError {
  constructor(code: string, message: string, context?: Record<string, unknown>) {
    super(code, message, context);
  }
}
