import { debugStore } from "../utils/debugStore.js";

export const BLOCKED_APPS = [
  "com.android.settings", // settings typically requires explicit intent
  "com.android.vending",  // play store purchases
  "com.google.android.apps.authenticator2", // 2FA apps
  "com.authy.authy",
];

export function evaluateActionSafety(action: string, contextPackage: string): boolean {
  let isSafe = false;

  // If the app is in the hard-blocked list, deny automation unless explicitly overridden by user
  if (BLOCKED_APPS.includes(contextPackage)) {
    isSafe = false;
  } else {
    // Auto-allow safe actions
    const autoAllow = [
      "read_snapshot",
      "summarize",
      "classify",
      "suggest_open_app",
      "interpret"
    ];
    if (autoAllow.includes(action)) isSafe = true;
  }

  debugStore.updateSafetyPolicy(`notification_${action}`, isSafe ? "allow" : "deny");
  return isSafe;
}

export function isActionAllowed(action: string, contextPackage: string): boolean {
  return evaluateActionSafety(action, contextPackage);
}
