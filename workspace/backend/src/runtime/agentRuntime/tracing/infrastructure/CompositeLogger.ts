/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.COMPOSITELOGGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = CompositeLogger module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tracing\infrastructure\CompositeLogger.ts
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
 * CompositeLogger — fans out log calls to multiple ILogger implementations.
 * 
 * One logger failing does not break the others.
 */

import { ILogger } from '../../core/interfaces/ILogger.js';

export class CompositeLogger implements ILogger {
  constructor(private readonly loggers: ILogger[]) {}

  debug(message: string, context?: Record<string, unknown>): void {
    for (const logger of this.loggers) {
      try { logger.debug(message, context); } catch { /* swallow */ }
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    for (const logger of this.loggers) {
      try { logger.info(message, context); } catch { /* swallow */ }
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    for (const logger of this.loggers) {
      try { logger.warn(message, context); } catch { /* swallow */ }
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    for (const logger of this.loggers) {
      try { logger.error(message, error, context); } catch { /* swallow */ }
    }
  }
}
