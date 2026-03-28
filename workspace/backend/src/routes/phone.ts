/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.PHONE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = phone module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\routes\phone.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { Router } from "express";
import type { Request, Response } from "express";
import { invokeMcpTool } from "../services/mcpDispatcher";

export const phoneRouter = Router();

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function getPhoneInfo(req: Request, res: Response) {
  try {
    const result = await invokeMcpTool(
      "mobile-device-agent-mcp",
      "mcp_mobile_device_info",
      {}
    );

    res.json({
      ok: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: getErrorMessage(error),
    });
  }
}

export async function listPhoneApps(req: Request, res: Response) {
  try {
    const query =
      typeof req.query.query === "string" ? req.query.query : undefined;

    const result = await invokeMcpTool(
      "mobile-device-agent-mcp",
      "mcp_mobile_list_apps",
      { query }
    );

    res.json({
      ok: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: getErrorMessage(error),
    });
  }
}

export async function resolvePhoneApp(req: Request, res: Response) {
  try {
    const query =
      typeof req.query.query === "string"
        ? req.query.query
        : typeof req.body?.query === "string"
        ? req.body.query
        : "";

    if (!query) {
      return res.status(400).json({
        ok: false,
        error: "query is required",
      });
    }

    const result = await invokeMcpTool(
      "mobile-device-agent-mcp",
      "mcp_mobile_resolve_app",
      { query }
    );

    res.json({
      ok: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: getErrorMessage(error),
    });
  }
}

export async function openPhoneApp(req: Request, res: Response) {
  try {
    const packageName =
      typeof req.body?.packageName === "string" ? req.body.packageName : "";

    if (!packageName) {
      return res.status(400).json({
        ok: false,
        error: "packageName is required",
      });
    }

    const result = await invokeMcpTool(
      "mobile-device-agent-mcp",
      "mcp_mobile_launch_app",
      { package: packageName }
    );

    res.json({
      ok: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: getErrorMessage(error),
    });
  }
}

export async function listPhoneFiles(req: Request, res: Response) {
  try {
    const path =
      typeof req.query.path === "string"
        ? req.query.path
        : typeof req.body?.path === "string"
        ? req.body.path
        : "";

    if (!path) {
      return res.status(400).json({
        ok: false,
        error: "path is required",
      });
    }

    const result = await invokeMcpTool(
      "mobile-device-agent-mcp",
      "mcp_mobile_list_files",
      { path }
    );

    res.json({
      ok: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: getErrorMessage(error),
    });
  }
}

export async function getPhoneScreenDump(req: Request, res: Response) {
  try {
    const result = await invokeMcpTool(
      "mobile-device-agent-mcp",
      "mcp_mobile_ui_dump",
      {}
    );

    res.json({
      ok: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: getErrorMessage(error),
    });
  }
}

export async function getPhoneScreenshot(req: Request, res: Response) {
  try {
    const result = await invokeMcpTool(
      "mobile-device-agent-mcp",
      "mcp_mobile_screencap",
      {}
    );

    res.json({
      ok: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: getErrorMessage(error),
    });
  }
}

export async function goPhoneHome(req: Request, res: Response) {
  try {
    const result = await invokeMcpTool(
      "mobile-device-agent-mcp",
      "mcp_mobile_keyevent",
      { code: 3 }
    );

    res.json({
      ok: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: getErrorMessage(error),
    });
  }
}

phoneRouter.get("/info", getPhoneInfo);
phoneRouter.get("/apps", listPhoneApps);
phoneRouter.get("/apps/resolve", resolvePhoneApp);
phoneRouter.post("/apps/open", openPhoneApp);
phoneRouter.get("/files", listPhoneFiles);
phoneRouter.get("/ui-dump", getPhoneScreenDump);
phoneRouter.get("/screencap", getPhoneScreenshot);
phoneRouter.post("/home", goPhoneHome);
