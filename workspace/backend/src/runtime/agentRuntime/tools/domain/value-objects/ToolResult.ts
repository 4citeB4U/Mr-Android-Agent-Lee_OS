/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.TOOLRESULT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ToolResult module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\domain\value-objects\ToolResult.ts
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
 * ToolResult - Value object representing the result of tool execution
 * 
 * Wraps either successful execution data or an error.
 * Similar to Result<T, E> but specialized for tool execution results.
 * 
 * @example
 * ```typescript
 * // Success case
 * const result = ToolResult.success({ temperature: 20, condition: 'sunny' });
 * if (result.isSuccess()) {
 *   console.log(result.getData());
 * }
 * 
 * // Error case
 * const errorResult = ToolResult.error(new Error('API unavailable'));
 * if (!errorResult.isSuccess()) {
 *   console.error(errorResult.getError());
 * }
 * ```
 */
export class ToolResult {
  private constructor(
    private readonly success: boolean,
    private readonly data?: unknown,
    private readonly error?: Error
  ) {}

  /**
   * Create a successful tool result
   * 
   * @param data - The result data from tool execution
   */
  static success(data: unknown): ToolResult {
    return new ToolResult(true, data, undefined);
  }

  /**
   * Create a failed tool result
   * 
   * @param error - The error that occurred during tool execution
   */
  static error(error: Error): ToolResult {
    return new ToolResult(false, undefined, error);
  }

  /**
   * Check if the tool execution was successful
   */
  isSuccess(): boolean {
    return this.success;
  }

  /**
   * Check if the tool execution failed
   */
  isError(): boolean {
    return !this.success;
  }

  /**
   * Get the success data
   * 
   * @throws {Error} If called on an error result
   */
  getData(): unknown {
    if (!this.success) {
      throw new Error('Cannot get data from error result');
    }
    return this.data;
  }

  /**
   * Get the error
   * 
   * @throws {Error} If called on a success result
   */
  getError(): Error {
    if (this.success) {
      throw new Error('Cannot get error from success result');
    }
    return this.error!;
  }

  /**
   * Convert to plain object representation
   * Useful for serialization or logging
   */
  toObject(): {
    success: boolean;
    data?: unknown;
    error?: { message: string; name: string };
  } {
    if (this.success) {
      return {
        success: true,
        data: this.data,
      };
    } else {
      return {
        success: false,
        error: {
          name: this.error!.name,
          message: this.error!.message,
        },
      };
    }
  }

  /**
   * Get string representation
   */
  toString(): string {
    if (this.success) {
      return `ToolResult.success(${JSON.stringify(this.data)})`;
    } else {
      return `ToolResult.error(${this.error!.message})`;
    }
  }
}
