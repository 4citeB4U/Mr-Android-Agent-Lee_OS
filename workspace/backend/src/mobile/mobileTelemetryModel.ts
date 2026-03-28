export interface TelemetryBattery {
  level: number;
  isCharging: boolean;
}

export interface TelemetryNetwork {
  isOnline: boolean;
  isWifi: boolean;
  isCellular: boolean;
  airplaneMode: boolean;
}

export interface TelemetryRuntime {
  isScreenOn: boolean;
  orientation: "portrait" | "landscape";
  uptimeSeconds: number;
}

export interface TelemetryMemory {
  availableMb: number;
  totalMb: number;
  lowMemory: boolean;
}

export interface TelemetryServices {
  notificationListenerEnabled: boolean;
}

export interface DiagnosticSnapshot {
  battery?: TelemetryBattery;
  network?: TelemetryNetwork;
  runtime?: TelemetryRuntime;
  memory?: TelemetryMemory;
  services?: TelemetryServices;
  error?: string;
}

/**
 * Normalizes raw Android diagnostics JSON into a strictly typed DiagnosticSnapshot.
 */
export function parseDiagnosticSnapshot(rawJson: any): DiagnosticSnapshot {
  if (!rawJson) return {};

  if (typeof rawJson === "string") {
    try {
      rawJson = JSON.parse(rawJson);
    } catch {
      return { error: "Failed to parse raw diagnostic JSON." };
    }
  }

  return {
    battery: rawJson.battery,
    network: rawJson.network,
    runtime: rawJson.runtime,
    memory: rawJson.memory,
    services: rawJson.services,
    error: rawJson.error,
  };
}
