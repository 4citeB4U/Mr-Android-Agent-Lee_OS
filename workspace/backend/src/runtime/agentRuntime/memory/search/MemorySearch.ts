/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.MEMORYSEARCH.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = MemorySearch module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\search\MemorySearch.ts
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
 * MemorySearch - In-memory keyword search over saved memory entries.
 *
 * No DuckDB, no embeddings — uses simple keyword matching and importance scoring.
 */

import { randomUUID } from "crypto";
import { ILogger } from "../../core/interfaces/ILogger.js";
import type {
    SearchOptions,
    SearchResponse,
    SearchResult,
} from "./SearchOptions.js";

export interface MemoryEntry {
  id: string;
  content: string;
  category: string;
  tags: string[];
  importance: number;
  createdAt: Date;
}

export class MemorySearch {
  private readonly entries: MemoryEntry[] = [];

  constructor(private readonly logger: ILogger) {}

  save(entry: Omit<MemoryEntry, "id" | "createdAt">): MemoryEntry {
    const saved: MemoryEntry = {
      id: randomUUID(),
      createdAt: new Date(),
      ...entry,
    };
    this.entries.push(saved);
    this.logger.debug("Memory saved", {
      id: saved.id,
      category: saved.category,
    });
    return saved;
  }

  async search(options: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now();
    const maxResults = options.maxResults ?? 10;
    const minScore = options.minScore ?? 0.1;
    const queryWords = options.query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    let results: SearchResult[] = [];

    for (const entry of this.entries) {
      // Tag filter
      if (options.tags && options.tags.length > 0) {
        const hasTag = options.tags.some((t) => entry.tags.includes(t));
        if (!hasTag) continue;
      }

      // Date filter
      if (options.dateFrom && entry.createdAt < options.dateFrom) continue;
      if (options.dateTo && entry.createdAt > options.dateTo) continue;

      // Keyword score
      const text = entry.content.toLowerCase();
      const matchCount = queryWords.filter((w) => text.includes(w)).length;
      if (matchCount === 0) continue;

      const keywordRatio = matchCount / Math.max(1, queryWords.length);
      const score = keywordRatio * 0.7 + entry.importance * 0.3;

      if (score < minScore) continue;

      results.push({
        id: entry.id,
        source: "memory",
        sourceRef: "runtime-memory",
        content: entry.content,
        score,
        importance: entry.importance,
        tags: entry.tags,
        createdAt: entry.createdAt,
      });
    }

    // Sort
    if ((options.sort ?? "relevance") === "recency") {
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else {
      results.sort((a, b) => b.score - a.score);
    }

    const totalMatches = results.length;
    results = results.slice(0, maxResults);

    return {
      results,
      totalMatches,
      method: "keyword",
      durationMs: Date.now() - startTime,
    };
  }

  checkDuplicate(content: string): boolean {
    const normalized = content.toLowerCase().trim();
    return this.entries.some((e) => {
      const existing = e.content.toLowerCase().trim();
      const commonWords = normalized
        .split(/\s+/)
        .filter((w) => existing.includes(w));
      return (
        commonWords.length / Math.max(1, normalized.split(/\s+/).length) > 0.8
      );
    });
  }

  getAll(): MemoryEntry[] {
    return [...this.entries];
  }
}
