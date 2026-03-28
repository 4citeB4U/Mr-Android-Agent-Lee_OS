/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SEARCHOPTIONS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SearchOptions module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\search\SearchOptions.ts
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
 * SearchOptions - Types for semantic search
 * 
 * Pure types, no I/O.
 */

export type SearchSource = 'memory' | 'daily' | 'conversation';
export type SearchSort = 'relevance' | 'recency' | 'importance';

export interface SearchOptions {
  /** Query text */
  query: string;
  /** Filter by source types */
  sources?: SearchSource[];
  /** Date range filter */
  dateFrom?: Date;
  dateTo?: Date;
  /** Filter by tags */
  tags?: string[];
  /** Filter by session ID (conversation only) */
  sessionId?: string;
  /** Filter by message role (conversation only) */
  roles?: Array<'user' | 'assistant' | 'system'>;
  /** Max results to return (default: 10) */
  maxResults?: number;
  /** Minimum relevance score 0-1 (default: 0.3) */
  minScore?: number;
  /** Sort order (default: relevance) */
  sort?: SearchSort;
  /** Use keyword search only (skip embeddings) */
  keywordOnly?: boolean;
}

export interface SearchResult {
  /** Unique chunk/message ID */
  id: string;
  /** Source type */
  source: SearchSource;
  /** Source file path or session ID */
  sourceRef: string;
  /** Section header (memory chunks) */
  header?: string;
  /** Content text */
  content: string;
  /** Relevance score 0-1 */
  score: number;
  /** Cosine similarity (if semantic search used) */
  similarity?: number;
  /** Importance score (memory chunks) */
  importance?: number;
  /** Tags */
  tags?: string[];
  /** Message role (conversation) */
  role?: string;
  /** Creation timestamp */
  createdAt: Date;
}

export interface SearchResponse {
  /** Search results */
  results: SearchResult[];
  /** Total matches (before limit) */
  totalMatches: number;
  /** Search method used */
  method: 'semantic' | 'keyword' | 'hybrid';
  /** Search duration in ms */
  durationMs: number;
}
