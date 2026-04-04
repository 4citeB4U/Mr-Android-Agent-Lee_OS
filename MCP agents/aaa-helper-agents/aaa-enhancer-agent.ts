/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AAA.ENHANCEMENT
TAG: MCP.AAA.ENHANCER.AGENT

COLOR_ONION_HEX:
NEON=#FF6D00
FLUO=#FF9100
PASTEL=#FFF3E0

ICON_ASCII:
family=lucide
glyph=sparkles

5WH:
WHAT = AAA Enhancer Agent — detects and fills capability gaps in MCP agents
WHY = Ensures every agent has the minimum required tools for full AAA compliance
WHO = Agent Lee OS — MCP AAA System
WHERE = MCP agents/aaa-helper-agents/aaa-enhancer-agent.ts
WHEN = 2026
HOW = Detects missing capabilities, then calls enhanceAgent to patch the target agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
PROPRIETARY
*/
// AAA Enhancer Agent
// Enhances agents with missing tools/capabilities for deep verification
import { detectMissingCapabilities, enhanceAgent } from "./tools/enhance";

export async function enhance(targetAgent: string) {
  const missing = await detectMissingCapabilities(targetAgent);
  if (missing.length > 0) {
    await enhanceAgent(targetAgent, missing);
  }
  return missing;
}
