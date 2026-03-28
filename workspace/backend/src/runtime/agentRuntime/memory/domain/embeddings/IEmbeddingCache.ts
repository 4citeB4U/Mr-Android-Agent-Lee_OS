/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.IEMBEDDINGCACHE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IEmbeddingCache module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\domain\embeddings\IEmbeddingCache.ts
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
 * IEmbeddingCache - Interface for embedding caching
 * 
 * Caches embeddings to avoid redundant API calls or model inference.
 * Implementations can use memory, disk, or distributed caches.
 */

export interface IEmbeddingCache {
  /**
   * Get cached embedding for a given key
   * 
   * @param key - Cache key (typically a hash of the text)
   * @returns Embedding vector if cached, null otherwise
   */
  get(key: string): Promise<number[] | null>;

  /**
   * Store an embedding in the cache
   * 
   * @param key - Cache key
   * @param embedding - Embedding vector to cache
   */
  set(key: string, embedding: number[]): Promise<void>;

  /**
   * Check if an embedding exists in cache
   * 
   * @param key - Cache key
   * @returns true if cached, false otherwise
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all cached embeddings
   */
  clear(): Promise<void>;

  /**
   * Get cache statistics
   * 
   * @returns Stats about cache usage (hits, misses, size, etc.)
   */
  getStats(): Promise<CacheStats>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;      // Number of cached items
  sizeBytes: number; // Approximate memory/disk usage
}
