/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENTRUNTIME_TOOLS_INDEX_TS.MAIN_INDEX.MAIN

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
WHERE = backend\src\runtime\agentRuntime\tools\index.ts
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
 * Tools slice - Tool registry and execution (FCIS pattern).
 * Public API for tool operations.
 */

// Domain interfaces
export type { ITool } from './domain/interfaces/ITool.js';
export type { IToolRegistry } from './domain/interfaces/IToolRegistry.js';

// Domain value objects
export { ToolParameter } from './domain/value-objects/ToolParameter.js';
export { ToolResult } from './domain/value-objects/ToolResult.js';

// Domain types
export type { JSONSchema, JSONSchemaProperty } from './domain/types/JSONSchema.js';
export { isJSONSchema } from './domain/types/JSONSchema.js';

// Domain events
export { ToolRegisteredEvent } from './domain/events/ToolRegisteredEvent.js';
export type { ToolRegisteredPayload } from './domain/events/ToolRegisteredEvent.js';
export { ToolUnregisteredEvent } from './domain/events/ToolUnregisteredEvent.js';
export type { ToolUnregisteredPayload } from './domain/events/ToolUnregisteredEvent.js';

// Application layer
export { ToolInvoker, validateParameters } from './application/ToolExecutor.js';
export type { ValidationResult } from './application/ToolExecutor.js';

// Infrastructure (for DI registration only)
export { InMemoryToolRegistry } from './infrastructure/InMemoryToolRegistry.js';
