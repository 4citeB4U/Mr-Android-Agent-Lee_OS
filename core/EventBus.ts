// Leeway header removed per standards compliance
// EventMap type for the EventBus
type EventMap = {
  'breakglass:activated': { caps: string[]; ttl_ms: number; scope: string; reason: string };
  'breakglass:ended': {};
  'shield:threat': { module: string; severity: 'low' | 'medium' | 'high' | 'critical'; detail: string };
  'brain:budget_changed': { mode: string; maxActiveAgents: number; writePolicy: string };
  'report:written': { key: string; event: import('./ReportWriter').ReportEvent };
  'navigate:page': { page: string };
  'verification:start': { mission_id: string; workflows: string[] };
  'verification:result': { mission_id: string; verdict: import('./VerificationCorps').GovernanceVerdict; scenarios: import('./VerificationCorps').ScenarioResult[] };
  'standards:compliance': { score: number; violations: number; total_files: number; recommendation: string };
  'conductor:state': { state: 'idle' | 'listening' | 'thinking' | 'speaking'; sessionId: string };
  'stt:partial': { text: string; confidence: number };
  'stt:speech_start': {};
  'stt:speech_end': { durationMs: number };
  'tts:speaking': { text: string; prosody: { pace: string; pitch: string; emotion: string } };
  'tts:done': { durationMs: number };
  'tts:cancelled': { reason: 'barge_in' | 'interrupt' };
  'vision:screen_text': { text: string; confidence: number };
  'vision:scene_summary': { summary: string };
  'vision:ui_hints': { hints: string[] };
  'router:intent': { intent: string; mode: 'local' | 'gemini'; confidence: number; reason: string };
  'redaction:applied': { originalLength: number; redactedLength: number; categories: string[] };
  'file:event': import('./fileOps').FileEvent;
  'governance:file_operation': import('./governanceEnforcer').FileGovernanceLog;
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


