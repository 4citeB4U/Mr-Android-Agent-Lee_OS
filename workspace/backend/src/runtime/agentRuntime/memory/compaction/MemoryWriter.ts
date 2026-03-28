/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.MEMORYWRITER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = MemoryWriter module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\compaction\MemoryWriter.ts
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
 * MemoryWriter - Writes extracted memories to daily files
 * 
 * Imperative Shell: performs file I/O.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ILogger } from '../../core/interfaces/ILogger.js';
import type { MemoryItem } from './ExtractionPrompt.js';

export class MemoryWriter {
  constructor(
    private readonly workspacePath: string,
    private readonly logger: ILogger
  ) {}

  /**
   * Write extracted memories to the daily file
   */
  async writeMemories(items: MemoryItem[], date?: Date): Promise<number> {
    if (items.length === 0) return 0;

    const d = date ?? new Date();
    const dateStr = d.toISOString().split('T')[0];
    const memoryDir = path.join(this.workspacePath, 'memory');
    const filePath = path.join(memoryDir, `${dateStr}.md`);

    // Ensure directory exists
    await fs.mkdir(memoryDir, { recursive: true });

    // Load existing content for dedup
    let existing = '';
    try {
      existing = await fs.readFile(filePath, 'utf-8');
    } catch {
      // File doesn't exist yet
    }

    // Filter duplicates
    const newItems = items.filter(
      item => !this.isDuplicate(item.content, existing)
    );

    if (newItems.length === 0) {
      this.logger.info('All extracted memories already exist, skipping write');
      return 0;
    }

    // Format and append
    const timestamp = d.toISOString().split('T')[1].split('.')[0];
    const section = this.formatSection(newItems, timestamp);

    await fs.appendFile(filePath, section);

    this.logger.info('Wrote extracted memories', {
      file: filePath,
      count: newItems.length,
      skipped: items.length - newItems.length,
    });

    return newItems.length;
  }

  /**
   * Check if content is a duplicate of existing text (fuzzy)
   */
  private isDuplicate(content: string, existing: string): boolean {
    if (!existing) return false;

    // Normalize for comparison
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const normalized = normalize(content);
    const existingNorm = normalize(existing);

    // Exact substring match
    if (existingNorm.includes(normalized)) return true;

    // Check word overlap (>80% of words match)
    const words = new Set(normalized.split(/\s+/));
    const existingWords = new Set(existingNorm.split(/\s+/));
    let overlap = 0;
    for (const w of words) {
      if (existingWords.has(w)) overlap++;
    }
    return words.size > 3 && overlap / words.size > 0.8;
  }

  private formatSection(items: MemoryItem[], timestamp: string): string {
    let section = `\n### Extracted (${timestamp})\n\n`;
    for (const item of items) {
      section += `- [${item.category}] ${item.content}\n`;
    }
    return section;
  }
}
