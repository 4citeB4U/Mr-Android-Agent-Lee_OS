/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CONFIGURATIONERROR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ConfigurationError module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\ConfigurationError.ts
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
 * Error thrown when configuration is invalid or missing
 * 
 * @example
 * ```typescript
 * if (!config.apiKey) {
 *   throw new ConfigurationError('MISSING_API_KEY', 'API key is required');
 * }
 * ```
 */
export class ConfigurationError extends DomainError {
  constructor(code: string, message: string, context?: Record<string, unknown>) {
    super(code, message, context);
  }
}
