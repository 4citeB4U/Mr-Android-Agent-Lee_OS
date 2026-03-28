/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CACHEKEYGENERATOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = CacheKeyGenerator module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\embeddings\logic\CacheKeyGenerator.ts
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
 * CacheKeyGenerator - Pure function for generating cache keys
 * 
 * Creates deterministic hash keys for embedding cache.
 * Part of Functional Core (pure, testable).
 */

import * as crypto from 'crypto';

export class CacheKeyGenerator {
  /**
   * Generate cache key for a text
   * 
   * Uses MD5 hash of the text content. Same text always produces
   * the same key (deterministic).
   * 
   * @param text - Input text
   * @returns Cache key (hex string)
   */
  static generate(text: string): string {
    return crypto
      .createHash('md5')
      .update(text, 'utf-8')
      .digest('hex');
  }

  /**
   * Generate cache keys for multiple texts
   * 
   * @param texts - Array of texts
   * @returns Array of cache keys
   */
  static generateBatch(texts: string[]): string[] {
    return texts.map(text => this.generate(text));
  }
}
