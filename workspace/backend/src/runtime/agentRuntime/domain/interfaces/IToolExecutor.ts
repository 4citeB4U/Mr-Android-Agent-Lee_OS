/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.DOMAIN_INTERFACES_ITOOLEXECUTOR_TS.MAIN_ITOOLEXECUTOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IToolExecutor module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\domain\interfaces\IToolExecutor.ts
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
 * IToolExecutor — agent-layer tool execution interface
 */
import { DomainError } from "../../core/errors/DomainError.js";
import { Result } from "../../core/types/Result.js";

export interface ToolExecutionResult {
  success: boolean;
  output: unknown;
  durationMs: number;
}

export interface IToolExecutor {
  execute(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<Result<ToolExecutionResult, DomainError>>;
}
