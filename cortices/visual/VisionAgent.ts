/*
 * Cortex: Visual — VisionAgent (migrated from agents/VisionAgent.ts)
 */

import { slmRouter } from '../../core/SLMRouter';
import { eventBus } from '../../core/EventBus';
import { buildAgentLeeCorePrompt } from '../../core/agent_lee_prompt_assembler';
import LeewayRTCClient from '../../core/LeewayRTCClient';

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
  /**
   * Capture a frame from the LeeWay RTC camera stream and analyse it.
   */
  static async captureFromRTC(): Promise<void> {
    const rtc = LeewayRTCClient.getInstance();
    const stream = rtc.getLocalStream();
    if (!stream || stream.getVideoTracks().length === 0) {
      eventBus.emit('agent:error', { agent: 'Vision', error: 'No RTC video stream available' });
      return;
    }

    try {
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      // ...rest of VisionAgent implementation...
    } catch (err) {
      eventBus.emit('agent:error', { agent: 'Vision', error: err });
    }
  }
}
