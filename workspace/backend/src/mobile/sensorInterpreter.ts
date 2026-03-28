import { SensorEnvironment } from "./sensorModel.js";

// Mock interpreting raw data from a snapshot to a structured state
export function interpretSensorSnapshot(rawSnapshot: any): SensorEnvironment {
  // Dummy baseline logic reflecting how the raw readings convert to human meaning
  let motionState: SensorEnvironment["motionState"] = "unknown";
  let lightLevel: SensorEnvironment["lightLevel"] = "unknown";
  let proximity: SensorEnvironment["proximity"] = "unknown";

  if (rawSnapshot?.accel_magnitude) {
    motionState = rawSnapshot.accel_magnitude > 11.0 ? "moving" : "still";
  }

  if (rawSnapshot?.lux !== undefined) {
    if (rawSnapshot.lux < 10) lightLevel = "dark";
    else if (rawSnapshot.lux < 50) lightLevel = "dim";
    else lightLevel = "bright";
  }

  if (rawSnapshot?.proximity_cm !== undefined) {
    proximity = rawSnapshot.proximity_cm <= 5.0 ? "near" : "far";
  }

  return {
    motionState,
    lightLevel,
    proximity,
    orientation: rawSnapshot?.orientation || "unknown",
    activity: rawSnapshot?.detected_activity || "unknown",
    locationMode: rawSnapshot?.location_mode || "none"
  };
}
