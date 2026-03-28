import { assembleMobileContext } from "./mobileContextAssembler.js";
import { evaluateNavigationContext } from "./mobileDecisionEngine.js";
import { buildScreenModel } from "../vision/phoneScreenModel.js";
import { parseUIHierarchy } from "../vision/phoneVision.js";
import { interpretSensorSnapshot } from "./sensorInterpreter.js";
import { tapElementByText } from "../vision/phoneNavigator.js";
import { open_telegram_and_verify } from "../vision/phoneTaskPlanner.js";
import { debugStore } from "../utils/debugStore.js";

export async function orchestrateTask(mcp: any, targetIntrusiveTask: string, requiredApp?: string) {
  
  // 1. Gather Screen Context
  const dump = await mcp("mcp_mobile_ui_dump");
  const nodes = parseUIHierarchy(dump?.xml || "");
  const screenModel = buildScreenModel(nodes);

  // 2. Gather Sensor Context
  const rawSensor = await mcp("mcp_mobile_sensor_snapshot");
  const sensorEnv = interpretSensorSnapshot(rawSensor);

  // 3. Assemble Unified Context
  const context = assembleMobileContext(screenModel, sensorEnv);
  debugStore.updateContext(context);

  // 4. Ask Decision Engine
  const decision = evaluateNavigationContext(context, requiredApp);
  debugStore.updateDecision(decision);

  if (!decision.allowed) {
    if (decision.suggestedAction === "open_app" && decision.targetApp === "telegram") {
      console.log(`[Orchestrator] Decision engine suggested opening ${decision.targetApp}. Attempting...`);
      await open_telegram_and_verify(mcp);
      // Recurse to try again now that condition is met
      return await orchestrateTask(mcp, targetIntrusiveTask, requiredApp);
    } else {
      console.log(`[Orchestrator] Task ABORTED. Reason: ${decision.reason}`);
      return { success: false, reason: decision.reason };
    }
  }

  // 5. Proceed with safe task execution if allowed
  console.log(`[Orchestrator] Task ALLOWED. Proceeding with: ${targetIntrusiveTask}`);
  
  // Minimal example dispatcher:
  if (targetIntrusiveTask === "tap_search") {
      await tapElementByText(mcp, "Search");
  }

  // 6. Final verification closure
  const finalDump = await mcp("mcp_mobile_ui_dump");
  
  return {
    success: finalDump.xml !== dump.xml,
    message: "Task executed successfully within safety boundaries."
  };
}
