/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.IPROCESSMANAGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IProcessManager module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\interfaces\IProcessManager.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { ChildProcess } from 'child_process';

/**
 * Spawn options for process execution
 */
export interface SpawnOptions {
  /**
   * Current working directory
   */
  cwd?: string;

  /**
   * Environment variables
   */
  env?: NodeJS.ProcessEnv;

  /**
   * Standard I/O configuration
   * @default 'pipe'
   */
  stdio?: 'pipe' | 'ignore' | 'inherit' | Array<'pipe' | 'ignore' | 'inherit'>;

  /**
   * Timeout in milliseconds
   */
  timeout?: number;

  /**
   * Whether to run in a shell
   * @default false (but ProcessManager may override based on platform)
   */
  shell?: boolean | string;

  /**
   * Hide window on Windows
   * @default true
   */
  windowsHide?: boolean;
}

/**
 * Process manager interface for cross-platform process spawning and management
 * 
 * Provides abstractions for spawning processes, managing their lifecycle,
 * and handling platform-specific differences (Windows vs Unix).
 * 
 * @example
 * ```typescript
 * const processManager = Container.resolve<IProcessManager>(Tokens.IProcessManager);
 * 
 * // Spawn a process
 * const result = processManager.spawn('node', ['--version']);
 * if (result.isSuccess()) {
 *   const child = result.getValue();
 *   child.stdout?.on('data', (data) => console.log(data.toString()));
 * }
 * 
 * // Kill a process gracefully
 * await processManager.killGracefully(child.pid!, 5000);
 * ```
 */
export interface IProcessManager {
  /**
   * Spawn a child process with platform-appropriate options
   * 
   * @param command - Command to execute
   * @param args - Command arguments
   * @param options - Spawn options
   * @returns Promise resolving to ChildProcess instance
   * @throws Error if spawn fails
   */
  spawn(command: string, args?: string[], options?: SpawnOptions): Promise<ChildProcess>;

  /**
   * Kill a process by PID
   * 
   * On Windows: Uses taskkill /F
   * On Unix: Sends SIGKILL
   * 
   * @param pid - Process ID
   * @returns Promise that resolves when process is killed
   * @throws Error if kill fails
   */
  kill(pid: number): Promise<void>;

  /**
   * Kill a process gracefully with fallback to force kill
   * 
   * Tries SIGTERM first, then SIGKILL after timeout.
   * 
   * @param pid - Process ID
   * @param timeoutMs - Timeout before force kill (default: 5000ms)
   * @returns Promise that resolves when process exits
   * @throws Error if process doesn't exist
   */
  killGracefully(pid: number, timeoutMs?: number): Promise<void>;

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
