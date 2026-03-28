/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.TOOLOUTPUTFILEMANAGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ToolOutputFileManager module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\infrastructure\ToolOutputFileManager.ts
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
 * ToolOutputFileManager — Manages temp files for large tool outputs.
 *
 * When tool output exceeds a threshold, the full output is saved to
 * a file in the workspace's .tool-outputs/ directory. The agent can
 * then use read_file or exec (grep, head, etc.) to inspect it.
 *
 * Only applies to tools NOT in the passthrough allowlist — built-in
 * tools like read_file always return full output.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ILogger } from '../../core/interfaces/ILogger.js';

const DEFAULT_THRESHOLD = 2048; // 2KB
const DEFAULT_PREVIEW_LENGTH = 500;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Tools that always return full output regardless of size.
 * These are tools where truncation would defeat the purpose.
 */
const PASSTHROUGH_TOOLS = new Set([
  'read_file',
  'list_files',
  'search_memory',
  'save_memory',
]);

export interface LargeOutputMetadata {
  readonly type: 'large_output';
  readonly size: number;
  readonly path: string;
  readonly preview: string;
  readonly truncated: boolean;
  readonly hint: string;
}

export class ToolOutputFileManager {
  private readonly outputDir: string;
  private readonly threshold: number;
  private readonly previewLength: number;
  private readonly ttlMs: number;
  private readonly trackedFiles: Set<string> = new Set();
  private readonly logger: ILogger;

  constructor(
    outputDir: string,
    logger: ILogger,
    options?: {
      threshold?: number;
      previewLength?: number;
      ttlMs?: number;
    },
  ) {
    this.outputDir = outputDir;
    this.threshold = options?.threshold ?? DEFAULT_THRESHOLD;
    this.previewLength = options?.previewLength ?? DEFAULT_PREVIEW_LENGTH;
    this.ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
    this.logger = logger;
  }

  /**
   * Check if a tool is in the passthrough allowlist (never truncated).
   */
  isPassthrough(toolName: string): boolean {
    return PASSTHROUGH_TOOLS.has(toolName);
  }

  /**
   * Check if content exceeds the threshold.
   */
  exceedsThreshold(content: string): boolean {
    return Buffer.byteLength(content, 'utf-8') > this.threshold;
  }

  /**
   * Save large output to a file and return metadata with preview.
   * The file is placed in workspace/.tool-outputs/ so read_file can access it.
   */
  save(content: string, toolName: string): LargeOutputMetadata {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `${toolName}-${timestamp}.txt`;
    const filePath = path.join(this.outputDir, filename);

    fs.writeFileSync(filePath, content, 'utf-8');
    this.trackedFiles.add(filePath);

    const size = Buffer.byteLength(content, 'utf-8');
    const preview = content.substring(0, this.previewLength);

    this.logger.debug('Saved large tool output', {
      toolName,
      size,
      path: filePath,
    });

    return {
      type: 'large_output',
      size,
      path: filePath,
      preview,
      truncated: content.length > this.previewLength,
      hint: `Full output saved to ${filePath}. Use read_file or exec (grep, head, tail) to inspect.`,
    };
  }

  /**
   * Clean up all tracked files from the current session.
   */
  cleanupSession(): void {
    for (const filePath of this.trackedFiles) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {
        // Silently ignore cleanup failures
      }
    }
    this.trackedFiles.clear();
    this.logger.debug('Cleaned up session tool output files');
  }

  /**
   * Clean up files older than TTL.
   */
  cleanupStale(): void {
    if (!fs.existsSync(this.outputDir)) {
      return;
    }

    const now = Date.now();
    const files = fs.readdirSync(this.outputDir);

    for (const file of files) {
      const filePath = path.join(this.outputDir, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > this.ttlMs) {
          fs.unlinkSync(filePath);
          this.logger.debug('Removed stale tool output', { path: filePath });
        }
      } catch {
        // Skip files that can't be stat'd
      }
    }
  }
}
