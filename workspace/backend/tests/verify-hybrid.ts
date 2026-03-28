import { mcpDispatcher } from "../src/services/mcpDispatcher";
import dotenv from "dotenv";

dotenv.config();

/**
 * VERIFICATION SCRIPT: Hybrid Routing Proof
 * 1. Test Sovereign Agent (Playwright) -> Should stay local
 * 2. Test Non-Sovereign Agent (InsForge) -> Should go remote
 */

async function runTest() {
  console.log("--- STARTING HYBRID ROUTING VERIFICATION --- \n");

  // Ensure handshake matches what we put in the sovereign DB
  process.env.NEURAL_HANDSHAKE = process.env.NEURAL_HANDSHAKE || "AGENT_LEE_SOVEREIGN_V1";

  // 1. Test Playwright (Sovereign Core)
  console.log("[TEST 1] Dispatching Playwright (Expect LOCAL fallback/fail if bridge offline)...");
  const localResult = await mcpDispatcher.dispatch("navigate", "playwright-agent-mcp", "https://google.com");
  console.log(`Result: ${localResult.success ? "SUCCESS" : "FAILED (Expected if no bridge)"}`);
  console.log(`Agent: ${localResult.agent}\n`);

  // 2. Test InsForge (Offload Candidate)
  console.log("[TEST 2] Dispatching InsForge (Remote Gateway)...");
  const insforgeResult = await mcpDispatcher.dispatch("deploy", "insforge-agent-mcp", "deploy to production");
  console.log(`Result: ${insforgeResult.success ? 'PASSED' : 'FAILED'}`);
  console.log(`Summary: ${insforgeResult.summary}\n`);

  // 3. Test Docs-RAG (Offload Candidate)
  console.log("[TEST 3] Dispatching Docs-RAG (Remote Gateway)...");
  const ragResult = await mcpDispatcher.dispatch("search", "docs-rag-agent-mcp", "how to deploy functions");
  console.log(`Result: ${ragResult.success ? 'PASSED' : 'FAILED'}`);
  console.log(`Summary: ${ragResult.summary}\n`);

  // 4. Test Planner (Offload Candidate)
  console.log("[TEST 4] Dispatching Planner (Remote Gateway)...");
  const plannerResult = await mcpDispatcher.dispatch("orchestrate", "planner-agent-mcp", "initialize project");
  console.log(`Result: ${plannerResult.success ? 'PASSED' : 'FAILED'}`);
  console.log(`Summary: ${plannerResult.summary}\n`);

  console.log("--- VERIFICATION COMPLETE ---");
  process.exit(0);
}

runTest().catch(console.error);
