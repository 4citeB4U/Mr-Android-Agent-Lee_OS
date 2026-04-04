/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AAA.TOOLS
TAG: MCP.AAA.TOOLS.SCAN

COLOR_ONION_HEX:
NEON=#00BCD4
FLUO=#4DD0E1
PASTEL=#E0F7FA

ICON_ASCII:
family=lucide
glyph=scan

5WH:
WHAT = AAA scan tool functions — endpoint, websocket, and pipeline discovery for MCP agents
WHY = Provides the atomic scan operations used by the AAA Scanner Agent
WHO = Agent Lee OS — MCP AAA System
WHERE = MCP agents/aaa-helper-agents/tools/scan.ts
WHEN = 2026
HOW = Reads agent registry entries to extract and return discovered endpoints and pipelines

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
PROPRIETARY
*/
// Tool functions for scanning endpoints, websockets, pipelines
import { readFileSync } from "fs";
import { join } from "path";
import { logAgentEvent } from "../../shared/env";

function loadAgentRegistry() {
  const registryPath = join(__dirname, "../../agent-registry.json");
  return JSON.parse(readFileSync(registryPath, "utf-8"));
}

export async function scanEndpoints(agent: string) {
  // Deep scan: load endpoints from agent-registry.json
  const registry = loadAgentRegistry();
  const agentEntry = registry.agents.find((a: any) => a.id === agent);
  const endpoints = agentEntry && agentEntry.tools ? agentEntry.tools : [];
  logAgentEvent(agent, "Scan endpoints", { endpoints });
  return endpoints;
}

export async function scanWebsockets(agent: string) {
  // Deep scan: check for websocket tools in agent-registry.json
  const registry = loadAgentRegistry();
  const agentEntry = registry.agents.find((a: any) => a.id === agent);
  const websockets =
    agentEntry && agentEntry.tools
      ? agentEntry.tools.filter(
          (t: string) => t.includes("ws") || t.includes("socket"),
        )
      : [];
  logAgentEvent(agent, "Scan websockets", { websockets });
  return websockets;
}

export async function scanPipelines(agent: string) {
  // Deep scan: check for pipeline tools in agent-registry.json
  const registry = loadAgentRegistry();
  const agentEntry = registry.agents.find((a: any) => a.id === agent);
  const pipelines =
    agentEntry && agentEntry.tools
      ? agentEntry.tools.filter(
          (t: string) =>
            t.includes("pipeline") ||
            t.includes("flow") ||
            t.includes("process"),
        )
      : [];
  logAgentEvent(agent, "Scan pipelines", { pipelines });
  return pipelines;
}
