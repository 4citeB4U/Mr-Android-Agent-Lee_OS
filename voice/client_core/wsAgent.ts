/**
 * wsAgent.ts – Server-connected mode for Agent Lee.
 *
 * Wires together:
 *  AudioCapture → AgentLeeSocket → AudioPlayback
 *  AgentLeeSocket events → AgentUI
 *  AgentUI interactions → AgentLeeSocket
 *
 * Barge-in logic:
 *  If AudioPlayback is playing and a local VAD detects speech onset,
 *  stopPlayback() is called immediately and an interrupt event is sent
 *  to the server.
 */

import { AudioCapture, AudioPlayback } from './audio';
import { AgentLeeSocket } from './websocket';
import { AgentUI } from './ui';
import type {
  StateEvent,
  PartialTranscriptEvent,
  FinalTranscriptEvent,
  PartialResponseTextEvent,
  FinalResponseTextEvent,
  AudioOutMetadata,
  ErrorEvent,
} from './types';

// ── Config ────────────────────────────────────────────────────────────────────
const WS_URL = (() => {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws`;
})();

// Local energy-based barge-in threshold (0-1)
const BARGE_IN_ENERGY_THRESHOLD = 0.01;

// ── State ─────────────────────────────────────────────────────────────────────
let micActive = false;
let captureInst: AudioCapture | null = null;
let energySmoother = 0;

// ── Initialise ────────────────────────────────────────────────────────────────
const ui = new AgentUI();
const socket = new AgentLeeSocket(WS_URL);
const playback = new AudioPlayback(22050);

// ── Socket events ─────────────────────────────────────────────────────────────

socket.on<StateEvent>('state', (e) => {
  ui.setState(e.state);
  if (e.state === 'listening') {
    ui.clearResponse();
  }
});

socket.on<PartialTranscriptEvent>('partial_transcript', (e) => {
  ui.setPartialTranscript(e.text);
});

socket.on<FinalTranscriptEvent>('final_transcript', (e) => {
  ui.setFinalTranscript(e.text, e.confidence);
});

socket.on<PartialResponseTextEvent>('partial_response_text', (e) => {
  ui.appendResponseToken(e.text);
});

socket.on<FinalResponseTextEvent>('final_response_text', (e) => {
  ui.setFinalResponse(e.text, e.route);
});

// Audio out: the server sends a JSON metadata frame, then a binary frame.
// We only care about the binary frame for playback.
socket.on<AudioOutMetadata>('audio_out', (_e) => {
  // Metadata received – next binary frame is the audio chunk.
  // (Handled in onAudio below.)
});

socket.onAudio((buf) => {
  playback.queueChunk(buf);
});

socket.on<ErrorEvent>('error', (e) => {
  ui.showError(e.code, e.message);
  console.error('[AgentLee] Error:', e);
});

// ── Microphone ────────────────────────────────────────────────────────────────

async function startMic(): Promise<void> {
  try {
    captureInst = new AudioCapture((pcm) => {
      // Local energy-based barge-in: detect speech while AI is speaking
      const int16 = new Int16Array(pcm);
      let sum = 0;
      for (let i = 0; i < int16.length; i++) sum += (int16[i] / 32768) ** 2;
      const rms = Math.sqrt(sum / int16.length);
      energySmoother = 0.8 * energySmoother + 0.2 * rms;

      if (playback.isPlaying && energySmoother > BARGE_IN_ENERGY_THRESHOLD) {
        // Barge-in: stop playback and notify server
        playback.stopPlayback();
        socket.sendInterrupt();
      }

      // Stream audio to server
      socket.sendAudio(pcm);
    });

    await captureInst.start();
    micActive = true;
    ui.setMicActive(true);
    console.log('[AgentLee] Microphone started.');
  } catch (err) {
    console.error('[AgentLee] Mic error:', err);
    ui.showError('mic_error', String(err));
  }
}

function stopMic(): void {
  captureInst?.stop();
  captureInst = null;
  micActive = false;
  ui.setMicActive(false);
  console.log('[AgentLee] Microphone stopped.');
}

// ── UI bindings ───────────────────────────────────────────────────────────────

ui.onMicClick(() => {
  if (micActive) {
    stopMic();
  } else {
    void startMic();
  }
});

ui.onSendText((text) => {
  socket.sendText(text);
  ui.clearResponse();
});

// ── Startup ───────────────────────────────────────────────────────────────────

socket.connect();
ui.setState('idle');

console.log('[AgentLee] Client initialised. Connecting to', WS_URL);
