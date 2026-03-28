import { DiagnosticSnapshot } from "./mobileTelemetryModel";

export interface TelemetryInterpretation {
  isHealthy: boolean;
  warnings: string[];
  blockers: string[];
}

/**
 * Interprets the current diagnostic snapshot against safety and operational thresholds.
 */
export function interpretTelemetry(snapshot: DiagnosticSnapshot): TelemetryInterpretation {
  const warnings: string[] = [];
  const blockers: string[] = [];

  // Battery checks
  if (snapshot.battery) {
    if (snapshot.battery.level < 15 && !snapshot.battery.isCharging) {
      warnings.push("Battery is critically low.");
    }
    if (snapshot.battery.level < 5 && !snapshot.battery.isCharging) {
      blockers.push("Battery is too low for safe operation.");
    }
  }

  // Network checks
  if (snapshot.network) {
    if (!snapshot.network.isOnline) {
      blockers.push("Device is offline. Cloud capabilities are unavailable.");
    }
    if (snapshot.network.airplaneMode) {
      warnings.push("Airplane mode is enabled.");
    }
  }

  // Memory checks
  if (snapshot.memory) {
    if (snapshot.memory.lowMemory) {
      warnings.push("Device is reporting low memory state.");
    }
  }

  // Service health
  if (snapshot.services) {
    if (!snapshot.services.notificationListenerEnabled) {
      warnings.push("Notification Listener is disabled. Agent Lee cannot read notifications.");
    }
  }

  return {
    isHealthy: blockers.length === 0,
    warnings,
    blockers,
  };
}
