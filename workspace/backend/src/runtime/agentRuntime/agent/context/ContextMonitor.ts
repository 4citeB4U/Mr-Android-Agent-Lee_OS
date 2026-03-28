/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CONTEXTMONITOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ContextMonitor module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\context\ContextMonitor.ts
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
 * Context monitoring for tracking context window usage
 * 
 * Monitors session message counts, token estimates, and compaction activity.
 * Publishes warning events when thresholds are exceeded.
 */

import { IEventBus, DomainEvent } from '../../core/interfaces/IEventBus.js';
import { ITracer } from '../../core/interfaces/ITracer.js';

/**
 * Configuration options for ContextMonitor
 */
export interface ContextMonitorOptions {
  /**
   * Maximum context window size in tokens
   * @default 128000
   */
  maxContextTokens?: number;

  /**
   * Average tokens per message (for estimation)
   * @default 100
   */
  tokensPerMessage?: number;

  /**
   * Warning threshold percentage (0-100)
   * @default 75
   */
  warningThreshold?: number;

  /**
   * Urgent threshold percentage (0-100)
   * @default 90
   */
  urgentThreshold?: number;

  /**
   * Log stats every N messages
   * @default 10
   */
  logInterval?: number;
}

/**
 * Statistics about context usage
 */
export interface ContextStats {
  /**
   * Total number of messages in session
   */
  messageCount: number;

  /**
   * Estimated token count (rough approximation)
   */
  estimatedTokens: number;

  /**
   * Number of compactions that have occurred
   */
  compactionCount: number;

  /**
   * Timestamp of last compaction
   */
  lastCompactionAt?: Date;

  /**
   * Usage percentage (0-100)
   */
  usagePercent: number;
}

/**
 * Warning event payload
 */
export interface ContextWarningPayload {
  sessionId: string;
  stats: ContextStats;
  threshold: number;
}

/**
 * Context warning event (75% threshold)
 */
export class ContextWarningEvent implements DomainEvent<ContextWarningPayload> {
  readonly eventName = 'context.warning';
  readonly occurredAt: Date;
  readonly payload: ContextWarningPayload;

  constructor(sessionId: string, stats: ContextStats, threshold: number) {
    this.occurredAt = new Date();
    this.payload = { sessionId, stats, threshold };
  }
}

/**
 * Context urgent event (90% threshold)
 */
export class ContextUrgentEvent implements DomainEvent<ContextWarningPayload> {
  readonly eventName = 'context.urgent';
  readonly occurredAt: Date;
  readonly payload: ContextWarningPayload;

  constructor(sessionId: string, stats: ContextStats, threshold: number) {
    this.occurredAt = new Date();
    this.payload = { sessionId, stats, threshold };
  }
}

/**
 * Session tracking data
 */
interface SessionTracker {
  sessionId: string;
  messageCount: number;
  compactionCount: number;
  lastCompactionAt?: Date;
  lastWarningPercent?: number;
  lastLoggedMessage?: number;
}

/**
 * Context monitoring service
 * 
 * Tracks context usage across sessions and publishes warning events
 * when usage thresholds are exceeded.
 * 
 * @example
 * ```typescript
 * const monitor = new ContextMonitor(eventBus, tracer, {
 *   maxContextTokens: 128000,
 *   warningThreshold: 75,
 *   urgentThreshold: 90
 * });
 * 
 * // Monitor a session
 * monitor.monitorSession('session-123');
 * 
 * // Get current stats
 * const stats = monitor.getStats('session-123');
 * console.log(`Usage: ${stats.usagePercent}%`);
 * ```
 */
export class ContextMonitor {
  private readonly sessions = new Map<string, SessionTracker>();
  private readonly maxContextTokens: number;
  private readonly tokensPerMessage: number;
  private readonly warningThreshold: number;
  private readonly urgentThreshold: number;
  private readonly logInterval: number;

  constructor(
    private readonly eventBus: IEventBus,
    private readonly tracer: ITracer,
    options: ContextMonitorOptions = {}
  ) {
    // Load configuration with defaults
    this.maxContextTokens = options.maxContextTokens ?? 128000;
    this.tokensPerMessage = options.tokensPerMessage ?? 100;
    this.warningThreshold = options.warningThreshold ?? 75;
    this.urgentThreshold = options.urgentThreshold ?? 90;
    this.logInterval = options.logInterval ?? 10;
  }

