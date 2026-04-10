/*
 * AGENT LEE COLLECTIVE RUNTIME — SOVEREIGN SYNTHESIS LAYER
 * Phase 3: Sensory Synchronization — PerceptionBuffer & Synthesis
 */
import { PerceptionBus, PerceptionEvent } from './PerceptionBus';

// Sliding window buffer for last N ms of events
class PerceptionBuffer {
  private voiceBuffer: PerceptionEvent[] = [];
  private visionBuffer: PerceptionEvent[] = [];
  private windowMs: number;

  constructor(windowMs = 5000) {
    this.windowMs = windowMs;
  }

  add(event: PerceptionEvent) {
    const now = Date.now();
    if (event.type === 'voice') {
      this.voiceBuffer.push(event);
      this.voiceBuffer = this.voiceBuffer.filter(e => now - e.timestamp <= this.windowMs);
    } else if (event.type === 'vision') {
      this.visionBuffer.push(event);
      this.visionBuffer = this.visionBuffer.filter(e => now - e.timestamp <= this.windowMs);
    }
  }

  getRecentVoice() {
    return this.voiceBuffer;
  }
  getRecentVision() {
    return this.visionBuffer;
  }

  synthesizeIntent(onSynthesis: (intent: string, context: any) => void) {
    // Called on every VOICE_PACKET
    const lastVoice = this.voiceBuffer[this.voiceBuffer.length - 1];
    const recentVision = this.visionBuffer.filter(e => e.timestamp >= (lastVoice?.timestamp || 0) - this.windowMs);
    // Example synthesis logic
    if (lastVoice && recentVision.length) {
      let transcript = '';
      if (lastVoice.payload && (lastVoice.payload as any).kind === 'voice') {
        transcript = ((lastVoice.payload as import('./PerceptionBus').VoicePayload).transcript || '').toLowerCase();
      }
      const visionDesc = recentVision.map(v => {
        if (v.payload && (v.payload as any).kind === 'vision') {
          return (v.payload as import('./PerceptionBus').VisionPayload).sceneDescription || '';
        }
        return '';
      }).join(' ');
      if (transcript.includes('fix') && visionDesc.includes('error')) {
        onSynthesis('BUILD_CORTEX_REPAIR', { transcript, visionDesc });
        return 'BUILD_CORTEX_REPAIR';
      }
    }
    // Default: fallback
    onSynthesis('DEFAULT', {});
    return 'DEFAULT';
  }
}

// Sovereign Interpreter
export class SovereignInterpreter {
  private buffer = new PerceptionBuffer();
  private bus = PerceptionBus.getInstance();

  constructor() {
    this.bus.subscribe('voice', (event) => {
      this.buffer.add(event);
      this.buffer.synthesizeIntent((intent, ctx) => {
        console.log(`[Sovereign] Multimodal synthesis:`, intent, ctx);
        if (intent === 'BUILD_CORTEX_REPAIR') {
          // Route to Build Cortex, etc.
          console.log('[Sovereign] Multimodal synthesis successful. Routing to Build Cortex.');
        }
      });
    });
    this.bus.subscribe('vision', (event) => {
      this.buffer.add(event);
    });
  }
}

// Boot Sovereign Interpreter
export const sovereign = new SovereignInterpreter();
