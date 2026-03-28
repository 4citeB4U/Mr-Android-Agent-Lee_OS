/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SHAREDSTATE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SharedState module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\communication\infrastructure\SharedState.ts
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
 * SharedState - In-memory shared state store
 * 
 * Provides key-value storage with atomic operations and change watchers.
 */

import type { ISharedState, ChangeCallback } from '../domain/ISharedState.js';

export class SharedState implements ISharedState {
  private readonly store = new Map<string, unknown>();
  private readonly watchers = new Map<string, Set<ChangeCallback>>();

  set(key: string, value: unknown): void {
    const old = this.store.get(key);
    this.store.set(key, value);
    this.notify(key, value, old);
  }

  get<T = unknown>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  delete(key: string): boolean {
    const old = this.store.get(key);
    const deleted = this.store.delete(key);
    if (deleted) this.notify(key, undefined, old);
    return deleted;
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  increment(key: string, by: number = 1): number {
    const current = (this.store.get(key) as number) ?? 0;
    const next = current + by;
    this.store.set(key, next);
    this.notify(key, next, current);
    return next;
  }

  append(key: string, value: unknown): void {
    const arr = (this.store.get(key) as unknown[]) ?? [];
    const old = [...arr];
    arr.push(value);
    this.store.set(key, arr);
    this.notify(key, arr, old);
  }

  keys(): string[] {
    return [...this.store.keys()];
  }

  watch(key: string, callback: ChangeCallback): void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }
    this.watchers.get(key)!.add(callback);
  }

  unwatch(key: string, callback: ChangeCallback): void {
    this.watchers.get(key)?.delete(callback);
  }

  clear(): void {
    this.store.clear();
    this.watchers.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private notify(key: string, value: unknown, oldValue: unknown): void {
    const cbs = this.watchers.get(key);
    if (!cbs) return;
    for (const cb of cbs) {
      try { cb(key, value, oldValue); } catch { /* best effort */ }
    }
  }
}