  /**
   * Start monitoring a session
   * 
   * @param sessionId - Session ID to monitor
   */
  monitorSession(sessionId: string): void {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        messageCount: 0,
        compactionCount: 0,
      });

      this.tracer.span('context.monitor.start', (span) => {
        span.setAttribute('sessionId', sessionId);
        span.setStatus('ok');
      });
    }
  }

  /**
   * Record a new message in the session
   * 
   * @param sessionId - Session ID
   */
  recordMessage(sessionId: string): void {
    const tracker = this.sessions.get(sessionId);
    if (!tracker) {
      // Auto-start monitoring if not already started
      this.monitorSession(sessionId);
      return this.recordMessage(sessionId);
    }

    tracker.messageCount++;

    // Check thresholds
    const stats = this.calculateStats(tracker);
    this.checkThresholds(sessionId, stats);

    // Log periodically
    if (tracker.messageCount % this.logInterval === 0) {
      this.logStats(sessionId, stats);
    }
  }

  /**
   * Record a compaction event
   * 
   * @param sessionId - Session ID
   */
  recordCompaction(sessionId: string): void {
    const tracker = this.sessions.get(sessionId);
    if (!tracker) {
      return;
    }

    tracker.compactionCount++;
    tracker.lastCompactionAt = new Date();

    this.tracer.span('context.monitor.compaction', (span) => {
      span.setAttribute('sessionId', sessionId);
      span.setAttribute('compactionCount', tracker.compactionCount);
      span.setStatus('ok');
    });
  }

  /**
   * Get current statistics for a session
   * 
   * @param sessionId - Session ID
   * @returns Context statistics
   */
  getStats(sessionId: string): ContextStats {
    const tracker = this.sessions.get(sessionId);
    if (!tracker) {
      return {
        messageCount: 0,
        estimatedTokens: 0,
        compactionCount: 0,
        usagePercent: 0,
      };
    }

    return this.calculateStats(tracker);
  }

  /**
   * Stop monitoring a session
   * 
   * @param sessionId - Session ID
   */
  stopMonitoring(sessionId: string): void {
    this.sessions.delete(sessionId);

    this.tracer.span('context.monitor.stop', (span) => {
      span.setAttribute('sessionId', sessionId);
      span.setStatus('ok');
    });
  }

  /**
   * Calculate statistics for a session
   * 
   * @param tracker - Session tracker data
   * @returns Calculated statistics
   */
  private calculateStats(tracker: SessionTracker): ContextStats {
    const estimatedTokens = tracker.messageCount * this.tokensPerMessage;
    const usagePercent = Math.min(100, (estimatedTokens / this.maxContextTokens) * 100);

    return {
      messageCount: tracker.messageCount,
      estimatedTokens,
      compactionCount: tracker.compactionCount,
      lastCompactionAt: tracker.lastCompactionAt,
      usagePercent: Math.round(usagePercent * 100) / 100, // Round to 2 decimals
    };
  }

  /**
   * Check thresholds and publish warning events
   * 
   * @param sessionId - Session ID
   * @param stats - Current statistics
   */
  private checkThresholds(sessionId: string, stats: ContextStats): void {
    const tracker = this.sessions.get(sessionId);
    if (!tracker) {
      return;
    }

    // Only emit events once per threshold level
    const currentLevel = this.getThresholdLevel(stats.usagePercent);
    const lastLevel = tracker.lastWarningPercent
      ? this.getThresholdLevel(tracker.lastWarningPercent)
      : 0;

    if (currentLevel > lastLevel) {
      tracker.lastWarningPercent = stats.usagePercent;

      // Emit appropriate event
      if (stats.usagePercent >= this.urgentThreshold) {
        this.eventBus.publish(
          new ContextUrgentEvent(sessionId, stats, this.urgentThreshold)
        );

        this.tracer.span('context.monitor.urgent', (span) => {
          span.setAttribute('sessionId', sessionId);
          span.setAttribute('usagePercent', stats.usagePercent);
          span.setAttribute('threshold', this.urgentThreshold);
          span.setStatus('ok');
        });
      } else if (stats.usagePercent >= this.warningThreshold) {
        this.eventBus.publish(
          new ContextWarningEvent(sessionId, stats, this.warningThreshold)
        );

        this.tracer.span('context.monitor.warning', (span) => {
          span.setAttribute('sessionId', sessionId);
          span.setAttribute('usagePercent', stats.usagePercent);
          span.setAttribute('threshold', this.warningThreshold);
          span.setStatus('ok');
        });
      }
    }
  }

  /**
   * Get threshold level (0: none, 1: warning, 2: urgent)
   * 
   * @param percent - Usage percentage
   * @returns Threshold level
   */
  private getThresholdLevel(percent: number): number {
    if (percent >= this.urgentThreshold) {
      return 2;
    }
    if (percent >= this.warningThreshold) {
      return 1;
    }
    return 0;
  }

  /**
   * Log statistics to tracer
   * 
   * @param sessionId - Session ID
   * @param stats - Statistics to log
   */
  private logStats(sessionId: string, stats: ContextStats): void {
    this.tracer.span('context.monitor.stats', (span) => {
      span.setAttribute('sessionId', sessionId);
      span.setAttribute('messageCount', stats.messageCount);
      span.setAttribute('estimatedTokens', stats.estimatedTokens);
      span.setAttribute('compactionCount', stats.compactionCount);
      span.setAttribute('usagePercent', stats.usagePercent);
      if (stats.lastCompactionAt) {
        span.setAttribute('lastCompactionAt', stats.lastCompactionAt.toISOString());
      }
      span.setStatus('ok');
    });
  }
}
