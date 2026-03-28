/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ICOPILOTCLI.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ICopilotCLI module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\interfaces\ICopilotCLI.ts
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
 * Copilot CLI discovery interface
 * 
 * Provides methods to locate and verify the GitHub Copilot CLI installation
 * across different platforms.
 * 
 * @example
 * ```typescript
 * const copilotCLI = Container.resolve<ICopilotCLI>(Tokens.ICopilotCLI);
 * 
 * // Find CLI binary
 * const cliPath = copilotCLI.findCLI();
 * console.log('Found CLI at:', cliPath);
 * 
 * // Verify installation
 * const status = await copilotCLI.verify();
 * console.log('Version:', status.version);
 * console.log('Authenticated:', status.authenticated);
 * ```
 */
export interface ICopilotCLI {
  /**
   * Find the Copilot CLI binary in PATH or common locations
   * 
   * Searches in platform-specific locations:
   * - Windows: Program Files, LOCALAPPDATA
   * - Linux: /usr/local/bin, /usr/bin, ~/.local/bin
   * - macOS: /usr/local/bin, /opt/homebrew/bin
   * 
   * @returns Path to copilot-cli binary
   * @throws Error if CLI not found
   */
  findCLI(): string;

  /**
   * Verify Copilot CLI installation and authentication status
   * 
   * Checks:
   * - CLI is executable
   * - Version can be determined
   * - Authentication status
   * 
   * @returns Installation status including version and auth state
   * @throws Error if CLI not found or not executable
   */
  verify(): Promise<{
    version: string;
    authenticated: boolean;
    path: string;
  }>;

  /**
   * Get the platform-specific binary name
   * 
   * @returns Binary name
   * @example
   * - Windows: 'copilot-cli.exe'
   * - Linux/macOS: 'copilot-cli'
   */
  getBinaryName(): string;
}
