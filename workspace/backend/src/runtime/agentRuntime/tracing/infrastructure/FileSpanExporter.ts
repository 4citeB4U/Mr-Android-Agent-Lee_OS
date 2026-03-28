/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.FILESPANEXPORTER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = FileSpanExporter module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tracing\infrastructure\FileSpanExporter.ts
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
 * FileSpanExporter - Stub (no @opentelemetry/sdk-trace-base dependency).
 * NullTracer is used at runtime; this file is kept for structural completeness.
 */

export interface ReadableSpan { name: string; [key: string]: unknown; }
export interface ExportResult { code: number; }

export class FileSpanExporter {
  constructor(private readonly filePath: string) {}
  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    resultCallback({ code: 0 });
  }
  async shutdown(): Promise<void> {}
  async forceFlush(): Promise<void> {}
}
