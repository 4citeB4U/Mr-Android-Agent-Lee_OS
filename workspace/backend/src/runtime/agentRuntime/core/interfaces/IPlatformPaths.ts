/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.IPLATFORMPATHS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IPlatformPaths module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\interfaces\IPlatformPaths.ts
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
 * Platform paths interface for cross-platform file system access
 * 
 * Abstracts platform-specific directory paths (Windows vs Linux).
 * Provides consistent access to configuration, data, and plugin directories.
 * 
 * @example
 * ```typescript
 * const paths = new PlatformPaths();
 * await paths.ensureDirectories();
 * const configFile = path.join(paths.getConfigDir(), 'config.json');
 * ```
 */
export interface IPlatformPaths {
  /**
   * Get the configuration directory path
   * 
   * @returns Absolute path to config directory
   * @example
   * - Linux: ~/.config/openclaw-lite
   * - Windows: %APPDATA%/openclaw-lite
   */
  getConfigDir(): string;

  /**
   * Get the data directory path
   * 
   * @returns Absolute path to data directory
   * @example
   * - Linux: ~/.local/share/openclaw-lite
   * - Windows: %LOCALAPPDATA%/openclaw-lite
   */
  getDataDir(): string;

  /**
   * Get the workspace directory path
   * 
   * @returns Absolute path to workspace directory
   * @example
   * - Linux: ~/workspace
   * - Windows: %USERPROFILE%/Documents/workspace
   */
  getWorkspaceDir(): string;

  /**
   * Get the skills directory path
   * 
   * @returns Absolute path to skills directory
   * @example
   * - Linux: ~/.local/share/openclaw-lite/skills
   * - Windows: %LOCALAPPDATA%/openclaw-lite/skills
   */
  getSkillsDir(): string;

  /**
   * Get the temporary files directory path
   * 
   * @returns Absolute path to temp directory
   * @example
   * - Linux: ~/.cache/openclaw-lite
   * - Windows: %TEMP%/openclaw-lite
   */
  getTempDir(): string;

  /**
   * Get the logs directory path
   * 
   * @returns Absolute path to logs directory
   * @example
   * - Linux: ~/.local/share/openclaw-lite/logs
   * - Windows: %LOCALAPPDATA%/openclaw-lite/logs
   */
  getLogsDir(): string;

  /**
   * Get the traces directory path
   * 
   * @returns Absolute path to traces directory
   * @example
   * - Linux: ~/.local/share/openclaw-lite/traces
   * - Windows: %LOCALAPPDATA%/openclaw-lite/traces
   */
  getTracesDir(): string;

  /**
   * Get the sessions directory path
   * 
   * Per-session directories containing spans.jsonl, log.jsonl, and session.json.
   * @returns Absolute path to sessions directory
   * @example
   * - Linux: ~/.local/share/openclaw-lite/sessions
   * - Windows: %LOCALAPPDATA%/openclaw-lite/sessions
   */
  getSessionsDir(): string;

  /**
   * Ensure all required directories exist
   * 
   * Creates directories if they don't exist (recursive mkdir).
   * 
   * @throws {Error} If directory creation fails
   */
  ensureDirectories(): Promise<void>;
}
