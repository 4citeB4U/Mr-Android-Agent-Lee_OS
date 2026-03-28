/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ICOORDINATION.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ICoordination module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\communication\domain\ICoordination.ts
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
 * ICoordination - Synchronization primitives for multi-agent coordination
 * 
 * Domain interface (DIP).
 */

export interface Lock {
  /** Resource name */
  resource: string;
  /** Lock holder agent ID */
  holder: string;
  /** Release the lock */
  release(): void;
}

export interface ICoordination {
  /** Acquire exclusive lock on a resource */
  lock(resource: string, holderId: string, timeoutMs?: number): Lock | null;

  /** Try to acquire lock (non-blocking) */
  tryLock(resource: string, holderId: string): Lock | null;

  /** Check if resource is locked */
  isLocked(resource: string): boolean;

  /** Wait for N agents to reach a barrier */
  barrier(name: string, agentId: string, count: number): boolean;

  /** Check if barrier is complete */
  isBarrierComplete(name: string): boolean;

  /** Atomic counter increment */
  counter(name: string): number;

  /** Get counter value */
  getCounter(name: string): number;

  /** Reset a barrier */
  resetBarrier(name: string): void;
}
