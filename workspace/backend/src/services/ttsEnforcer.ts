/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.TTSENFORCER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ttsEnforcer module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\services\ttsEnforcer.ts
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
 * TTS Enforcer — Agent Lee Voice (Mode-Aware Router)
 *
 * Edge modes   (live, fast, default, reply, chat, command):
 *   Primary: edge-tts CLI (en-US-GuyNeural) → Gemini fallback → TEXT_ONLY
 *
 * Gemini modes (narration, premium, archive, onboarding, ceremony, longform):
 *   Primary: Gemini TTS (gemini-2.5-flash-preview-tts, voice "Charon") → edge-tts fallback → TEXT_ONLY
 *
 * Includes retry logic and robust shell escaping for voice stability.
 * See: VOICE_IDENTITY_POLICY.md, tts-router-spec.md
 */

import { exec } from "child_process";
import { readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

// 4-key rotation — avoids per-key rate limits on Gemini TTS
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter(Boolean) as string[];

let _keyIdx = 0;
function nextGeminiKey(): string | undefined {
  if (GEMINI_KEYS.length === 0) return undefined;
  const key = GEMINI_KEYS[_keyIdx % GEMINI_KEYS.length];
  _keyIdx++;
  return key;
}

export interface TTSResult {
  speak: boolean;
  audioBase64?: string;
  transcript: string;
  voiceState: "GEMINI_TTS" | "GEMINI_NARRATION" | "EDGE_TTS" | "TEXT_ONLY";
  notice?: string;
}

// Mode classification — mirrors VOICE_IDENTITY_POLICY.md
const GEMINI_MODES = new Set([
  "narration",
  "premium",
  "archive",
  "onboarding",
  "ceremony",
  "longform",
]);

function resolveVoiceEngine(mode: string): "gemini" | "edge" {
  return GEMINI_MODES.has((mode || "live").toLowerCase()) ? "gemini" : "edge";
}

/** Helper: sleep for retry backoff */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Gemini TTS with retry ──────────────────────────────────────────────────
async function callGeminiTTS(text: string, retries = 1): Promise<string> {
  const voice = process.env.GEMINI_TTS_VOICE || "Charon";

  for (let attempt = 0; attempt <= retries; attempt++) {
    const apiKey = nextGeminiKey();
    if (!apiKey) throw new Error("No Gemini API keys configured");

    try {
      const body = {
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: { prebuilt_voice_config: { voice_name: voice } },
          },
        },
      };

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(20_000),
        },
      );

      if (resp.status === 429 && attempt < retries) {
        console.warn("[tts] Gemini TTS rate-limited, retrying with next key...");
        await sleep(500);
        continue;
      }

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Gemini TTS HTTP ${resp.status}: ${errText}`);
      }

      const data: any = await resp.json();
      const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!b64) throw new Error("Gemini TTS returned no audio data");
      return b64; // already base64 PCM/wav
    } catch (err: any) {
      if (attempt < retries) {
        console.warn(
          `[tts] Gemini TTS attempt ${attempt + 1} failed: ${err.message}, retrying...`,
        );
        await sleep(500);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Gemini TTS exhausted retries");
}

// ── Edge-TTS with robust shell escaping + retry ────────────────────────────

/** Sanitize text for safe shell injection in edge-tts CLI */
function sanitizeForShell(raw: string): string {
  return (
    raw
      // Remove characters that break shell parsing
      .replace(/[`$\\]/g, "")
      // Escape double quotes
      .replace(/"/g, '\\"')
      // Normalize smart quotes to plain
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      // Remove control characters and non-printable chars
      .replace(/[\x00-\x1F\x7F]/g, " ")
      // Collapse multiple spaces/newlines
      .replace(/\s+/g, " ")
      .trim()
  );
}

async function callEdgeTTS(text: string, retries = 1): Promise<string> {
  const voice = process.env.EDGE_TTS_VOICE || "en-US-GuyNeural";

  for (let attempt = 0; attempt <= retries; attempt++) {
    const outPath = join(tmpdir(), `lee_tts_${Date.now()}_${attempt}.mp3`);
    const safeText = sanitizeForShell(text);
    if (!safeText) throw new Error("Edge-TTS: text empty after sanitization");

    try {
      await execAsync(
        `edge-tts --text "${safeText}" --voice "${voice}" --write-media "${outPath}"`,
        { timeout: 20000 },
      );
      const buf = await readFile(outPath);
      unlink(outPath).catch(() => {}); // best-effort cleanup
      if (buf.length < 100)
        throw new Error("Edge-TTS output too small — likely empty audio");
      return buf.toString("base64");
    } catch (err: any) {
      unlink(outPath).catch(() => {});
      if (attempt < retries) {
        console.warn(
          `[tts] Edge-TTS attempt ${attempt + 1} failed: ${err.message}, retrying...`,
        );
        await sleep(600);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Edge-TTS exhausted retries");
}

/**
 * Sovereign TTS: routes by mode.
 *   Edge modes   → edge-tts primary, Gemini fallback
 *   Gemini modes → Gemini TTS primary, edge-tts fallback
 */
export async function agentLeeRespond(
  text: string,
  handshake?: string,
  mode: string = "live",
): Promise<TTSResult> {
  if (handshake && handshake !== process.env.NEURAL_HANDSHAKE) {
    throw new Error("Unauthorized: Sovereign Handshake Failed.");
  }

  // Strip markdown formatting before speaking
  const spokenText = text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const engine = resolveVoiceEngine(mode);

  // ── Gemini modes: narration / premium / ceremony / etc. ───────────────────
  if (engine === "gemini") {
    try {
      const audioBase64 = await callGeminiTTS(spokenText);
      return {
        speak: true,
        audioBase64,
        transcript: text,
        voiceState: "GEMINI_NARRATION",
      };
    } catch (err: any) {
      console.warn(
        `[tts] Gemini TTS failed for mode=${mode}, trying edge-tts:`,
        err?.message,
      );
    }

    // Emergency fallback: edge-tts even for narration mode
    try {
      const audioBase64 = await callEdgeTTS(spokenText);
      return {
        speak: true,
        audioBase64,
        transcript: text,
        voiceState: "EDGE_TTS",
        notice: `Gemini TTS unavailable for mode=${mode} — using Edge-TTS fallback`,
      };
    } catch (err: any) {
      console.warn(
        "[tts] Edge-TTS also failed, returning TEXT_ONLY:",
        err?.message,
      );
    }

    return {
      speak: false,
      transcript: text,
      voiceState: "TEXT_ONLY",
      notice: "All TTS engines unavailable. Transcript only.",
    };
  }

  // ── Edge modes: live / fast / chat / command (default) ────────────────────
  try {
    const audioBase64 = await callEdgeTTS(spokenText);
    return {
      speak: true,
      audioBase64,
      transcript: text,
      voiceState: "EDGE_TTS",
    };
  } catch (err: any) {
    console.warn(
      "[tts] Edge-TTS failed, trying Gemini TTS fallback:",
      err?.message,
    );
  }

  // Gemini fallback for live mode (edge was down)
  try {
    const audioBase64 = await callGeminiTTS(spokenText);
    return {
      speak: true,
      audioBase64,
      transcript: text,
      voiceState: "GEMINI_TTS",
      notice: "Edge-TTS unavailable — using Gemini TTS fallback",
    };
  } catch (err: any) {
    console.warn("[tts] Gemini TTS fallback also failed:", err?.message);
  }

  return {
    speak: false,
    transcript: text,
    voiceState: "TEXT_ONLY",
    notice: "All TTS engines unavailable. Transcript only.",
  };
}
