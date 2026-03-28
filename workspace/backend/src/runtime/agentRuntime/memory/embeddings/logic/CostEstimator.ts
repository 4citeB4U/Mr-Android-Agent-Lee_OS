/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.COSTESTIMATOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = CostEstimator module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\embeddings\logic\CostEstimator.ts
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
 * CostEstimator - Pure functions for estimating embedding generation costs
 * 
 * Part of Functional Core (pure, testable).
 */

export type ProviderType = 'openai' | 'local';

export interface CostEstimate {
  /** Estimated cost in USD */
  cost: number;
  
  /** Currency code */
  currency: 'USD';
  
  /** Estimated token count */
  estimatedTokens: number;
  
  /** Provider used for estimation */
  provider: ProviderType;
}

export class CostEstimator {
  // OpenAI text-embedding-ada-002 pricing (as of 2024)
  // $0.0001 per 1K tokens
  private static readonly OPENAI_COST_PER_1K_TOKENS = 0.0001;

  // Rough estimate: 1 token ≈ 0.75 words ≈ 4 characters
  private static readonly CHARS_PER_TOKEN = 4;

  /**
   * Estimate cost for generating embeddings
   * 
   * @param texts - Texts to embed
   * @param provider - Provider type
   * @returns Cost estimate
   */
  static estimate(texts: string[], provider: ProviderType): CostEstimate {
    if (provider === 'local') {
      return {
        cost: 0,
        currency: 'USD',
        estimatedTokens: 0,
        provider: 'local',
      };
    }

    // OpenAI estimation
    const totalChars = texts.reduce((sum, text) => sum + text.length, 0);
    const estimatedTokens = Math.ceil(totalChars / this.CHARS_PER_TOKEN);
    const cost = (estimatedTokens / 1000) * this.OPENAI_COST_PER_1K_TOKENS;

    return {
      cost: Math.round(cost * 100000) / 100000, // Round to 5 decimal places
      currency: 'USD',
      estimatedTokens,
      provider: 'openai',
    };
  }

  /**
   * Estimate token count for a text
   * 
   * @param text - Input text
   * @returns Estimated token count
   */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  /**
   * Calculate actual cost from token usage
   * 
   * @param tokens - Actual tokens used
   * @param provider - Provider type
   * @returns Actual cost
   */
  static calculateActualCost(tokens: number, provider: ProviderType): number {
    if (provider === 'local') {
      return 0;
    }

    return Math.round(
      ((tokens / 1000) * this.OPENAI_COST_PER_1K_TOKENS) * 100000
    ) / 100000;
  }
}
