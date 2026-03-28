import { boundsToCenter, findElementByText, parseUIHierarchy } from "./phoneVision";
import { debugStore } from "../utils/debugStore.js";

export type MCPInvoker = (tool: string, input?: Record<string, unknown>) => Promise<any>;

export async function go_home_and_verify(mcp: MCPInvoker) {
  debugStore.updateTaskPlan("go_home", "pending", { action: "go_home" });
  await mcp("mcp_mobile_keyevent", { code: 3 });
  const dump = await mcp("mcp_mobile_ui_dump");
  const success = typeof dump?.xml === "string" && dump.xml.length > 0;
  debugStore.updateTaskPlan("go_home", "completed", { success });
  return { success };
}

export async function open_telegram_and_verify(mcp: MCPInvoker) {
  debugStore.updateTaskPlan("open_telegram", "pending", { action: "open_telegram" });
  const resolved = await mcp("mcp_mobile_resolve_app", { query: "telegram" });
  const match = resolved?.matches?.[0];
  if (!match) {
    debugStore.updateTaskPlan("open_telegram", "failed", { reason: "App not found" });
    throw new Error("Telegram not found");
  }

  await mcp("mcp_mobile_launch_app", { package: match });
  const dump = await mcp("mcp_mobile_ui_dump");

  const success = typeof dump?.xml === "string" && dump.xml.toLowerCase().includes("telegram");
  debugStore.updateTaskPlan("open_telegram", "completed", { success });
  return { success };
}

export async function tap_element_by_text_and_verify(mcp: MCPInvoker, text: string) {
  debugStore.updateTaskPlan("tap_element", "pending", { target: text });
  const before = await mcp("mcp_mobile_ui_dump");
  const beforeNodes = parseUIHierarchy(before.xml);
  const target = findElementByText(beforeNodes, text, true);

  if (!target) {
    debugStore.updateTaskPlan("tap_element", "failed", { reason: "Element not found", target: text });
    throw new Error(`Element not found: ${text}`);
  }

  const point = boundsToCenter(target.bounds);
  await mcp("mcp_mobile_tap", point);

  const after = await mcp("mcp_mobile_ui_dump");
  const success = after.xml !== before.xml;
  debugStore.updateTaskPlan("tap_element", "completed", { success, target, point });
  
  return {
    success,
    target: text,
    point
  };
}
