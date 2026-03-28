/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.PROVIDERSELECTOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ProviderSelector module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\embeddings\logic\ProviderSelector.ts
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
 * ProviderSelector - Pure logic for selecting embedding provider
 * 
 * Determines which provider to use based on configuration and availability.
 * Part of Functional Core (pure, testable).
 */

import { EmbeddingConfig } from '../../domain/embeddings/EmbeddingConfig.js';

export type SelectedProvider = 'openai' | 'local';

export interface ProviderSelection {
  /** Selected provider */
  provider: SelectedProvider;
  
  /** Reason for selection */
  reason: string;
}

export class ProviderSelector {
  /**
   * Select provider based on configuration and availability
   * 
   * @param config - Embedding configuration
   * @param openaiAvailable - Whether OpenAI API is available (has API key)
   * @returns Selected provider and reason
   */
  static select(
    config: EmbeddingConfig,
    openaiAvailable: boolean
  ): ProviderSelection {
    // Explicit 'openai' configuration
    if (config.provider === 'openai') {
      if (!openaiAvailable) {
        throw new Error(
          'OpenAI provider configured but API key not available'
        );
      }
      
      return {
        provider: 'openai',
        reason: 'explicitly configured',
      };
    }

    // Explicit 'local' configuration
    if (config.provider === 'local') {
      return {
        provider: 'local',
        reason: 'explicitly configured',
      };
    }

    // Auto mode - prefer OpenAI if available
    if (config.provider === 'auto') {
      if (openaiAvailable) {
        return {
          provider: 'openai',
          reason: 'auto-selected (OpenAI available)',
        };
      }
      
      return {
        provider: 'local',
        reason: 'auto-selected (OpenAI unavailable, using local fallback)',
      };
    }

    // Fallback (should not reach here if config is validated)
    return {
      provider: 'local',
      reason: 'default fallback',
    };
  }

  /**
   * Determine if fallback to local is allowed
   * 
   * @param config - Embedding configuration
   * @returns true if fallback is allowed
   */
  static isFallbackAllowed(config: EmbeddingConfig): boolean {
    // Fallback allowed in 'auto' mode or when 'local' is configured
    return config.provider === 'auto' || config.provider === 'local';
  }

  /**
   * Check if OpenAI is available based on configuration
   * 
   * @param config - Embedding configuration
   * @returns true if OpenAI can be used
   */
  static isOpenAIAvailable(config: EmbeddingConfig): boolean {
    return !!(config.openai?.apiKey && config.openai.apiKey.length > 0);
  }
}
