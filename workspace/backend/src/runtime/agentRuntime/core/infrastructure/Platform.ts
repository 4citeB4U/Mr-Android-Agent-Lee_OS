/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.PLATFORM.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = Platform module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\infrastructure\Platform.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { IPlatform } from '../interfaces/IPlatform.js';

/**
 * Platform detection implementation
 * 
 * Provides cross-platform detection capabilities and platform-specific
 * configuration values using Node.js process.platform.
 * 
 * @example
 * ```typescript
 * const platform = new Platform();
 * console.log('OS:', platform.getOS());
 * console.log('Path separator:', platform.getPathSeparator());
 * ```
 */
export class Platform implements IPlatform {
  /**
   * Check if running on Windows
   */
  isWindows(): boolean {
    return process.platform === 'win32';
  }

  /**
   * Check if running on Linux
   */
  isLinux(): boolean {
    return process.platform === 'linux';
  }

  /**
   * Check if running on macOS
   */
  isMac(): boolean {
    return process.platform === 'darwin';
  }

  /**
   * Get the operating system type
   */
  getOS(): 'windows' | 'linux' | 'mac' | 'unknown' {
    if (this.isWindows()) return 'windows';
    if (this.isLinux()) return 'linux';
    if (this.isMac()) return 'mac';
    return 'unknown';
  }

  /**
   * Get the platform-specific PATH environment variable separator
   * 
   * - Windows: ';'
   * - Unix (Linux/macOS): ':'
   */
  getPathSeparator(): string {
    return this.isWindows() ? ';' : ':';
  }

  /**
   * Get the platform-specific shell executable
   * 
   * - Windows: 'cmd.exe'
   * - Unix (Linux/macOS): '/bin/bash'
   */
  getShell(): string {
    return this.isWindows() ? 'cmd.exe' : '/bin/bash';
  }
}
