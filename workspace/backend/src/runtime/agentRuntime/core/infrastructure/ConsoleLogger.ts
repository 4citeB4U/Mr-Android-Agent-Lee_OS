/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CONSOLELOGGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ConsoleLogger module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\infrastructure\ConsoleLogger.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { ILogger } from '../interfaces/ILogger.js';

/**
 * Log level enumeration
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Console-based logger implementation
 * 
 * Logs to stdout/stderr with structured formatting:
 * - ISO 8601 timestamps
 * - Log level labels
 * - JSON-serialized context
 * - Configurable minimum log level
 * 
 * @example
 * ```typescript
 * const logger = new ConsoleLogger(LogLevel.INFO);
 * logger.info('Server started', { port: 3000 });
 * // Output: [2026-02-20T08:00:00.000Z] INFO: Server started {"port":3000}
 * ```
 */
export class ConsoleLogger implements ILogger {
  /**
   * @param minLevel - Minimum log level to output (default: INFO)
   */
  constructor(private readonly minLevel: LogLevel = LogLevel.INFO) {}

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.DEBUG) {
      console.debug(this.format('DEBUG', message, context));
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.INFO) {
      console.info(this.format('INFO', message, context));
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.WARN) {
      console.warn(this.format('WARN', message, context));
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (this.minLevel <= LogLevel.ERROR) {
      const errorContext = error
        ? { error: error.message, stack: error.stack }
        : {};
      const mergedContext = context
        ? { ...context, ...errorContext }
        : errorContext;
      console.error(this.format('ERROR', message, mergedContext));
    }
  }

  /**
   * Format log message with timestamp, level, and context
   */
  private format(
    level: string,
    message: string,
    context?: Record<string, unknown>
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr =
      context && Object.keys(context).length > 0
        ? ` ${safeStringify(context)}`
        : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }
}

function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    try {
      const seen = new WeakSet();
      return JSON.stringify(obj, (_key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        return value;
      });
    } catch {
      return '[Unserializable]';
    }
  }
}
