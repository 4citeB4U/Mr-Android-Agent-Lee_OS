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

  if (status === 'ready') {
    return null; // Hide when ready
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
    >
      <div className="text-center max-w-md mx-auto">
        {/* Logo */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-6"
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-3xl">🧠</span>
          </div>
        </motion.div>

        {/* Status */}
        <h2 className="text-2xl font-bold text-white mb-2">Agent Lee</h2>
        <p className="text-cyan-300 text-sm mb-6">{message}</p>

        {/* Progress indicator */}
        {status === 'initializing' && (
          <div className="flex justify-center gap-2 mb-6">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                className="w-2 h-2 bg-cyan-400 rounded-full"
              />
            ))}
          </div>
        )}

        {/* Error display */}
        {status === 'error' && (
          <div className="bg-red-900/50 border border-red-500 rounded p-4 mb-4 text-sm">
            <p className="text-red-200 font-mono">{error}</p>
            <div className="mt-4 space-y-2 text-xs text-red-300">
              <p>💡 Troubleshooting:</p>
              <ul className="list-disc list-inside">
                <li>Check if RTC server is running (port 3000)</li>
                <li>Verify .env.local has VITE_API_KEY set</li>
                <li>Allow microphone/camera permissions</li>
                <li>Check browser console for details</li>
              </ul>
            </div>
          </div>
        )}

        {/* System requirements */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>✓ Voice: WebRTC Audio</p>
          <p>✓ Vision: Camera Stream</p>
          <p>✓ API Key: Configured</p>
        </div>
      </div>
    </motion.div>
  );
};

export default RTCBootstrap;
