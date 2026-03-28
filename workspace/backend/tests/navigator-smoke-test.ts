import { tapElementByText } from "../src/vision/phoneNavigator.js";

// Mock MCP invoker map for the smoke test
const mockMcp = async (tool: string, input?: any) => {
  if (tool === "mcp_mobile_ui_dump") {
    return {
      xml: `<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>
<hierarchy rotation="0">
  <node index="0" bounds="[0,0][1080,2400]">
    <node index="0" text="Search" clickable="true" bounds="[100,200][300,400]" />
  </node>
</hierarchy>`
    };
  }
  if (tool === "mcp_mobile_tap") {
    console.log(`[MCP MOCK] Executed tap at x: ${input.x}, y: ${input.y}`);
    return { success: true };
  }
  return {};
};

async function run() {
  console.log("=== Agent Lee Navigator Smoke Test ===");

  try {
    const result = await tapElementByText(mockMcp, "Search");
    console.log("✓ Tap verification successful!");
    console.log("Result:", result);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

run().catch(console.error);
