/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ERRORHANDLERS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ErrorHandlers module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\infrastructure\ErrorHandlers.ts
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
 * Global error handlers for process-level safety.
 *
 * Registers handlers for unhandled rejections and uncaught exceptions
 * to prevent silent crashes.
 */

import { ILogger } from '../interfaces/ILogger.js';

/**
 * Install global error handlers that prevent silent crashes.
 *
 * - unhandledRejection: Log and continue (non-fatal)
 * - uncaughtException: Log and exit gracefully (fatal)
 */
export function installGlobalErrorHandlers(logger: ILogger): void {
  process.on('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error
      ? reason
      : new Error(String(reason));

    logger.error('Unhandled promise rejection', error, {
      type: 'unhandledRejection',
    });
  });

  process.on('uncaughtException', (error: Error, origin: string) => {
    logger.error('Uncaught exception — shutting down', error, {
      type: 'uncaughtException',
      origin,
    });

    // Give logger time to flush
    setTimeout(() => process.exit(1), 100);
  });
}

/**
 * Run an async function with error boundary — returns default value on failure.
 * Useful for optional features that shouldn't crash the system.
 */
export async function withErrorBoundary<T>(
  fn: () => Promise<T>,
  fallback: T,
  logger: ILogger,
  context: string,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.warn(`Error boundary caught in ${context}`, {
      error: (error as Error).message,
    });
    return fallback;
  }
}

/**
 * Retry an async operation with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    logger?: ILogger;
    context?: string;
  } = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 30000;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        options.logger?.debug(`Retry ${attempt + 1}/${maxRetries} for ${options.context ?? 'operation'} in ${delay}ms`, {
          error: lastError.message,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
