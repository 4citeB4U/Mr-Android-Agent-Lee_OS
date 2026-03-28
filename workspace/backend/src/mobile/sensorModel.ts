export type SensorEnvironment = {
  motionState?: "still" | "moving" | "unknown";
  orientation?: "portrait" | "landscape" | "flat" | "unknown";
  lightLevel?: "dark" | "dim" | "bright" | "unknown";
  proximity?: "near" | "far" | "unknown";
  activity?: "walking" | "running" | "driving" | "cycling" | "still" | "unknown";
  locationMode?: "none" | "approximate" | "precise";
};
