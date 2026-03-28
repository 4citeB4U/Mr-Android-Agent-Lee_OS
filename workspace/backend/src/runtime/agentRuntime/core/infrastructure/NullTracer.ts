/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.NULLTRACER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = NullTracer module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\infrastructure\NullTracer.ts
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
 * NullTracer - Pass-through ITracer implementation for Agent Lee runtime
 *
 * Executes traced functions without any OpenTelemetry overhead.
 * Used in production since OpenTelemetry is not available.
 */

import { ITracer, ISpan } from '../interfaces/ITracer.js';

class NullSpan implements ISpan {
  setAttribute(_key: string, _value: string | number | boolean): void {}
  addEvent(_name: string, _attributes?: Record<string, unknown>): void {}
  setStatus(_status: 'ok' | 'error', _message?: string): void {}
  end(): void {}
}

const NULL_SPAN = new NullSpan();

export class NullTracer implements ITracer {
  async span<T>(
    _name: string,
    fn: (span: ISpan) => T | Promise<T>
  ): Promise<T> {
    return fn(NULL_SPAN);
  }

  async childSpan<T>(
    _name: string,
    fn: (span: ISpan) => T | Promise<T>
  ): Promise<T> {
    return fn(NULL_SPAN);
  }
}
