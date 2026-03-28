/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.MEMORYCONFIG.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = MemoryConfig module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\config\MemoryConfig.ts
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
 * MemoryConfig - Configuration schema for the memory system
 * 
 * Pure types with defaults — no I/O.
 */

export interface MemoryConfig {
  database: {
    /** Database file path (default: auto from PlatformPaths) */
    path?: string;
    /** Auto-index memory files on startup (default: true) */
    autoIndex: boolean;
  };
  embeddings: {
    /** Embedding provider: 'openai' | 'local' (default: 'local') */
    provider: 'openai' | 'local';
    /** Model name (default varies by provider) */
    model?: string;
    /** API key (can use env var OPENAI_API_KEY) */
    apiKey?: string;
    /** Batch size for embedding generation (default: 20) */
    batchSize: number;
  };
  indexing: {
    /** Watch memory files for changes (default: true) */
    watchFiles: boolean;
    /** Max chunk size in characters (default: 2000) */
    maxChunkSize: number;
    /** Min chunk size in characters (default: 50) */
    minChunkSize: number;
    /** File patterns to index (default: ['MEMORY.md', 'memory/*.md']) */
    patterns: string[];
  };
  search: {
    /** Default max results (default: 10) */
    defaultMaxResults: number;
    /** Default min score threshold (default: 0.3) */
    defaultMinScore: number;
  };
  compaction: {
    /** Extract memories on compaction (default: true) */
    extractMemories: boolean;
    /** Min importance threshold for extraction (default: 0.3) */
    minImportance: number;
    /** Max memories per compaction (default: 20) */
    maxMemories: number;
  };
}

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  database: {
    autoIndex: true,
  },
  embeddings: {
    provider: 'local',
    batchSize: 20,
  },
  indexing: {
    watchFiles: true,
    maxChunkSize: 2000,
    minChunkSize: 50,
    patterns: ['MEMORY.md', 'memory/*.md'],
  },
  search: {
    defaultMaxResults: 10,
    defaultMinScore: 0.3,
  },
  compaction: {
    extractMemories: true,
    minImportance: 0.3,
    maxMemories: 20,
  },
};

/**
 * Merge partial config with defaults
 */
export function resolveMemoryConfig(partial?: Partial<MemoryConfig>): MemoryConfig {
  if (!partial) return { ...DEFAULT_MEMORY_CONFIG };

  return {
    database: { ...DEFAULT_MEMORY_CONFIG.database, ...partial.database },
    embeddings: { ...DEFAULT_MEMORY_CONFIG.embeddings, ...partial.embeddings },
    indexing: { ...DEFAULT_MEMORY_CONFIG.indexing, ...partial.indexing },
    search: { ...DEFAULT_MEMORY_CONFIG.search, ...partial.search },
    compaction: { ...DEFAULT_MEMORY_CONFIG.compaction, ...partial.compaction },
  };
}

/**
 * Validate memory config, returning errors
 */
export function validateMemoryConfig(config: MemoryConfig): string[] {
  const errors: string[] = [];

  if (config.indexing.maxChunkSize < 100) {
    errors.push('indexing.maxChunkSize must be >= 100');
  }
  if (config.indexing.minChunkSize < 10) {
    errors.push('indexing.minChunkSize must be >= 10');
  }
  if (config.indexing.minChunkSize >= config.indexing.maxChunkSize) {
    errors.push('indexing.minChunkSize must be less than maxChunkSize');
  }
  if (config.search.defaultMaxResults < 1 || config.search.defaultMaxResults > 100) {
    errors.push('search.defaultMaxResults must be between 1 and 100');
  }
  if (config.search.defaultMinScore < 0 || config.search.defaultMinScore > 1) {
    errors.push('search.defaultMinScore must be between 0 and 1');
  }
  if (config.embeddings.batchSize < 1) {
    errors.push('embeddings.batchSize must be >= 1');
  }
  if (config.embeddings.provider === 'openai' && !config.embeddings.apiKey && !process.env.OPENAI_API_KEY) {
    errors.push('embeddings.apiKey or OPENAI_API_KEY env var required for openai provider');
  }

  return errors;
}
