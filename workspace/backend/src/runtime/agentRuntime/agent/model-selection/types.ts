/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.MODEL_SELECTION_TYPES.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = types module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\model-selection\types.ts
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
 * Types for model selection system
 */

/**
 * Task types for model selection
 */
export enum TaskType {
  CODING = 'coding',
  RESEARCH = 'research',
  DATA_PROCESSING = 'data-processing',
  GENERAL = 'general',
}

/**
 * Complexity levels for task analysis
 */
export type ComplexityLevel = 'simple' | 'medium' | 'complex';

/**
 * Cost tier for models (relative cost units)
 */
export type CostTier = 1 | 2 | 3 | 4 | 5;

/**
 * Model selection configuration
 */
export interface ModelSelectionConfig {
  /**
   * Whether model selection is enabled
   */
  enabled: boolean;

  /**
   * Default model to use when no specific match is found
   */
  defaultModel: string;

  /**
   * Task-specific model mappings (priority order)
   */
  taskMappings: Record<TaskType, string[]>;

  /**
   * Complexity-based score multipliers
   */
  complexityMultipliers: {
    simple: number;
    medium: number;
    complex: number;
  };
}

/**
 * Result of model selection
 */
export interface ModelSelectionResult {
  /**
   * Selected model name
   */
  model: string;

  /**
   * Reason for selection
   */
  reason: string;

  /**
   * Task type used for selection
   */
  taskType?: TaskType;

  /**
   * Detected complexity level
   */
  complexity?: ComplexityLevel;

  /**
   * Cost of selected model
   */
  cost?: CostTier;
}
