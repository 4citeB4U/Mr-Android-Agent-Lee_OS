// core/security/InputFirewallAgent.ts
import { PerceptionBus } from '../PerceptionBus.ts';
import type { PerceptionEvent } from '../PerceptionBus.ts';

const INJECTION_PATTERNS = [
  /ignore instructions/i,
  /bypass governance/i,
  /delete the database/i,
  /disable security/i,
  /run code without approval/i,
  /override system/i
];

export class InputFirewallAgent {
  private bus = PerceptionBus.getInstance();
  private frozen = false;

  constructor() {
    this.bus.subscribe('*', this.scan.bind(this));
  }

  scan(event: PerceptionEvent) {
    if (this.frozen) return;
    let text = '';
    if (event.payload && typeof event.payload === 'object') {
      if ('transcript' in event.payload && typeof event.payload.transcript === 'string') {
        text = event.payload.transcript;
      } else if ('sceneDescription' in event.payload && typeof event.payload.sceneDescription === 'string') {
        text = event.payload.sceneDescription;
      }
    }
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        this.emitBlock(event, text);
        this.freezeCollective();
        return;
      }
    }
  }

  emitBlock(event: PerceptionEvent, text: string) {
    this.bus.publish({
      id: `security_block_${Date.now()}`,
      type: 'SECURITY_BLOCK',
      source: 'InputFirewall',
      timestamp: Date.now(),
      payload: {
        reason: 'Prompt Injection Detected',
        offendingText: text,
        originalEvent: event
      } as import('../PerceptionBus').SecurityBlockPayload
    });
    console.log('[InputFirewall] Injection Attempt Blocked. System Lockdown Initiated. Receipt logged to Memory Lake.');
  }

  freezeCollective() {
    this.frozen = true;
    // Simulate freezing the runtime
    if (globalThis.CollectiveRuntime) {
      globalThis.CollectiveRuntime.frozen = true;
    }
  }
}

// Boot the firewall
export const inputFirewall = new InputFirewallAgent();
