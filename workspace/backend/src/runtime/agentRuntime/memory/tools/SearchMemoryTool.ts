/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SEARCHMEMORYTOOL.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SearchMemoryTool module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\tools\SearchMemoryTool.ts
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
 * SearchMemoryTool - Agent tool for searching memory and conversations
 * 
 * Exposes MemorySearch as an ITool for agent use.
 */

import { ITool } from '../../tools/domain/interfaces/ITool.js';
import { Result } from '../../core/types/Result.js';
import { ToolResult } from '../../tools/domain/value-objects/ToolResult.js';
import { JSONSchema } from '../../tools/domain/types/JSONSchema.js';
import { MemorySearch } from '../search/MemorySearch.js';
import type { SearchSource } from '../search/SearchOptions.js';

const MAX_CONTENT_LENGTH = 500;

export class SearchMemoryTool implements ITool {
  readonly name = 'search_memory';
  readonly description =
    'Search through memory files and past conversations. ' +
    'Use this to recall decisions, preferences, past discussions, ' +
    'technical context, or anything previously discussed. ' +
    'Supports semantic search (meaning-based) and keyword filtering.';

  readonly schema: JSONSchema = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural language search query (e.g., "What database did we choose?")',
      },
      sources: {
        type: 'array',
        items: { type: 'string', enum: ['memory', 'daily', 'conversation'] },
        description: 'Filter by source type. memory=MEMORY.md, daily=daily notes, conversation=chat history',
      },
      max_results: {
        type: 'number',
        description: 'Maximum results to return (default: 5)',
      },
      date_from: {
        type: 'string',
        description: 'Filter results after this date (ISO format)',
      },
      date_to: {
        type: 'string',
        description: 'Filter results before this date (ISO format)',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by tags (e.g., ["decision", "architecture"])',
      },
    },
    required: ['query'],
  };


  constructor(
    private readonly memorySearch: MemorySearch
  ) {}

  async execute(parameters: unknown): Promise<Result<ToolResult, Error>> {
    try {
      const params = parameters as {
        query: string;
        sources?: string[];
        max_results?: number;
        date_from?: string;
        date_to?: string;
        tags?: string[];
      };

      if (!params.query || params.query.trim().length === 0) {
        return Result.ok(ToolResult.error(new Error('Query parameter is required')));
      }

      const response = await this.memorySearch.search({
        query: params.query,
        sources: params.sources as SearchSource[] | undefined,
        maxResults: params.max_results ?? 5,
        dateFrom: params.date_from ? new Date(params.date_from) : undefined,
        dateTo: params.date_to ? new Date(params.date_to) : undefined,
        tags: params.tags,
        minScore: 0.3,
      });

      if (response.results.length === 0) {
        return Result.ok(ToolResult.success({
          message: 'No results found for your query.',
          query: params.query,
          method: response.method,
        }));
      }

      // Format results for agent consumption
      const formattedResults = response.results.map((r, i) => {
        let content = r.content;
        if (content.length > MAX_CONTENT_LENGTH) {
          content = content.substring(0, MAX_CONTENT_LENGTH) + '...';
        }

        return {
          rank: i + 1,
          source: r.sourceRef,
          type: r.source,
          ...(r.header ? { section: r.header } : {}),
          content,
          relevance: `${Math.round(r.score * 100)}%`,
          ...(r.tags && r.tags.length > 0 ? { tags: r.tags } : {}),
          ...(r.role ? { role: r.role } : {}),
          date: r.createdAt.toISOString().split('T')[0],
        };
      });

      return Result.ok(ToolResult.success({
        query: params.query,
        method: response.method,
        total_matches: response.totalMatches,
        results: formattedResults,
      }));
    } catch (error) {
      return Result.ok(ToolResult.error(
        new Error(`Search failed: ${(error as Error).message}`)
      ));
    }
  }
}
