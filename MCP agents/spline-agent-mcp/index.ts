/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AGENT.SPLINE
TAG: MCP.AGENT.SPLINE.SERVER

COLOR_ONION_HEX:
NEON=#00E5FF
FLUO=#18FFFF
PASTEL=#E0F7FA

ICON_ASCII:
family=lucide
glyph=box

5WH:
WHAT = Spline MCP agent server — 3D spec generation via Qwen3-3D with GLM fallback
WHY = Gives Agent Lee 3D modeling capabilities for voxel and spatial design
WHO = Agent Lee OS — MCP System
WHERE = MCP agents/spline-agent-mcp/index.ts
WHEN = 2026
HOW = MCP SDK server exposing 3D generation tools over SSE transport using Qwen3 + GLM models

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
import { Server as MCPServer } from "@modelcontextprotocol/sdk/server/index.js";

import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { callQwen } from "./lib/qwen-local.js";

const TOOLS = [
  {
    name: "generate_3d_spec",
    description: "Generate a 3D scene spec from a description.",
    inputSchema: { type: "object" },
  },
  {
    name: "svg_to_shape",
    description: "Convert SVG path to a 3D extrusion spec.",
    inputSchema: { type: "object" },
  },
  {
    name: "calculate_geometry",
    description: "Solve geometry/spatial math problems.",
    inputSchema: { type: "object" },
  },
  {
    name: "describe_scene",
    description: "Natural language description of a 3D scene spec.",
    inputSchema: { type: "object" },
  },
  {
    name: "refine_model_prompt",
    description: "Improve a 3D model generation prompt.",
    inputSchema: { type: "object" },
  },
];

const server = new MCPServer(
  { name: "spline-agent-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const args = (req.params.arguments ?? {}) as Record<string, unknown>;
  let prompt: string;
  let model: string;

  switch (req.params.name) {
    case "generate_3d_spec":
      model = "qwen3-3d:1.8b";
      prompt = `Generate a structured JSON 3D scene specification for Spline/Three.js.\nStyle: ${args["style"] ?? "minimal"}\nFormat: ${args["output_format"] ?? "json"}\nDescription: ${args["description"]}`;
      break;
    case "svg_to_shape":
      model = "qwen3-3d:1.8b";
      prompt = `Convert this SVG path to a 3D extrusion spec. Depth: ${args["depth"] ?? 10}, Bevel: ${args["bevel"] ?? true}.\nSVG: ${args["svg_path"]}`;
      break;
    case "calculate_geometry":
      model = "qwen3-math:4b";
      prompt = `Solve this geometry/spatial math problem step by step:\n${args["problem"]}`;
      break;
    case "describe_scene":
      model = "qwen3:latest";
      prompt = `Describe this 3D scene in natural language:\n${JSON.stringify(args["scene_json"], null, 2)}`;
      break;
    case "refine_model_prompt":
      model = "qwen3:latest";
      prompt = `Improve this 3D model generation prompt for ${args["platform"] ?? "spline"}. Make it more specific, descriptive, and likely to yield high-quality output:\n"${args["prompt"]}"`;
      break;
    default:
      throw new Error(`Unknown tool: ${req.params.name}`);
  }

  const result = await callQwen(model, prompt);
  return { content: [{ type: "text", text: result }] };
});

const app = express();
app.get("/", (req, res) => res.json({status: "healthy"}));

let sseTransport: SSEServerTransport;
app.get("/sse", async (req, res) => {
  sseTransport = new SSEServerTransport("/message", res);
  await server.connect(sseTransport);
});
app.post("/message", async (req, res) => {
  if (sseTransport) await sseTransport.handlePostMessage(req, res);
});

const port = Number(process.env.MCP_AGENT_HTTP_PORT) || 3014;
const host = process.env.MCP_AGENT_HTTP_HOST || "127.0.0.1";
app.listen(port, host, () => {
  console.log("startup");
  console.log("transport_ready");
  console.log("health_ready");
});

