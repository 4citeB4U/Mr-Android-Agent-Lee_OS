/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AGENT.STITCH
TAG: MCP.AGENT.STITCH.SERVER

COLOR_ONION_HEX:
NEON=#E040FB
FLUO=#EA80FC
PASTEL=#F3E5F5

ICON_ASCII:
family=lucide
glyph=layout

5WH:
WHAT = Stitch MCP agent server — UI generation and design refinement via Stitch + Gemini
WHY = Provides Agent Lee with automated UI scaffolding and visual design capabilities
WHO = Agent Lee OS — MCP System
WHERE = MCP agents/stitch-agent-mcp/index.ts
WHEN = 2026
HOW = MCP SDK server exposing UI generation tools over SSE transport using Gemini API

AGENTS:
ASSESS
ALIGN
AUDIT
PIXEL

LICENSE:
PROPRIETARY
*/
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { env } from "../shared/env";
import { callGemini } from "./lib/gemini";

const TOOLS = [
  {
    name: "generate_component",
    description: "Generate a React component from a description.",
    inputSchema: { type: "object" },
  },
  {
    name: "refine_layout",
    description: "Refine an existing component given improvement notes.",
    inputSchema: { type: "object" },
  },
  {
    name: "draft_screen",
    description: "Draft a full screen layout for a given page purpose.",
    inputSchema: { type: "object" },
  },
  {
    name: "map_ui_flow",
    description: "Map navigation flow between screens for a feature.",
    inputSchema: { type: "object" },
  },
  {
    name: "propose_design_patch",
    description: "Propose a targeted UI fix given complaint + screenshot.",
    inputSchema: { type: "object" },
  },
];

const server = new Server(
  { name: "stitch-agent-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const args = (req.params.arguments ?? {}) as Record<string, unknown>;
  let prompt: string;

  switch (req.params.name) {
    case "generate_component":
      prompt = `Generate a clean, accessible ${args["framework"] ?? "React"} component for: "${args["description"]}". ${args["style_guide"] ? `Style guide: ${args["style_guide"]}` : ""} Return only the component code.`;
      break;
    case "refine_layout":
      prompt = `Refine this UI component based on the following notes.\n\nNotes: ${args["notes"]}\n\nOriginal:\n\`\`\`tsx\n${args["component_code"]}\n\`\`\`\n\nReturn only the improved code.`;
      break;
    case "draft_screen":
      prompt = `Draft a full ${args["framework"] ?? "React"} screen layout for "${args["screen_name"]}" whose purpose is: "${args["purpose"]}". Sections: ${JSON.stringify(args["sections"] ?? [])}. Return JSX only.`;
      break;
    case "map_ui_flow":
      prompt = `Map the navigation flow for feature "${args["feature"]}" across these screens: ${JSON.stringify(args["screens"] ?? [])}. Return a Mermaid flowchart diagram.`;
      break;
    case "propose_design_patch":
      prompt = `The user reports: "${args["complaint"]}". Analyze the attached screenshot and propose a minimal targeted CSS/JSX patch to fix this issue. Return only the patch code.`;
      break;
    default:
      throw new Error(`Unknown tool: ${req.params.name}`);
  }

  const result = await callGemini(
    prompt,
    args["screenshot_base64"] as string | undefined,
  );
  return { content: [{ type: "text", text: result }] };
});

const app = express();
const PORT = Number(process.env.MCP_AGENT_HTTP_PORT) || 3102;
const HOST = process.env.MCP_AGENT_HTTP_HOST || "127.0.0.1";

let transport: SSEServerTransport;

async function connectSse(res: express.Response) {
  console.log("StitchAgent: SSE connection established");
  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
}

app.get("/sse", async (req, res) => {
  await connectSse(res);
});

app.get("/message", async (req, res) => {
  await connectSse(res);
});

app.post("/message", async (req, res) => {
  if (!transport) {
    res.status(400).send("No active SSE connection");
    return;
  }
  console.log("StitchAgent: Received message");
  await transport.handlePostMessage(req, res);
});

app.get("/", (req, res) => {
  res.json({ status: "healthy", agent: "stitch-agent-mcp" });
});

app.listen(PORT, HOST, () => {
  console.log(`startup\ntransport_ready\nhealth_ready`);
});
