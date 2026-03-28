/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENTRUNTIME_SUB_AGENTS_INDEX_TS.MAIN_AGENTS_INDEX.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = index module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\sub-agents\index.ts
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
 * Sub-agent management module
 * 
 * Provides sub-agent spawning, orchestration, and lifecycle management.
 */

export { SubAgentManager } from './SubAgentManager.js';
export {
  OpenClawStyleOrchestrator,
  OpenClawSpawnOptions,
} from './OpenClawStyleOrchestrator.js';
export { ForkableSession } from './ForkableSession.js';
export { SpawnOptions, AgentInfo, SpawnResult } from './types.js';
export {
  ForkOptions,
  ForkResult,
  SessionMessage,
} from './fork-types.js';
export {
  SubAgentSpawnedEvent,
  SubAgentCompletedEvent,
  SubAgentFailedEvent,
  SubAgentSpawnedPayload,
  SubAgentCompletedPayload,
  SubAgentFailedPayload,
} from './events.js';
export {
  registerSubAgentTools,
  sessionsSpawnTool,
  sessionsListTool,
  sessionsSendTool,
  sessionsHistoryTool,
  sessionsDestroyTool,
} from './tools.js';
