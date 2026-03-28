/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.IPLATFORM.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IPlatform module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\interfaces\IPlatform.ts
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
 * Platform detection interface for cross-platform compatibility
 * 
 * Provides methods to detect the current operating system and retrieve
 * platform-specific configuration values (e.g., path separators, shell).
 * 
 * @example
 * ```typescript
 * const platform = Container.resolve<IPlatform>(Tokens.IPlatform);
 * 
 * if (platform.isWindows()) {
 *   console.log('Running on Windows');
 *   console.log('Shell:', platform.getShell()); // cmd.exe
 * }
 * ```
 */
export interface IPlatform {
  /**
   * Check if running on Windows
   * 
   * @returns true if platform is win32
   */
  isWindows(): boolean;

  /**
   * Check if running on Linux
   * 
   * @returns true if platform is linux
   */
  isLinux(): boolean;

  /**
   * Check if running on macOS
   * 
   * @returns true if platform is darwin
   */
  isMac(): boolean;

  /**
   * Get the operating system type
   * 
   * @returns Operating system identifier
   */
  getOS(): 'windows' | 'linux' | 'mac' | 'unknown';

  /**
   * Get the platform-specific PATH environment variable separator
   * 
   * @returns Path separator (';' on Windows, ':' on Unix)
   * @example
   * - Windows: ';'
   * - Linux/macOS: ':'
   */
  getPathSeparator(): string;

  /**
   * Get the platform-specific shell executable
   * 
   * @returns Shell path/name
   * @example
   * - Windows: 'cmd.exe'
   * - Linux/macOS: '/bin/bash'
   */
  getShell(): string;
}
