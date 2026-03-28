/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.TAGEXTRACTOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = TagExtractor module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\indexing\TagExtractor.ts
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
 * TagExtractor - Extracts tags from text content
 * 
 * Pure function: deterministic, no I/O.
 * Extracts hashtags and keyword-based tags.
 */

export interface TagExtractionResult {
  /** All extracted tags (lowercase, deduplicated) */
  tags: string[];
  /** Tags from explicit hashtags (#important) */
  hashTags: string[];
  /** Tags from keyword matching */
  keywordTags: string[];
}

/** Default keyword dictionary grouped by category */
const DEFAULT_KEYWORDS: Record<string, string[]> = {
  decision: ['decided', 'decision', 'chose', 'chosen', 'agreed', 'concluded'],
  important: ['important', 'critical', 'urgent', 'priority', 'essential', 'key'],
  todo: ['todo', 'to-do', 'fixme', 'hack', 'action item', 'need to', 'should'],
  bug: ['bug', 'broken', 'issue', 'error', 'crash', 'regression'],
  api: ['api', 'endpoint', 'rest', 'graphql', 'webhook'],
  auth: ['authentication', 'authorization', 'auth', 'login', 'password', 'token', 'oauth'],
  config: ['configuration', 'config', 'setting', 'environment', 'env'],
  database: ['database', 'db', 'sql', 'query', 'migration', 'schema'],
  preference: ['prefer', 'preference', 'like', 'dislike', 'favorite', 'want'],
  person: ['meeting', 'discussed with', 'talked to', 'call with'],
  architecture: ['architecture', 'design', 'pattern', 'refactor', 'structure'],
  deployment: ['deploy', 'deployment', 'release', 'staging', 'production'],
};

export class TagExtractor {
  /**
   * Extract tags from text content
   */
  static extract(
    text: string,
    customKeywords?: Record<string, string[]>
  ): TagExtractionResult {
    const keywords = customKeywords || DEFAULT_KEYWORDS;
    const lowerText = text.toLowerCase();

    // Extract hashtags
    const hashTags = TagExtractor.extractHashTags(text);

    // Extract keyword tags
    const keywordTags = TagExtractor.extractKeywordTags(lowerText, keywords);

    // Combine and deduplicate
    const allTags = [...new Set([...hashTags, ...keywordTags])];

    return {
      tags: allTags,
      hashTags,
      keywordTags,
    };
  }

  /**
   * Extract explicit hashtags (#important, #todo)
   */
  private static extractHashTags(text: string): string[] {
    const matches = text.match(/#([a-zA-Z][a-zA-Z0-9_-]*)/g);
    if (!matches) return [];

    return [...new Set(
      matches.map(m => m.slice(1).toLowerCase())
    )];
  }

  /**
   * Extract tags based on keyword dictionary
   */
  private static extractKeywordTags(
    lowerText: string,
    keywords: Record<string, string[]>
  ): string[] {
    const tags: string[] = [];

    for (const [category, words] of Object.entries(keywords)) {
      for (const word of words) {
        // Word boundary matching (avoid partial matches)
        const regex = new RegExp(`\\b${TagExtractor.escapeRegex(word)}\\b`, 'i');
        if (regex.test(lowerText)) {
          tags.push(category);
          break; // One match per category is enough
        }
      }
    }

    return tags;
  }

  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
