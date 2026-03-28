/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.MANAGESCHEDULETOOL.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ManageScheduleTool module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\scheduler\tools\ManageScheduleTool.ts
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
 * ManageScheduleTool — list, cancel, trigger, or inspect scheduled tasks
 */

import { ITool } from '../../tools/domain/interfaces/ITool.js';
import { ToolResult } from '../../tools/domain/value-objects/ToolResult.js';
import { Result } from '../../core/types/Result.js';
import { SchedulerService } from '../application/SchedulerService.js';
import { ManageScheduleToolSchema } from './tool-schemas.js';

export class ManageScheduleTool implements ITool {
  readonly name = ManageScheduleToolSchema.name;
  readonly description = ManageScheduleToolSchema.description;
  readonly schema = ManageScheduleToolSchema.parameters;

  constructor(private readonly scheduler: SchedulerService) {}

  async execute(parameters: unknown): Promise<Result<ToolResult, Error>> {
    try {
      const params = parameters as {
        action: 'list' | 'cancel' | 'trigger' | 'status';
        jobId?: string;
      };

      switch (params.action) {
        case 'list': {
          const jobs = await this.scheduler.listJobs();
          return Result.ok(
            ToolResult.success({
              jobs: jobs.map(j => ({
                jobId: j.id,
                label: j.label,
                schedule: j.schedule,
                enabled: j.enabled,
                runCount: j.runCount,
              })),
              count: jobs.length,
              message: `Found ${jobs.length} scheduled task(s)`,
            })
          );
        }

        case 'cancel': {
          if (!params.jobId) {
            return Result.fail(new Error('jobId is required for cancel'));
          }
          const cancelled = await this.scheduler.cancelJob(params.jobId);
          if (!cancelled) {
            return Result.ok(
              ToolResult.success({
                cancelled: false,
                message: `Job ${params.jobId} not found`,
              })
            );
          }
          return Result.ok(
            ToolResult.success({
              cancelled: true,
              message: `Job ${params.jobId} cancelled and removed`,
            })
          );
        }

        case 'trigger': {
          if (!params.jobId) {
            return Result.fail(new Error('jobId is required for trigger'));
          }
          const run = await this.scheduler.triggerJob(params.jobId);
          return Result.ok(
            ToolResult.success({
              runId: run.runId,
              agentId: run.agentId,
              status: run.status,
              message: `Job ${params.jobId} triggered — run ${run.runId}`,
            })
          );
        }

        case 'status': {
          if (!params.jobId) {
            return Result.fail(new Error('jobId is required for status'));
          }
          const status = await this.scheduler.getJobStatus(params.jobId);
          if (!status) {
            return Result.ok(
              ToolResult.success({
                found: false,
                message: `Job ${params.jobId} not found`,
              })
            );
          }
          return Result.ok(
            ToolResult.success({
              jobId: status.job.id,
              label: status.job.label,
              schedule: status.job.schedule,
              enabled: status.job.enabled,
              runCount: status.job.runCount,
              maxRuns: status.job.maxRuns,
              nextRunAt: status.nextRunAt,
              runs: status.runs.map(r => ({
                runId: r.runId,
                status: r.status,
                startedAt: r.startedAt,
                completedAt: r.completedAt,
                agentId: r.agentId,
                error: r.error,
              })),
              message: `Job "${status.job.label}" — ${status.job.enabled ? 'active' : 'disabled'}, ${status.job.runCount} run(s)`,
            })
          );
        }

        default:
          return Result.fail(new Error(`Unknown action: ${params.action}`));
      }
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
