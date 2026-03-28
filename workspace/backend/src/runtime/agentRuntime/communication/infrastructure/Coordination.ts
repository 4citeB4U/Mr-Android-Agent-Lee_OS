/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.COORDINATION.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = Coordination module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\communication\infrastructure\Coordination.ts
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
 * Coordination - Synchronization primitives for multi-agent coordination
 * 
 * Provides locks, barriers, and counters for in-memory coordination.
 */

import type { ICoordination, Lock } from '../domain/ICoordination.js';

export class Coordination implements ICoordination {
  private readonly locks = new Map<string, { holder: string; acquired: number }>();
  private readonly barriers = new Map<string, { agents: Set<string>; count: number }>();
  private readonly counters = new Map<string, number>();

  lock(resource: string, holderId: string, timeoutMs: number = 5000): Lock | null {
    const existing = this.locks.get(resource);

    if (existing) {
      // Check timeout on existing lock
      if (Date.now() - existing.acquired > timeoutMs) {
        this.locks.delete(resource); // Expired, force release
      } else {
        return null; // Already locked
      }
    }

    this.locks.set(resource, { holder: holderId, acquired: Date.now() });

    return {
      resource,
      holder: holderId,
      release: () => {
        const current = this.locks.get(resource);
        if (current?.holder === holderId) {
          this.locks.delete(resource);
        }
      },
    };
  }

  tryLock(resource: string, holderId: string): Lock | null {
    if (this.locks.has(resource)) return null;
    return this.lock(resource, holderId);
  }

  isLocked(resource: string): boolean {
    return this.locks.has(resource);
  }

  barrier(name: string, agentId: string, count: number): boolean {
    if (!this.barriers.has(name)) {
      this.barriers.set(name, { agents: new Set(), count });
    }

    const b = this.barriers.get(name)!;
    b.agents.add(agentId);

    return b.agents.size >= b.count;
  }

  isBarrierComplete(name: string): boolean {
    const b = this.barriers.get(name);
    if (!b) return false;
    return b.agents.size >= b.count;
  }

  resetBarrier(name: string): void {
    this.barriers.delete(name);
  }

  counter(name: string): number {
    const current = (this.counters.get(name) ?? 0) + 1;
    this.counters.set(name, current);
    return current;
  }

  getCounter(name: string): number {
    return this.counters.get(name) ?? 0;
  }
}
