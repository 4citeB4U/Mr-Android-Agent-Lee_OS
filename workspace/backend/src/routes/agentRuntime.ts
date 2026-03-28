/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENTRUNTIME.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = agentRuntime module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\routes\agentRuntime.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

/**
 * Agent Runtime Route
 *
 * Exposes the Agent Lee runtime session API:
 *   POST   /api/agent-runtime/session/start
 *   POST   /api/agent-runtime/session/send
 *   GET    /api/agent-runtime/session/:id/history
 *   DELETE /api/agent-runtime/session/:id
 *   GET    /api/agent-runtime/tools
 *   GET    /api/agent-runtime/status
 */

import { Request, Response, Router } from "express";
import { IAgentSessionManager } from "../runtime/agentRuntime/agent/domain/interfaces/IAgentSessionManager.js";
import {
    bootstrap
} from "../runtime/agentRuntime/composition/bootstrap.js";
import {
    Container,
    Tokens,
} from "../runtime/agentRuntime/composition/Container.js";

const router = Router();

let bootstrapped = false;

async function ensureBootstrapped(): Promise<void> {
  if (!bootstrapped) {
    await bootstrap({ logLevel: "info" });
    bootstrapped = true;
  }
}

/**
 * POST /api/agent-runtime/session/start
 * Initialize and start an agent session.
 * Body: { systemPrompt?: string, model?: string }
 */
router.post("/session/start", async (req: Request, res: Response) => {
  try {
    await ensureBootstrapped();

    const manager = Container.resolve<IAgentSessionManager>(
      Tokens.IAgentSessionManager,
    );

    const initResult = await manager.initialize({
      model: req.body?.model ?? "glm-4-flash",
      systemPrompt: req.body?.systemPrompt,
    });

    if (initResult.isFailure()) {
      return res.status(500).json({ error: initResult.getError().message });
    }

    const startResult = await manager.start();
    if (startResult.isFailure()) {
      return res.status(500).json({ error: startResult.getError().message });
    }

    return res.json({
      sessionId: manager.getSessionId(),
      status: "running",
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/agent-runtime/session/send
 * Send a message to the running session.
 * Body: { message: string }
 */
router.post("/session/send", async (req: Request, res: Response) => {
  try {
    await ensureBootstrapped();

    const { message } = req.body ?? {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message (string) is required" });
    }

    const manager = Container.resolve<IAgentSessionManager>(
      Tokens.IAgentSessionManager,
    );

    if (!manager.isRunning()) {
      return res
        .status(409)
        .json({ error: "No active session — call /session/start first" });
    }

    const result = await manager.sendMessage(message);
    if (result.isFailure()) {
      return res.status(500).json({ error: result.getError().message });
    }

    return res.json({ response: result.getValue() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/agent-runtime/session/:id/history
 */
router.get("/session/:id/history", async (req: Request, res: Response) => {
  try {
    await ensureBootstrapped();

    const manager = Container.resolve<IAgentSessionManager>(
      Tokens.IAgentSessionManager,
    );

    if (manager.getSessionId() !== req.params.id) {
      return res.status(404).json({ error: "Session not found" });
    }

    const result = await manager.getHistory();
    if (result.isFailure()) {
      return res.status(500).json({ error: result.getError().message });
    }

    return res.json({ history: result.getValue() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/agent-runtime/session/:id
 * Stop a session.
 */
router.delete("/session/:id", async (req: Request, res: Response) => {
  try {
    await ensureBootstrapped();

    const manager = Container.resolve<IAgentSessionManager>(
      Tokens.IAgentSessionManager,
    );

    if (manager.getSessionId() !== req.params.id) {
      return res.status(404).json({ error: "Session not found" });
    }

    await manager.stop();
    return res.json({ status: "stopped" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/agent-runtime/tools
 */
router.get("/tools", async (_req: Request, res: Response) => {
  try {
    await ensureBootstrapped();

    const manager = Container.resolve<IAgentSessionManager>(
      Tokens.IAgentSessionManager,
    );
    const tools = await manager.getAvailableTools();
    return res.json({ tools });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/agent-runtime/status
 */
router.get("/status", async (_req: Request, res: Response) => {
  try {
    await ensureBootstrapped();

    const manager = Container.resolve<IAgentSessionManager>(
      Tokens.IAgentSessionManager,
    );
    return res.json({
      bootstrapped,
      running: manager.isRunning(),
      sessionId: manager.getSessionId(),
    });
  } catch (err: any) {
    // Runtime not yet initialized
    return res.json({ bootstrapped: false, running: false, sessionId: null });
  }
});

export { router as agentRuntimeRouter };
