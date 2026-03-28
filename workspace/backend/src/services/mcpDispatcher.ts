/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.MCPDISPATCHER.MAIN

5WH:
WHAT = MCP Dispatcher service
WHY = Bridges AI intent classification to actual MCP tool execution
WHO = LEEWAY / Phase 2 Upgrade
WHERE = backend\src\services\mcpDispatcher.ts
WHEN = 2026
HOW = Dispatches classified intents to the appropriate MCP bridge endpoints

LICENSE:
MIT
*/

/**
 * MCP Dispatcher — Connects Agent Lee's brain to his MCP tools.
 *
 * When the AI classifies an intent that maps to an MCP agent, the dispatcher
 * calls the MCP Bridge to actually execute the action, then returns the result
 * back to the AI for summarization in Agent Lee's voice.
 *
 * Supported dispatch targets:
 *    testsprite    → Test generation and execution
 *    playwright    → Browser automation
 *    insforge      → Backend/DB/deployment operations
 *    stitch        → UI design and component generation
 *    planner-agent → Task breakdown and orchestration (MCP planner-agent)
 *    notebooklm    → RAG-grounded memory retrieval
 *
 * The dispatcher also provides a workspace file search (simple RAG)
 * and a tool listing endpoint so Agent Lee knows what he can do.
 */

import fs from "fs";
import path from "path";
import { leewaySkillsService } from "./leewaySkills.js";
import { debugStore } from "../utils/debugStore.js";

