/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.DOMAIN_INTERFACES_INDEX_TS.MAIN_INDEX.MAIN

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
WHERE = backend\src\runtime\agentRuntime\agent\domain\interfaces\index.ts
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
 * Agent domain interfaces exports
 */

export type { Message, AssistantResponse, SessionConfig } from './IAgentTypes.js';
export { AgentError } from './IAgentTypes.js';
export type { IAgentSession, SessionState } from './IAgentSession.js';
export type {
  IAgentSessionManager,
  AgentSessionConfig
} from './IAgentSessionManager.js';
export type { IToolExecutor, ToolExecutionContext, ToolExecutionResult } from './IToolExecutor.js';
export type { IWorkspaceInstructionLoader } from './IWorkspaceInstructionLoader.js';
