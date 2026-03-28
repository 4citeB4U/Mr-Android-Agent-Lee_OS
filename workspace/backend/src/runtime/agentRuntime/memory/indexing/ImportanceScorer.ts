/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.IMPORTANCESCORER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ImportanceScorer module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\indexing\ImportanceScorer.ts
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
 * ImportanceScorer - Scores content chunks by importance
 * 
 * Pure function: deterministic, no I/O.
 * Uses pattern matching to estimate importance 0.0-1.0.
 */

export interface ImportanceResult {
  /** Overall score 0.0-1.0 */
  score: number;
  /** Breakdown of scoring factors */
  factors: ImportanceFactor[];
}

export interface ImportanceFactor {
  name: string;
  weight: number;
  matched: boolean;
}

/** Pattern categories with weights */
const SCORING_PATTERNS: Array<{
  name: string;
  weight: number;
  patterns: RegExp[];
}> = [
  {
    name: 'decision',
    weight: 0.25,
    patterns: [
      /\b(?:decided|decision|chose|chosen|agreed|concluded|went with)\b/i,
    ],
  },
  {
    name: 'critical',
    weight: 0.20,
    patterns: [
      /\b(?:critical|urgent|important|essential|must|required|blocking)\b/i,
    ],
  },
  {
    name: 'preference',
    weight: 0.15,
    patterns: [
      /\b(?:prefer|like|dislike|want|favorite|always use|never use)\b/i,
    ],
  },
  {
    name: 'technical',
    weight: 0.15,
    patterns: [
      /\b(?:implement|architecture|design|pattern|using|configured|deploy)\b/i,
    ],
  },
  {
    name: 'action',
    weight: 0.10,
    patterns: [
      /\b(?:todo|fixme|need to|should|action item|follow.?up)\b/i,
    ],
  },
  {
    name: 'person',
    weight: 0.10,
    patterns: [
      /\b(?:meeting|discussed|talked|call with|@\w+)\b/i,
    ],
  },
];

/** Base score for all chunks */
const BASE_SCORE = 0.1;

/** Bonus for longer, more detailed content */
const LENGTH_THRESHOLDS = [
  { chars: 200, bonus: 0.05 },
  { chars: 500, bonus: 0.05 },
  { chars: 1000, bonus: 0.05 },
];

export class ImportanceScorer {
  /**
   * Score a text chunk for importance
   */
  static score(text: string): ImportanceResult {
    if (!text || text.trim().length === 0) {
      return { score: 0, factors: [] };
    }

    let score = BASE_SCORE;
    const factors: ImportanceFactor[] = [];

    // Pattern matching
    for (const pattern of SCORING_PATTERNS) {
      const matched = pattern.patterns.some(p => p.test(text));
      factors.push({
        name: pattern.name,
        weight: pattern.weight,
        matched,
      });
      if (matched) {
        score += pattern.weight;
      }
    }

    // Length bonus
    const charCount = text.length;
    for (const threshold of LENGTH_THRESHOLDS) {
      if (charCount >= threshold.chars) {
        score += threshold.bonus;
      }
    }

    // Clamp to 0.0-1.0
    score = Math.min(1.0, Math.max(0.0, score));

    // Round to 2 decimal places
    score = Math.round(score * 100) / 100;

    return { score, factors };
  }

  /**
   * Batch score multiple chunks
   */
  static scoreBatch(texts: string[]): ImportanceResult[] {
    return texts.map(text => ImportanceScorer.score(text));
  }
}
