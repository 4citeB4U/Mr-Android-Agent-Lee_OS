/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.LOCALPROVIDER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = LocalProvider module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\infrastructure\embeddings\LocalProvider.ts
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
 * LocalProvider - Stub embedding provider (no external ML dependencies).
 *
 * Returns zero-vector embeddings so the repo compiles without @xenova/transformers.
 * Replace with a real implementation when ML packages are available.
 */

import { ILogger } from "../../../core/interfaces/ILogger.js";
import { Result } from "../../../core/types/Result.js";
import { LocalEmbeddingConfig } from "../../domain/embeddings/EmbeddingConfig.js";
import { IEmbeddingProvider } from "../../domain/embeddings/IEmbeddingProvider.js";

const DIMENSIONS = 384;

export class LocalProvider implements IEmbeddingProvider {
  constructor(
    private readonly config: LocalEmbeddingConfig,
    private readonly logger: ILogger,
  ) {
    this.logger.debug("LocalProvider stub initialized (zero embeddings)");
  }

  async generate(_text: string): Promise<Result<number[], Error>> {
    return Result.ok(new Array(DIMENSIONS).fill(0));
  }

  async generateBatch(texts: string[]): Promise<Result<number[][], Error>> {
    return Result.ok(texts.map(() => new Array(DIMENSIONS).fill(0)));
  }

  getDimensions(): number {
    return DIMENSIONS;
  }

  getModelName(): string {
    return this.config.model ?? "stub";
  }

  getProviderName(): string {
    return "local-stub";
  }
}
