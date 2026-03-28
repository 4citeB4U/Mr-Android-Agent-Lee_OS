/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ERRORCLASSIFIER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ErrorClassifier module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\embeddings\logic\ErrorClassifier.ts
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
 * ErrorClassifier - Pure functions for classifying API errors
 * 
 * Determines if errors are retryable and what strategy to use.
 * Part of Functional Core (pure, testable).
 */

export type RetryStrategy = 
  | 'retry'                  // Simple retry
  | 'exponential_backoff'    // Retry with exponential backoff
  | 'fallback_to_local'      // Switch to local provider
  | 'error';                 // Fatal, no recovery

export interface ErrorClassification {
  /** Whether the error can be retried */
  retryable: boolean;
  
  /** Retry strategy to use */
  strategy: RetryStrategy;
  
  /** Human-readable reason */
  reason: string;
}

export interface ApiError {
  status?: number;
  code?: string;
  message: string;
}

export class ErrorClassifier {
  /**
   * Classify an error and determine retry strategy
   * 
   * @param error - Error object (typically from API response)
   * @returns Classification with retry strategy
   */
  static classify(error: ApiError): ErrorClassification {
    // Rate limit errors (429) - retry with backoff
    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      return {
        retryable: true,
        strategy: 'exponential_backoff',
        reason: 'Rate limit exceeded - will retry with backoff',
      };
    }

    // Authentication errors (401, 403) - fallback to local
    if (error.status === 401 || error.status === 403 || 
        error.code === 'invalid_api_key') {
      return {
        retryable: false,
        strategy: 'fallback_to_local',
        reason: 'Authentication failed - falling back to local provider',
      };
    }

    // Server errors (500-599) - simple retry
    if (error.status && error.status >= 500 && error.status < 600) {
      return {
        retryable: true,
        strategy: 'retry',
        reason: 'Server error - will retry',
      };
    }

    // Network errors (connection reset, timeout) - simple retry
    if (error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND') {
      return {
        retryable: true,
        strategy: 'retry',
        reason: 'Network error - will retry',
      };
    }

    // Client errors (400-499 except 401/403/429) - fatal
    if (error.status && error.status >= 400 && error.status < 500) {
      return {
        retryable: false,
        strategy: 'error',
        reason: 'Client error - request malformed',
      };
    }

    // Unknown errors - don't retry
    return {
      retryable: false,
      strategy: 'error',
      reason: 'Unknown error - not retrying',
    };
  }

  /**
   * Check if an error should trigger fallback to local provider
   * 
   * @param error - Error object
   * @returns true if should fallback
   */
  static shouldFallbackToLocal(error: ApiError): boolean {
    const classification = this.classify(error);
    return classification.strategy === 'fallback_to_local';
  }

  /**
   * Calculate retry delay based on attempt number
   * 
   * @param attemptNumber - Current attempt (1-indexed)
   * @param strategy - Retry strategy
   * @returns Delay in milliseconds
   */
  static calculateRetryDelay(
    attemptNumber: number,
    strategy: RetryStrategy
  ): number {
    if (strategy === 'exponential_backoff') {
      // 1s, 2s, 4s, 8s, 16s (max 16s)
      return Math.min(1000 * Math.pow(2, attemptNumber - 1), 16000);
    }

    if (strategy === 'retry') {
      // Fixed 1s delay
      return 1000;
    }

    // No retry for other strategies
    return 0;
  }
}
