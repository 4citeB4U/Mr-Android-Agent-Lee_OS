/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.BACKEND_SRC_INDEX_TS.MAIN_INDEX.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = index module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\index.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import cors from "cors";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import "./env.js";
import { agentRuntimeRouter } from "./routes/agentRuntime.js";
import { agentsRouter } from "./routes/agents.js";
import { appsRouter, appsWss } from "./routes/apps.js";
import { brainApiRouter } from "./routes/brain.js";
import { cerebralRouter } from "./routes/cerebral.js";
import { cloudflareDeploymentRouter } from "./routes/cfDeployment.js";
import { chatRouter } from "./routes/chat.js";
import { creatorRouter } from "./routes/creator.js";
import { deploymentRouter } from "./routes/deployment.js";
import { deviceRouter } from "./routes/device.js";
import { fileRouter } from "./routes/files.js";
import { fsRouter } from "./routes/fs.js";
import { layersRouter } from "./routes/layers.js";
import { mcpRouter } from "./routes/mcp.js";
import { mcpBrowserRouter } from "./routes/mcpBrowser.js";
import { mcpDashboardRouter } from "./routes/mcpDashboard.js";
import { memoryRouter } from "./routes/memory.js";
import { phoneRouter } from "./routes/phone.js";
import { searchRouter } from "./routes/search.js";
import { servicesRouter } from "./routes/services.js";
import { terminalRouter, terminalWss } from "./routes/terminal.js";
import { tunnelRouter } from "./routes/tunnel.js";
import { vmRouter } from "./routes/vm.js";
import { vmterminalRouter, vmterminalWss } from "./routes/vmterminal.js";
import { leewayApiRouter } from "./routes/leeway.js";
import { debugRouter } from "./routes/debug.js";
import { adbRouter } from "./routes/adb.js";
import ttsRouter from "./routes/tts.js";
import { bootstrap as agentRuntimeBootstrap } from "./runtime/agentRuntime/composition/bootstrap.js";
import { liteMode } from "./services/LiteMode.js";
import { securityMiddleware } from "./services/security.js";
// DISABLED: WatchdogService has compilation errors
// import { watchdogService } from "./services/WatchdogService.js";
import { setupWebSocket } from "./ws.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATIC_PATH = path.join(__dirname, "../../.Agent_Lee_OS/dist");

const PORT = Number(process.env.PORT || 7001);
const WS_PORT = Number(process.env.WS_PORT || 7003);
const app = express();

// Initialize WS
setupWebSocket(WS_PORT);

// Middleware
const ALLOWED_ORIGINS = [
  "http://localhost:7000",
  "http://localhost:7001",
  "http://localhost:5173",
  "http://127.0.0.1:7000",
  "http://127.0.0.1:7001",
  "https://appassets.androidplatform.net",
  "https://zenobia-suborbiculate-facetely.ngrok-free.dev",
  "https://agentleeos.leewayinnovations.io",
  "https://agentlee.rapidwebdevelop.com",
];
const ALLOWED_ORIGIN_PATTERNS = [
  /\.trycloudflare\.com$/,
  /\.ngrok-free\.dev$/,
  /\.ngrok\.app$/,
  /\.ngrok\.io$/,
  /\.leewayinnovations\.io$/,
  /\.rapidwebdevelop\.com$/,
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      if (ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin)))
        return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-neural-handshake",
      "x-device-id",
      "x-neural-timestamp",
      "x-neural-nonce",
      "x-neural-signature",
    ],
    exposedHeaders: ["Content-Type", "Content-Length"],
    optionsSuccessStatus: 204,
  }),
);
app.get("/health", (req, res) => {
  // Provide basic health info and conservative security headers for tests
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  res.json({
    status: "healthy",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// ADB phone control + TTS synthesis + Chat API + Brain + Memory + Phone
app.use("/api/adb", adbRouter);
app.use("/api/chat", chatRouter);
app.use("/api/tts", ttsRouter);
app.use("/api/brain", brainApiRouter);
app.use("/api/memory", memoryRouter);
app.use("/api/phone", phoneRouter);
app.use("/api/cerebral", cerebralRouter);

// SPA Catch-all (Must be after API routes)
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API_ENDPOINT_NOT_FOUND" });
  }
  res.sendFile(path.join(STATIC_PATH, "index.html"));
});

// Start server
const HOST = "0.0.0.0";
const httpServer = http.createServer(app);

// ── WebSocket upgrade routing (single-port, path-based) ──────────────────
httpServer.on("upgrade", (req, socket, head) => {
  try {
    const url = new URL(req.url || "", `http://localhost`);
    // Accept handshake via header OR ?handshake= query param (browsers can't set WS headers)
    const handshake =
      (req.headers["x-neural-handshake"] as string) ||
      url.searchParams.get("handshake") ||
      "";
    const HS = process.env.NEURAL_HANDSHAKE || "AGENT_LEE_SOVEREIGN_V1";

    if (handshake !== HS) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    // Narrow imported WSS servers to any for safe runtime calls
    const _terminalWss: any = terminalWss;
    const _vmterminalWss: any = vmterminalWss;
    const _appsWss: any = appsWss;

    const route = url.pathname;
    const wssByRoute: Record<string, any> = {
      "/api/terminal/ws": _terminalWss,
      "/api/vmterminal/ws": _vmterminalWss,
      "/api/apps/ws": _appsWss,
      "/api/apps": _appsWss,
    };

    const targetWss = wssByRoute[route];
    if (targetWss && typeof targetWss.handleUpgrade === "function") {
      const upgr = targetWss.handleUpgrade as unknown as (
        req: any,
        socket: any,
        head: any,
        cb: (ws: any) => void,
      ) => void;
      upgr(req as any, socket as any, head as any, (ws: any) => {
        targetWss.emit("connection", ws, req);
      });
      return;
    }

    // If no matching handler, reject
    socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n");
    socket.destroy();
  } catch (err) {
    try {
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
      socket.destroy();
    } catch {}
  }
});

// Startup logs and server listen
console.log("   Agent Lee OS - Backend API [HARDENED]");
console.log("═══════════════════════════════════════════════════════");
console.log(`   Host: ${HOST}`);
console.log(`   Port: ${PORT}`);
console.log(`   Health: http://${HOST}:${PORT}/health`);
console.log(`   File API: http://${HOST}:${PORT}/api/files`);

httpServer.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);

  // Ensure Lite Mode is not blocking on startup
  liteMode.deactivate();

  // Start Agent Lee runtime (non-blocking — errors are logged, not thrown)
  agentRuntimeBootstrap({ logLevel: "info" }).catch((err) => {
    console.error("[AgentRuntime] Bootstrap failed:", err?.message ?? err);
  });

  // Start Pi-Appliance watchdogs after server is live
  // DISABLED: WatchdogService has compilation errors in this build
  // watchdogService.start();

  // Broadcast LiteMode state changes to UI via AppsWss
  liteMode.on("activated", (reason: string) => {
    const _wss = appsWss as any;
    if (_wss?.clients) {
      const msg = JSON.stringify({ type: "lite_mode_activated", reason });
      _wss.clients.forEach((c: any) => {
        if (c.readyState === 1) c.send(msg);
      });
    }
  });
  liteMode.on("deactivated", () => {
    const _wss = appsWss as any;
    if (_wss?.clients) {
      const msg = JSON.stringify({ type: "lite_mode_deactivated" });
      _wss.clients.forEach((c: any) => {
        if (c.readyState === 1) c.send(msg);
      });
    }
  });
});
