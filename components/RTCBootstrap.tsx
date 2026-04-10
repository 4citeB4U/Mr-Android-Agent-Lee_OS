/*
LEEWAY HEADER — DO NOT REMOVE

REGION: COMPONENTS.RTC.BOOTSTRAP
TAG: COMPONENTS.RTC.INITIALIZATION.STARTUP

COLOR_ONION_HEX:
NEON=#00FFD1
FLUO=#00B4FF
PASTEL=#C7F0FF

ICON_ASCII:
family=lucide
glyph=radio

5WH:
WHAT = RTC Bootstrap Component — Initializes Agent Lee voice + vision on app startup
WHY = Ensures Agent Lee is listening and seeing from the moment the app loads
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/RTCBootstrap.tsx
WHEN = 2026-04-07

AGENTS:
ARIA
OBSERVER
NEXUS

LICENSE:
MIT
*/

import React, { useEffect, useState } from 'react';
import { createRTCInitializer, RTCInitializer } from '../core/RTCInitializer';
import { eventBus } from '../core/EventBus';
import { motion } from 'framer-motion';

interface RTCBootstrapProps {
  onReady?: () => void;
  onError?: (error: Error) => void;
}

/**
 * RTCBootstrap — Initialize Agent Lee's real-time communication on app load
 * 
 * Shows a loading screen during initialization and handles errors gracefully.
 */
export const RTCBootstrap: React.FC<RTCBootstrapProps> = ({ onReady, onError }) => {
  const [status, setStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [message, setMessage] = useState('Initializing Agent Lee voice + vision...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let rtcInitializer: RTCInitializer | null = null;

    const initializeRTC = async () => {
      try {
        console.log('[RTCBootstrap] Starting initialization...');
        setMessage('Connecting to LeeWay RTC SFU...');

        rtcInitializer = createRTCInitializer();
        
        setMessage('Requesting microphone access...');
        await rtcInitializer.initialize();

        setMessage('Agent Lee ready for voice + vision!');
        setStatus('ready');
        
        // Emit boot event
        eventBus.emit('app:rtc-ready', { timestamp: Date.now() });
        onReady?.();

        console.log('[RTCBootstrap] ✅ RTC fully initialized');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('[RTCBootstrap] Initialization failed:', errorMsg);
        
        setError(errorMsg);
        setStatus('error');
        setMessage('RTC initialization failed. Check console.');
        
        eventBus.emit('app:rtc-error', { error: errorMsg });
        onError?.(err instanceof Error ? err : new Error(errorMsg));
      }
    };

    initializeRTC();

    // Listen for RTC events
    const stateChangeHandler = (data: any) => {
      console.log('[RTCBootstrap] RTC State:', data.state);
      setMessage(`RTC State: ${data.state}`);
    };

    const voiceReadyHandler = () => {
      setMessage('Voice ready! Listening for commands...');
    };

    const visionReadyHandler = () => {
      setMessage('Vision ready! Analyzing scene...');
    };

    eventBus.on('rtc:state-change', stateChangeHandler);
    eventBus.on('rtc:voice-ready', voiceReadyHandler);
    eventBus.on('rtc:vision-ready', visionReadyHandler);

    return () => {
      eventBus.off('rtc:state-change', stateChangeHandler);
      eventBus.off('rtc:voice-ready', voiceReadyHandler);
      eventBus.off('rtc:vision-ready', visionReadyHandler);
    };
  }, [onReady, onError]);

  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const statusConfig = {
    initializing: {
      bg: 'rgba(0,30,60,0.85)',
      border: 'rgba(0,255,255,0.3)',
      glow: '0 0 12px rgba(0,255,255,0.15)',
      dotColor: '#22d3ee',
      textColor: '#67e8f9',
      labelColor: '#a5f3fc',
    },
    ready: {
      bg: 'rgba(0,40,20,0.85)',
      border: 'rgba(16,185,129,0.4)',
      glow: '0 0 12px rgba(16,185,129,0.15)',
      dotColor: '#10b981',
      textColor: '#6ee7b7',
      labelColor: '#a7f3d0',
    },
    error: {
      bg: 'rgba(60,10,10,0.9)',
      border: 'rgba(239,68,68,0.4)',
      glow: '0 0 12px rgba(239,68,68,0.15)',
      dotColor: '#ef4444',
      textColor: '#fca5a5',
      labelColor: '#fecaca',
    },
  };

  const cfg = statusConfig[status];

  return null;
};

export default RTCBootstrap;
