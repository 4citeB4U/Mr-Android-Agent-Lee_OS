/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.FILEEMBEDDINGCACHE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = FileEmbeddingCache module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\infrastructure\embeddings\FileEmbeddingCache.ts
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
 * FileEmbeddingCache - File-based embedding cache implementation
 * 
 * Implements IEmbeddingCache using filesystem for persistent caching.
 * Part of Imperative Shell (I/O operations).
 */

import { IEmbeddingCache, type CacheStats } from '../../domain/embeddings/IEmbeddingCache.js';
import { ILogger } from '../../../core/interfaces/ILogger.js';
import * as fs from 'fs/promises';
import * as path from 'path';

interface CacheEntry {
  embedding: number[];
  createdAt: number;
  accessedAt: number;
}

export class FileEmbeddingCache implements IEmbeddingCache {
  private stats = {
    hits: 0,
    misses: 0,
  };

  private memoryCache = new Map<string, CacheEntry>();
  private readonly cacheFilePath: string;

  constructor(
    private readonly cacheDirectory: string,
    private readonly logger: ILogger
  ) {
    this.cacheFilePath = path.join(cacheDirectory, 'embeddings-cache.json');
  }

  /**
   * Initialize cache (load from disk if exists)
   */
  async initialize(): Promise<void> {
    try {
      // Ensure cache directory exists
      await fs.mkdir(this.cacheDirectory, { recursive: true });

      // Load cache from disk if exists
      try {
        const content = await fs.readFile(this.cacheFilePath, 'utf-8');
        const data = JSON.parse(content);
        
        // Restore to memory
        for (const [key, entry] of Object.entries(data)) {
          this.memoryCache.set(key, entry as CacheEntry);
        }

        this.logger.info('Embedding cache loaded', {
          entries: this.memoryCache.size,
          path: this.cacheFilePath,
        });
      } catch (error) {
        // File doesn't exist yet - that's fine
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          this.logger.warn('Failed to load cache file, starting fresh', {
            error: (error as Error).message,
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to initialize cache', error as Error);
      // Continue without cache rather than failing
    }
  }

  async get(key: string): Promise<number[] | null> {
    const entry = this.memoryCache.get(key);
    
    if (entry) {
      // Update access time (for LRU)
      entry.accessedAt = Date.now();
      this.stats.hits++;
      
      this.logger.debug('Cache hit', { key: key.substring(0, 8) });
      return entry.embedding;
    }

    this.stats.misses++;
    this.logger.debug('Cache miss', { key: key.substring(0, 8) });
    return null;
  }

  async set(key: string, embedding: number[]): Promise<void> {
    const entry: CacheEntry = {
      embedding,
      createdAt: Date.now(),
      accessedAt: Date.now(),
    };

    this.memoryCache.set(key, entry);
    
    // Persist to disk asynchronously (fire and forget)
    this.persistToDisk().catch(error => {
      this.logger.error('Failed to persist cache to disk', error as Error);
    });
  }

  async has(key: string): Promise<boolean> {
    return this.memoryCache.has(key);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;

    try {
      await fs.unlink(this.cacheFilePath);
      this.logger.info('Cache cleared');
    } catch (error) {
      // File might not exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn('Failed to delete cache file', {
          error: (error as Error).message,
        });
      }
    }
  }

  async getStats(): Promise<CacheStats> {
    // Calculate approximate size
    let totalBytes = 0;
    
    for (const entry of this.memoryCache.values()) {
      // Rough estimate: each float is 8 bytes + overhead
      totalBytes += entry.embedding.length * 8 + 16; // +16 for timestamps
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.memoryCache.size,
      sizeBytes: totalBytes,
    };
  }

  /**
   * Persist memory cache to disk
   * Called asynchronously after set() operations
   */
  private async persistToDisk(): Promise<void> {
    try {
      const data: Record<string, CacheEntry> = {};
      
      for (const [key, entry] of this.memoryCache.entries()) {
        data[key] = entry;
      }

      const json = JSON.stringify(data, null, 2);
      await fs.writeFile(this.cacheFilePath, json, 'utf-8');
      
      this.logger.debug('Cache persisted to disk', {
        entries: this.memoryCache.size,
      });
    } catch (error) {
      // Don't throw - cache persistence is best-effort
      this.logger.warn('Cache persistence failed', {
        error: (error as Error).message,
      });
    }
  }
}
