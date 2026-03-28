/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SESSIONCLEANER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SessionCleaner module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tracing\application\SessionCleaner.ts
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
 * SessionCleaner — deletes session directories older than a configured age.
 * 
 * Runs once at startup (fire-and-forget). Only removes directories matching
 * the session naming pattern `YYYY-MM-DDTHHMMSS_{id}`.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ILogger } from '../../core/interfaces/ILogger.js';

export interface SessionCleanerConfig {
  maxAgeDays: number;
  sessionsDir: string;
  /** Directory name of the currently active session (never deleted) */
  currentSessionDir?: string;
}

export interface CleanupResult {
  scanned: number;
  deleted: number;
  freedBytes: number;
  errors: string[];
}

// Matches: 2026-02-23T143012_a1b2c3d4
const SESSION_DIR_PATTERN = /^(\d{4}-\d{2}-\d{2}T\d{6})_[a-z0-9]+$/;

export class SessionCleaner {
  constructor(
    private readonly config: SessionCleanerConfig,
    private readonly logger: ILogger,
  ) {}

  async clean(): Promise<CleanupResult> {
    const result: CleanupResult = { scanned: 0, deleted: 0, freedBytes: 0, errors: [] };

    let entries: string[];
    try {
      entries = await fs.readdir(this.config.sessionsDir);
    } catch {
      return result; // directory doesn't exist yet
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.config.maxAgeDays);

    for (const entry of entries) {
      const match = SESSION_DIR_PATTERN.exec(entry);
      if (!match) continue;

      result.scanned++;

      // Never delete the active session
      if (entry === this.config.currentSessionDir) continue;

      // Parse date from directory name: "2026-02-23T143012" → "2026-02-23T14:30:12"
      const raw = match[1];
      const isoDate = `${raw.slice(0, 13)}:${raw.slice(13, 15)}:${raw.slice(15)}Z`;
      const dirDate = new Date(isoDate);

      if (dirDate >= cutoff) continue;

      const dirPath = path.join(this.config.sessionsDir, entry);
      try {
        const size = await this.dirSize(dirPath);
        await fs.rm(dirPath, { recursive: true, force: true });
        result.deleted++;
        result.freedBytes += size;
        this.logger.info('Deleted old session directory', { dir: entry, ageMs: Date.now() - dirDate.getTime() });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`${entry}: ${msg}`);
        this.logger.warn('Failed to delete session directory', { dir: entry, error: msg });
      }
    }

    return result;
  }

  private async dirSize(dirPath: string): Promise<number> {
    let total = 0;
    try {
      const entries = await fs.readdir(dirPath);
      for (const entry of entries) {
        const stat = await fs.stat(path.join(dirPath, entry));
        total += stat.size;
      }
    } catch { /* best effort */ }
    return total;
  }
}
