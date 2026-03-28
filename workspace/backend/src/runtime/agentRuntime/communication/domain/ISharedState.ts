/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ISHAREDSTATE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ISharedState module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\communication\domain\ISharedState.ts
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
 * ISharedState - Interface for shared state between agents
 * 
 * Domain interface (DIP).
 */

export type ChangeCallback = (key: string, value: unknown, oldValue: unknown) => void;

export interface ISharedState {
  /** Set a value */
  set(key: string, value: unknown): void;

  /** Get a value */
  get<T = unknown>(key: string): T | undefined;

  /** Delete a key */
  delete(key: string): boolean;

  /** Check if key exists */
  has(key: string): boolean;

  /** Atomic increment (returns new value) */
  increment(key: string, by?: number): number;

  /** Atomic append to array */
  append(key: string, value: unknown): void;

  /** Get all keys */
  keys(): string[];

  /** Watch for changes to a key */
  watch(key: string, callback: ChangeCallback): void;

  /** Stop watching */
  unwatch(key: string, callback: ChangeCallback): void;

  /** Clear all state */
  clear(): void;
}
