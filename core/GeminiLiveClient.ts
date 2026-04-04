/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.CORE.LIVE
TAG: AI.ORCHESTRATION.CORE.GEMINICLIENT.LIVE

COLOR_ONION_HEX:
NEON=#4285F4
FLUO=#5A9AF5
PASTEL=#BFDBFE

ICON_ASCII:
family=lucide
glyph=radio

5WH:
WHAT = Gemini Live bidirectional audio/text client using @google/genai SDK
WHY = Enables real-time bidirectional audio conversations with Gemini — missing from raw fetch GeminiClient
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = core/GeminiLiveClient.ts
WHEN = 2026
HOW = Wraps GoogleGenAI Live API (WebSocket-based) for streaming audio input/output sessions

AGENTS:
ASSESS
AUDIT
GEMINI
ECHO

LICENSE:
MIT
*/

// core/GeminiLiveClient.ts
// Gemini Live API — bidirectional streaming (text + audio) via @google/genai SDK.
// Requires GEMINI_API_KEY in env (MCP side) or uses the session OAuth token (browser side).
// NOTE: The Live API uses API key auth only (not OAuth Bearer). Wire to a backend proxy
//       that validates the user's Firebase idToken before forwarding to the Live endpoint.

import { GoogleGenAI, Modality } from '@google/genai';

export type LiveRole = 'user' | 'model';

export interface LiveMessage {
  role: LiveRole;
  text?: string;
  audioBase64?: string;
}

export interface GeminiLiveSessionConfig {
  model?: string;
  systemPrompt?: string;
  onMessage?: (msg: LiveMessage) => void;
  onError?: (err: Error) => void;
  onClose?: () => void;
}

export class GeminiLiveClient {
  private session: Awaited<ReturnType<InstanceType<typeof GoogleGenAI>['live']['connect']>> | null = null;
  private client: GoogleGenAI | null = null;
  private config: GeminiLiveSessionConfig = {};

  /** Connect to Gemini Live. apiKey must come from a trusted backend — never expose raw keys client-side. */
  async connect(apiKey: string, config: GeminiLiveSessionConfig = {}): Promise<void> {
    this.config = config;
    this.client = new GoogleGenAI({ apiKey });

    const model = config.model ?? 'gemini-2.0-flash-live-001';

    this.session = await this.client.live.connect({
      model,
      callbacks: {
        onopen: () => {
          // Session open — send system prompt if provided
          if (config.systemPrompt && this.session) {
            this.session.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: config.systemPrompt }] }],
              turnComplete: true,
            });
          }
        },
        onmessage: (message) => {
          const part = message?.serverContent?.modelTurn?.parts?.[0];
          if (!part) return;
          const liveMsg: LiveMessage = { role: 'model' };
          if (part.text) liveMsg.text = part.text;
          if ((part as { inlineData?: { data?: string } }).inlineData?.data) {
            liveMsg.audioBase64 = (part as { inlineData?: { data?: string } }).inlineData!.data;
          }
          config.onMessage?.(liveMsg);
        },
        onerror: (e) => {
          config.onError?.(e instanceof Error ? e : new Error(String(e)));
        },
        onclose: () => {
          this.session = null;
          config.onClose?.();
        },
      },
      config: {
        responseModalities: [Modality.TEXT],
        ...(config.systemPrompt
          ? { systemInstruction: { parts: [{ text: config.systemPrompt }] } }
          : {}),
      },
    });
  }

  /** Send a text turn to Gemini Live. */
  sendText(text: string): void {
    if (!this.session) throw new Error('GeminiLiveClient: not connected');
    this.session.sendClientContent({
      turns: [{ role: 'user', parts: [{ text }] }],
      turnComplete: true,
    });
  }

  /** Send raw PCM audio chunk (base64-encoded) to Gemini Live. */
  sendAudioChunk(base64Pcm: string, mimeType = 'audio/pcm;rate=16000'): void {
    if (!this.session) throw new Error('GeminiLiveClient: not connected');
    this.session.sendRealtimeInput({
      audio: { data: base64Pcm, mimeType },
    });
  }

  /** Gracefully close the Live session. */
  disconnect(): void {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
  }

  get isConnected(): boolean {
    return this.session !== null;
  }
}

// Singleton export — one live session at a time per tab
export const geminiLiveClient = new GeminiLiveClient();
