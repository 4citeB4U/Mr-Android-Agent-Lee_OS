/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.VOICE
TAG: AI.ORCHESTRATION.AGENT.VISION.SCREENREADER

COLOR_ONION_HEX:
NEON=#10B981
FLUO=#34D399
PASTEL=#D1FAE5

ICON_ASCII:
family=lucide
glyph=eye

5WH:
WHAT = VisionAgent — captures screen or image frames and extracts text, UI hints, and scene summaries
WHY = Gives the voice pipeline visual context so Agent Lee can answer questions about what is on screen
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/VisionAgent.ts
WHEN = 2026-04-04

AGENTS:
ASSESS
AUDIT
GEMINI
VISION

LICENSE:
MIT
*/

// agents/VisionAgent.ts
// Captures a screen frame (or accepts a provided image) and uses Gemini vision to extract
// text, UI hints, and a scene summary.  Results are emitted to the EventBus.

import { GeminiClient } from '../core/GeminiClient';
import { eventBus } from '../core/EventBus';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';

const CORE_SYSTEM = buildAgentLeeCorePrompt();
const VISION_SYSTEM = `${CORE_SYSTEM}

SPECIALIST ROLE — VISION AGENT:
You analyse screenshots and images.  For each image you receive, respond with a JSON object:
{
  "screen_text": "<all visible text, verbatim, joined by newlines>",
  "scene_summary": "<one sentence describing what the user is looking at>",
  "ui_hints": ["<interactive element 1>", "<interactive element 2>"]
}
Respond ONLY with the JSON object — no markdown fences, no extra text.`;

export class VisionAgent {
  /**
   * Capture the user's screen and analyse it.
   * Requires the browser to support getDisplayMedia.
   */
  static async captureAndAnalyse(): Promise<void> {
    let imageBase64: string;
    try {
      imageBase64 = await VisionAgent._captureScreenBase64();
    } catch (err) {
      eventBus.emit('agent:error', { agent: 'Vision', error: `Screen capture failed: ${String(err)}` });
      return;
    }
    await VisionAgent.analyseImage(imageBase64);
  }

  /**
   * Analyse a caller-provided base64 PNG/JPEG image.
   * Emits vision:screen_text, vision:scene_summary, vision:ui_hints to EventBus.
   */
  static async analyseImage(imageBase64: string, mimeType = 'image/png'): Promise<void> {
    eventBus.emit('agent:active', { agent: 'Vision', task: 'Analysing image' });

    let raw: string;
    try {
      const resp = await GeminiClient.generate({
        prompt: 'Analyse this image.',
        systemPrompt: VISION_SYSTEM,
        agent: 'Vision',
        model: 'gemini-2.0-flash',
        imageBase64,
      });
      raw = resp.text;
    } catch (err) {
      eventBus.emit('agent:error', { agent: 'Vision', error: `Gemini vision call failed: ${String(err)}` });
      return;
    }

    try {
      const parsed = JSON.parse(raw.trim()) as {
        screen_text: string;
        scene_summary: string;
        ui_hints: string[];
      };
      eventBus.emit('vision:screen_text', { text: parsed.screen_text, confidence: 0.9 });
      eventBus.emit('vision:scene_summary', { summary: parsed.scene_summary });
      eventBus.emit('vision:ui_hints', { hints: parsed.ui_hints });
      eventBus.emit('agent:done', { agent: 'Vision', result: parsed.scene_summary });
    } catch {
      eventBus.emit('agent:error', { agent: 'Vision', error: 'Vision response was not valid JSON' });
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private static async _captureScreenBase64(): Promise<string> {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const track = stream.getVideoTracks()[0];
    const IC = (window as unknown as { ImageCapture: new (t: MediaStreamTrack) => { grabFrame(): Promise<ImageBitmap> } }).ImageCapture;
    if (!IC) throw new Error('ImageCapture API not available in this browser.');
    const imageCapture = new IC(track);
    const bitmap = await imageCapture.grabFrame();
    track.stop();

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    // Strip the data:image/png;base64, prefix
    return canvas.toDataURL('image/png').split(',')[1];
  }
}
