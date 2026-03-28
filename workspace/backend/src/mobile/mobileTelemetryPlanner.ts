import { DiagnosticSnapshot } from "./mobileTelemetryModel";
import { interpretTelemetry, TelemetryInterpretation } from "./mobileTelemetryInterpreter";
import { invokeMcpTool } from "../services/mcpDispatcher";

export interface TelemetryPlan {
  interpretation: TelemetryInterpretation;
  suggestedAction: "proceed" | "abort_low_battery" | "abort_offline" | "warn_degraded";
}

/**
 * Fetches the current telemetry snapshot and creates a plan for whether it's safe to continue.
 */
export async function planTelemetryAction(): Promise<TelemetryPlan> {
  const result = await invokeMcpTool("mobile-device-agent-mcp", "mcp_mobile_diagnostics_snapshot", {});
  
  const mcpResult = result as any;
  if (mcpResult.isError) {
    throw new Error(`Failed to fetch diagnostics: ${mcpResult.content?.[0]?.text}`);
  }

  const rawJsonStr = mcpResult.content?.[0]?.text || "{}";
  const rawJson = JSON.parse(rawJsonStr);
  const snapshot: DiagnosticSnapshot = rawJson;
  
  const interpretation = interpretTelemetry(snapshot);

  let suggestedAction: TelemetryPlan["suggestedAction"] = "proceed";

  if (!interpretation.isHealthy) {
    if (interpretation.blockers.some(b => b.includes("offline"))) {
      suggestedAction = "abort_offline";
    } else if (interpretation.blockers.some(b => b.includes("low for safe operation"))) {
      suggestedAction = "abort_low_battery";
    }
  } else if (interpretation.warnings.length > 0) {
    suggestedAction = "warn_degraded";
  }

  return {
    interpretation,
    suggestedAction
  };
}
