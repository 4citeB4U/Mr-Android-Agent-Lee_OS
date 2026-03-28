/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.FILESCHEDULERSTORE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = FileSchedulerStore module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\scheduler\infrastructure\FileSchedulerStore.ts
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
 * JSON file-backed scheduler store
 *
 * Persists jobs and runs to `{dataDir}/scheduler/jobs.json` and `runs.json`.
 * Loads on construction. Writes are debounced to avoid excessive I/O.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ISchedulerStore } from '../domain/ISchedulerStore.js';
import { ScheduledJob, JobRun } from '../domain/ScheduledJob.js';

const MAX_RUNS_PER_JOB = 50;

export class FileSchedulerStore implements ISchedulerStore {
  private jobs: Map<string, ScheduledJob> = new Map();
  private runs: Map<string, JobRun[]> = new Map(); // jobId → runs
  private readonly jobsPath: string;
  private readonly runsPath: string;
  private dirty = false;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly dataDir: string) {
    this.jobsPath = path.join(dataDir, 'jobs.json');
    this.runsPath = path.join(dataDir, 'runs.json');
  }

  /**
   * Load persisted data from disk. Call once before use.
   */
  async load(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });

    try {
      const raw = await fs.readFile(this.jobsPath, 'utf-8');
      const arr: ScheduledJob[] = JSON.parse(raw);
      for (const job of arr) {
        this.jobs.set(job.id, job);
      }
    } catch {
      // File doesn't exist yet — fine
    }

    try {
      const raw = await fs.readFile(this.runsPath, 'utf-8');
      const obj: Record<string, JobRun[]> = JSON.parse(raw);
      for (const [jobId, runs] of Object.entries(obj)) {
        this.runs.set(jobId, runs);
      }
    } catch {
      // File doesn't exist yet — fine
    }
  }

  async saveJob(job: ScheduledJob): Promise<void> {
    this.jobs.set(job.id, job);
    this.scheduleDiskFlush();
  }

  async getJob(id: string): Promise<ScheduledJob | undefined> {
    return this.jobs.get(id);
  }

  async listJobs(): Promise<ScheduledJob[]> {
    return Array.from(this.jobs.values());
  }

  async deleteJob(id: string): Promise<boolean> {
    const existed = this.jobs.delete(id);
    this.runs.delete(id);
    if (existed) this.scheduleDiskFlush();
    return existed;
  }

  async updateJob(id: string, patch: Partial<ScheduledJob>): Promise<void> {
    const existing = this.jobs.get(id);
    if (!existing) return;
    this.jobs.set(id, { ...existing, ...patch } as ScheduledJob);
    this.scheduleDiskFlush();
  }

  async saveRun(run: JobRun): Promise<void> {
    const arr = this.runs.get(run.jobId) ?? [];
    arr.push(run);
    // Cap history
    if (arr.length > MAX_RUNS_PER_JOB) {
      arr.splice(0, arr.length - MAX_RUNS_PER_JOB);
    }
    this.runs.set(run.jobId, arr);
    this.scheduleDiskFlush();
  }

  async updateRun(runId: string, patch: Partial<JobRun>): Promise<void> {
    for (const arr of this.runs.values()) {
      const idx = arr.findIndex(r => r.runId === runId);
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...patch } as JobRun;
        this.scheduleDiskFlush();
        return;
      }
    }
  }

  async getRuns(jobId: string, limit?: number): Promise<JobRun[]> {
    const arr = this.runs.get(jobId) ?? [];
    if (limit) return arr.slice(-limit);
    return [...arr];
  }

  async getRunningRun(jobId: string): Promise<JobRun | undefined> {
    const arr = this.runs.get(jobId) ?? [];
    return arr.find(r => r.status === 'running');
  }

  /**
   * Flush immediately (call on shutdown).
   */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.writeToDisk();
  }

  // ── private ──

  private scheduleDiskFlush(): void {
    this.dirty = true;
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(async () => {
      this.flushTimer = null;
      await this.writeToDisk();
    }, 500);
    this.flushTimer.unref?.();
  }

  private async writeToDisk(): Promise<void> {
    if (!this.dirty) return;
    this.dirty = false;

    const jobsArr = Array.from(this.jobs.values());
    const runsObj: Record<string, JobRun[]> = {};
    for (const [jobId, runs] of this.runs) {
      runsObj[jobId] = runs;
    }

    try {
      await Promise.all([
        fs.writeFile(this.jobsPath, JSON.stringify(jobsArr, null, 2)),
        fs.writeFile(this.runsPath, JSON.stringify(runsObj, null, 2)),
      ]);
    } catch {
      // Directory may have been removed (e.g. test cleanup) — ignore
    }
  }
}
