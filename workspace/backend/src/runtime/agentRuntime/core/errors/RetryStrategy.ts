/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.RETRYSTRATEGY.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = RetryStrategy module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\RetryStrategy.ts
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
 * Retry configuration and policy
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Backoff multiplier (e.g., 2 for exponential) */
  backoffMultiplier: number;
  /** Predicate to determine if error is retryable */
  isRetryable?: (error: Error) => boolean;
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  attemptNumber: number;
  totalAttempts: number;
  delayMs: number;
  error: Error;
}

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject immediately
  HALF_OPEN = 'HALF_OPEN', // Testing if recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time in ms to wait before trying again */
  resetTimeoutMs: number;
  /** Number of successes needed to close circuit */
  successThreshold: number;
}

/**
 * RetryStrategy - Reusable retry logic with exponential backoff and circuit breaker
 * 
 * @example
 * ```typescript
 * const strategy = new RetryStrategy({
 *   maxRetries: 3,
 *   initialDelayMs: 1000,
 *   maxDelayMs: 10000,
 *   backoffMultiplier: 2
 * });
 * 
 * const result = await strategy.execute(async () => {
 *   return await riskyOperation();
 * });
 * ```
 */
export class RetryStrategy {
  private config: RetryConfig;
  private circuitBreaker?: CircuitBreakerState;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      initialDelayMs: config.initialDelayMs ?? 1000,
      maxDelayMs: config.maxDelayMs ?? 30000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      isRetryable: config.isRetryable ?? this.defaultIsRetryable,
    };
  }

  /**
   * Enable circuit breaker pattern
   */
  withCircuitBreaker(config: Partial<CircuitBreakerConfig> = {}): this {
    this.circuitBreaker = new CircuitBreakerState({
      failureThreshold: config.failureThreshold ?? 5,
      resetTimeoutMs: config.resetTimeoutMs ?? 60000,
      successThreshold: config.successThreshold ?? 2,
    });
    return this;
  }

  /**
   * Execute an operation with retry logic
   */
  async execute<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: RetryAttempt) => void
  ): Promise<T> {
    // Check circuit breaker
    if (this.circuitBreaker?.isOpen()) {
      throw new Error('Circuit breaker is OPEN - too many failures');
    }

    let lastError: Error;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        const result = await operation();
        
        // Success - record for circuit breaker
        this.circuitBreaker?.recordSuccess();
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!this.config.isRetryable!(lastError)) {
          // Non-retryable error - fail immediately
          this.circuitBreaker?.recordFailure();
          throw lastError;
        }

        // Check if we've exhausted retries
        if (attempt >= this.config.maxRetries) {
          this.circuitBreaker?.recordFailure();
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delayMs = this.calculateDelay(attempt);

        // Notify caller of retry
        if (onRetry) {
          onRetry({
            attemptNumber: attempt + 1,
            totalAttempts: this.config.maxRetries + 1,
            delayMs,
            error: lastError,
          });
        }

        // Wait before retrying
        await this.delay(delayMs);

        attempt++;
      }
    }

    // Should never reach here, but TypeScript doesn't know that
    throw lastError!;
  }

  /**
   * Execute with explicit retry condition
   */
  async executeWhile<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: Error, attempt: number) => boolean,
    onRetry?: (attempt: RetryAttempt) => void
  ): Promise<T> {
    const originalRetryable = this.config.isRetryable;
    let currentAttempt = 0;

    this.config.isRetryable = (error: Error) => {
      return shouldRetry(error, currentAttempt);
    };

    try {
      return await this.execute(operation, (attempt) => {
        currentAttempt = attempt.attemptNumber;
        if (onRetry) {
          onRetry(attempt);
        }
      });
    } finally {
      this.config.isRetryable = originalRetryable;
    }
  }

  /**
   * Calculate delay for retry attempt
   */
  private calculateDelay(attempt: number): number {
    const delay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt);
    return Math.min(delay, this.config.maxDelayMs);
  }

  /**
   * Default retry condition - retry on transient errors
   */
  private defaultIsRetryable(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Network errors
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('etimedout')
    ) {
      return true;
    }

    // Temporary failures
    if (message.includes('temporary') || message.includes('unavailable')) {
      return true;
    }

    // Check HTTP status codes
    const statusCode = (error as any).statusCode || (error as any).status;
    if (statusCode) {
      // 429 (rate limit) and 5xx (server errors) are retryable
      if (statusCode === 429 || (statusCode >= 500 && statusCode < 600)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current circuit breaker state
   */
  getCircuitState(): CircuitState | null {
    return this.circuitBreaker?.getState() ?? null;
  }

  /**
   * Reset circuit breaker (for testing)
   */
  resetCircuit(): void {
    this.circuitBreaker?.reset();
  }
}

/**
 * Circuit breaker state management
 */
class CircuitBreakerState {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.close();
      }
    } else {
      this.failureCount = 0;
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.failureCount >= this.config.failureThreshold) {
      this.open();
    }
  }

  isOpen(): boolean {
    if (this.state === CircuitState.OPEN) {
      // Check if reset timeout has elapsed
      const now = Date.now();
      if (now - this.lastFailureTime >= this.config.resetTimeoutMs) {
        this.halfOpen();
        return false;
      }
      return true;
    }
    return false;
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }

  private open(): void {
    this.state = CircuitState.OPEN;
  }

  private halfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;
  }

  private close(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }
}
