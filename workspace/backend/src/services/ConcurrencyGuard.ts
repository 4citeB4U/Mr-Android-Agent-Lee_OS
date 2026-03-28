/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CONCURRENCYGUARD.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ConcurrencyGuard module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\services\ConcurrencyGuard.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

// LEEWAY v12 HEADER
// File: backend/src/services/ConcurrencyGuard.ts
// Purpose: Hard concurrency caps for LLM, TTS, and tool jobs (Pi-Appliance resource budgets).
// Max concurrent: LLM=2, TTS=6, toolJobs=3 (tightened in Lite Mode).

export type SlotType = "llm" | "tts" | "toolJobs";

export interface AcquireResult {
  allowed: boolean;
  retryAfterMs?: number;
}

const NORMAL_CAPS: Record<SlotType, number> = {
  llm: Number(process.env.MAX_LLM_CONCURRENT || 2),
  tts: Number(process.env.MAX_TTS_CONCURRENT || 6),
  toolJobs: Number(process.env.MAX_TOOL_JOBS || 3),
};

const LITE_CAPS: Record<SlotType, number> = {
  llm: 1,
  tts: 2,
  toolJobs: 2,
};

class ConcurrencyGuard {
  private active: Record<SlotType, number> = { llm: 0, tts: 0, toolJobs: 0 };
  private liteMode = false;

  setLiteMode(on: boolean): void {
    this.liteMode = on;
  }

  private cap(type: SlotType): number {
    return this.liteMode ? LITE_CAPS[type] : NORMAL_CAPS[type];
  }

  acquire(type: SlotType): AcquireResult {
    if (this.active[type] >= this.cap(type)) {
      return { allowed: false, retryAfterMs: 500 };
    }
    this.active[type]++;
    return { allowed: true };
  }

  release(type: SlotType): void {
    if (this.active[type] > 0) this.active[type]--;
  }

  status(): Record<SlotType, { active: number; cap: number }> {
    return {
      llm: { active: this.active.llm, cap: this.cap("llm") },
      tts: { active: this.active.tts, cap: this.cap("tts") },
      toolJobs: { active: this.active.toolJobs, cap: this.cap("toolJobs") },
    };
  }
}

export const concurrencyGuard = new ConcurrencyGuard();
