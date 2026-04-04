/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AGENT.SPLINE
TAG: MCP.AGENT.SPLINE.QWEN

COLOR_ONION_HEX:
NEON=#00E5FF
FLUO=#18FFFF
PASTEL=#E0F7FA

ICON_ASCII:
family=lucide
glyph=cpu

5WH:
WHAT = Qwen local model helper — inference via Ollama API for the Spline 3D agent
WHY = Provides the Spline MCP agent with local Qwen model access for offline 3D generation
WHO = Agent Lee OS — MCP System
WHERE = MCP agents/spline-agent-mcp/lib/qwen-local.ts
WHEN = 2026
HOW = REST calls to local Ollama API for Qwen model inference with streaming response handling

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
PROPRIETARY
*/
import { env } from "../../shared/env.js";

const OLLAMA_URL = "http://localhost:11434/api/generate";

export async function callQwen(model: string, prompt: string): Promise<string> {
  // Try local Ollama first
  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
    });
    if (res.ok) {
      const data = (await res.json()) as { response?: string };
      return data.response ?? "";
    }
  } catch {
    // Ollama not running — fall through to GLM
  }

  // Fallback: GLM-4-Flash via Z.ai
  const apiKey = env("ZAI_API_KEY", "");
  if (!apiKey) return `[SplineAgent] No local Qwen or GLM API key available.`;

  const res = await fetch(
    "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
      }),
    },
  );
  if (!res.ok) throw new Error(`GLM fallback failed: ${res.status}`);
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}
