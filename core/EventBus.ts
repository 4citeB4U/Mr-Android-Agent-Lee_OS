/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.CORE.EVENTS
TAG: AI.ORCHESTRATION.CORE.EVENTBUS.TYPED

COLOR_ONION_HEX:
NEON=#F59E0B
FLUO=#FBBF24
PASTEL=#FDE68A

ICON_ASCII:
family=lucide
glyph=zap

5WH:
WHAT = Lightweight typed event bus for agent-to-UI communication across the system
WHY = Decouples agent execution from UI rendering — agents emit events, UI listens without direct coupling
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = core/EventBus.ts
WHEN = 2026
HOW = TypeScript generic class with emit/on/off/once methods and strict event type map

AGENTS:
ASSESS
AUDIT

LICENSE:
MIT
*/

// core/EventBus.ts
// Lightweight typed event bus for agent-to-UI communication

type EventMap = {
  'agent:active': { agent: string; task: string };
  'agent:done': { agent: string; result: string };
  'agent:error': { agent: string; error: string };
  'vm:open': { agent: string; task: string };
  'vm:output': { chunk: string };
  'vm:result': { code?: string; output?: string; language?: string; tested: boolean };
  'vm:close': {};
  'dream:start': {};
  'dream:end': { insights: string[] };
  'emotion:detected': { emotion: string; confidence: number; style: string };
  'user:voice': { transcript: string; language: string; speakerId: string };
  'heal:start': { module: string };
  'heal:complete': { module: string; success: boolean };
  'memory:saved': { key: string };
  'voxel:generate': { prompt: string; image?: string };

  // ── Launch Pad cross-page events ──────────────────────────────
  /** Deep-link: open Launch Pad and select a specific launch */
  'launchpad:open': { launchId: string };
  /** A deployable bundle has been created and is ready for the pipeline */
  'launchpad:bundle_ready': { launchId: string; bundleId: string };
  /** A job has been queued/started */
  'launchpad:job_started': { launchId: string; jobId: string };
  /** A pipeline step changed status */
  'launchpad:job_updated': { launchId: string; jobId: string };
  /** The entire job completed (succeeded or failed) */
  'launchpad:job_finished': { launchId: string; jobId: string; status: 'succeeded' | 'failed' };

  // ── Governance events ────────────────────────────────────────
  /** A task state machine transitioned to a new state */
  'task:state_changed': { task_id: string; state: string; lead: string };
  /** A new checkpoint was written (before or after a WRITE step) */
  'checkpoint:created': { checkpoint_id: string; phase: 'before' | 'after'; task_id: string };
  /** A capability was granted for a time window */
  'permit:granted': { cap: string; ttl_ms: number; scope: string; reason: string };
  /** A capability grant was revoked */
  'permit:revoked': { cap: string };
  /** Break-glass emergency mode activated */
  'breakglass:activated': { caps: string[]; ttl_ms: number; scope: string; reason: string };
  /** Break-glass ended */
  'breakglass:ended': {};
  /** Shield detected a threat or injection attempt */
  'shield:threat': { module: string; severity: 'low' | 'medium' | 'high' | 'critical'; detail: string };
  /** Brain Sentinel changed budget mode */
  'brain:budget_changed': { mode: string; maxActiveAgents: number; writePolicy: string };
  /** A report event was written to the IndexedDB buffer */
  'report:written': { key: string; event: import('./ReportWriter').ReportEvent };
  /** Verification Corps mission started */
  'verification:start': { mission_id: string; workflows: string[] };
  /** Verification Corps mission completed with verdict */
  'verification:result': { mission_id: string; verdict: import('./VerificationCorps').GovernanceVerdict; scenarios: import('./VerificationCorps').ScenarioResult[] };
  /** Leeway Standards compliance audit completed */
  'standards:compliance': { score: number; violations: number; total_files: number; recommendation: string };

  // ── Voice Pipeline events (LiveConductor / STT / TTS / Vision / Router) ─────
  /** LiveConductorAgent changed pipeline state */
  'conductor:state': { state: 'idle' | 'listening' | 'thinking' | 'speaking'; sessionId: string };
  /** StreamingSTTAgent produced a partial transcript */
  'stt:partial': { text: string; confidence: number };
  /** StreamingSTTAgent detected speech start (VAD) */
  'stt:speech_start': {};
  /** StreamingSTTAgent detected speech end (VAD) */
  'stt:speech_end': { durationMs: number };
  /** StreamingTTSAgent started speaking an utterance */
  'tts:speaking': { text: string; prosody: { pace: string; pitch: string; emotion: string } };
  /** StreamingTTSAgent finished an utterance */
  'tts:done': { durationMs: number };
  /** StreamingTTSAgent utterance was cancelled mid-stream (barge-in) */
  'tts:cancelled': { reason: 'barge_in' | 'interrupt' };
  /** VisionAgent extracted text from a screen capture */
  'vision:screen_text': { text: string; confidence: number };
  /** VisionAgent produced a scene summary */
  'vision:scene_summary': { summary: string };
  /** VisionAgent detected UI hints (buttons / inputs visible on screen) */
  'vision:ui_hints': { hints: string[] };
  /** RouterAgent classified the user intent for the current turn */
  'router:intent': { intent: string; mode: 'local' | 'gemini'; confidence: number; reason: string };
  /** SafetyRedactionAgent applied redaction to outgoing text */
  'redaction:applied': { originalLength: number; redactedLength: number; categories: string[] };
};

type Listener<T> = (data: T) => void;

class EventBusClass {
  private listeners: Map<string, Set<Listener<unknown>>> = new Map();

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(h => (h as Listener<EventMap[K]>)(data));
    }
  }

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>);
    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>) {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  once<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>) {
    const wrapper: Listener<EventMap[K]> = (data) => {
      listener(data);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
}

export const eventBus = new EventBusClass();
