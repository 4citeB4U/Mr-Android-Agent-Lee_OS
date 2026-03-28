/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.RESULT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = Result module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\types\Result.ts
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
 * Result type for railway-oriented programming
 * 
 * Represents the outcome of an operation that can either succeed with a value
 * or fail with an error. This eliminates the need for exceptions in expected
 * error cases and makes error handling explicit.
 * 
 * @template T - The success value type
 * @template E - The error type (must extend Error)
 * 
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<number, Error> {
 *   if (b === 0) {
 *     return Result.fail(new Error('Division by zero'));
 *   }
 *   return Result.ok(a / b);
 * }
 * 
 * const result = divide(10, 2);
 * if (result.isSuccess()) {
 *   console.log(result.getValue()); // 5
 * }
 * 
 * // Railway-oriented programming (chaining)
 * const final = divide(10, 2)
 *   .map(x => x * 2)
 *   .flatMap(x => divide(x, 5));
 * ```
 */
export class Result<T, E extends Error = Error> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  /**
   * Create a successful result containing a value
   */
  static ok<T, E extends Error = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  /**
   * Create a failed result containing an error
   */
  static fail<T, E extends Error = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  /**
   * Check if this result represents success
   */
  isSuccess(): boolean {
    return this._isSuccess;
  }

  /**
   * Check if this result represents failure
   */
  isFailure(): boolean {
    return !this._isSuccess;
  }

  /**
   * Get the success value
   * 
   * @throws {Error} If called on a failed result
   */
  getValue(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from failed result');
    }
    return this._value!;
  }

  /**
   * Get the error
   * 
   * @throws {Error} If called on a successful result
   */
  getError(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from successful result');
    }
    return this._error!;
  }

  /**
   * Transform the success value using a function
   * 
   * If this result is a failure, the function is not called and the
   * error is propagated.
   * 
   * @param fn - Function to transform the success value
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isSuccess) {
      return Result.ok(fn(this._value!));
    }
    return Result.fail(this._error!);
  }

  /**
   * Chain operations that return Results (monadic bind)
   * 
   * If this result is a failure, the function is not called and the
   * error is propagated.
   * 
   * @param fn - Function that returns a new Result
   */
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._isSuccess) {
      return fn(this._value!);
    }
    return Result.fail(this._error!);
  }

  /**
   * Pattern match on the result, providing handlers for both cases
   * 
   * @param onSuccess - Handler for success case
   * @param onFailure - Handler for failure case
   * @returns The result of the appropriate handler
   */
  match<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U {
    if (this._isSuccess) {
      return onSuccess(this._value!);
    }
    return onFailure(this._error!);
  }
}
