/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.TOOLPARAMETER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ToolParameter module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\domain\value-objects\ToolParameter.ts
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
 * ToolParameter - Value object representing a tool parameter
 * 
 * Wraps a parameter name, value, and optional type information.
 * Used for type-safe parameter handling in tool execution.
 * 
 * @example
 * ```typescript
 * const param = ToolParameter.create('location', 'London');
 * console.log(param.name);  // 'location'
 * console.log(param.value); // 'London'
 * ```
 */
export class ToolParameter {
  private constructor(
    public readonly name: string,
    public readonly value: unknown,
    public readonly type?: string
  ) {}

  /**
   * Create a tool parameter
   * 
   * @param name - Parameter name (must not be empty)
   * @param value - Parameter value
   * @param type - Optional type hint
   * @throws {Error} If name is empty
   */
  static create(name: string, value: unknown, type?: string): ToolParameter {
    if (!name || name.trim().length === 0) {
      throw new Error('Parameter name cannot be empty');
    }

    return new ToolParameter(name, value, type);
  }

  /**
   * Create multiple tool parameters from an object
   * 
   * @param params - Object with parameter names and values
   * @returns Array of ToolParameter instances
   * 
   * @example
   * ```typescript
   * const params = ToolParameter.fromObject({
   *   location: 'London',
   *   units: 'metric'
   * });
   * // → [ToolParameter('location', 'London'), ToolParameter('units', 'metric')]
   * ```
   */
  static fromObject(params: Record<string, unknown>): ToolParameter[] {
    return Object.entries(params).map(([name, value]) =>
      ToolParameter.create(name, value)
    );
  }

  /**
   * Convert to plain object representation
   */
  toObject(): Record<string, unknown> {
    return {
      name: this.name,
      value: this.value,
      type: this.type,
    };
  }

  /**
   * Check if value matches expected type
   * 
   * @param expectedType - Type to check against
   */
  isType(expectedType: string): boolean {
    if (!this.type) {
      return false;
    }
    return this.type === expectedType;
  }

  /**
   * Get string representation
   */
  toString(): string {
    const typeStr = this.type ? ` (${this.type})` : '';
    return `${this.name}${typeStr}: ${JSON.stringify(this.value)}`;
  }
}
