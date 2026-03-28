/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.IEMBEDDINGPROVIDER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IEmbeddingProvider module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\domain\embeddings\IEmbeddingProvider.ts
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
 * IEmbeddingProvider - Interface for embedding generation
 * 
 * Implementations can use different backends (OpenAI, local models, etc.)
 * Following Dependency Inversion Principle.
 */

import { Result } from '../../../core/types/Result.js';

export interface IEmbeddingProvider {
  /**
   * Generate embedding for a single text
   * 
   * @param text - Input text to embed
   * @returns Result containing embedding vector or error
   */
  generate(text: string): Promise<Result<number[], Error>>;

  /**
   * Generate embeddings for multiple texts (batch processing)
   * More efficient than calling generate() multiple times
   * 
   * @param texts - Array of texts to embed
   * @returns Result containing array of embeddings or error
   */
  generateBatch(texts: string[]): Promise<Result<number[][], Error>>;

  /**
   * Get the dimensionality of embeddings produced by this provider
   * 
   * @returns Embedding dimension (e.g., 1536 for OpenAI, 384 for MiniLM)
   */
  getDimensions(): number;

  /**
   * Get the provider name/identifier
   * 
   * @returns Provider name (e.g., 'openai', 'local')
   */
  getProviderName(): string;

  /**
   * Get the model identifier used by this provider
   * 
   * @returns Model name (e.g., 'text-embedding-ada-002', 'Xenova/all-MiniLM-L6-v2')
   */
  getModelName(): string;
}
