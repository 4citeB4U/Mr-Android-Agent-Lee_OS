/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.PLATFORMPATHS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = PlatformPaths module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\infrastructure\PlatformPaths.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import * as path from 'path';
import * as fs from 'fs/promises';
import { IPlatformPaths } from '../interfaces/IPlatformPaths.js';
import { IPlatform } from '../interfaces/IPlatform.js';

/**
 * Workspace-local paths implementation
 * 
 * All runtime data lives under `{cwd}/.claw/` with clear subdirectories.
 * Portable, git-ignorable, and simple.
 * 
 * ```
 * my-project/              ← cwd (= workspace)
 * ├── .claw/               ← openclaw-lite runtime root
 * │   ├── config/          ← configuration files (config.json)
 * │   ├── data/            ← runtime data (memory.duckdb, repl-history, scheduler/, tool-outputs/)
 * │   ├── sessions/        ← per-session traces & logs
 * │   ├── skills/          ← user-installed skills
 * │   ├── logs/            ← application logs
 * │   ├── traces/          ← OpenTelemetry traces
 * │   └── tmp/             ← cache & temporary files
 * ├── SOUL.md
 * ├── AGENTS.md
 * └── ...
 * ```
 */
export class PlatformPaths implements IPlatformPaths {
  private readonly clawDir: string;

  /**
   * @param _platform - Platform detection instance (kept for interface compat)
   * @param customRoot - Optional custom root directory (for testing); defaults to cwd
   */
  constructor(_platform: IPlatform, customRoot?: string) {
    this.clawDir = path.join(customRoot || process.cwd(), '.claw');
  }

  /** Configuration files (config.json). */
  getConfigDir(): string {
    return path.join(this.clawDir, 'config');
  }

  /** Runtime data (memory DB, scheduler, tool outputs, repl history). */
  getDataDir(): string {
    return path.join(this.clawDir, 'data');
  }

  /** Workspace directory — the cwd itself. */
  getWorkspaceDir(): string {
    return path.dirname(this.clawDir);
  }

  /** User-installed skills. */
  getSkillsDir(): string {
    return path.join(this.clawDir, 'skills');
  }

  /** Temporary / cache files. */
  getTempDir(): string {
    return path.join(this.clawDir, 'tmp');
  }

  /** Application logs. */
  getLogsDir(): string {
    return path.join(this.clawDir, 'logs');
  }

  /** OpenTelemetry trace files. */
  getTracesDir(): string {
    return path.join(this.clawDir, 'traces');
  }

  /** Per-session directories (spans, logs, metadata). */
  getSessionsDir(): string {
    return path.join(this.clawDir, 'sessions');
  }

  /**
   * Ensure all required directories exist (idempotent).
   */
  async ensureDirectories(): Promise<void> {
    const directories = [
      this.clawDir,
      this.getConfigDir(),
      this.getDataDir(),
      this.getSkillsDir(),
      this.getTempDir(),
      this.getLogsDir(),
      this.getTracesDir(),
      this.getSessionsDir(),
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}
