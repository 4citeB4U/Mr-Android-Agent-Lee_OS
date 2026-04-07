/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE.INFERENCE.ROUTER
TAG: CORE.INFERENCE.RESPONSE.ROUTER

COLOR_ONION_HEX:
NEON=#6366F1
FLUO=#818CF8
PASTEL=#DDD6FE

ICON_ASCII:
family=lucide
glyph=router

5WH:
WHAT = Agent Lee Response Router — intelligently routes requests through inference tiers
WHY = Minimize latency & cost by using fastest capable inference method
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = core/AgentLeeResponseRouter.ts
WHEN = 2026
HOW = Persona Rules → Qwen Local → Gemini Fallback with automatic tier selection and fallback

AGENTS:
ASSESS
ALIGN

LICENSE:
MIT
*/

import LeewayRTCClient, { RTCState } from './LeewayRTCClient';
import QwenBridge, { QwenStatus } from './QwenBridge';
import { GeminiLiveClient } from './GeminiLiveClient';

export enum InferenceTier {
  PERSONA_RULES = 'persona_rules',
  QWEN_LOCAL = 'qwen_local',
  GEMINI_FALLBACK = 'gemini_fallback',
}

export interface InferenceResult {
  response: string;
  tier: InferenceTier;
  latency: number; // milliseconds
  metadata: {
    model?: string;
    tokenCount?: number;
    confidence?: number;
    diagnostics?: Record<string, any>;
  };
}

/**
 * AgentLeeResponseRouter - Intelligently routes inference through available tiers
 * 
 * Priority:
 * 1. Persona Rules (instant, < 100ms) - for known intents and RTC context
 * 2. Qwen Local (fast, < 2s) - for complex requests when model available
 * 3. Gemini Fallback (slow, < 5s) - when Qwen unavailable, for compatibility
 */
export class AgentLeeResponseRouter {
  private qwenBridge: QwenBridge;
  private geminiClient: GeminiLiveClient;
  private rtcState?: { connectionState: string; iceState: string; peerCount: number };

  constructor(rtcState?: { connectionState: string; iceState: string; peerCount: number }) {
    this.qwenBridge = QwenBridge.getInstance();
    this.geminiClient = new GeminiLiveClient();
    this.rtcState = rtcState;
  }

  /**
   * Route inference request through available tiers
   */
  async generateResponse(input: string): Promise<InferenceResult> {
    const startTime = Date.now();

    try {
      // Tier 1: Persona Rules (instant, always available)
      const personaResponse = this.tryPersonaRules(input);
      if (personaResponse) {
        return {
          response: personaResponse,
          tier: InferenceTier.PERSONA_RULES,
          latency: Date.now() - startTime,
          metadata: { confidence: 0.95 },
        };
      }

      // Tier 2: Phi Local (if available)
      if (this.qwenBridge.getStatus() === QwenStatus.ONLINE) {
        try {
          // Check if the task is complex enough to warrant Gemini "Operations Assistant"
          if (this.isComplexTask(input)) {
            console.log('[Router] Complex task detected, invoking Gemini Operations Assistant');
            const response = await this.invokeGeminiFallback(input);
            return {
              response,
              tier: InferenceTier.GEMINI_FALLBACK,
              latency: Date.now() - startTime,
              metadata: { model: 'gemini-2.0-flash-ops-assistant', confidence: 0.95 },
            };
          }

          const bridge = QwenBridge.getInstance();
          const response = await this.invokeQwen(input);
          return {
            response,
            tier: InferenceTier.QWEN_LOCAL,
            latency: Date.now() - startTime,
            metadata: { model: bridge.getStats().model, confidence: 0.85 },
          };
        } catch (error) {
          console.warn(`[Router] Local model failed, falling back to Gemini Operations Assistant:`, error);
        }
      }

      // Tier 3: Gemini (Complex / Fallback)
      const response = await this.invokeGeminiFallback(input);
      const totalLatency = Date.now() - startTime;
      
      // Inject telemetry for performance audit transparency
      console.log(`[Router] Diagnostics: ${input.slice(0, 20)}... -> Tier: ${InferenceTier.GEMINI_FALLBACK} Latency: ${totalLatency}ms`);
      
      return {
        response,
        tier: InferenceTier.GEMINI_FALLBACK,
        latency: totalLatency,
        metadata: { 
          model: 'gemini-2.0-flash-fallback', 
          confidence: 0.8,
          diagnostics: { latencyMs: totalLatency }
        },
      };
    } catch (error) {
      console.error('[Router] All inference tiers failed:', error);
      return {
        response: "I'm having difficulty processing that request. Please try again.",
        tier: InferenceTier.PERSONA_RULES,
        latency: Date.now() - startTime,
        metadata: { confidence: 0.3 },
      };
    }
  }

