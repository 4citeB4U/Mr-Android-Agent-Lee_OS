/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENT_DOMAIN_INTERFACES_IWORKSPACEINSTRUCTIONLOADER.MAIN

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
WHERE = backend\src\runtime\agentRuntime\agent\domain\interfaces\IWorkspaceInstructionLoader.ts
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
 * Workspace instruction loader interface
 * 
 * Loads workspace instruction files (SOUL.md, AGENTS.md, USER.md, TOOLS.md)
 * and returns the combined content for systemMessage append mode.
 */
export interface IWorkspaceInstructionLoader {
  /**
   * Load workspace instruction files and return combined content.
   * 
   * @param workspaceRoot - Workspace root directory
   * @param instructionFiles - Ordered list of instruction files to load
   */
  loadInstructions(workspaceRoot: string, instructionFiles: string[]): Promise<string>;
}
