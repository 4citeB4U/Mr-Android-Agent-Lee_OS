/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.MODELSELECTOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ModelSelector module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\model-selection\ModelSelector.ts
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
 * ModelSelector - Agent Lee native model selector
 *
 * Routes tasks to appropriate GLM model variants.
 * Replaces ConfigLoader dependency with hardcoded GLM configuration.
 */

import { TaskType, ComplexityLevel, ModelSelectionConfig } from './types.js';

/** GLM model names available in Agent Lee */
const GLM_MODELS = {
  default: 'glm-4-flash',
  thinking: 'glm-4-flash',   // same endpoint, GLM handles reasoning internally
  vision: 'glm-4v-flash',
  fast: 'glm-4-flash',
} as const;

const DEFAULT_CONFIG: ModelSelectionConfig = {
  enabled: true,
  defaultModel: GLM_MODELS.default,
  taskMappings: {
    [TaskType.CODING]:           [GLM_MODELS.thinking, GLM_MODELS.default],
    [TaskType.RESEARCH]:         [GLM_MODELS.thinking, GLM_MODELS.default],
    [TaskType.DATA_PROCESSING]:  [GLM_MODELS.default],
    [TaskType.GENERAL]:          [GLM_MODELS.default],
  },
  complexityMultipliers: {
    simple:  0.8,
    medium:  1.0,
    complex: 1.2,
  },
};

const KNOWN_AVAILABLE_MODELS = [
  GLM_MODELS.default,
  GLM_MODELS.thinking,
  GLM_MODELS.vision,
] as string[];

const ULTIMATE_FALLBACK = GLM_MODELS.default;

export class ModelSelector {
  private config: ModelSelectionConfig = DEFAULT_CONFIG;

  constructor() {}

  async initialize(): Promise<void> {
    // No external config needed — defaults are GLM-native
  }

  selectForTask(taskType: TaskType, _complexity?: ComplexityLevel | string): string {
    if (!this.config.enabled) return this.config.defaultModel;

    const candidates = this.config.taskMappings[taskType] ?? [this.config.defaultModel];
    const available = candidates.filter((m) => KNOWN_AVAILABLE_MODELS.includes(m));

    return available[0] ?? ULTIMATE_FALLBACK;
  }

  getDefaultModel(): string {
    return this.config.defaultModel;
  }

  getAvailableModels(): string[] {
    return [...KNOWN_AVAILABLE_MODELS];
  }

  isModelAvailable(model: string): boolean {
    return KNOWN_AVAILABLE_MODELS.includes(model);
  }

  getModelCost(_model: string): number {
    // All GLM models treated as equal cost
    return 1;
  }
}
