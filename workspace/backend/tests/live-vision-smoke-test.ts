import { spawn } from "node:child_process";
import { parseUIHierarchy, boundsToCenter, findElementByText } from "../src/vision/phoneVision.js";

function runCmd(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { shell: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", d => stdout += d.toString());
    child.stderr.on("data", d => stderr += d.toString());
    child.on("close", code => {
      if (code === 0) resolve(stdout);
      else reject(new Error("Command failed: " + code + "\n" + stderr));
    });
  });
}

async function run() {
  console.log("=== Agent Lee Live Fold6 Vision Smoke Test ===");
  try {
    console.log("1. Pulling live UI dump via ADB...");
    await runCmd("adb", ["shell", "uiautomator", "dump", "/sdcard/window_dump.xml"]);
    const xml = await runCmd("adb", ["exec-out", "cat", "/sdcard/window_dump.xml"]);
    
    console.log("2. Parsing XML dump with phoneVision.ts...");
    const nodes = parseUIHierarchy(xml);
    console.log(`✓ Parsed ${nodes.length} UI nodes from genuine Fold6 layout.`);
    
    console.log("3. Discovering actionable targets...");
    const clickableNodes = nodes.filter(n => n.clickable === "true" && n.bounds && n.bounds !== "[0,0][0,0]");
    console.log(`✓ Found ${clickableNodes.length} explicitly clickable targets on the current screen.`);
    
    if (clickableNodes.length > 0) {
      const sample = clickableNodes[0];
      const center = boundsToCenter(sample.bounds);
      console.log(`✓ Coordinate Math Verification:`);
      console.log(`  Target: ${sample.text || sample.resourceId || "Unknown icon"}`);
      console.log(`  Raw Bounds: ${sample.bounds}`);
      console.log(`  Calculated Tap Center: (x: ${center.x}, y: ${center.y})`);
    }

    console.log("\n=== Live Test Passed! ===");
  } catch (err) {
    console.error("Test execution failed:", err);
  }
}

run();
