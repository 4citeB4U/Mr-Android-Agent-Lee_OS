/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.REGISTERSCHEDULERTOOLS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = registerSchedulerTools module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\scheduler\tools\registerSchedulerTools.ts
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
 * Register scheduler tools with the tool registry
 */

import { IToolRegistry } from '../../tools/domain/interfaces/IToolRegistry.js';
import { SchedulerService } from '../application/SchedulerService.js';
import { ScheduleTaskTool } from './ScheduleTaskTool.js';
import { ManageScheduleTool } from './ManageScheduleTool.js';

export async function registerSchedulerTools(
  toolRegistry: IToolRegistry,
  schedulerService: SchedulerService,
): Promise<void> {
  const scheduleTool = new ScheduleTaskTool(schedulerService);
  const scheduleResult = await toolRegistry.register(scheduleTool);
  if (scheduleResult.isFailure()) {
    throw scheduleResult.getError();
  }

  const manageTool = new ManageScheduleTool(schedulerService);
  const manageResult = await toolRegistry.register(manageTool);
  if (manageResult.isFailure()) {
    throw manageResult.getError();
  }

  console.log('✅ Registered 2 scheduler tools');
  console.log('   - schedule_task: Create one-off or recurring tasks');
  console.log('   - manage_schedule: List/cancel/trigger/inspect scheduled tasks');
}
