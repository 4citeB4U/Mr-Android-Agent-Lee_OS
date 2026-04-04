/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AAA.SCANNING
TAG: MCP.AAA.SCANNER.AGENT

COLOR_ONION_HEX:
NEON=#00BCD4
FLUO=#4DD0E1
PASTEL=#E0F7FA

ICON_ASCII:
family=lucide
glyph=scan

5WH:
WHAT = AAA Scanner Agent — scans MCP agents for endpoints, websockets, and pipelines
WHY = Provides full surface-area discovery for each agent before AAA testing
WHO = Agent Lee OS — MCP AAA System
WHERE = MCP agents/aaa-helper-agents/aaa-scanner-agent.ts
WHEN = 2026
HOW = Calls scan tools for endpoints, websockets, and pipeline discovery on a target agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
PROPRIETARY
*/
// AAA Scanner Agent
// Scans MCP agents for endpoints, websockets, and pipelines
import { scanEndpoints, scanPipelines, scanWebsockets } from "./tools/scan";

export async function runScan(targetAgent: string) {
  const endpoints = await scanEndpoints(targetAgent);
  const websockets = await scanWebsockets(targetAgent);
  const pipelines = await scanPipelines(targetAgent);
  return { endpoints, websockets, pipelines };
}
