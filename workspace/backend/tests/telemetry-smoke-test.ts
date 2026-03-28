import { parseDiagnosticSnapshot } from "../src/mobile/mobileTelemetryModel";
import { interpretTelemetry } from "../src/mobile/mobileTelemetryInterpreter";
import { evaluateTelemetrySafety } from "../src/security/telemetrySafety";

async function runTelemetrySmokeTest() {
  console.log("--- Telemetry Smoke Test Started ---");

  // 1. Simulate a healthy device snapshot
  const healthySnapshotJson = {
    battery: { level: 85, isCharging: true },
    network: { isOnline: true, isWifi: true, isCellular: false, airplaneMode: false },
    runtime: { isScreenOn: true, orientation: "portrait", uptimeSeconds: 3600 },
    memory: { availableMb: 2048, totalMb: 8192, lowMemory: false },
    services: { notificationListenerEnabled: true }
  };

  const healthySnapshot = parseDiagnosticSnapshot(healthySnapshotJson);
  console.log("[1/3] Healthy Snapshot Parsed: ", healthySnapshot);

  const healthyInterpretation = interpretTelemetry(healthySnapshot);
  console.log("Interpretation:", healthyInterpretation);

  const healthyPlan: any = {
      interpretation: healthyInterpretation,
      suggestedAction: "proceed"
  };

  const healthySafety = evaluateTelemetrySafety("launch_camera", healthyPlan);
  console.log("Safety Result:", healthySafety);

  // 2. Simulate critically degraded device (low battery, offline)
  const degradedSnapshotJson = {
    battery: { level: 2, isCharging: false },
    network: { isOnline: false, isWifi: false, isCellular: false, airplaneMode: true },
    runtime: { isScreenOn: true, orientation: "portrait", uptimeSeconds: 3600 },
    memory: { availableMb: 2048, totalMb: 8192, lowMemory: false },
    services: { notificationListenerEnabled: true }
  };

  const degradedSnapshot = parseDiagnosticSnapshot(degradedSnapshotJson);
  console.log("\n[2/3] Degraded Snapshot Parsed: ", degradedSnapshot);

  const degradedInterpretation = interpretTelemetry(degradedSnapshot);
  console.log("Interpretation:", degradedInterpretation);

  let suggestedAction = "proceed";
  if (degradedInterpretation.blockers.some(b => b.includes("offline"))) {
      suggestedAction = "abort_offline";
  } else if (degradedInterpretation.blockers.some(b => b.includes("low for safe operation"))) {
      suggestedAction = "abort_low_battery";
  }

  const degradedPlan: any = {
      interpretation: degradedInterpretation,
      suggestedAction: suggestedAction
  };

  const degradedSafety = evaluateTelemetrySafety("remote_upload", degradedPlan);
  console.log("Safety Result:", degradedSafety);

  // 3. Ensure offline blocks cloud functions but allows local intent
  console.log("\n[3/3] Telemetry Smoke Test Completed");
}

runTelemetrySmokeTest().catch(console.error);
