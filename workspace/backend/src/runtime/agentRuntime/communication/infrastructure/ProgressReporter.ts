/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.PROGRESSREPORTER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ProgressReporter module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\communication\infrastructure\ProgressReporter.ts
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
 * ProgressReporter - Allows sub-agents to report progress and partial results
 * 
 * Bridges between agent execution and parent notification via MessageBroker.
 */

import type { IMessageBroker } from '../domain/IMessageBroker.js';
import { AgentStateManager } from './AgentStateManager.js';
import { ILogger } from '../../core/interfaces/ILogger.js';

export interface ProgressUpdate {
  /** Progress 0-1 */
  progress: number;
  /** Human-readable status message */
  message: string;
  /** Optional partial result data */
  partialResult?: unknown;
  /** Whether this is the final update */
  isComplete: boolean;
}

export type ProgressCallback = (agentId: string, update: ProgressUpdate) => void;

export interface ProgressConfig {
  /** Minimum interval between updates in ms */
  minIntervalMs: number;
}

const DEFAULT_CONFIG: ProgressConfig = {
  minIntervalMs: 5000,
};

export class ProgressReporter {
  private readonly lastReport = new Map<string, number>();
  private readonly callbacks = new Map<string, Set<ProgressCallback>>();

  constructor(
    private readonly broker: IMessageBroker,
    private readonly stateManager: AgentStateManager,
    private readonly logger: ILogger,
    private readonly config: ProgressConfig = DEFAULT_CONFIG
  ) {}

  /**
   * Report progress from a sub-agent
   */
  async report(agentId: string, update: ProgressUpdate): Promise<boolean> {
    // Rate limit
    const now = Date.now();
    const last = this.lastReport.get(agentId) ?? 0;
    if (!update.isComplete && now - last < this.config.minIntervalMs) {
      return false; // throttled
    }

    this.lastReport.set(agentId, now);

    // Update state manager
    this.stateManager.setProgress(agentId, update.progress);
    if (update.isComplete) {
      this.stateManager.setStatus(agentId, 'completed', update.message);
    }

    // Notify parent via broker
    const parentId = this.broker.getParent(agentId);
    if (parentId) {
      await this.broker.sendToParent(agentId, JSON.stringify({
        type: 'progress',
        progress: update.progress,
        message: update.message,
        partialResult: update.partialResult,
        isComplete: update.isComplete,
      }), 'progress');
    }

    // Notify direct callbacks
    const cbs = this.callbacks.get(agentId);
    if (cbs) {
      for (const cb of cbs) {
        try { cb(agentId, update); } catch (e) {
          this.logger.error('Progress callback error', e as Error);
        }
      }
    }

    this.logger.debug('Progress reported', {
      agentId,
      progress: update.progress,
      message: update.message,
      isComplete: update.isComplete,
    });

    return true;
  }

  /**
   * Subscribe to progress updates for an agent
   */
  subscribe(agentId: string, callback: ProgressCallback): void {
    if (!this.callbacks.has(agentId)) {
      this.callbacks.set(agentId, new Set());
    }
    this.callbacks.get(agentId)!.add(callback);
  }

  /**
   * Unsubscribe from progress updates
   */
  unsubscribe(agentId: string, callback: ProgressCallback): void {
    this.callbacks.get(agentId)?.delete(callback);
  }

  /**
   * Get last reported progress for an agent
   */
  getLastProgress(agentId: string): number | undefined {
    return this.stateManager.getState(agentId)?.progress;
  }
}
