/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.EMBEDDINGCONFIG.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = EmbeddingConfig module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\domain\embeddings\EmbeddingConfig.ts
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
 * EmbeddingConfig - Configuration for embedding generation
 */

export interface EmbeddingConfig {
  /** Primary provider ('openai' | 'local' | 'auto') */
  provider: 'openai' | 'local' | 'auto';

  /** OpenAI configuration */
  openai?: OpenAIEmbeddingConfig;

  /** Local model configuration */
  local?: LocalEmbeddingConfig;

  /** Cache configuration */
  cache?: EmbeddingCacheConfig;
}

export interface OpenAIEmbeddingConfig {
  /** OpenAI API key (use environment variable reference) */
  apiKey: string;

  /** Model to use (default: text-embedding-ada-002) */
  model?: string;

  /** Base URL for API (allow custom endpoints) */
  baseUrl?: string;

  /** Request timeout in milliseconds */
  timeoutMs?: number;

  /** Max retry attempts for rate limits */
  maxRetries?: number;
}

export interface LocalEmbeddingConfig {
  /** Model identifier (Hugging Face model ID) */
  model?: string;

  /** Device to use ('cpu' | 'gpu') */
  device?: 'cpu' | 'gpu';

  /** Max batch size for local inference */
  maxBatchSize?: number;
}

export interface EmbeddingCacheConfig {
  /** Enable caching (default: true) */
  enabled?: boolean;

  /** Cache directory (auto-resolved if not specified) */
  directory?: string;

  /** Max cache size in MB (default: 100) */
  maxSizeMb?: number;

  /** Cache eviction strategy ('lru' | 'lfu' | 'fifo') */
  eviction?: 'lru' | 'lfu' | 'fifo';
}
