/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SAVEMEMORYTOOL.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SaveMemoryTool module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\tools\SaveMemoryTool.ts
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
 * SaveMemoryTool - Agent tool for explicitly saving facts to memory.
 *
 * Uses in-memory MemorySearch — no DuckDB required.
 */

import { ITool } from '../../tools/domain/interfaces/ITool.js';
import { Result } from '../../core/types/Result.js';
import { ToolResult } from '../../tools/domain/value-objects/ToolResult.js';
import { JSONSchema } from '../../tools/domain/types/JSONSchema.js';
import { MemorySearch } from '../search/MemorySearch.js';

type MemoryCategory =
  | 'decision' | 'preference' | 'fact' | 'lesson' | 'context' | 'todo' | 'other';

const VALID_CATEGORIES: MemoryCategory[] = [
  'decision', 'preference', 'fact', 'lesson', 'context', 'todo', 'other',
];

const CATEGORY_IMPORTANCE: Record<MemoryCategory, number> = {
  decision: 0.9, preference: 0.85, fact: 0.8,
  lesson: 0.85, context: 0.7, todo: 0.6, other: 0.5,
};

export class SaveMemoryTool implements ITool {
  readonly name = 'save_memory';
  readonly description =
    'Save an important fact, decision, preference, or lesson to long-term memory. ' +
    'Use when the user shares something worth remembering across sessions.';

  readonly schema: JSONSchema = {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'The fact or information to remember. Write as a clear, self-contained statement.',
      },
      category: {
        type: 'string',
        enum: VALID_CATEGORIES,
        description: 'Category: decision, preference, fact, lesson, context, todo, other.',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional tags for easier retrieval.',
      },
    },
    required: ['content', 'category'],
  };

  constructor(private readonly memorySearch: MemorySearch) {}

  async execute(parameters: unknown): Promise<Result<ToolResult, Error>> {
    try {
      const params = parameters as { content: string; category: string; tags?: string[] };

      if (!params.content || params.content.trim().length < 10) {
        return Result.ok(ToolResult.error(
          new Error('Content must be at least 10 characters.')
        ));
      }
      if (params.content.length > 2000) {
        return Result.ok(ToolResult.error(
          new Error('Content too long (max 2000 chars).')
        ));
      }

      const category = (params.category || 'other') as MemoryCategory;
      if (!VALID_CATEGORIES.includes(category)) {
        return Result.ok(ToolResult.error(
          new Error(`Invalid category. Use one of: ${VALID_CATEGORIES.join(', ')}`)
        ));
      }

      if (this.memorySearch.checkDuplicate(params.content)) {
        return Result.ok(ToolResult.success({
          saved: false,
          reason: 'Similar memory already exists.',
        }));
      }

      const importance = CATEGORY_IMPORTANCE[category];
      const entry = this.memorySearch.save({
        content: params.content.trim(),
        category,
        tags: params.tags ?? [],
        importance,
      });

      return Result.ok(ToolResult.success({
        saved: true,
        id: entry.id,
        category,
        importance,
      }));
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
