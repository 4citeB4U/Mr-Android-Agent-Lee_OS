import { orchestrateTask } from "../src/mobile/mobileAutonomyOrchestrator.js";
import * as assert from "assert";

let screenPhase = "home";

// Mocking the MCP to supply controlled environments
const mockMcp = async (tool: string, input?: any) => {
  if (tool === "mcp_mobile_ui_dump") {
    if (screenPhase === "home") {
        return { xml: `<hierarchy><node text="Telegram" clickable="true" bounds="[10,10][20,20]"/></hierarchy>` };
    }
    if (screenPhase === "telegram") {
        return { xml: `<hierarchy><node text="Search" resource-id="org.telegram.messenger:id/search" clickable="true" bounds="[10,10][20,20]"/></hierarchy>` };
    }
    return { xml: `<hierarchy><node text="Search Box Active" resource-id="org.telegram.messenger:id/search" clickable="true" bounds="[10,10][20,20]"/></hierarchy>` };
  }
  
  if (tool === "mcp_mobile_sensor_snapshot") {
    // Read global state injected by tests
    return (global as any).__mockSensorSnapshot;
  }

  if (tool === "mcp_mobile_launch_app") {
      screenPhase = "telegram"; // Mutate state
      return { success: true };
  }

  if (tool === "mcp_mobile_resolve_app") {
      return { matches: ["org.telegram.messenger"] };
  }

  if (tool === "mcp_mobile_tap") {
      // Simulate tap doing something and modifying UI
      screenPhase = "telegram_search_open";
      return { success: true };
  }
  return {};
};

async function run() {
  console.log("=== Agent Lee Mobile Context Smoke Test ===");

  // CASE 1: Moving State blocks action
  console.log("\n--- Case 1: Moving Environment ---");
  (global as any).__mockSensorSnapshot = { accel_magnitude: 15.0 }; // moving
  let res = await orchestrateTask(mockMcp, "tap_search", "telegram");
  assert.strictEqual(res.success, false);
  console.log("✓ Correctly blocked due to motion");

  // CASE 2: Near proximity (log check only, task should proceed to app-req check)
  console.log("\n--- Case 2: Near Proximity + Home Screen ---");
  (global as any).__mockSensorSnapshot = { accel_magnitude: 9.8, proximity_cm: 2.0 }; // still, near
  screenPhase = "home";
  
  // This will see we are on home but we require telegram. It will launch telegram, recurse, then tap.
  res = await orchestrateTask(mockMcp, "tap_search", "telegram");
  assert.strictEqual(res.success, true);
  console.log("✓ Correctly orchestrated app launch prior to tap execution while near");

  console.log("\n=== Mobile Context Smoke Test Passed! ===");
}

run().catch(console.error);
