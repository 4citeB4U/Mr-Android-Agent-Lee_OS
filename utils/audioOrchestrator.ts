/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UTILS.AUDIO.ORCHESTRATOR
TAG: UTILS.AUDIO.ORCHESTRATOR.EVENTS

5WH:
WHAT = Event-driven audio orchestrator — routes app events to the correct audio playback
WHY = Centralizes all audio trigger logic; enforces voice priority (ducking); prevents conflicts
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = utils/audioOrchestrator.ts
WHEN = 2026
HOW = Singleton with handleEvent() dispatcher, duck/restore logic for ambient layers,
      priority-ordered: AgentVoice > UIFeedback > Ambient

LICENSE:
MIT
*/

import { audioManager } from './audioManager';

// ── Internal state ────────────────────────────────────────────────────
let _agentSpeaking  = false;
let _agentListening = false;
let _universeActive = false;

// Base volumes (restored after duck)
const BASE_VOL: Record<string, number> = {
  universeAmbient: 0.3,
  universeCar:     0.5,
  idle:            0.3,
  appLoading:      0.3,
};

// Ducked volumes (10–20% of base)
const DUCK_VOL: Record<string, number> = {
  universeAmbient: 0.05,
  universeCar:     0.08,
  idle:            0.05,
  appLoading:      0.05,
};

function duckAllAmbient() {
  Object.entries(DUCK_VOL).forEach(([key, vol]) => audioManager.setVolume(key, vol));
}

function restoreAllAmbient() {
  Object.entries(BASE_VOL).forEach(([key, vol]) => {
    // Only restore universe sounds if universe is still active
    if ((key === 'universeAmbient' || key === 'universeCar') && !_universeActive) return;
    audioManager.setVolume(key, vol);
  });
}

// ── Public orchestrator ───────────────────────────────────────────────
export const audioOrchestrator = {
  /**
   * Primary event dispatcher. Call this from UI components and lifecycle hooks.
   *
   * Supported events:
   *  app:loading | app:loaded
   *  button:click | nav:click
   *  universe:loading | universe:active | universe:exit
   *  settings:open
   *  diagnostics:open | diagnostics:close
   *  idle:start | idle:end
   *  chat:sent | chat:received
   *  agent:speaking | agent:done | agent:thinking
   *  agent:listening | agent:listening:stop
   */
  handleEvent(eventType: string) {
    switch (eventType) {
      // ── App lifecycle ───────────────────────────────────────
      case 'app:loading':
        audioManager.playLoop('appLoading', BASE_VOL.appLoading);
        break;

      case 'app:loaded':
        audioManager.stop('appLoading');
        setTimeout(() => audioManager.play('appOpen'), 100);
        break;

      // ── Button / nav feedback ────────────────────────────────
      case 'button:click':
        audioManager.setVolume('buttonClick', 0.8);
        audioManager.play('buttonClick');
        break;

      case 'nav:click':
        audioManager.play('navClick');
        break;

      // ── Universe flow ────────────────────────────────────────
      case 'universe:loading':
        audioManager.play('universeIntro');
        break;

      case 'universe:active':
        _universeActive = true;
        audioManager.playLoop('universeAmbient', _agentSpeaking || _agentListening ? DUCK_VOL.universeAmbient : BASE_VOL.universeAmbient);
        audioManager.playLoop('universeCar',     _agentSpeaking || _agentListening ? DUCK_VOL.universeCar    : BASE_VOL.universeCar);
        break;

      case 'universe:exit':
        _universeActive = false;
        audioManager.stop('universeAmbient');
        audioManager.stop('universeCar');
        audioManager.play('universeExit');
        break;

      // ── Settings ─────────────────────────────────────────────
      case 'settings:open':
        audioManager.play('settingsOpen');
        break;

      // ── Diagnostics ──────────────────────────────────────────
      case 'diagnostics:open':
        audioManager.playLoop('appLoading', _agentSpeaking || _agentListening ? DUCK_VOL.appLoading : BASE_VOL.appLoading);
        break;

      case 'diagnostics:close':
        audioManager.stop('appLoading');
        break;

      // ── Idle detection ───────────────────────────────────────
      case 'idle:start':
        if (!_agentSpeaking && !_agentListening) {
          audioManager.playLoop('idle', BASE_VOL.idle);
        }
        break;

      case 'idle:end':
        audioManager.stop('idle');
        break;
      
      case 'chat:sent':
        audioManager.play('buttonClick');
        break;

      case 'chat:received':
        audioManager.play('chatReceived');
        break;

      // ── Agent voice priority (ducking system) ────────────────
      case 'agent:thinking':
        audioManager.playLoop('pulse', 0.2); // Low vol loopy hum
        break;
      
      case 'agent:thinking:stop':
        audioManager.stop('pulse');
        break;

      case 'agent:speaking':
        _agentSpeaking = true;
        duckAllAmbient();
        break;

      case 'agent:done':
        _agentSpeaking = false;
        if (!_agentListening) restoreAllAmbient();
        break;

      case 'agent:listening':
        _agentListening = true;
        duckAllAmbient();
        break;

      case 'agent:listening:stop':
        _agentListening = false;
        if (!_agentSpeaking) restoreAllAmbient();
        break;

      default:
        break;
    }
  },

  /** Convenience: update agent speaking state and apply ducking. */
  setAgentSpeaking(val: boolean) {
    this.handleEvent(val ? 'agent:speaking' : 'agent:done');
  },

  /** Convenience: update agent listening state and apply ducking. */
  setAgentListening(val: boolean) {
    this.handleEvent(val ? 'agent:listening' : 'agent:listening:stop');
  },

  /** Re-enforce audio priority based on current state. */
  managePriority() {
    if (_agentSpeaking || _agentListening) {
      duckAllAmbient();
    } else {
      restoreAllAmbient();
    }
  },

  /** Enforce voice isolation pass. */
  enforceIsolation() {
    this.managePriority();
  },

  /** Resume any ambient layers that should be playing. */
  routeAudioLayers() {
    if (_universeActive) {
      if (!audioManager.isPlaying('universeAmbient')) {
        audioManager.playLoop('universeAmbient', BASE_VOL.universeAmbient);
      }
      if (!audioManager.isPlaying('universeCar')) {
        audioManager.playLoop('universeCar', BASE_VOL.universeCar);
      }
    }
  },
};
