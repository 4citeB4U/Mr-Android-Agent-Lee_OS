/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ILOGGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ILogger module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\interfaces\ILogger.ts
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
 * Logger interface for structured logging
 * 
 * Provides methods for logging at different severity levels with optional
 * structured context. Implementations should handle formatting, output
 * destination, and log level filtering.
 * 
 * @example
 * ```typescript
 * logger.info('User logged in', { userId: '123', timestamp: Date.now() });
 * logger.error('Failed to save', error, { operation: 'save', retries: 3 });
 * ```
 */
export interface ILogger {
  /**
   * Log a debug message (verbose, for development)
   * 
   * @param message - The log message
   * @param context - Optional structured context data
   */
  debug(message: string, context?: Record<string, unknown>): void;

  /**
   * Log an informational message
   * 
   * @param message - The log message
   * @param context - Optional structured context data
   */
  info(message: string, context?: Record<string, unknown>): void;

  /**
   * Log a warning message
   * 
   * @param message - The log message
   * @param context - Optional structured context data
   */
  warn(message: string, context?: Record<string, unknown>): void;

  /**
   * Log an error message
   * 
   * @param message - The log message
   * @param error - Optional error object
   * @param context - Optional structured context data
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
}