  /**
   * Complex Task Detection logic
   */
  private isComplexTask(input: string): boolean {
    const lower = input.toLowerCase();
    const complexKeywords = [
      'analyze', 'calculate', 'summarize this meeting', 'complex', 'mathematics',
      'programming', 'code', 'architect', 'operations assistant', 'heavy computation',
      'reasoning', 'debug', 'solve', 'plan'
    ];
    
    // If input is long (> 100 chars) or contains complex keywords
    return input.length > 150 || complexKeywords.some(kw => lower.includes(kw));
  }


  /**
   * Try fast persona rules first
   * Based on LeeWay-Edge-RTC persona.ts patterns
   */
  private tryPersonaRules(input: string): string | null {
    const lower = input.toLowerCase().trim();

    // Greeting patterns
    if (/\b(hello|hi|hey|what'?s up|howdy|sup)\b/i.test(lower)) {
      return "Agent Lee online. I'm watching your RTC session. Talk to me.";
    }

    // Farewell patterns
    if (/\b(bye|goodbye|see you|later|peace|signing off)\b/i.test(lower)) {
      return "Session ending. Safe travels. Agent Lee standing by.";
    }

    // Connection quality query
    if (/\b(connection|quality|latency|lag|packet loss)\b/i.test(lower)) {
      if (this.rtcState) {
        const qualityMsg = this.getRTCQualityResponse();
        if (qualityMsg) return qualityMsg;
      }
      return "Connection appears nominal. Check the diagnostics panel for detailed metrics.";
    }

    // Peer info query
    if (/\b(peers|who's connected|active users|participants)\b/i.test(lower)) {
      if (this.rtcState?.peerCount !== undefined) {
        return `${this.rtcState.peerCount} peer${this.rtcState.peerCount !== 1 ? 's' : ''} connected. Check the roster below.`;
      }
      return "Peer list is displayed in the diagnostics panel.";
    }

    // Help request
    if (/\b(help|what can you do|capabilities)\b/i.test(lower)) {
      return "I monitor your WebRTC session, manage peer communication, and execute voice commands. Say 'status' for system health.";
    }

    // Status check
    if (/\b(status|how are you|everything okay)\b/i.test(lower)) {
      const statusMsg = this.getSystemStatusResponse();
      if (statusMsg) return statusMsg;
      return "System operational. All agents active and responsive.";
    }

    // Default: no persona rule matched
    return null;
  }

  /**
   * Generate RTC-aware quality response
   */
  private getRTCQualityResponse(): string | null {
    if (!this.rtcState) return null;

    const { connectionState, iceState } = this.rtcState;

    if (connectionState === 'connected' && iceState === 'completed') {
      return "Connection stable. Direct peer-to-peer established. Quality optimal.";
    }

    if (connectionState === 'connected' && iceState !== 'completed') {
      return "Connection in progress. Establishing optimal path. Hang tight.";
    }

    if (connectionState === 'disconnected') {
      return "Connection interrupted. Attempting automatic reconnection.";
    }

    if (connectionState === 'failed') {
      return "Connection failed. Check network and try again.";
    }

    return null;
  }

  /**
   * Generate system status response
   */
  private getSystemStatusResponse(): string {
    const checks: string[] = [];

    // Check services
    const rtcOk = this.rtcState?.connectionState === 'connected';
    checks.push(rtcOk ? '✓ RTC' : '✗ RTC');

    const qwenOk = this.qwenBridge.getStatus() === QwenStatus.ONLINE;
    checks.push(qwenOk ? '✓ Qwen' : '✗ Qwen');

    return `Status: ${checks.join(' | ')}. Systems operational.`;
  }

  /**
   * Invoke local Phi model (lightweight Qwen alternative)
   */
  private async invokeQwen(input: string): Promise<string> {
    const systemPrompt = `You are Agent Lee, a helpful AI assistant managing WebRTC sessions.
Respond concisely (1-3 sentences max).
Be professional and direct.`;

    const response = await this.qwenBridge.generate(input, systemPrompt);
    return response;
  }

  /**
   * Invoke Gemini as fallback
   */
  private async invokeGeminiFallback(input: string): Promise<string> {
    const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';

    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Use lightweight REST API, not Live API (to avoid heavy dependencies)
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: input,
                },
              ],
            },
          ],
          systemInstruction: {
            parts: [
              {
                text: 'You are Agent Lee. Respond concisely (1-3 sentences max). Be professional.',
              },
            ],
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 256,
          },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    return text;
  }

  /**
   * Update RTC context (called from LeewayRTCClient)
   */
  updateRTCContext(rtcState: { connectionState: string; iceState: string; peerCount: number }): void {
    this.rtcState = rtcState;
  }
}

export default AgentLeeResponseRouter;
