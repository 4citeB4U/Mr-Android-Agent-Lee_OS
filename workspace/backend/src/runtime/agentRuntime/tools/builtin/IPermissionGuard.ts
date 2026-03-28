/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.IPERMISSIONGUARD.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IPermissionGuard module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\builtin\IPermissionGuard.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import type { SafetyDecision, CommandContext, CommandEvaluationOptions } from './CommandSafetyGuard.js';

export interface SDKPermissionRequest {
  kind: 'shell' | 'write' | 'read' | 'mcp' | 'url';
  command?: string;
  fullCommandText?: string;
  path?: string;
  url?: string;
  serverName?: string;
  toolName?: string;
  [key: string]: unknown;
}

export interface IPermissionGuard {
  evaluateCommand(
    command: string,
    args: string[],
    context: CommandContext,
    options?: CommandEvaluationOptions
  ): Promise<SafetyDecision>;

  evaluateSDKRequest(request: SDKPermissionRequest): Promise<SafetyDecision>;
}
