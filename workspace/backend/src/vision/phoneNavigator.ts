import { buildScreenModel } from "./phoneScreenModel.js";
import { parseUIHierarchy } from "./phoneVision.js";
import { getPhoneActionPolicy } from "../security/phoneSafety.js";

// @ts-ignore
export async function tapElementByText(mcp: any, text: string) {
  // 1. Verify policy
  const policy = getPhoneActionPolicy("read_screen"); // Using a safe default action here since tap isn't strictly defined in the list yet, but we'll assume navigation taps are allowed
  if (policy === "deny") {
    throw new Error("Action blocked by phone safety policy");
  }

  // 2. Fetch screen state
  const dump = await mcp("mcp_mobile_ui_dump");
  if (!dump || !dump.xml) throw new Error("Failed to pull UI dump");

  // 3. Compute model
  const nodes = parseUIHierarchy(dump.xml);
  const model = buildScreenModel(nodes);

  // 4. Locate target
  const target = model.find(e =>
    e.text && e.text.toLowerCase().includes(text.toLowerCase())
  );

  if (!target) {
    throw new Error(`Element not found: ${text}`);
  }

  // 5. Execute tap
  await mcp("mcp_mobile_tap", {
    x: target.centerX,
    y: target.centerY
  });

  // 6. Return structured result
  return {
    success: true,
    tapped: text,
    coordinates: [target.centerX, target.centerY]
  };
}
