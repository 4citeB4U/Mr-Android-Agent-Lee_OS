export type SensorAction = 
  | "sensor_capabilities_discovery"
  | "sensor_snapshot"
  | "activity_state_check"
  | "precise_location"
  | "background_location"
  | "continuous_tracking";

const autoAllow = new Set<SensorAction>([
  "sensor_capabilities_discovery",
  "sensor_snapshot",
  "activity_state_check"
]);

const requireConfirmation = new Set<SensorAction>([
  "precise_location",
  "background_location"
]);

export function getSensorActionPolicy(action: SensorAction): "allow" | "confirm" | "deny" {
  if (autoAllow.has(action)) return "allow";
  if (requireConfirmation.has(action)) return "confirm";
  return "deny"; // Deny anything like continuous tracking by default
}
