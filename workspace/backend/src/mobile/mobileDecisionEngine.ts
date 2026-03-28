import { MobileContext } from "./mobileContextAssembler.js";

export type DecisionResult = {
  allowed: boolean;
  reason?: string;
  suggestedAction?: "open_app" | "abort" | "proceed";
  targetApp?: string;
};

export function evaluateNavigationContext(context: MobileContext, targetAppRequirement?: string): DecisionResult {

  // 1. Environmental blocks
  if (context.environment.motionState === "moving") {
    return {
      allowed: false,
      reason: "Device is moving. Intrusive UI automation blocked for safety.",
      suggestedAction: "abort"
    };
  }

  // 2. Proximity checks (e.g. don't do weird things if phone is face down or in pocket)
  if (context.environment.proximity === "near") {
     console.log("[Decision Engine] Proximity is NEAR. Suppressing spoken output or bright flashes.");
  }

  // 3. Application State requirements
  if (targetAppRequirement && context.visibleApp !== targetAppRequirement) {
    return {
      allowed: false,
      reason: `Task requires ${targetAppRequirement} but current app is ${context.visibleApp || "unknown"}.`,
      suggestedAction: "open_app",
      targetApp: targetAppRequirement
    };
  }

  return {
    allowed: true,
    suggestedAction: "proceed"
  };
}
