/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE.INFERENCE.CLIENT
TAG: CORE.INFERENCE.CLIENT.LOCAL

COLOR_ONION_HEX:
NEON=#00FFD1
FLUO=#00B4FF
PASTEL=#C7F0FF

ICON_ASCII:
family=lucide
glyph=cpu

5WH:
WHAT = LeewayInferenceClient — Local-only inference engine. Routes ALL calls to Ollama. Zero cloud APIs.
WHY = Sovereign, private inference for Agent Lee OS. No external vendor dependencies.
      Created by Leonard Lee / LeeWay Innovations — all inference stays on-device.
WHO = Leonard Lee — LeeWay Innovations
WHERE = core/LeewayInferenceClient.ts
WHEN = 2026

LICENSE:
MIT — LeeWay Industries
*/

// core/LeewayInferenceClient.ts
// LOCAL-ONLY sovereign inference client.
// All calls route to Ollama running on localhost. Zero cloud API calls.

const OLLAMA_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OLLAMA_API_URL)
  ? import.meta.env.VITE_OLLAMA_API_URL
  : 'http://localhost:11434';

const DEFAULT_MODEL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LOCAL_MODEL)
  ? import.meta.env.VITE_LOCAL_MODEL
  : 'gemma4:e2b';

// Agent name registry
export type AgentName =
  | 'AgentLee' | 'Atlas' | 'Nova' | 'Echo' | 'Sage' | 'Shield'
  | 'Pixel' | 'Nexus' | 'Aria' | 'LiveConductor' | 'StreamingSTT'
  | 'StreamingTTS' | 'Vision' | 'Router' | 'SafetyRedaction'
  | 'LilyCortex' | 'GabrielCortex' | 'AdamCortex' | 'ScribeArchive'
  | 'GuardAegis' | 'BugHunterForge' | 'SyntaxForge' | 'BrainSentinel';

export interface LeewayGenerateOptions {
  prompt: string;
  systemPrompt?: string;
  agent?: AgentName | string;
  model?: string;        // accepted for API compat — always overridden by local model
  temperature?: number;
  maxTokens?: number;
}

export interface LeewayGenerateResult {
  text: string;
  model: string;
  latencyMs: number;
}

/**
 * LeewayInferenceClient
 * Sovereign local inference — powered by Ollama.
 * Created by Leonard Lee · LeeWay Innovations · 2026
 */
export class LeewayInferenceClient {
  static async generate(opts: LeewayGenerateOptions): Promise<LeewayGenerateResult> {
    const start = Date.now();
    const model = DEFAULT_MODEL;

    const messages: { role: string; content: string }[] = [];
    if (opts.systemPrompt) {
      messages.push({ role: 'system', content: opts.systemPrompt });
    }
    messages.push({ role: 'user', content: opts.prompt });

    try {
      const res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature: opts.temperature ?? 0.7,
            num_predict: opts.maxTokens ?? 1024,
          },
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!res.ok) {
        throw new Error(`Ollama ${res.status}: ${res.statusText}`);
      }

      const data = await res.json() as { message?: { content?: string } };
      const text = data.message?.content ?? '[No response from local model]';
      return { text, model, latencyMs: Date.now() - start };

    } catch (err) {
      console.warn('[LeewayInferenceClient] Ollama unavailable:', err);
      return {
        text: `[Agent Lee is running offline. Start Ollama at ${OLLAMA_URL} to enable local AI.]`,
        model,
        latencyMs: Date.now() - start,
      };
    }
  }
}

export default LeewayInferenceClient;
