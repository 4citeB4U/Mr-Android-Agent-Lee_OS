/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SESSIONID.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SessionId module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\domain\value-objects\SessionId.ts
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
 * SessionId value object
 * 
 * Unique identifier for an agent session. Uses UUIDs for uniqueness.
 * Implements value object semantics (equality by value, immutability).
 * 
 * @example
 * ```typescript
 * const id = SessionId.create();
 * console.log(id.toString()); // "550e8400-e29b-41d4-a716-446655440000"
 * 
 * const reconstructed = SessionId.from(id.toString());
 * console.log(id.equals(reconstructed)); // true
 * ```
 */

import { randomUUID } from 'crypto';

export class SessionId {
  private constructor(private readonly _value: string) {}

  /**
   * Create a new unique session ID
   * 
   * @returns New SessionId with a generated UUID
   */
  static create(): SessionId {
    return new SessionId(randomUUID());
  }

  /**
   * Create a SessionId from an existing value
   * 
   * @param value - Existing session ID string (typically a UUID)
   * @returns SessionId with the provided value
   */
  static from(value: string): SessionId {
    return new SessionId(value);
  }

  /**
   * Get the string value of this ID
   * 
   * @returns The UUID string
   */
  get value(): string {
    return this._value;
  }

  /**
   * Convert to string representation
   * 
   * @returns The UUID string
   */
  toString(): string {
    return this._value;
  }

  /**
   * Check equality with another SessionId
   * 
   * @param other - SessionId to compare with
   * @returns true if values are equal
   */
  equals(other: SessionId): boolean {
    return this._value === other._value;
  }
}
