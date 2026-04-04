/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AAA.ORCHESTRATION
TAG: MCP.AAA.RUNNER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=play-circle

5WH:
WHAT = AAA full-stack verification runner — orchestrates all AAA helper agents across the MCP fleet
WHY = Provides a single entry point to run the complete scan, test, validate, and enhance pipeline
WHO = Agent Lee OS — MCP AAA System
WHERE = MCP agents/aaa-helper-agents/run-all-agents-check.ts
WHEN = 2026
HOW = Iterates the registered agent list and runs enhance, scan, test, and validate in sequence

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
PROPRIETARY
*/
// Entry point: Deploy and run AAA helper agents for full-stack MCP verification
import { enhance } from "./aaa-enhancer-agent";
import { runScan } from "./aaa-scanner-agent";
import { runTests } from "./aaa-tester-agent";
import { validateAAA } from "./aaa-validator-agent";

const AGENTS = [
  "agent-registry-mcp",
  "desktop-commander-agent-mcp",
  "docs-rag-agent-mcp",
  "health-agent-mcp",
  "insforge-agent-mcp",
  "memory-agent-mcp",
  "planner-agent-mcp",
  "playwright-agent-mcp",
  "scheduling-agent-mcp",
  "spline-agent-mcp",
  "stitch-agent-mcp",
  "testsprite-agent-mcp",
  "validation-agent-mcp",
  "vision-agent-mcp",
  "voice-agent-mcp",
];

async function runFullStackCheck() {
  for (const agent of AGENTS) {
    const scanResult = await runScan(agent);
    const tools = scanResult.endpoints.concat(
      scanResult.websockets,
      scanResult.pipelines,
    );
    await runTests(agent, tools);
    await validateAAA(agent);
    await enhance(agent);
  }
  console.log("AAA full-stack check completed for all MCP agents.");
}

runFullStackCheck();
