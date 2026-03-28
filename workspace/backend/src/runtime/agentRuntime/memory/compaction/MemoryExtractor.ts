/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.COMPACTION_MEMORYEXTRACTOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = MemoryExtractor module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\compaction\MemoryExtractor.ts
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
 * MemoryExtractor - Orchestrates memory extraction on compaction
 * 
 * Coordinates: get messages → build prompt → call LLM → parse → write.
 * Imperative Shell: depends on external LLM invocation.
 */

import { ILogger } from '../../core/interfaces/ILogger.js';
import { ExtractionPrompt } from './ExtractionPrompt.js';
import { MemoryWriter } from './MemoryWriter.js';

/**
 * Interface for invoking LLM for extraction
 * (Injected dependency — can be sub-agent or direct API call)
 */
export interface IExtractionLLM {
  complete(prompt: string): Promise<string>;
}

export interface ExtractionConfig {
  /** Enable/disable extraction */
  enabled: boolean;
  /** Max messages to analyze */
  maxMessages: number;
  /** Min importance threshold (not used yet, reserved) */
  minImportance: number;
  /** Max memories to extract per compaction */
  maxMemories: number;
}

export const DEFAULT_EXTRACTION_CONFIG: ExtractionConfig = {
  enabled: true,
  maxMessages: 50,
  minImportance: 0.3,
  maxMemories: 20,
};

export class MemoryExtractor {
  constructor(
    private readonly llm: IExtractionLLM,
    private readonly writer: MemoryWriter,
    private readonly logger: ILogger,
    private readonly config: ExtractionConfig = DEFAULT_EXTRACTION_CONFIG
  ) {}

  /**
   * Extract memories from conversation messages
   */
  async extract(
    messages: Array<{ role: string; content: string }>,
    sessionId?: string
  ): Promise<{ extracted: number; written: number }> {
    if (!this.config.enabled) {
      return { extracted: 0, written: 0 };
    }

    // Limit messages
    const recentMessages = messages.slice(-this.config.maxMessages);

    if (recentMessages.length === 0) {
      return { extracted: 0, written: 0 };
    }

    this.logger.info('Extracting memories from conversation', {
      messageCount: recentMessages.length,
      sessionId,
    });

    try {
      // Build prompt and call LLM
      const prompt = ExtractionPrompt.build(recentMessages);
      const response = await this.llm.complete(prompt);

      // Parse response
      let items = ExtractionPrompt.parse(response);

      // Limit
      if (items.length > this.config.maxMemories) {
        items = items.slice(0, this.config.maxMemories);
      }

      this.logger.info('Extracted memory items', {
        count: items.length,
        categories: [...new Set(items.map(i => i.category))],
      });

      // Write to daily file
      const written = await this.writer.writeMemories(items);

      return { extracted: items.length, written };
    } catch (error) {
      this.logger.error('Memory extraction failed', error as Error);
      return { extracted: 0, written: 0 };
    }
  }
}
