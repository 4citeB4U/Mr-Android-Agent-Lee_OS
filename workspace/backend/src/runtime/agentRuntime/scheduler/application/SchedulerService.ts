/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SCHEDULERSERVICE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SchedulerService module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\scheduler\application\SchedulerService.ts
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
 * SchedulerService — core scheduler logic
 *
 * Manages job lifecycle, arms timers (via node-cron and setTimeout/setInterval),
 * and delegates execution to the sub-agent orchestrator.
 */

import { randomUUID } from "crypto";
import type { IEventBus } from "../../core/interfaces/IEventBus.js";
import type { OpenClawStyleOrchestrator } from "../../sub-agents/OpenClawStyleOrchestrator.js";
import type { ISchedulerStore } from "../domain/ISchedulerStore.js";
import type {
    CreateJobParams,
    JobRun,
    ScheduledJob,
} from "../domain/ScheduledJob.js";
/**
 * Active timer handle — timeout, interval, or cron-stub (uses setInterval).
 */
type TimerHandle =
  | { kind: "cron"; handle: ReturnType<typeof setInterval> }
  | { kind: "timeout"; handle: ReturnType<typeof setTimeout> }
  | { kind: "interval"; handle: ReturnType<typeof setInterval> };

export class SchedulerService {
  private timers: Map<string, TimerHandle> = new Map();
  private started = false;

  constructor(
    private readonly store: ISchedulerStore,
    private readonly orchestrator: OpenClawStyleOrchestrator,
    private readonly eventBus: IEventBus,
  ) {
    this.setupCompletionListener();
  }

  // ── Public API ──

  async addJob(params: CreateJobParams): Promise<ScheduledJob> {
    const job: ScheduledJob = {
      id: randomUUID(),
      label: params.label ?? params.task.slice(0, 60),
      task: params.task,
      schedule: params.schedule,
      model: params.model,
      maxRuns: params.maxRuns,
      timeoutSeconds: params.timeoutSeconds ?? 600,
      createdAt: new Date().toISOString(),
      enabled: true,
      runCount: 0,
    };

    await this.store.saveJob(job);

    if (this.started) {
      this.armJob(job);
    }

    return job;
  }

  async cancelJob(id: string): Promise<boolean> {
    this.disarmJob(id);
    return this.store.deleteJob(id);
  }

  async triggerJob(id: string): Promise<JobRun> {
    const job = await this.store.getJob(id);
    if (!job) throw new Error(`Job not found: ${id}`);
    if (!job.enabled) throw new Error(`Job is disabled: ${id}`);
    return this.executeJob(job);
  }

  async getJobStatus(id: string): Promise<
    | {
        job: ScheduledJob;
        runs: JobRun[];
        nextRunAt?: string;
      }
    | undefined
  > {
    const job = await this.store.getJob(id);
    if (!job) return undefined;
    const runs = await this.store.getRuns(id, 10);
    const nextRunAt = this.computeNextRunAt(job);
    return { job, runs, nextRunAt };
  }

  async listJobs(): Promise<ScheduledJob[]> {
    return this.store.listJobs();
  }

  /**
   * Arm all enabled jobs. Call once after store is loaded.
   */
  start(): void {
    this.started = true;
    // Arm asynchronously — don't block
    this.store.listJobs().then((jobs) => {
      for (const job of jobs) {
        if (job.enabled) this.armJob(job);
      }
    });
  }

  /**
   * Disarm all timers and flush store.
   */
  async shutdown(): Promise<void> {
    this.started = false;
    for (const [id] of this.timers) {
      this.disarmJob(id);
    }
  }

  // ── Timer management ──

  private armJob(job: ScheduledJob): void {
    // Don't double-arm
    this.disarmJob(job.id);

    const schedule = job.schedule;

    switch (schedule.kind) {
      case "once": {
        const delayMs = new Date(schedule.at).getTime() - Date.now();
        if (delayMs <= 0) {
          // Past due — fire immediately
          this.onJobFire(job.id);
        } else {
          const handle = setTimeout(() => this.onJobFire(job.id), delayMs);
          handle.unref?.();
          this.timers.set(job.id, { kind: "timeout", handle });
        }
        break;
      }
      case "interval": {
        // Align to anchor if provided
        let initialDelay = 0;
        if (schedule.anchorMs) {
          const elapsed =
            (Date.now() - schedule.anchorMs) % schedule.intervalMs;
          initialDelay = schedule.intervalMs - elapsed;
        }

        const startInterval = () => {
          const handle = setInterval(
            () => this.onJobFire(job.id),
            schedule.intervalMs,
          );
          handle.unref?.();
          this.timers.set(job.id, { kind: "interval", handle });
          // Also fire immediately at the aligned time
          this.onJobFire(job.id);
        };

        if (initialDelay > 0) {
          const alignHandle = setTimeout(startInterval, initialDelay);
          alignHandle.unref?.();
          this.timers.set(job.id, { kind: "timeout", handle: alignHandle });
        } else {
          startInterval();
        }
        break;
      }
      case "cron": {
        // Stub: fire every 60 seconds (node-cron not available in this build)
        const handle = setInterval(() => this.onJobFire(job.id), 60_000);
        handle.unref?.();
        this.timers.set(job.id, { kind: "cron", handle });
        break;
      }
    }
  }

