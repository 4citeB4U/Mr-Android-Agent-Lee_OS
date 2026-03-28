/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.OPTION.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = Option module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\types\Option.ts
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
 * Option type for handling nullable values
 * 
 * Represents a value that may or may not exist. This eliminates the need
 * for null/undefined checks and makes absence explicit.
 * 
 * @template T - The value type
 * 
 * @example
 * ```typescript
 * function findUser(id: string): Option<User> {
 *   const user = database.get(id);
 *   return user ? Option.some(user) : Option.none();
 * }
 * 
 * const user = findUser('123');
 * const name = user
 *   .map(u => u.name)
 *   .unwrapOr('Unknown');
 * ```
 */
export class Option<T> {
  private constructor(
    private readonly _value: T | undefined,
    private readonly _isSome: boolean
  ) {}

  /**
   * Create an Option containing a value
   */
  static some<T>(value: T): Option<T> {
    return new Option(value, true);
  }

  /**
   * Create an Option representing no value
   */
  static none<T>(): Option<T> {
    return new Option<T>(undefined, false);
  }

  /**
   * Check if this option contains a value
   */
  isSome(): boolean {
    return this._isSome;
  }

  /**
   * Check if this option contains no value
   */
  isNone(): boolean {
    return !this._isSome;
  }

  /**
   * Get the contained value
   * 
   * @throws {Error} If called on None
   */
  unwrap(): T {
    if (this.isNone()) {
      throw new Error('Cannot unwrap None');
    }
    return this._value!;
  }

  /**
   * Get the contained value or return a default
   * 
   * @param defaultValue - Value to return if this is None
   */
  unwrapOr(defaultValue: T): T {
    return this.isSome() ? this._value! : defaultValue;
  }

  /**
   * Transform the contained value using a function
   * 
   * If this is None, the function is not called and None is returned.
   * 
   * @param fn - Function to transform the value
   */
  map<U>(fn: (value: T) => U): Option<U> {
    return this.isSome() ? Option.some(fn(this._value!)) : Option.none();
  }
}
