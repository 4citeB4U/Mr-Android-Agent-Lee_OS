/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.IUSERAPPROVALPROVIDER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IUserApprovalProvider module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\builtin\IUserApprovalProvider.ts
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
 * IUserApprovalProvider — Interface for requesting user approval
 * for commands that need human confirmation.
 *
 * CLI implements this with interactive y/n prompt.
 * Other UIs can implement their own approval flow.
 */

export interface ApprovalRequest {
  readonly command: string;
  readonly args: string[];
  readonly reason: string;
  readonly kind?: 'exec' | 'shell' | 'write' | 'read' | 'url' | 'mcp';
}

export interface IUserApprovalProvider {
  /**
   * Request user approval for a command.
   * @returns true if approved, false if denied
   */
  requestApproval(request: ApprovalRequest): Promise<boolean>;
}
