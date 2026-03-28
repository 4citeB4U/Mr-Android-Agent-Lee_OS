/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.BATCHSPLITTER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = BatchSplitter module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\embeddings\logic\BatchSplitter.ts
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
 * BatchSplitter - Pure function for splitting arrays into batches
 * 
 * Part of Functional Core (pure, testable).
 */

export class BatchSplitter {
  /**
   * Split an array into batches of specified size
   * 
   * @param items - Array to split
   * @param batchSize - Maximum items per batch (must be > 0)
   * @returns Array of batches
   * 
   * @example
   * ```typescript
   * BatchSplitter.split(['a', 'b', 'c', 'd', 'e'], 2)
   * // Returns: [['a','b'], ['c','d'], ['e']]
   * ```
   */
  static split<T>(items: T[], batchSize: number): T[][] {
    if (batchSize <= 0) {
      throw new Error('Batch size must be greater than 0');
    }

    if (items.length === 0) {
      return [];
    }

    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Calculate how many batches will be created
   * 
   * @param itemCount - Total number of items
   * @param batchSize - Batch size
   * @returns Number of batches
   */
  static calculateBatchCount(itemCount: number, batchSize: number): number {
    if (itemCount === 0 || batchSize <= 0) {
      return 0;
    }
    
    return Math.ceil(itemCount / batchSize);
  }
}
