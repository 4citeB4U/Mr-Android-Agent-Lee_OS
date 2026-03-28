/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.HEALTH.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = health module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\services\health.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface ServiceHealth {
  name: string;
  port: number;
  status: "online" | "offline" | "warning";
  latency?: number;
  lastChecked: string;
}

class HealthService {
  private services: ServiceHealth[] = [
    {
      name: "Sovereign Frontend",
      port: 7000,
      status: "offline",
      lastChecked: "",
    },
    { name: "Neural Hub (API)", port: 7001, status: "online", lastChecked: "" },
    { name: "MCP Bridge", port: 7002, status: "offline", lastChecked: "" },
    {
      name: "Neural Mesh (WS)",
      port: 7003,
      status: "offline",
      lastChecked: "",
    },
    { name: "Neural Router", port: 7004, status: "offline", lastChecked: "" },
    { name: "Desktop Agent", port: 7005, status: "offline", lastChecked: "" },
    { name: "InsForge Bridge", port: 7007, status: "offline", lastChecked: "" },
    { name: "Dashboard MCP", port: 7008, status: "offline", lastChecked: "" },
    {
      name: "Browser MCP (Playwright)",
      port: 7009,
      status: "offline",
      lastChecked: "",
    },
    {
      name: "Cloudflare Tunnel (ngrok inspect)",
      port: 4040,
      status: "offline",
      lastChecked: "",
    },
  ];

  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startMonitoring();
  }

  private async checkPort(port: number): Promise<boolean> {
    try {
      // Windows specific port check
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  private startMonitoring() {
    console.log("[health] Initializing autonomous telemetry monitoring...");
    this.poll();
    this.pollingInterval = setInterval(() => this.poll(), 30000); // 30s intervals
  }

  private async poll() {
    const timestamp = new Date().toISOString();
    for (const service of this.services) {
      const isAlive = await this.checkPort(service.port);
      service.status = isAlive ? "online" : "offline";
      service.lastChecked = timestamp;
    }
  }

  public getSystemStatus() {
    return {
      timestamp: new Date().toISOString(),
      services: this.services,
      overallStatus: this.services.every((s) => s.status === "online")
        ? "nominal"
        : "degraded",
    };
  }
}

export const healthService = new HealthService();
