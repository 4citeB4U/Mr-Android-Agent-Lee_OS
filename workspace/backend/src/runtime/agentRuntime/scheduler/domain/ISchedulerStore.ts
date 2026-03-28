/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ISCHEDULERSTORE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ISchedulerStore module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\scheduler\domain\ISchedulerStore.ts
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
 * Persistence abstraction for the scheduler
 */

import { ScheduledJob, JobRun } from './ScheduledJob.js';

export interface ISchedulerStore {
  saveJob(job: ScheduledJob): Promise<void>;
  getJob(id: string): Promise<ScheduledJob | undefined>;
  listJobs(): Promise<ScheduledJob[]>;
  deleteJob(id: string): Promise<boolean>;
  updateJob(id: string, patch: Partial<ScheduledJob>): Promise<void>;

  saveRun(run: JobRun): Promise<void>;
  updateRun(runId: string, patch: Partial<JobRun>): Promise<void>;
  getRuns(jobId: string, limit?: number): Promise<JobRun[]>;
  getRunningRun(jobId: string): Promise<JobRun | undefined>;
}
