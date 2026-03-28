/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SESSIONDIRECTORY.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SessionDirectory module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tracing\domain\SessionDirectory.ts
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
 * SessionDirectory value object
 * 
 * Encapsulates the per-session directory path and provides file path accessors.
 * Directory naming format: `{ISO-date}_{sessionId-prefix}` — sorts chronologically
 * via filesystem `ls` and is human-readable.
 * 
 * @example
 * ```typescript
 * const dir = await SessionDirectory.create('/data/sessions', sessionId, new Date());
 * // dir.path     → /data/sessions/2026-02-23T143012_a1b2c3d4
 * // dir.spansFile → /data/sessions/2026-02-23T143012_a1b2c3d4/spans.jsonl
 * // dir.logFile   → /data/sessions/2026-02-23T143012_a1b2c3d4/log.jsonl
 * ```
 */

import * as fs from 'fs/promises';
import * as pathModule from 'path';

export class SessionDirectory {
  private constructor(
    private readonly _path: string,
    private readonly _dirName: string,
  ) {}

  /**
   * Create a new session directory on the filesystem.
   * 
   * @param baseDir - Parent directory for all sessions
   * @param sessionId - UUID session identifier
   * @param startedAt - Session start time (used for directory name)
   */
  static async create(baseDir: string, sessionId: string, startedAt: Date): Promise<SessionDirectory> {
    const dirName = SessionDirectory.formatDirName(sessionId, startedAt);
    const fullPath = pathModule.join(baseDir, dirName);
    await fs.mkdir(fullPath, { recursive: true });
    return new SessionDirectory(fullPath, dirName);
  }

  /** Full absolute path to the session directory */
  get path(): string { return this._path; }

  /** Directory name only (e.g. `2026-02-23T143012_a1b2c3d4`) */
  get dirName(): string { return this._dirName; }

  /** Path to OTel spans JSONL file */
  get spansFile(): string { return pathModule.join(this._path, 'spans.jsonl'); }

  /** Path to structured JSON log file */
  get logFile(): string { return pathModule.join(this._path, 'log.jsonl'); }

  /** Path to session metadata JSON file */
  get metadataFile(): string { return pathModule.join(this._path, 'session.json'); }

  /**
   * Format directory name: `YYYY-MM-DDTHHMMSS_{id-prefix}`
   * 
   * Uses ISO date with colons removed for filesystem compatibility.
   * First 8 chars of sessionId (or full ID if shorter) for quick identification.
   */
  private static formatDirName(sessionId: string, startedAt: Date): string {
    const iso = startedAt.toISOString();
    // "2026-02-23T14:30:12.000Z" → "2026-02-23T143012"
    const datePart = iso.slice(0, 19).replace(/:/g, '');
    const idPrefix = sessionId.slice(0, 8);
    return `${datePart}_${idPrefix}`;
  }
}
