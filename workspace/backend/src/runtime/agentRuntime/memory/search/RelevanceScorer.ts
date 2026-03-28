/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.RELEVANCESCORER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = RelevanceScorer module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\search\RelevanceScorer.ts
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
 * RelevanceScorer - Combines similarity, importance, recency, and tier scores
 * 
 * Pure function: deterministic, no I/O.
 * 
 * Tier boosting follows generational memory model:
 * - Gen 2 (long-term) memories get a relevance boost — they've proven their worth
 * - Gen 1 (medium-term) gets moderate boost
 * - Gen 0 (short-term) gets no boost (unproven)
 */

export interface ScoringWeights {
  /** Weight for cosine similarity (default: 0.6) */
  similarity: number;
  /** Weight for importance (default: 0.15) */
  importance: number;
  /** Weight for recency (default: 0.1) */
  recency: number;
  /** Weight for tier boost (default: 0.15) */
  tier: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  similarity: 0.6,
  importance: 0.15,
  recency: 0.1,
  tier: 0.15,
};

/** Tier boost values: Gen 0 = 0.3, Gen 1 = 0.6, Gen 2 = 1.0 */
const TIER_BOOST = [0.3, 0.6, 1.0];

export class RelevanceScorer {
  /**
   * Calculate combined relevance score with tier awareness
   * 
   * @param similarity - Cosine similarity (0-1)
   * @param importance - Importance score (0-1)
   * @param ageMs - Age in milliseconds
   * @param tier - Memory tier (0=short, 1=medium, 2=long). Default 0.
   * @param weights - Scoring weights
   */
  static score(
    similarity: number,
    importance: number,
    ageMs: number,
    tier: number = 0,
    weights: ScoringWeights = DEFAULT_WEIGHTS
  ): number {
    // Recency: exponential decay over 30 days
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const recency = Math.exp(-ageMs / thirtyDaysMs);

    // Tier boost: higher tier = proven value
    const tierBoost = TIER_BOOST[Math.min(tier, 2)] ?? 0.3;

    const score =
      similarity * weights.similarity +
      importance * weights.importance +
      recency * weights.recency +
      tierBoost * weights.tier;

    return Math.min(1.0, Math.max(0.0, Math.round(score * 1000) / 1000));
  }

  /**
   * Score for keyword search (no similarity, use keyword match quality)
   */
  static keywordScore(
    matchQuality: number,
    importance: number,
    ageMs: number,
    tier: number = 0,
    weights: ScoringWeights = DEFAULT_WEIGHTS
  ): number {
    // Keyword matches get 80% of the similarity weight
    return RelevanceScorer.score(
      matchQuality * 0.8,
      importance,
      ageMs,
      tier,
      weights
    );
  }
}
