/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ERRORRECOVERY.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ErrorRecovery module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\ErrorRecovery.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { Result } from '../types/Result.js';

/**
 * Recovery strategy type
 */
export type RecoveryStrategy<T> = (error: Error) => Promise<T> | T;

/**
 * Fallback configuration
 */
export interface FallbackConfig<T> {
  /** Primary operation to attempt */
  operation: () => Promise<T>;
  /** Fallback operation if primary fails */
  fallback: RecoveryStrategy<T>;
  /** Optional predicate to determine if fallback should be used */
  shouldFallback?: (error: Error) => boolean;
}

/**
 * Degradation level
 */
export enum DegradationLevel {
  /** Full functionality */
  NONE = 'NONE',
  /** Minor features disabled */
  PARTIAL = 'PARTIAL',
  /** Core functionality only */
  REDUCED = 'REDUCED',
  /** Minimal functionality */
  MINIMAL = 'MINIMAL',
}

/**
 * Degraded result with level indicator
 */
export interface DegradedResult<T> {
  value: T;
  level: DegradationLevel;
  reason?: string;
}

/**
 * ErrorRecovery - Graceful degradation and recovery patterns
 * 
 * Provides:
 * - Fallback strategies
 * - Graceful degradation
 * - Error transformation
 * - Safe defaults
 * 
 * @example
 * ```typescript
 * // Fallback to default value
 * const value = await ErrorRecovery.withFallback(
 *   () => loadConfig(),
 *   () => defaultConfig
 * );
 * 
 * // Graceful degradation
 * const result = await ErrorRecovery.withDegradation(
 *   () => loadAdvancedFeature(),
 *   () => loadBasicFeature(),
 *   DegradationLevel.PARTIAL
 * );
 * ```
 */
export class ErrorRecovery {
  /**
   * Execute operation with fallback
   * 
   * If primary operation fails, use fallback value/strategy
   */
  static async withFallback<T>(config: FallbackConfig<T>): Promise<T>;
  static async withFallback<T>(
    operation: () => Promise<T>,
    fallback: RecoveryStrategy<T>,
    shouldFallback?: (error: Error) => boolean
  ): Promise<T>;
  static async withFallback<T>(
    operationOrConfig: (() => Promise<T>) | FallbackConfig<T>,
    fallback?: RecoveryStrategy<T>,
    shouldFallback?: (error: Error) => boolean
  ): Promise<T> {
    const config: FallbackConfig<T> =
      typeof operationOrConfig === 'function'
        ? {
            operation: operationOrConfig,
            fallback: fallback!,
            shouldFallback,
          }
        : operationOrConfig;

    try {
      return await config.operation();
    } catch (error) {
      // Check if fallback should be used
      if (config.shouldFallback && !config.shouldFallback(error as Error)) {
        throw error;
      }

      // Use fallback
      return await config.fallback(error as Error);
    }
  }

  /**
   * Execute operation with graceful degradation
   * 
   * If primary fails, use degraded version with level indicator
   */
  static async withDegradation<T>(
    primary: () => Promise<T>,
    degraded: RecoveryStrategy<T>,
    level: DegradationLevel,
    reason?: string
  ): Promise<DegradedResult<T>> {
    try {
      const value = await primary();
      return {
        value,
        level: DegradationLevel.NONE,
      };
    } catch (error) {
      const value = await degraded(error as Error);
      return {
        value,
        level,
        reason: reason || (error as Error).message,
      };
    }
  }

  /**
   * Execute operation with default value on failure
   */
  static async withDefault<T>(operation: () => Promise<T>, defaultValue: T): Promise<T> {
    return this.withFallback(operation, () => defaultValue);
  }

  /**
   * Execute operation and transform errors
   * 
   * Convert one error type to another (e.g., SDK errors to domain errors)
   */
  static async withTransform<T, E extends Error>(
    operation: () => Promise<T>,
    transform: (error: Error) => E
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw transform(error as Error);
    }
  }

  /**
   * Execute operation as Result<T, E>
   * 
   * Convert exceptions to Result failures
   */
  static async toResult<T>(operation: () => Promise<T>): Promise<Result<T, Error>> {
    try {
      const value = await operation();
      return Result.ok(value);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  /**
   * Execute multiple operations and return first success
   * 
   * Useful for trying multiple fallback strategies
   */
  static async firstSuccess<T>(operations: Array<() => Promise<T>>): Promise<T> {
    const errors: Error[] = [];

    for (const operation of operations) {
      try {
        return await operation();
      } catch (error) {
        errors.push(error as Error);
      }
    }

    // All operations failed
    throw new AggregateError(
      errors,
      `All ${operations.length} operations failed`
    );
  }

  /**
   * Execute operation with timeout and fallback
   */
  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    fallback: RecoveryStrategy<T>
  ): Promise<T> {
    return this.withFallback(
      () => this.executeWithTimeout(operation, timeoutMs),
      fallback,
      (error) => error.message.toLowerCase().includes('timeout') || error.message.includes('timed out')
    );
  }

  /**
   * Execute operation with a timeout
   */
  private static async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Safe array mapping with error recovery
   * 
   * Continue processing even if some items fail
   */
  static async mapWithRecovery<T, U>(
    items: T[],
    mapper: (item: T, index: number) => Promise<U>,
    onError?: (error: Error, item: T, index: number) => U | null
  ): Promise<Array<U | null>> {
    const results = await Promise.all(
      items.map(async (item, index) => {
        try {
          return await mapper(item, index);
        } catch (error) {
          if (onError) {
            return onError(error as Error, item, index);
          }
          return null;
        }
      })
    );

    return results;
  }

  /**
   * Filter out null results from mapWithRecovery
   */
  static filterSuccesses<T>(results: Array<T | null>): T[] {
    return results.filter((r): r is T => r !== null);
  }

  /**
   * Execute operation with partial success handling
   * 
   * Returns both successes and failures
   */
  static async partialSuccess<T>(
    operations: Array<() => Promise<T>>
  ): Promise<{
    successes: T[];
    failures: Array<{ index: number; error: Error }>;
  }> {
    const successes: T[] = [];
    const failures: Array<{ index: number; error: Error }> = [];

    await Promise.all(
      operations.map(async (operation, index) => {
        try {
          const result = await operation();
          successes.push(result);
        } catch (error) {
          failures.push({ index, error: error as Error });
        }
      })
    );

    return { successes, failures };
  }

  /**
   * Ignore specific errors and continue
   */
  static async ignoreErrors<T>(
    operation: () => Promise<T>,
    shouldIgnore: (error: Error) => boolean,
    defaultValue?: T
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      if (shouldIgnore(error as Error)) {
        return defaultValue;
      }
      throw error;
    }
  }

  /**
   * Combine multiple recovery strategies
   * 
   * Try each recovery in order until one succeeds
   */
  static async withRecoveryChain<T>(
    operation: () => Promise<T>,
    recoveries: Array<RecoveryStrategy<T>>
  ): Promise<T> {
    try {
      return await operation();
    } catch (primaryError) {
      // Try each recovery strategy
      for (const recovery of recoveries) {
        try {
          return await recovery(primaryError as Error);
        } catch {
          // Continue to next recovery
        }
      }

      // All recoveries failed - throw original error
      throw primaryError;
    }
  }
}
