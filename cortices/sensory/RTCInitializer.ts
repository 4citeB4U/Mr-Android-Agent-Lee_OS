/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORTEX.SENSORY.RTC.INITIALIZATION
TAG: CORTEX.SENSORY.RTC.STARTUP

COLOR_ONION_HEX:
NEON=#00FFD1
FLUO=#00B4FF
PASTEL=#C7F0FF

ICON_ASCII:
family=lucide
glyph=radio

5WH:
WHAT = RTC Initializer — Ensures Agent Lee is always connected for voice AND vision
WHY = Central startup routine for full multimedia connectivity; voice commands + visual context
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = cortices/sensory/RTCInitializer.ts
WHEN = 2026-04-10 (Revised)

AGENTS:
ARIA (Voice Coordinator)
OBSERVER (Vision AI)
NEXUS (Orchestration)

LICENSE:
MIT
*/

import LeewayRTCClient from '../../core/LeewayRTCClient';
import { eventBus } from '../../core/EventBus';

export interface RTCConfig {
  apiKey: string;
  wsUrl: string;
  httpUrl: string;
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectDelayMs: number;
  enableVoice: boolean;
  enableVision: boolean;
  enableVideo: boolean;
}

/**
 * Loads default configuration from environment variables
 */
export function getDefaultRTCConfig(): RTCConfig {
  return {
    apiKey: (import.meta.env.VITE_API_KEY as string) || '',
    wsUrl: (import.meta.env.VITE_VOICE_WS_URL as string) || 'ws://localhost:3000/ws',
    httpUrl: (import.meta.env.VITE_RTC_HTTP_URL as string) || 'http://localhost:3000',
    autoReconnect: import.meta.env.VITE_RTC_AUTO_RECONNECT === 'true',
    maxReconnectAttempts: parseInt(import.meta.env.VITE_RTC_RECONNECT_MAX_ATTEMPTS as string) || 10,
    reconnectDelayMs: parseInt(import.meta.env.VITE_RTC_RECONNECT_DELAY_MS as string) || 1000,
    enableVoice: (import.meta.env.VITE_VOICE_ENABLED as string) !== 'false',
    enableVision: (import.meta.env.VITE_VISION_ENABLED as string) !== 'false',
    enableVideo: (import.meta.env.VITE_VIDEO_ENABLED as string) !== 'false',
  };
}

/**
 * Factory function for creating/retrieving the RTCInitializer singleton
 */
export function createRTCInitializer(config?: RTCConfig): RTCInitializer {
  return RTCInitializer.getInstance(config || getDefaultRTCConfig());
}

/**
 * RTCInitializer — Orchestrates the startup of voice and vision systems
 */
export class RTCInitializer {
  private static instance: RTCInitializer | null = null;
  private rtcClient: LeewayRTCClient;
  private config: RTCConfig;
  private isInitialized = false;

  private constructor(config: RTCConfig) {
    this.config = config;
    this.rtcClient = LeewayRTCClient.getInstance(config.wsUrl);
  }

  /**
   * Singleton accessor
   */
  static getInstance(config?: RTCConfig): RTCInitializer {
    if (!RTCInitializer.instance) {
      if (!config) {
        throw new Error('[RTCInitializer] Config required on first instantiation');
      }
      RTCInitializer.instance = new RTCInitializer(config);
    }
    return RTCInitializer.instance;
  }

  /**
   * Core initialization logic
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[RTCInitializer] Initializing Agent Lee RTC system...');
    
    try {
      // 1. Connect to LeeWay RTC SFU
      await this.rtcClient.connect((state) => {
        console.log(`[RTCInitializer] RTC State change: ${state}`);
        eventBus.emit('rtc:state-change', { state });
      });

      // 2. Publish media (microphone/camera) if enabled
      if (this.config.enableVoice || this.config.enableVision) {
        console.log('[RTCInitializer] Requesting media permissions...');
        await this.rtcClient.publish(this.config.enableVideo);
        
        if (this.config.enableVoice) {
          console.log('[RTCInitializer] Starting voice listener...');
          await this.rtcClient.startListening();
          eventBus.emit('rtc:voice-ready');
        }

        if (this.config.enableVision) {
          console.log('[RTCInitializer] Vision system ready.');
          eventBus.emit('rtc:vision-ready');
        }
      }

      this.isInitialized = true;
      console.log('[RTCInitializer] ✅ System fully initialized');
      eventBus.emit('app:rtc-ready', { timestamp: Date.now() });
    } catch (error) {
      console.error('[RTCInitializer] Initialization failed:', error);
      eventBus.emit('app:rtc-error', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Accessor for the underlying RTC client
   */
  getRTCClient(): LeewayRTCClient {
    return this.rtcClient;
  }

  /**
   * Status check
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}
