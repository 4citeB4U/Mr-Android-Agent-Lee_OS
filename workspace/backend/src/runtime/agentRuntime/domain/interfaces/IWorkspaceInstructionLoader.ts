/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.DOMAIN_INTERFACES_IWORKSPACEINSTRUCTIONLOADER_TS.MAIN_IWORKSPACEINSTRUCTIONLOADER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IWorkspaceInstructionLoader module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\domain\interfaces\IWorkspaceInstructionLoader.ts
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
 * IWorkspaceInstructionLoader — interface for loading workspace instruction files
 */
export interface IWorkspaceInstructionLoader {
  loadInstructions(
    workspaceRoot: string,
    instructionFiles: string[],
  ): Promise<string>;
}
