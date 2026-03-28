/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.MEMORYFILEWRITER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = MemoryFileWriter module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\context\MemoryFileWriter.ts
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
 * Memory file writer for context management
 * 
 * Writes extracted memories to daily markdown files with atomic operations.
 * Integrates with Phase 0 ConfigLoader for workspace path resolution.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ITracer } from '../../core/interfaces/ITracer.js';
import { IEventBus } from '../../core/interfaces/IEventBus.js';
import { ExtractedMemory } from './types.js';
import { MemoryWrittenEvent } from './events.js';
import { Result } from '../../core/types/Result.js';

/**
 * Interface for config loader (minimal subset needed)
 */
interface IConfigLoader {
  load(configPath?: string): Promise<Result<any, any>>;
}

/**
 * MemoryFileWriter class
 * 
 * Persists extracted memories to daily markdown files in workspace.
 * 
 * @example
 * ```typescript
 * const writer = new MemoryFileWriter(configLoader, tracer, eventBus);
 * await writer.initialize();
 * 
 * await writer.writeMemories(memories, 'session-123');
 * ```
 */
export class MemoryFileWriter {
  private workspacePath: string | null = null;

  constructor(
    private readonly configLoader: IConfigLoader,
    private readonly tracer: ITracer,
    private readonly eventBus: IEventBus
  ) {}

  /**
   * Initialize the writer by loading workspace configuration
   * Should be called after construction
   */
  async initialize(): Promise<void> {
    const configResult = await this.configLoader.load();

    if (configResult.isSuccess()) {
      const config = configResult.getValue();
      // Get workspace path from config
      this.workspacePath = (config as any).workspace?.path || process.cwd();
    } else {
      // Fallback to current directory
      this.workspacePath = process.cwd();
    }
  }

  /**
   * Write memories to daily markdown file
   * 
   * @param memories - Memories to write
   * @param sessionId - Session ID for tracking
   * @returns File path where memories were written
   */
  async writeMemories(
    memories: ExtractedMemory[],
    sessionId: string
  ): Promise<string> {
    return this.tracer.span('memory.file.write', async (span) => {
      span.setAttribute('sessionId', sessionId);
      span.setAttribute('memoryCount', memories.length);

      try {
        if (!this.workspacePath) {
          throw new Error('MemoryFileWriter not initialized - call initialize() first');
        }

        // Skip if no memories
        if (memories.length === 0) {
          span.setAttribute('skipped', 'no-memories');
          span.setStatus('ok');
          return '';
        }

        // Get today's date in YYYY-MM-DD format (UTC)
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];

        // Build file path: workspace/memory/YYYY-MM-DD.md
        const memoryDir = path.join(this.workspacePath, 'memory');
        const filePath = path.join(memoryDir, `${dateStr}.md`);

        span.setAttribute('filePath', filePath);
        span.setAttribute('date', dateStr);

        // Ensure memory directory exists
        await fs.mkdir(memoryDir, { recursive: true });

        // Format memories as markdown
        const content = this.formatMemories(memories, sessionId, today);

        // Write atomically (write to temp, then rename)
        await this.writeAtomic(filePath, content);

        // Publish event
        await this.eventBus.publish(
          new MemoryWrittenEvent(sessionId, filePath, memories.length)
        );

        span.setStatus('ok');
        return filePath;
      } catch (error) {
        span.setStatus('error', error instanceof Error ? error.message : String(error));
        
        // Publish error event
        await this.eventBus.publish({
          eventName: 'context.memory.write.error',
          occurredAt: new Date(),
          payload: {
            sessionId,
            error: error instanceof Error ? error.message : String(error),
          },
        });

        throw error;
      }
    });
  }

  /**
   * Format memories as markdown
   * 
   * @param memories - Memories to format
   * @param sessionId - Session ID
   * @param timestamp - Timestamp for the session header
   * @returns Formatted markdown content
   */
  private formatMemories(
    memories: ExtractedMemory[],
    sessionId: string,
    timestamp: Date
  ): string {
    const lines: string[] = [];

    // Session header with timestamp
    const timeStr = timestamp.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    lines.push(`## Session: ${sessionId} (${timeStr} UTC)`);
    lines.push('');

    // Group memories by type
    const grouped = this.groupByType(memories);

    // Write each type section
    const typeOrder: Array<ExtractedMemory['type']> = ['fact', 'decision', 'preference', 'todo', 'learning'];
    const typeLabels: Record<ExtractedMemory['type'], string> = {
      fact: 'Facts',
      decision: 'Decisions',
      preference: 'Preferences',
      todo: 'TODOs',
      learning: 'Learnings',
    };

    for (const type of typeOrder) {
      const items = grouped[type];
      if (items.length === 0) {
        continue;
      }

      lines.push(`### ${typeLabels[type]}`);
      for (const memory of items) {
        // Format TODOs as checkbox items
        if (type === 'todo') {
          lines.push(`- [ ] ${memory.content}`);
        } else {
          lines.push(`- ${memory.content}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Group memories by type
   * 
   * @param memories - Memories to group
   * @returns Memories grouped by type
   */
  private groupByType(
    memories: ExtractedMemory[]
  ): Record<ExtractedMemory['type'], ExtractedMemory[]> {
    const grouped: Record<ExtractedMemory['type'], ExtractedMemory[]> = {
      fact: [],
      decision: [],
      preference: [],
      todo: [],
      learning: [],
    };

    for (const memory of memories) {
      grouped[memory.type].push(memory);
    }

    return grouped;
  }

  /**
   * Write content to file atomically
   * Uses temp file + rename pattern for atomic writes
   * 
   * @param filePath - Target file path
   * @param content - Content to write
   */
  private async writeAtomic(filePath: string, content: string): Promise<void> {
    // Check if file exists
    let existingContent = '';
    try {
      existingContent = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      // File doesn't exist - create with header
      const date = path.basename(filePath, '.md');
      existingContent = `# ${date} Memory Log\n\n`;
    }

    // Append new content
    const finalContent = existingContent + content + '\n';

    // Write to temporary file
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, finalContent, 'utf-8');

    // Atomic rename
    await fs.rename(tempPath, filePath);
  }

  /**
   * Get the workspace path
   * @returns Workspace path or null if not initialized
   */
  getWorkspacePath(): string | null {
    return this.workspacePath;
  }
}
