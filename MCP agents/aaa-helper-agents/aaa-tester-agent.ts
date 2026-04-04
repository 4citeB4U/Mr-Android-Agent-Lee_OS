/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AAA.TESTING
TAG: MCP.AAA.TESTER.AGENT

COLOR_ONION_HEX:
NEON=#7C4DFF
FLUO=#B388FF
PASTEL=#EDE7F6

ICON_ASCII:
family=lucide
glyph=flask-conical

5WH:
WHAT = AAA Tester Agent — runs basic and advanced tests for each MCP agent tool
WHY = Verifies that all agent tools behave correctly under test conditions
WHO = Agent Lee OS — MCP AAA System
WHERE = MCP agents/aaa-helper-agents/aaa-tester-agent.ts
WHEN = 2026
HOW = Calls basic and advanced test tool runners for a given target agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
PROPRIETARY
*/
// AAA Tester Agent
// Runs basic and advanced tests for each tool
import { runAdvancedTests, runBasicTests } from "./tools/test";

export async function runTests(targetAgent: string, tools: string[]) {
  const basicResults = await runBasicTests(targetAgent, tools);
  const advancedResults = await runAdvancedTests(targetAgent, tools);
  return { basicResults, advancedResults };
}
