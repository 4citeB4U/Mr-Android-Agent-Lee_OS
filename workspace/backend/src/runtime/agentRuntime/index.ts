/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENTRUNTIME_INDEX.MAIN

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
WHERE = backend\src\runtime\agentRuntime\index.ts
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
 * Agent Lee Runtime — public API barrel export
 */

// Bootstrap
export { bootstrap, shutdown } from "./composition/bootstrap.js";
export type { BootstrapOptions } from "./composition/bootstrap.js";

// Container + DI tokens
export { Container, Tokens } from "./composition/Container.js";

// Agent session
export type {
    AgentSessionConfig, IAgentSessionManager
} from "./agent/domain/interfaces/IAgentSessionManager.js";
export { AgentSessionManager } from "./application/AgentSessionManager.js";

// Configuration
export { getDefaultConfig, parseConfig } from "./core/config/AppConfig.js";
export type { AppConfig } from "./core/config/AppConfig.js";

// Sub-agents
export { ForkableSession } from "./sub-agents/ForkableSession.js";
export { SubAgentManager } from "./sub-agents/SubAgentManager.js";
export type {
    AgentInfo, SpawnOptions,
    SpawnResult
} from "./sub-agents/types.js";

