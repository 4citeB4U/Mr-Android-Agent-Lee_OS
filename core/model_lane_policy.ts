/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.CORE.MODEL_POLICY
TAG: AI.ORCHESTRATION.CORE.MODEL_POLICY.GEMINI

COLOR_ONION_HEX:
NEON=#4285F4
FLUO=#5A9AF5
PASTEL=#BFDBFE

ICON_ASCII:
family=lucide
glyph=route

5WH:
WHAT = Gemini model lane policy for consistent free-tier-first routing
WHY = Keeps default model usage aligned across pages, services, agents, and creators workflows
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = core/model_lane_policy.ts
WHEN = 2026
HOW = Central constants and helpers for preferred/default/fallback Gemini model IDs

AGENTS:
ASSESS
AUDIT
GEMINI

LICENSE:
MIT
*/

export const GEMINI_FREE_TIER_PRIMARY = 'gemini-2.0-flash';
export const GEMINI_FREE_TIER_THINKING = 'gemini-2.0-flash-thinking-exp';

export const GEMINI_IMAGE_MODEL_CANDIDATES = [
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.5-flash-image'
] as const;

export function firstDefinedModel(...models: Array<string | undefined | null>): string {
  for (const model of models) {
    if (model && model.trim()) return model.trim();
  }
  return GEMINI_FREE_TIER_PRIMARY;
}
