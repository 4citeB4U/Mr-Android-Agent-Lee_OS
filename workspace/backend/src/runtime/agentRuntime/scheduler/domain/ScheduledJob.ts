/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SCHEDULEDJOB.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ScheduledJob module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\scheduler\domain\ScheduledJob.ts
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
 * Domain types for the task scheduler
 *
 * Defines value objects for scheduled jobs, their schedules, and run records.
 */

/**
 * Schedule definition — when a job should fire
 */
export type JobSchedule =
  | { readonly kind: 'once'; readonly at: string }           // ISO-8601
  | { readonly kind: 'interval'; readonly intervalMs: number; readonly anchorMs?: number }
  | { readonly kind: 'cron'; readonly expr: string; readonly timezone: string };

/**
 * Persistent representation of a scheduled job
 */
export interface ScheduledJob {
  readonly id: string;
  readonly label: string;
  readonly task: string;
  readonly schedule: JobSchedule;
  readonly model?: string;
  readonly maxRuns?: number;
  readonly timeoutSeconds: number;
  readonly createdAt: string;       // ISO-8601
  readonly enabled: boolean;
  readonly runCount: number;
}

/**
 * A single execution record for a job
 */
export interface JobRun {
  readonly runId: string;
  readonly jobId: string;
  readonly startedAt: string;       // ISO-8601
  completedAt?: string;             // ISO-8601
  status: 'running' | 'completed' | 'failed';
  agentId?: string;
  result?: string;
  error?: string;
}

/**
 * Parameters for creating a new job (from tool input)
 */
export interface CreateJobParams {
  readonly task: string;
  readonly schedule: JobSchedule;
  readonly label?: string;
  readonly model?: string;
  readonly maxRuns?: number;
  readonly timeoutSeconds?: number;
}
