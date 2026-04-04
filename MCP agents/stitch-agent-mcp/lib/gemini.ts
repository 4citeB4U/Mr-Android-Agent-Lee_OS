/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AGENT.STITCH
TAG: MCP.AGENT.STITCH.GEMINI

COLOR_ONION_HEX:
NEON=#E040FB
FLUO=#EA80FC
PASTEL=#F3E5F5

ICON_ASCII:
family=lucide
glyph=sparkles

5WH:
WHAT = Gemini API helper — text and optional image input caller for the Stitch agent
WHY = Provides the Stitch MCP agent with Gemini model integration for UI generation prompts
WHO = Agent Lee OS — MCP System
WHERE = MCP agents/stitch-agent-mcp/lib/gemini.ts
WHEN = 2026
HOW = REST API call to a configurable Gemini model (default gemini-2.0-flash) with text + optional base64 image payload

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
PROPRIETARY
*/
import { env } from "../../shared/env.js";

const GEMINI_MODEL = env("GEMINI_STITCH_MODEL", "gemini-2.0-flash");
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function callGemini(
  prompt: string,
  imageBase64?: string,
): Promise<string> {
  const apiKey = env("GEMINI_API_KEY", "");
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const parts: unknown[] = imageBase64
    ? [
        { inlineData: { mimeType: "image/png", data: imageBase64 } },
        { text: prompt },
      ]
    : [{ text: prompt }];

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }] }),
  });

  if (!res.ok)
    throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
