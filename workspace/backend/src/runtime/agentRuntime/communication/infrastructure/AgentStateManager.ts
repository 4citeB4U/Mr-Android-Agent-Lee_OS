/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENTSTATEMANAGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = AgentStateManager module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\communication\infrastructure\AgentStateManager.ts
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
 * AgentStateManager - Tracks and queries agent state
 * 
 * Manages state transitions, metrics, and health monitoring.
 */

import type { AgentState, AgentStatus, AgentMetrics, StateChangeCallback } from '../domain/AgentState.js';
import { INITIAL_METRICS } from '../domain/AgentState.js';
import { ILogger } from '../../core/interfaces/ILogger.js';

export interface AgentStateConfig {
  /** Max errors to retain per agent */
  maxErrors: number;
  /** Idle timeout before marking degraded (ms) */
  idleTimeoutMs: number;
}

const DEFAULT_CONFIG: AgentStateConfig = {
  maxErrors: 20,
  idleTimeoutMs: 600000, // 10 min
};

export class AgentStateManager {
  private readonly states = new Map<string, AgentState>();
  private readonly watchers = new Map<string, Set<StateChangeCallback>>();
  private readonly globalWatchers = new Set<StateChangeCallback>();
  private readonly config: AgentStateConfig;

  constructor(
    private readonly logger: ILogger,
    config?: Partial<AgentStateConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a new agent
   */
  register(agentId: string, initialStatus: AgentStatus = 'spawning'): void {
    const state: AgentState = {
      agentId,
      status: initialStatus,
      metrics: { ...INITIAL_METRICS, lastActivity: Date.now() },
      pendingInjections: 0,
      health: 'healthy',
      errors: [],
      updatedAt: Date.now(),
    };

    this.states.set(agentId, state);
    this.notify(agentId, state);
  }

  /**
   * Update agent status
   */
  setStatus(agentId: string, status: AgentStatus, action?: string, tool?: string): void {
    const state = this.states.get(agentId);
    if (!state) return;

    state.status = status;
    state.currentAction = action;
    state.currentTool = tool;
    state.metrics.lastActivity = Date.now();
    state.updatedAt = Date.now();

    this.notify(agentId, state);
  }

  /**
   * Update agent metrics
   */
  updateMetrics(agentId: string, update: Partial<AgentMetrics>): void {
    const state = this.states.get(agentId);
    if (!state) return;

    Object.assign(state.metrics, update);
    state.metrics.lastActivity = Date.now();
    state.updatedAt = Date.now();
  }

  /**
   * Increment tool call count
   */
  recordToolCall(agentId: string, toolName: string): void {
    const state = this.states.get(agentId);
    if (!state) return;

    state.metrics.toolCallCount++;
    state.currentTool = toolName;
    state.status = 'tool-calling';
    state.metrics.lastActivity = Date.now();
    state.updatedAt = Date.now();

    this.notify(agentId, state);
  }

  /**
   * Record an error
   */
  recordError(agentId: string, error: string): void {
    const state = this.states.get(agentId);
    if (!state) return;

    state.errors.push(error);
    if (state.errors.length > this.config.maxErrors) {
      state.errors.shift();
    }

    state.health = state.errors.length >= 3 ? 'error' : 'degraded';
    state.updatedAt = Date.now();

    this.notify(agentId, state);
  }

  /**
   * Set progress
   */
  setProgress(agentId: string, progress: number): void {
    const state = this.states.get(agentId);
    if (!state) return;

    state.progress = Math.min(1, Math.max(0, progress));
    state.updatedAt = Date.now();
  }

  /**
   * Get current state for an agent
   */
  getState(agentId: string): AgentState | undefined {
    return this.states.get(agentId);
  }

  /**
   * Get all agent states
   */
  getAllStates(): Map<string, AgentState> {
    return new Map(this.states);
  }

  /**
   * Check health across all agents
   */
  checkHealth(agentId: string): 'healthy' | 'degraded' | 'error' {
    const state = this.states.get(agentId);
    if (!state) return 'error';

    // Check idle timeout
    const idle = Date.now() - state.metrics.lastActivity;
    if (idle > this.config.idleTimeoutMs && state.status !== 'idle' && state.status !== 'completed') {
      state.health = 'degraded';
    }

    return state.health;
  }

  /**
   * Remove agent state (cleanup)
   */
  unregister(agentId: string): void {
    this.states.delete(agentId);
    this.watchers.delete(agentId);
  }

  /**
   * Watch state changes for a specific agent
   */
  watch(agentId: string, callback: StateChangeCallback): void {
    if (!this.watchers.has(agentId)) {
      this.watchers.set(agentId, new Set());
    }
    this.watchers.get(agentId)!.add(callback);
  }

  /**
   * Watch all agent state changes
   */
  watchAll(callback: StateChangeCallback): void {
    this.globalWatchers.add(callback);
  }

  /**
   * Unwatch
   */
  unwatch(agentId: string, callback: StateChangeCallback): void {
    this.watchers.get(agentId)?.delete(callback);
  }

  private notify(agentId: string, state: AgentState): void {
    const agentWatchers = this.watchers.get(agentId);
    if (agentWatchers) {
      for (const cb of agentWatchers) {
        try { cb(agentId, { ...state }); } catch (e) {
          this.logger.error('State watcher error', e as Error);
        }
      }
    }

    for (const cb of this.globalWatchers) {
      try { cb(agentId, { ...state }); } catch (e) {
        this.logger.error('Global state watcher error', e as Error);
      }
    }
  }
}
