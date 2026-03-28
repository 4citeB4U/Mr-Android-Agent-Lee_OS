import { parseUIHierarchy, boundsToCenter, findElementByText, findElementByResourceId } from "../src/vision/phoneVision.js";
import { getPhoneActionPolicy } from "../src/security/phoneSafety.js";
import * as assert from "assert";

// Sample mock XML inspired by Android uiautomator dump
const mockXml = `<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>
<hierarchy rotation="0">
  <node index="0" text="" resource-id="" class="android.widget.FrameLayout" package="com.android.launcher3" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[0,0][1080,2400]">
    <node index="0" text="Telegram" resource-id="com.android.launcher3:id/icon" class="android.widget.TextView" package="com.android.launcher3" content-desc="Telegram" checkable="false" checked="false" clickable="true" enabled="true" focusable="true" focused="false" scrollable="false" long-clickable="true" password="false" selected="false" bounds="[100,200][300,400]" />
    <node index="1" text="Camera" resource-id="com.android.launcher3:id/icon_camera" class="android.widget.TextView" package="com.android.launcher3" content-desc="Camera" checkable="false" checked="false" clickable="true" enabled="true" focusable="true" focused="false" scrollable="false" long-clickable="true" password="false" selected="false" bounds="[400,200][600,400]" />
  </node>
</hierarchy>`;

async function runSmokeTest() {
  console.log("=== Agent Lee Vision Smoke Test ===");

  // 1. Test Safety Policy
  console.log("Testing phoneSafety policy...");
  assert.strictEqual(getPhoneActionPolicy("go_home"), "allow");
  assert.strictEqual(getPhoneActionPolicy("capture_screen"), "allow");
  assert.strictEqual(getPhoneActionPolicy("send_message"), "confirm");
  assert.strictEqual(getPhoneActionPolicy("take_photo"), "confirm");
  // @ts-expect-error testing invalid action
  assert.strictEqual(getPhoneActionPolicy("unknown_hack"), "deny");
  console.log("✓ Safety Policy OK");

  // 2. Test Vision Parser
  console.log("\nTesting phoneVision UI parsing...");
  const nodes = parseUIHierarchy(mockXml);
  assert.ok(nodes.length > 0, "Should parse nodes");
  
  // Find Telegram
  const telegramNode = findElementByText(nodes, "Telegram", true);
  assert.ok(telegramNode, "Should find Telegram by text");
  assert.strictEqual(telegramNode.text, "Telegram");
  assert.strictEqual(telegramNode.bounds, "[100,200][300,400]");

  // Find Camera by ID
  const cameraNode = findElementByResourceId(nodes, "com.android.launcher3:id/icon_camera");
  assert.ok(cameraNode, "Should find Camera by ID");

  // Test bounds to center conversion
  const center = boundsToCenter(telegramNode.bounds);
  assert.strictEqual(center.x, 200);
  assert.strictEqual(center.y, 300);
  console.log("✓ Vision Parsing & Math OK");

  console.log("\n=== Smoke Test Passed! ===");
}

runSmokeTest().catch(console.error);