  private disarmJob(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) return;

    switch (timer.kind) {
      case "cron":
        clearInterval(timer.handle);
        break;
      case "timeout":
        clearTimeout(timer.handle);
        break;
      case "interval":
        clearInterval(timer.handle);
        break;
    }
    this.timers.delete(id);
  }

  private async onJobFire(jobId: string): Promise<void> {
    const job = await this.store.getJob(jobId);
    if (!job || !job.enabled) {
      this.disarmJob(jobId);
      return;
    }

    // Check maxRuns
    if (job.maxRuns !== undefined && job.runCount >= job.maxRuns) {
      await this.store.updateJob(jobId, {
        enabled: false,
      } as Partial<ScheduledJob>);
      this.disarmJob(jobId);
      return;
    }

    await this.executeJob(job);

    // For once jobs, disable after firing
    if (job.schedule.kind === "once") {
      await this.store.updateJob(jobId, {
        enabled: false,
      } as Partial<ScheduledJob>);
      this.disarmJob(jobId);
    }
  }

  // ── Execution ──

  private async executeJob(job: ScheduledJob): Promise<JobRun> {
    const run: JobRun = {
      runId: randomUUID(),
      jobId: job.id,
      startedAt: new Date().toISOString(),
      status: "running",
    };

    await this.store.saveRun(run);
    await this.store.updateJob(job.id, {
      runCount: job.runCount + 1,
    } as Partial<ScheduledJob>);

    try {
      const taskPrompt = `[Scheduled task: ${job.label}]\n\n${job.task}`;
      const agentId = await this.orchestrator.spawn({
        task: taskPrompt,
        model: job.model,
        timeout: job.timeoutSeconds,
        cleanup: "delete",
        agentId: `sched-${job.id.slice(0, 8)}-${run.runId.slice(0, 8)}`,
      });

      run.agentId = agentId;
      await this.store.updateRun(run.runId, { agentId });

      return run;
    } catch (error) {
      const errorMsg = (error as Error).message;
      run.status = "failed";
      run.error = errorMsg;
      run.completedAt = new Date().toISOString();
      await this.store.updateRun(run.runId, {
        status: "failed",
        error: errorMsg,
        completedAt: run.completedAt,
      });
      return run;
    }
  }

  // ── Completion tracking ──

  private setupCompletionListener(): void {
    // Listen for sub-agent completion to update run records
    this.eventBus.subscribe("session.idle", async (_event: any) => {
      // Find runs with matching agentId
      const jobs = await this.store.listJobs();
      for (const job of jobs) {
        const runs = await this.store.getRuns(job.id);
        for (const run of runs) {
          if (run.status !== "running" || !run.agentId) continue;

          // Check if this agent completed
          const status = this.orchestrator.getAgentStatus(run.agentId);
          if (
            status &&
            (status.status === "completed" || status.status === "failed")
          ) {
            await this.store.updateRun(run.runId, {
              status: status.status,
              result: status.response,
              error: status.error,
              completedAt: new Date().toISOString(),
            });
          }
        }
      }
    });
  }

  // ── Helpers ──

  private computeNextRunAt(job: ScheduledJob): string | undefined {
    if (!job.enabled) return undefined;

    switch (job.schedule.kind) {
      case "once":
        return new Date(job.schedule.at).getTime() > Date.now()
          ? job.schedule.at
          : undefined;
      case "interval": {
        // Approximate
        const now = Date.now();
        if (job.schedule.anchorMs) {
          const elapsed =
            (now - job.schedule.anchorMs) % job.schedule.intervalMs;
          return new Date(
            now + job.schedule.intervalMs - elapsed,
          ).toISOString();
        }
        return new Date(now + job.schedule.intervalMs).toISOString();
      }
      case "cron": {
        // node-cron doesn't expose next fire time directly, so we note it's cron-based
        return undefined; // Could use cron-parser if needed
      }
    }
  }
}
