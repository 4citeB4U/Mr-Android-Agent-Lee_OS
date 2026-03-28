/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SCHEDULER_TOOLS_TOOL_SCHEMAS_TS.MAIN_TOOL.MAIN_SCHEMAS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = tool-schemas module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\scheduler\tools\tool-schemas.ts
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
 * Tool schemas for scheduler tools
 */

export const ScheduleTaskToolSchema = {
  name: 'schedule_task',
  description:
    'Schedule a one-off or recurring task to run in a new agent session. ' +
    'One-off: fires once at a specific time. Interval: fires every N milliseconds. ' +
    'Cron: fires on a cron schedule (standard 5-field or 6-field with seconds). ' +
    'Results are automatically reported back to this session when each run completes.',
  parameters: {
    type: 'object' as const,
    properties: {
      task: {
        type: 'string' as const,
        description:
          'Detailed task prompt for the spawned agent. Be specific about what to do and what to report back.',
      },
      schedule: {
        type: 'object' as const,
        description: 'When the task should run.',
        properties: {
          kind: {
            type: 'string' as const,
            enum: ['once', 'interval', 'cron'],
            description:
              '"once" = fire at a specific time. "interval" = fire every N ms. "cron" = cron expression.',
          },
          at: {
            type: 'string' as const,
            description: 'ISO-8601 timestamp for kind=once (e.g. "2026-02-26T14:00:00Z").',
          },
          intervalMs: {
            type: 'number' as const,
            description: 'Interval in milliseconds for kind=interval (e.g. 3600000 = 1 hour).',
          },
          cron: {
            type: 'string' as const,
            description:
              'Cron expression for kind=cron (e.g. "0 9 * * 1" = every Monday 9 AM). ' +
              'Supports 5-field (min hour dom month dow) or 6-field (sec min hour dom month dow).',
          },
          timezone: {
            type: 'string' as const,
            description: 'IANA timezone for kind=cron (default: "UTC"). E.g. "Europe/Dublin".',
          },
        },
        required: ['kind'],
      },
      label: {
        type: 'string' as const,
        description: 'Human-readable name for the scheduled task.',
      },
      model: {
        type: 'string' as const,
        description: 'Override model for the spawned agent (auto-selected if omitted).',
      },
      maxRuns: {
        type: 'number' as const,
        description: 'Maximum number of runs for recurring tasks. Omit for unlimited.',
      },
      timeoutSeconds: {
        type: 'number' as const,
        description: 'Per-run timeout in seconds (default: 600).',
      },
    },
    required: ['task', 'schedule'],
  },
};

export const ManageScheduleToolSchema = {
  name: 'manage_schedule',
  description:
    'List, cancel, trigger, or inspect scheduled tasks. ' +
    'Use action="list" to see all jobs. Use action="cancel" to remove a job. ' +
    'Use action="trigger" to fire a job immediately. Use action="status" for details and run history.',
  parameters: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string' as const,
        enum: ['list', 'cancel', 'trigger', 'status'],
        description: 'What to do.',
      },
      jobId: {
        type: 'string' as const,
        description: 'Job ID (required for cancel/trigger/status).',
      },
    },
    required: ['action'],
  },
};
