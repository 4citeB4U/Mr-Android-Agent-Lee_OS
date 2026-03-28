/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.STEERINGMANAGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SteeringManager module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\communication\infrastructure\SteeringManager.ts
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
 * SteeringManager - Mid-execution message injection
 * 
 * Manages injection queue and pause/resume state.
 * Mostly pure logic with minimal I/O (logging).
 */

import type { ISteeringManager, InjectOptions, PendingInjection } from '../domain/ISteeringManager.js';
import { ILogger } from '../../core/interfaces/ILogger.js';
import { randomUUID } from 'crypto';

export interface SteeringConfig {
  /** Max pending injections per agent */
  maxPendingPerAgent: number;
  /** Injection expiry in ms (default: 5 min) */
  expiryMs: number;
}

const DEFAULT_CONFIG: SteeringConfig = {
  maxPendingPerAgent: 10,
  expiryMs: 300000,
};

const DEFAULT_OPTIONS: InjectOptions = {
  timing: 'after-tool',
  priority: 'normal',
};

export class SteeringManager implements ISteeringManager {
  private readonly pending = new Map<string, PendingInjection[]>();
  private readonly paused = new Set<string>();
  private readonly config: SteeringConfig;

  constructor(
    private readonly logger: ILogger,
    config?: Partial<SteeringConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  inject(agentId: string, message: string, options?: Partial<InjectOptions>): string {
    const id = randomUUID();
    const opts: InjectOptions = { ...DEFAULT_OPTIONS, ...options };

    if (!this.pending.has(agentId)) {
      this.pending.set(agentId, []);
    }

    const queue = this.pending.get(agentId)!;

    if (queue.length >= this.config.maxPendingPerAgent) {
      this.logger.warn('Max pending injections reached', { agentId, max: this.config.maxPendingPerAgent });
      // Drop oldest non-interrupt
      const dropIdx = queue.findIndex(p => p.options.priority !== 'interrupt');
      if (dropIdx >= 0) {
        queue.splice(dropIdx, 1);
      } else {
        return id; // All interrupts, can't drop
      }
    }

    const injection: PendingInjection = {
      id,
      agentId,
      message,
      options: opts,
      createdAt: Date.now(),
      status: 'pending',
    };

    // Interrupts go to front
    if (opts.priority === 'interrupt') {
      queue.unshift(injection);
    } else {
      queue.push(injection);
    }

    this.logger.debug('Injection queued', { agentId, id, timing: opts.timing, priority: opts.priority });

    return id;
  }

  hasPending(agentId: string): boolean {
    const queue = this.pending.get(agentId);
    if (!queue || queue.length === 0) return false;

    // Purge expired
    this.purgeExpired(agentId);
    return (this.pending.get(agentId)?.length ?? 0) > 0;
  }

  consume(agentId: string, currentTool?: string): PendingInjection[] {
    this.purgeExpired(agentId);
    const queue = this.pending.get(agentId);
    if (!queue || queue.length === 0) return [];

    const consumed: PendingInjection[] = [];
    const remaining: PendingInjection[] = [];

    for (const injection of queue) {
      // Check tool filter
      if (injection.options.toolFilter && currentTool) {
        if (!injection.options.toolFilter.includes(currentTool)) {
          remaining.push(injection);
          continue;
        }
      }

      // Check timing
      if (injection.options.timing === 'after-tool' || injection.options.timing === 'immediate') {
        injection.status = 'delivered';
        consumed.push(injection);
      } else {
        remaining.push(injection);
      }
    }

    this.pending.set(agentId, remaining);

    if (consumed.length > 0) {
      this.logger.info('Injections consumed', { agentId, count: consumed.length });
    }

    return consumed;
  }

  pause(agentId: string): void {
    this.paused.add(agentId);
    this.logger.info('Agent paused', { agentId });
  }

  resume(agentId: string): void {
    this.paused.delete(agentId);
    this.logger.info('Agent resumed', { agentId });
  }

  isPaused(agentId: string): boolean {
    return this.paused.has(agentId);
  }

  getPending(agentId: string): readonly PendingInjection[] {
    return this.pending.get(agentId) ?? [];
  }

  clearPending(agentId: string): void {
    this.pending.delete(agentId);
  }

  private purgeExpired(agentId: string): void {
    const queue = this.pending.get(agentId);
    if (!queue) return;

    const now = Date.now();
    const valid = queue.filter(p => now - p.createdAt < this.config.expiryMs);

    if (valid.length !== queue.length) {
      this.logger.debug('Purged expired injections', {
        agentId,
        purged: queue.length - valid.length,
      });
      this.pending.set(agentId, valid);
    }
  }
}
