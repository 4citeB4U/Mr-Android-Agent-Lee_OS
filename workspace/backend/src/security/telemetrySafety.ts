import { TelemetryPlan } from "../mobile/mobileTelemetryPlanner";
import { debugStore } from "../utils/debugStore";

export interface SafetyResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Evaluates whether an operation should proceed given the current telemetry state.
 */
export function evaluateTelemetrySafety(intent: string, plan: TelemetryPlan): SafetyResult {
  const { suggestedAction, interpretation } = plan;

  let allowed = true;
  let reason = undefined;

  if (suggestedAction === "abort_offline") {
    allowed = false;
    reason = "Operation blocked: Device is currently offline.";
  } else if (suggestedAction === "abort_low_battery") {
    // Only block completely if the intent might be heavy. For now, we block most things on critical battery.
    allowed = false;
    reason = "Operation blocked: Battery level is critically low.";
  }

  debugStore.updateSafetyPolicy(
    `evaluateTelemetrySafety[${intent}]`, 
    allowed ? "allow" : "deny", 
    reason
  );

  return { allowed, reason };
}
