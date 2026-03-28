/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ISTEERINGMANAGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ISteeringManager module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\communication\domain\ISteeringManager.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

/**
 * ISteeringManager - Interface for mid-execution message injection
 * 
 * Domain interface (DIP).
 */

export interface InjectOptions {
  /** When to inject */
  timing: 'immediate' | 'after-tool' | 'before-response';
  /** Only inject after these tools */
  toolFilter?: string[];
  /** Priority */
  priority: 'background' | 'normal' | 'interrupt';
}

export interface PendingInjection {
  id: string;
  agentId: string;
  message: string;
  options: InjectOptions;
  createdAt: number;
  status: 'pending' | 'delivered' | 'expired';
}

export interface ISteeringManager {
  /** Queue a message for injection at next opportunity */
  inject(agentId: string, message: string, options?: Partial<InjectOptions>): string;

  /** Check if agent has pending injections */
  hasPending(agentId: string): boolean;

  /** Get and consume pending injections for an agent (optionally filtered by tool) */
  consume(agentId: string, currentTool?: string): PendingInjection[];

  /** Pause agent at next inject point */
  pause(agentId: string): void;

  /** Resume paused agent */
  resume(agentId: string): void;

  /** Check if agent is paused */
  isPaused(agentId: string): boolean;

  /** Get all pending injections for an agent */
  getPending(agentId: string): readonly PendingInjection[];

  /** Clear all pending injections */
  clearPending(agentId: string): void;
}
