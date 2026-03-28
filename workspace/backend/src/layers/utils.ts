/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UTIL
TAG: CORE.SDK.LAYERS_UTILS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = utils module
WHY = Part of UTIL region
WHO = LEEWAY Align Agent
WHERE = backend\src\layers\utils.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

// LEEWAY HEADER BLOCK
// File: core/utils.ts
// Purpose: Shared utilities for Agent Lee OS
// Security: LEEWAY-CORE-2026 compliant

// ── Phrase Repetition Tracker ─────────────────────────────────────────────
export class PhraseRepetitionTracker {
  private recentPhrases: string[] = [];
  private window: number;

  constructor(window = 5) {
    this.window = window;
  }

  check(text: string): boolean {
    const sentences = text.split(/[.!?]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 20);
    for (const phrase of sentences) {
      if (this.recentPhrases.some(prev => this.similarity(prev, phrase) > 0.75)) {
        return true;
      }
    }
    this.recentPhrases.push(...sentences.slice(0, 2));
    if (this.recentPhrases.length > this.window) {
      this.recentPhrases = this.recentPhrases.slice(-this.window);
    }
    return false;
  }

  private similarity(a: string, b: string): number {
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    let common = 0;
    for (const w of wordsA) { if (wordsB.has(w)) common++; }
    return common / Math.max(wordsA.size, wordsB.size);
  }

  reset(): void { this.recentPhrases = []; }
}

// ── Anti-Repetition Window Tracker ────────────────────────────────────────
export class AntiRepetitionTracker {
  private usedPhrases: string[] = [];
  private window: number;

  constructor(window = 10) {
    this.window = window;
  }

  pick(bucket: string[]): string {
    const available = bucket.filter(p => !this.usedPhrases.includes(p));
    const pool = available.length > 0 ? available : bucket;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    this.usedPhrases.push(selected);
    if (this.usedPhrases.length > this.window) {
      this.usedPhrases.shift();
    }
    return selected;
  }
}

// ── Directory Hashing Utility ─────────────────────────────────────────────
// ── Directory Helper ───────────────────────────────────────────────────────
import * as os from 'os';
export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
import * as path from 'path';
import * as fs from 'fs';

export function hashDirectory(dir: string, base = dir): Record<string, string> {
  // Placeholder: actual implementation should hash files recursively
  return {};
}

export function aggregateHash(tree: Record<string, string>): string {
  // Placeholder: actual implementation should aggregate hashes
  return '';
}
