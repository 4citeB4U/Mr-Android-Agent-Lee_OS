/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SCHEDULETASKTOOL.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ScheduleTaskTool module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\scheduler\tools\ScheduleTaskTool.ts
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
 * ScheduleTaskTool — creates one-off or recurring scheduled tasks
 */

import { ITool } from '../../tools/domain/interfaces/ITool.js';
import { ToolResult } from '../../tools/domain/value-objects/ToolResult.js';
import { Result } from '../../core/types/Result.js';
import { SchedulerService } from '../application/SchedulerService.js';
import { ScheduleTaskToolSchema } from './tool-schemas.js';
import type { JobSchedule } from '../domain/ScheduledJob.js';

export class ScheduleTaskTool implements ITool {
  readonly name = ScheduleTaskToolSchema.name;
  readonly description = ScheduleTaskToolSchema.description;
  readonly schema = ScheduleTaskToolSchema.parameters;

  constructor(private readonly scheduler: SchedulerService) {}

  async execute(parameters: unknown): Promise<Result<ToolResult, Error>> {
    try {
      const params = parameters as {
        task: string;
        schedule: {
          kind: 'once' | 'interval' | 'cron';
          at?: string;
          intervalMs?: number;
          cron?: string;
          timezone?: string;
        };
        label?: string;
        model?: string;
        maxRuns?: number;
        timeoutSeconds?: number;
      };

      // Validate schedule
      const schedule = this.parseSchedule(params.schedule);

      const job = await this.scheduler.addJob({
        task: params.task,
        schedule,
        label: params.label,
        model: params.model,
        maxRuns: params.maxRuns,
        timeoutSeconds: params.timeoutSeconds,
      });

      return Result.ok(
        ToolResult.success({
          jobId: job.id,
          label: job.label,
          schedule: job.schedule,
          enabled: job.enabled,
          message: `Scheduled task "${job.label}" created (${job.schedule.kind})`,
        })
      );
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  private parseSchedule(input: {
    kind: string;
    at?: string;
    intervalMs?: number;
    cron?: string;
    timezone?: string;
  }): JobSchedule {
    switch (input.kind) {
      case 'once': {
        if (!input.at) throw new Error('schedule.at is required for kind=once');
        const date = new Date(input.at);
        if (isNaN(date.getTime())) throw new Error(`Invalid ISO-8601 timestamp: ${input.at}`);
        return { kind: 'once', at: date.toISOString() };
      }
      case 'interval': {
        if (!input.intervalMs || input.intervalMs < 1000) {
          throw new Error('schedule.intervalMs is required and must be >= 1000');
        }
        return { kind: 'interval', intervalMs: input.intervalMs };
      }
      case 'cron': {
        if (!input.cron) throw new Error('schedule.cron is required for kind=cron');
        return { kind: 'cron', expr: input.cron, timezone: input.timezone ?? 'UTC' };
      }
      default:
        throw new Error(`Unknown schedule kind: ${input.kind}`);
    }
  }
}
