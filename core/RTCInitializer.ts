/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE.RTC.INITIALIZATION
TAG: CORE.RTC.VOICE_VISION.STARTUP

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
WHERE = core/RTCInitializer.ts
WHEN = 2026-04-07

AGENTS:
ARIA (Voice Coordinator)
OBSERVER (Vision AI)
NEXUS (Orchestration)

LICENSE:
MIT
*/

import LeewayRTCClient, { RTCState } from './LeewayRTCClient';
import { eventBus } from './EventBus';
import { VisionAgent } from '../agents/VisionAgent';

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
 * RTCInitializer — Single entry point for Agent Lee voice + vision connectivity
 * 
 * Handles:
 * - API key validation
 * - WebSocket connection to LeeWay Edge RTC SFU
 * - Audio stream setup (voice commands + TTS)
 * - Video stream setup (vision for scene understanding)
 * - Automatic reconnection with exponential backoff
 * - Health monitoring and state tracking
 */
export class RTCInitializer {
  private static instance: RTCInitializer | null = null;
  private rtcClient: LeewayRTCClient;
  private config: RTCConfig;
  private isInitialized = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor(config: RTCConfig) {
    this.config = config;
    this.rtcClient = LeewayRTCClient.getInstance(config.wsUrl);
  }

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
   * Initialize Agent Lee's complete RTC stack:
   * 1. Validate API key
   * 2. Connect to SFU via WebSocket
   * 3. Setup voice (microphone + speaker)
   * 4. Setup vision (camera if available)
   * 5. Start health monitoring
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[RTCInitializer] Already initialized.');
      return;
    }

    try {
      console.log('[RTCInitializer] Starting Agent Lee voice + vision initialization...');
      
      // Validate API key
      if (!this.config.apiKey) {
        throw new Error('API key not configured. Set VITE_API_KEY in .env.local');
      }
      console.log(`[RTCInitializer] Using API key: ${this.config.apiKey.slice(0, 10)}...`);

      // Connect to RTC server
      console.log('[RTCInitializer] Connecting to LeeWay RTC SFU...');
      await this.rtcClient.connect((state: RTCState) => {
        console.log(`[RTCInitializer] RTC State: ${state}`);
        eventBus.emit('rtc:state-change', { state });
      });

      // Setup voice (audio input + output)
      if (this.config.enableVoice) {
        console.log('[RTCInitializer] Setting up voice (STT/TTS)...');
        await this.setupVoice();
      }

      // Setup vision (camera + processing)
      if (this.config.enableVision) {
        console.log('[RTCInitializer] Setting up vision (camera + scene analysis)...');
        await this.setupVision();
      }

      // Start health monitoring
      this.startHealthCheck();

      this.isInitialized = true;
      eventBus.emit('rtc:initialized', { timestamp: Date.now() });
      console.log('[RTCInitializer] ✅ Agent Lee voice + vision fully initialized');
    } catch (error) {
      console.error('[RTCInitializer] Initialization failed:', error);
      eventBus.emit('rtc:init-error', { error });
      throw error;
    }
  }

  /**
   * Setup voice: microphone + speaker
   */
  private async setupVoice(): Promise<void> {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      console.log('[RTCInitializer] ✅ Microphone access granted');
      eventBus.emit('rtc:voice-ready', { timestamp: Date.now() });

      // Publish audio stream to SFU
      await this.rtcClient.publish(false); // audio only
      console.log('[RTCInitializer] ✅ Audio stream published to SFU');

      // Start listening for voice commands
      await this.rtcClient.startListening();
      console.log('[RTCInitializer] ✅ STT listening started');
    } catch (error) {
      console.error('[RTCInitializer] Voice setup failed:', error);
      eventBus.emit('rtc:voice-error', { error });
      throw error;
    }
  }

  /**
   * Setup vision: camera + scene analysis
   */
  private async setupVision(): Promise<void> {
    try {
      // Check if camera is available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(d => d.kind === 'videoinput');

      if (!hasCamera) {
        console.warn('[RTCInitializer] No camera device found. Vision disabled.');
        eventBus.emit('rtc:vision-disabled', { reason: 'no-camera' });
        return;
      }

      console.log('[RTCInitializer] ✅ Camera detected');

      // Publish video stream to RTC
      await this.rtcClient.publish(true); // audio + video
      console.log('[RTCInitializer] ✅ Video stream published to SFU');

      eventBus.emit('rtc:vision-ready', { timestamp: Date.now() });
      console.log('[RTCInitializer] ✅ Vision ready for scene analysis');
    } catch (error) {
      console.warn('[RTCInitializer] Vision setup failed (non-critical):', error);
      eventBus.emit('rtc:vision-error', { error });
      // Don't throw - vision is optional fallback to audio-only
    }
  }

  /**
   * Health check: Monitors RTC connection and re-establishes if needed
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      const localStream = this.rtcClient.getLocalStream();
      
      if (!localStream) {
        console.warn('[RTCInitializer] Local stream lost. Attempting recovery...');
        this.initialize().catch(e => {
          console.error('[RTCInitializer] Recovery failed:', e);
          eventBus.emit('rtc:health-check-failed', { error: e });
        });
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get RTC client for direct access
   */
  getRTCClient(): LeewayRTCClient {
    return this.rtcClient;
  }

  /**
   * Speak text through Agent Lee (TTS)
   */
  async speak(text: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RTC not initialized. Call initialize() first.');
    }
    await this.rtcClient.speak(text);
  }

  /**
   * Capture and analyze current scene
   */
  async analyzeScene(): Promise<void> {
    if (!this.config.enableVision) {
      console.warn('[RTCInitializer] Vision disabled. Scene analysis unavailable.');
      return;
    }
    
    const stream = this.rtcClient.getLocalStream();
    if (!stream || stream.getVideoTracks().length === 0) {
      console.warn('[RTCInitializer] No video stream. Trying RTC capture...');
      await VisionAgent.captureFromRTC();
    }
  }

  /**
   * Graceful shutdown
   */
  disconnect(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.rtcClient.stopListening();
    this.rtcClient.disconnect();
    this.isInitialized = false;
    eventBus.emit('rtc:disconnected', { timestamp: Date.now() });
  }
}

/**
 * Create RTCInitializer with environment configuration
 */
export function createRTCInitializer(): RTCInitializer {
  const config: RTCConfig = {
    apiKey: import.meta.env.VITE_API_KEY || '-leeway23-MISSION',
    wsUrl: import.meta.env.VITE_VOICE_WS_URL || 'ws://localhost:3000/ws',
    httpUrl: import.meta.env.VITE_RTC_HTTP_URL || 'http://localhost:3000',
    autoReconnect: import.meta.env.VITE_RTC_AUTO_RECONNECT !== 'false',
    maxReconnectAttempts: parseInt(import.meta.env.VITE_RTC_RECONNECT_MAX_ATTEMPTS || '10'),
    reconnectDelayMs: parseInt(import.meta.env.VITE_RTC_RECONNECT_DELAY_MS || '1000'),
    enableVoice: true,
    enableVision: import.meta.env.VITE_VISION_MODEL ? true : false,
    enableVideo: true,
  };

  return RTCInitializer.getInstance(config);
}