const MCP_BRIDGE_PORT = Number(process.env.MCP_BRIDGE_PORT || 8002);
const BACKEND_PORT = Number(process.env.PORT || 8001);
const WORKSPACE_ROOT = path.resolve("c:\\Tools\\Portable-VSCode-MCP-Kit");
const MEMORY_PATH = path.join(WORKSPACE_ROOT, "workspace", "memory.json");
function getHandshake(): string {
  return process.env.NEURAL_HANDSHAKE || process.env.NEURAL_HANDSHAKE_KEY || "";
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface MCPDispatchResult {
  success: boolean;
  agent: string;
  intent: string;
  data?: any;
  error?: string;
  /** Summary text for the AI to paraphrase in Agent Lee's voice */
  summary: string;
}

export interface WorkspaceSearchResult {
  path: string;
  snippet: string;
  lineNumber: number;
}

export interface RemoteAgentConfig {
  name: string;
  url: string;
  sovereign: boolean;
}

// ── HTTP Helper ──────────────────────────────────────────────────────────────
async function safeFetch(
  url: string,
  opts: RequestInit = {},
  timeoutMs = 15_000,
): Promise<{ ok: boolean; status: number; body: any }> {
  try {
    const res = await fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(getHandshake() ? { "x-neural-handshake": getHandshake() } : {}),
        ...(opts.headers || {}),
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    let body: any;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return { ok: res.ok, status: res.status, body };
  } catch (err: any) {
    return { ok: false, status: 0, body: err.message };
  }
}

// ── Remote Registry (LeewayMCP Hybrid Cloud) ────────────────────────────────
const REMOTE_REGISTRY: Record<string, RemoteAgentConfig> = {
  "insforge-agent-mcp": {
    name: "InsForge Cloud",
    url: process.env.REMOTE_INSFORGE_URL || "https://3c4cp27v.us-west.insforge.app/functions/leeway-remote-worker",
    sovereign: false,
  },
  "docs-rag-agent-mcp": {
    name: "Docs-RAG Cloud",
    url: process.env.REMOTE_INSFORGE_URL || "https://3c4cp27v.us-west.insforge.app/functions/leeway-remote-worker",
    sovereign: false,
  },
  "planner-agent-mcp": {
    name: "Planner Cloud",
    url: process.env.REMOTE_INSFORGE_URL || "https://3c4cp27v.us-west.insforge.app/functions/leeway-remote-worker",
    sovereign: false,
  },
};

// ── MCP Dispatcher Service ──────────────────────────────────────────────────
class MCPDispatcherService {
  /**
   * Dispatch an intent to the appropriate MCP agent.
   * Returns a result that the AI can summarize in Agent Lee's voice.
   */
  async dispatch(
    intent: string,
    agent: string,
    userText: string,
  ): Promise<MCPDispatchResult> {
    console.log(
      `[mcp-dispatch] Intent: ${intent} → Agent: ${agent} | "${userText.slice(0, 80)}"`,
    );

    // 1. Check if the agent should be routed remotely (LeewayMCP Hybrid)
    const remoteConfig = REMOTE_REGISTRY[agent];
    if (remoteConfig && !process.env.MCP_LITE_MODE) {
      console.log(`[mcp-dispatch] Routing ${agent} to REMOTE GATEWAY: ${remoteConfig.url}`);
      return this.dispatchRemote(agent, remoteConfig, intent, userText);
    }

    // 2. Route to the right handler based on the classified agent (Local Sovereign Core)
    switch (agent) {
      case "insforge-agent-mcp":
        return this.dispatchGeneric(agent, intent, userText, "InsForge");
      case "planner-agent-mcp":
        return this.dispatchPlanner(intent, userText);
      case "testsprite-agent-mcp":
        return this.dispatchTestSprite(intent, userText);
      case "playwright-agent-mcp":
        return this.dispatchPlaywright(intent, userText);
      case "stitch-agent-mcp":
        return this.dispatchStitch(intent, userText);
      case "memory-agent-mcp":
        return this.dispatchMemory(intent, userText);
      case "desktop-commander-agent-mcp":
        return this.dispatchDesktop(intent, userText);
      case "mobile-device-agent-mcp":
        return this.dispatchGeneric(agent, intent, userText, "Mobile Device");
      case "vision-agent-mcp":
        return this.dispatchVision(intent, userText);
      case "voice-agent-mcp":
        // Voice is handled directly by ttsEnforcer — no dispatch needed
        return {
          success: true,
          agent,
          intent,
          summary: "Voice path handled directly by the TTS enforcer.",
        };
      case "spline-agent-mcp":
        return this.dispatchGeneric(agent, intent, userText, "3D generation");
      case "scheduling-agent-mcp":
        return this.dispatchGeneric(
          agent,
          intent,
          userText,
          "scheduling",
        );
      default:
        console.warn(`[mcp-dispatch] No handler for agent: ${agent}`);
        return {
          success: false,
          agent,
          intent,
          error: `No dispatch handler for agent: ${agent}`,
          summary: `I don't have a direct connection to ${agent} yet. Let me handle this with my reasoning core instead.`,
        };
    }
  }

  // ── Planner Agent ─────────────────────────────────────────────────────────
  private async dispatchPlanner(
    intent: string,
    userText: string,
  ): Promise<MCPDispatchResult> {
    // Try the local planner-agent MCP via the backend's own API
    const result = await safeFetch(
      `http://127.0.0.1:${BACKEND_PORT}/api/mcp/tools/call`,
      {
        method: "POST",
        body: JSON.stringify({
          server: "planner-agent",
          tool: "make_plan",
          args: { goal: userText },
        }),
      },
      30_000,
    );

    if (result.ok && result.body?.result) {
      return {
        success: true,
        agent: "planner-agent-mcp",
        intent,
        data: result.body.result,
        summary: `I broke down your request into actionable steps using my planning engine. Here's the plan: ${JSON.stringify(result.body.result).slice(0, 500)}`,
      };
    }

    // Fallback: use the MCP bridge
    const bridgeResult = await safeFetch(
      `http://127.0.0.1:${MCP_BRIDGE_PORT}/run/planner`,
      { method: "POST" },
    );

    if (bridgeResult.ok) {
      return {
        success: true,
        agent: "planner-agent-mcp",
        intent,
        data: bridgeResult.body,
        summary: `Planning agent executed. ${typeof bridgeResult.body === "object" ? JSON.stringify(bridgeResult.body).slice(0, 500) : String(bridgeResult.body).slice(0, 500)}`,
      };
    }

    return {
      success: false,
      agent: "planner-agent-mcp",
      intent,
      error: "Planner agent unavailable",
      summary:
        "My planning agent is offline right now. I can still break this down for you using my reasoning core.",
    };
  }

  // ── Remote Dispatch (LeewayMCP Hybrid Cloud) ──────────────────────────────
  private async dispatchRemote(
    agent: string,
    config: RemoteAgentConfig,
    intent: string,
    userText: string,
  ): Promise<MCPDispatchResult> {
    const result = await safeFetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-neural-handshake": getHandshake(),
        "apikey": process.env.INSFORGE_ANON_KEY || "",
        "Authorization": `Bearer ${process.env.INSFORGE_ANON_KEY || ""}`
      },
      body: JSON.stringify({
        agent,
        intent,
        prompt: userText,
        timestamp: new Date().toISOString(),
      }),
    });

    if (result.ok) {
      return {
        success: true,
        agent: config.name,
        intent,
        data: result.body,
        summary: `Cloud agent ${config.name} processed your request. ${
          typeof result.body === "object"
            ? JSON.stringify(result.body).slice(0, 400)
            : String(result.body).slice(0, 400)
        }`,
      };
    }

    // Fallback: If remote fails, try local if it's not strictly sovereign
    const errorBody = typeof result.body === 'object' ? JSON.stringify(result.body) : String(result.body);
    console.warn(`[mcp-dispatch] Remote ${config.name} failed: ${errorBody}`);
    return {
      success: false,
      agent: config.name,
      intent,
      error: errorBody,
      summary: `Cloud agent ${config.name} is unreachable. I'll attempt to process this locally if possible.`,
    };
  }

  // ── TestSprite Agent ──────────────────────────────────────────────────────
  private async dispatchTestSprite(
    intent: string,
    userText: string,
  ): Promise<MCPDispatchResult> {
    const result = await safeFetch(
      `http://127.0.0.1:${MCP_BRIDGE_PORT}/run/testsprite`,
      { method: "POST" },
      60_000,
    );

    if (result.ok) {
      return {
        success: true,
        agent: "testsprite-agent-mcp",
        intent,
        data: result.body,
        summary: `TestSprite executed. ${result.body?.out ? `Output: ${String(result.body.out).slice(0, 400)}` : "Completed successfully."}`,
      };
    }

    return {
      success: false,
      agent: "testsprite-agent-mcp",
      intent,
      error: result.body || "TestSprite bridge unavailable",
      summary:
        "TestSprite is offline. Make sure the MCP bridge is running on port " +
        MCP_BRIDGE_PORT +
        ".",
    };
  }

  // ── Playwright Agent ──────────────────────────────────────────────────────
  private async dispatchPlaywright(
    intent: string,
    userText: string,
  ): Promise<MCPDispatchResult> {
    const result = await safeFetch(
      `http://127.0.0.1:${MCP_BRIDGE_PORT}/run/playwright`,
      { method: "POST" },
      30_000,
    );

    if (result.ok) {
      return {
        success: true,
        agent: "playwright-agent-mcp",
        intent,
        data: result.body,
        summary: `Browser automation via Playwright is ready. ${result.body?.out ? String(result.body.out).slice(0, 300) : "Connected."}`,
      };
    }

    return {
      success: false,
      agent: "playwright-agent-mcp",
      intent,
      error: result.body || "Playwright bridge unavailable",
      summary:
        "Playwright browser automation is offline. Check MCP bridge status.",
    };
  }

  // ── Stitch Agent (UI Design) ──────────────────────────────────────────────
  private async dispatchStitch(
    intent: string,
    userText: string,
  ): Promise<MCPDispatchResult> {
    const result = await safeFetch(
      `http://127.0.0.1:${MCP_BRIDGE_PORT}/run/stitch`,
      { method: "POST" },
      30_000,
    );

    if (result.ok) {
      return {
        success: true,
        agent: "stitch-agent-mcp",
        intent,
        data: result.body,
        summary: `Stitch design agent activated. ${result.body?.out ? String(result.body.out).slice(0, 300) : "Ready for UI generation."}`,
      };
    }

    return {
      success: false,
      agent: "stitch-agent-mcp",
      intent,
      error: result.body || "Stitch agent unavailable",
      summary:
        "My design agent Stitch is offline. I can still describe the UI architecture for you.",
    };
  }

  // ── Memory Agent (RAG / NotebookLM) ───────────────────────────────────────
  private async dispatchMemory(
    intent: string,
    userText: string,
  ): Promise<MCPDispatchResult> {
    // First: try reading from local memory.json
    if (intent === "recall_memory") {
      try {
        if (fs.existsSync(MEMORY_PATH)) {
          const raw = fs.readFileSync(MEMORY_PATH, "utf-8");
          const memory = JSON.parse(raw);
          const query = userText.toLowerCase();

          // Simple keyword search across memory entries
          const matches: string[] = [];
          for (const [key, value] of Object.entries(memory)) {
            const valStr = JSON.stringify(value).toLowerCase();
            if (
              key.toLowerCase().includes(query) ||
              valStr.includes(query) ||
              query.split(/\s+/).some((w) => w.length > 3 && valStr.includes(w))
            ) {
              matches.push(`${key}: ${JSON.stringify(value).slice(0, 200)}`);
            }
          }

          if (matches.length > 0) {
            return {
              success: true,
              agent: "memory-agent-mcp",
              intent,
              data: matches,
              summary: `Found ${matches.length} memory entries related to your query:\n${matches.slice(0, 5).join("\n")}`,
            };
          }
        }
      } catch (err: any) {
        console.warn(`[mcp-dispatch] Memory read failed: ${err.message}`);
      }
    }

    // Second: try workspace file search (simple RAG)
    if (intent === "recall_memory" || intent === "write_memory") {
      const fileResults = await this.searchWorkspaceFiles(userText);
      if (fileResults.length > 0) {
        const snippets = fileResults
          .slice(0, 5)
          .map((r) => `${r.path}:${r.lineNumber} — ${r.snippet}`)
          .join("\n");
        return {
          success: true,
          agent: "memory-agent-mcp",
          intent,
          data: fileResults,
          summary: `I searched my workspace files and found ${fileResults.length} relevant results:\n${snippets}`,
        };
      }
    }

    // Third: if writing memory, append to memory.json
    if (intent === "write_memory") {
      try {
        let memory: Record<string, any> = {};
        if (fs.existsSync(MEMORY_PATH)) {
          memory = JSON.parse(fs.readFileSync(MEMORY_PATH, "utf-8"));
        }
        const key = `memory_${Date.now()}`;
        memory[key] = {
          text: userText,
          timestamp: new Date().toISOString(),
          source: "conversation",
        };
        fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2));
        return {
          success: true,
          agent: "memory-agent-mcp",
          intent,
          summary: `Stored to memory lake under key "${key}".`,
        };
      } catch (err: any) {
        return {
          success: false,
          agent: "memory-agent-mcp",
          intent,
          error: err.message,
          summary: "Couldn't write to memory lake. Check file permissions.",
        };
      }
    }

    return {
      success: false,
      agent: "memory-agent-mcp",
      intent,
      summary: "No relevant memories found for that query.",
    };
  }

  // ── Desktop Commander ─────────────────────────────────────────────────────
  private async dispatchDesktop(
    intent: string,
    userText: string,
  ): Promise<MCPDispatchResult> {
    // Try the Neural Router first (port 7004)
    const neuralPort = Number(process.env.NEURAL_ROUTER_PORT || 7004);
    const result = await safeFetch(
      `http://127.0.0.1:${neuralPort}/chat`,
      {
        method: "POST",
        body: JSON.stringify({
          prompt: userText,
          handshake: getHandshake(),
          mode: "auto",
          intent: "execute_terminal",
          agent: "desktop-commander-agent-mcp",
        }),
      },
      120_000,
    );

    if (result.ok && result.body?.response) {
      return {
        success: true,
        agent: "desktop-commander-agent-mcp",
        intent,
        data: result.body,
        summary: result.body.response,
      };
    }

    return {
      success: false,
      agent: "desktop-commander-agent-mcp",
      intent,
      error: "Neural Router offline",
      summary:
        "My desktop commander is offline. The Neural Router on port " +
        neuralPort +
        " isn't responding. I can still help you write the commands.",
    };
  }

  // ── Vision Agent ──────────────────────────────────────────────────────────
  private async dispatchVision(
    intent: string,
    userText: string,
  ): Promise<MCPDispatchResult> {
    const visionUrl = process.env.VISION_URL || "http://localhost:6005";
    const result = await safeFetch(`${visionUrl}/analyze`, {}, 15_000);

    if (result.ok) {
      return {
        success: true,
        agent: "vision-agent-mcp",
        intent,
        data: result.body,
        summary: `Visual analysis complete. ${result.body?.caption ? `I see: ${result.body.caption}` : JSON.stringify(result.body).slice(0, 300)}`,
      };
    }

    return {
      success: false,
      agent: "vision-agent-mcp",
      intent,
      error: "Vision agent offline",
      summary: "My vision agent isn't running right now. Start it to enable screen analysis.",
    };
  }

  // ── Generic Dispatch (for agents without custom handlers) ─────────────────
  private async dispatchGeneric(
    agent: string,
    intent: string,
    userText: string,
    description: string,
  ): Promise<MCPDispatchResult> {
    // Try MCP bridge
    const agentSlug = agent.replace(/-agent-mcp$/, "").replace(/-mcp$/, "");
    const result = await safeFetch(
      `http://127.0.0.1:${MCP_BRIDGE_PORT}/run/${agentSlug}`,
      { method: "POST" },
    );

    if (result.ok) {
      return {
        success: true,
        agent,
        intent,
        data: result.body,
        summary: `${description} agent responded. ${typeof result.body === "object" ? JSON.stringify(result.body).slice(0, 400) : String(result.body).slice(0, 400)}`,
      };
    }

    return {
      success: false,
      agent,
      intent,
      error: `${description} agent unavailable`,
      summary: `My ${description} agent is offline. I'll handle this with my reasoning core.`,
    };
  }

  // ── Workspace File Search (Simple RAG) ────────────────────────────────────
  /**
   * Searches workspace files for content relevant to the user's query.
   * This is a simple keyword-based search — not embedding-based — but gives
   * Agent Lee the ability to find and reference his own source files.
   */
  async searchWorkspaceFiles(
    query: string,
    maxResults = 10,
  ): Promise<WorkspaceSearchResult[]> {
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 8);
    if (keywords.length === 0) return [];

    const results: WorkspaceSearchResult[] = [];
    const searchDirs = [
      path.join(WORKSPACE_ROOT, "backend", "src"),
      path.join(WORKSPACE_ROOT, ".Agent_Lee_OS"),
      path.join(WORKSPACE_ROOT, "workspace"),
    ];
    const extensions = new Set([
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".json",
      ".md",
      ".txt",
      ".py",
    ]);

    for (const dir of searchDirs) {
      if (!fs.existsSync(dir)) continue;
      try {
        await this.searchDir(dir, keywords, extensions, results, maxResults, 0);
      } catch {
        // Skip inaccessible directories
      }
      if (results.length >= maxResults) break;
    }

    return results.slice(0, maxResults);
  }

  private async searchDir(
    dirPath: string,
    keywords: string[],
    extensions: Set<string>,
    results: WorkspaceSearchResult[],
    maxResults: number,
    depth: number,
  ): Promise<void> {
    if (depth > 4 || results.length >= maxResults) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxResults) return;
      const fullPath = path.join(dirPath, entry.name);

      // Skip node_modules, dist, .git, etc.
      if (entry.isDirectory()) {
        if (
          ["node_modules", "dist", ".git", ".next", "coverage", "__pycache__"].includes(
            entry.name,
          )
        ) {
          continue;
        }
        await this.searchDir(
          fullPath,
          keywords,
          extensions,
          results,
          maxResults,
          depth + 1,
        );
        continue;
      }

      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!extensions.has(ext)) continue;

      // Read file and search
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        if (content.length > 500_000) continue; // skip very large files
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const lower = lines[i].toLowerCase();
          const matchCount = keywords.filter((k) => lower.includes(k)).length;
          if (matchCount >= Math.min(2, keywords.length)) {
            const relativePath = path.relative(WORKSPACE_ROOT, fullPath);
            results.push({
              path: relativePath,
              snippet: lines[i].trim().slice(0, 200),
              lineNumber: i + 1,
            });
            if (results.length >= maxResults) return;
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  // ── Get available MCP tools ───────────────────────────────────────────────
  /**
   * Returns a summary of what Agent Lee can actually DO via his MCPs.
   * This is injected into the AI context when relevant.
   */
  async getAvailableTools(): Promise<string> {
    let bridgeOnline = false;
    try {
      const health = await safeFetch(
        `http://127.0.0.1:${MCP_BRIDGE_PORT}/health`,
        {},
        3_000,
      );
      bridgeOnline = health.ok;
    } catch {
      /* offline */
    }

    const skillsSummary = await leewaySkillsService.getSummary();
    const leewaySkillsLine = skillsSummary.installed && skillsSummary.enabled
      ? `🧠 Leeway Agent Skills — ${skillsSummary.totalSkills} packaged skills across ${skillsSummary.totalCategories} categories [ONLINE via ${skillsSummary.serverId}]`
      : "🧠 Leeway Agent Skills — package not active [OFFLINE]";

    const tools = [
      "📋 Planner Agent — Break tasks into steps, coordinate multi-step workflows",
      "🧪 TestSprite — Generate and run automated tests" +
        (bridgeOnline ? " [ONLINE]" : " [OFFLINE]"),
      "🌐 Playwright — Browser automation, web scraping, UI testing" +
        (bridgeOnline ? " [ONLINE]" : " [OFFLINE]"),
      "🎨 Stitch — UI component generation and design" +
        (bridgeOnline ? " [ONLINE]" : " [OFFLINE]"),
      "💾 Memory Agent — Search workspace files, read/write persistent memory",
      "🖥️ Desktop Commander — Terminal commands, script execution",
      "👁️ Vision Agent — Screen capture and visual analysis",
      "📱 Mobile Device Agent — Introspect Android, launch apps, manage files",
      "🗣️ Voice Agent — Text-to-speech synthesis",
      "📦 InsForge — Backend deployment, database, storage, edge functions" +
        (bridgeOnline ? " [ONLINE]" : " [OFFLINE]"),
      leewaySkillsLine,
    ];

    return (
      "AVAILABLE MCP TOOLS:\n" +
      tools.map((t) => `  ${t}`).join("\n") +
      `\n  MCP Bridge: ${bridgeOnline ? "ONLINE (port " + MCP_BRIDGE_PORT + ")" : "OFFLINE"}`
    );
  }
}

export const mcpDispatcher = new MCPDispatcherService();

export type McpInput = Record<string, unknown>;

export async function invokeMcpTool(
  serverName: string,
  toolName: string,
  input: McpInput
): Promise<unknown> {
  debugStore.updateMcpInvocation(toolName, input);

  const result = await safeFetch(`http://127.0.0.1:${BACKEND_PORT}/api/mcp/tools/call`, {
    method: "POST",
    body: JSON.stringify({
      serverId: serverName,
      toolName: toolName,
      args: input
    })
  });

  if (!result.ok) {
    throw new Error(`MCP Tool ${toolName} failed: ${JSON.stringify(result.body)}`);
  }

  return result.body;
}
