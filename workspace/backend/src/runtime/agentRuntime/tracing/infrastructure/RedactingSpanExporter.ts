/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.REDACTINGSPANEXPORTER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = RedactingSpanExporter module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tracing\infrastructure\RedactingSpanExporter.ts
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
 * RedactingSpanExporter - Stub (no @opentelemetry/sdk-trace-base dependency).
 * NullTracer is used at runtime; this file is kept for structural completeness.
 */

export interface ReadableSpan { name: string; [key: string]: unknown; }
export interface ExportResult { code: number; }
export interface SpanExporter {
  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void;
  shutdown(): Promise<void>;
}

export class RedactingSpanExporter implements SpanExporter {
  constructor(private readonly inner: SpanExporter) {}
  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    this.inner.export(spans, resultCallback);
  }
  async shutdown(): Promise<void> {
    await this.inner.shutdown();
  }
}
