/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENT_CONTEXT_INDEX_TS.MAIN_INDEX.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = index module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\context\index.ts
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
 * Context management system exports
 * 
 * PBI-2.2: Context Management & Compaction
 * Tasks 2.2.1, 2.2.2, 2.2.3, 2.2.4, 2.2.5, 2.2.6
 */

export { SmartCompactionSession } from './SmartCompactionSession.js';
export { MemoryExtractor } from './MemoryExtractor.js';
export { MemoryFileWriter } from './MemoryFileWriter.js';
export {
  ContextMonitor,
  ContextWarningEvent,
  ContextUrgentEvent,
  type ContextStats,
  type ContextWarningPayload,
  type ContextMonitorOptions,
} from './ContextMonitor.js';

export {
  SessionConfig,
  SessionEvent,
  ContextEvents,
  Message,
  ExtractedMemory,
  CompactionResult,
} from './types.js';

export {
  CompactionStartedEvent,
  CompactionCompleteEvent,
  CompactionTriggeredEvent,
  MemoryExtractedEvent,
  MemoryWrittenEvent,
  SessionCreatedEvent,
  CompactionStartedPayload,
  CompactionCompletePayload,
  CompactionTriggeredPayload,
  MemoryExtractedPayload,
  MemoryWrittenPayload,
  SessionCreatedPayload,
} from './events.js';
