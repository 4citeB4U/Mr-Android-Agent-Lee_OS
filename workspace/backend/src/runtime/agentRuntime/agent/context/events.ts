/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENT_CONTEXT_EVENTS_TS.MAIN_EVENTS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = events module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\context\events.ts
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
 * Domain events for context management
 */

import { DomainEvent } from '../../core/interfaces/IEventBus.js';
import { ContextEvents, ExtractedMemory } from './types.js';

/**
 * Payload for compaction started event
 */
export interface CompactionStartedPayload {
  /**
   * Session ID where compaction is occurring
   */
  sessionId: string;

  /**
   * Number of messages before compaction
   */
  messageCount?: number;

  /**
   * Trigger reason
   */
  reason?: string;
}

/**
 * Event published when context compaction starts
 */
export class CompactionStartedEvent implements DomainEvent<CompactionStartedPayload> {
  readonly eventName = ContextEvents.COMPACTION_STARTED;
  readonly occurredAt: Date;
  readonly payload: CompactionStartedPayload;

  constructor(sessionId: string, messageCount?: number, reason?: string) {
    this.occurredAt = new Date();
    this.payload = {
      sessionId,
      messageCount,
      reason,
    };
  }
}

/**
 * Payload for compaction complete event
 */
export interface CompactionCompletePayload {
  /**
   * Session ID where compaction occurred
   */
  sessionId: string;

  /**
   * Number of messages after compaction
   */
  remainingMessages?: number;

  /**
   * Duration of compaction in milliseconds
   */
  durationMs?: number;
}

/**
 * Event published when context compaction completes
 */
export class CompactionCompleteEvent implements DomainEvent<CompactionCompletePayload> {
  readonly eventName = ContextEvents.COMPACTION_COMPLETE;
  readonly occurredAt: Date;
  readonly payload: CompactionCompletePayload;

  constructor(sessionId: string, remainingMessages?: number, durationMs?: number) {
    this.occurredAt = new Date();
    this.payload = {
      sessionId,
      remainingMessages,
      durationMs,
    };
  }
}

/**
 * Payload for compaction triggered event
 */
export interface CompactionTriggeredPayload {
  /**
   * Session ID where compaction was triggered
   */
  sessionId: string;

  /**
   * Whether this was manually triggered
   */
  manual: boolean;

  /**
   * Trigger reason/source
   */
  reason?: string;
}

/**
 * Event published when compaction is manually triggered
 */
export class CompactionTriggeredEvent implements DomainEvent<CompactionTriggeredPayload> {
  readonly eventName = ContextEvents.COMPACTION_TRIGGERED;
  readonly occurredAt: Date;
  readonly payload: CompactionTriggeredPayload;

  constructor(sessionId: string, manual: boolean, reason?: string) {
    this.occurredAt = new Date();
    this.payload = {
      sessionId,
      manual,
      reason,
    };
  }
}

/**
 * Payload for memory extracted event
 */
export interface MemoryExtractedPayload {
  /**
   * Session ID where memories were extracted
   */
  sessionId: string;

  /**
   * Extracted memories
   */
  memories: ExtractedMemory[];

  /**
   * Number of messages analyzed
   */
  messageCount: number;
}

/**
 * Event published when memories are extracted from conversation history
 */
export class MemoryExtractedEvent implements DomainEvent<MemoryExtractedPayload> {
  readonly eventName = ContextEvents.MEMORY_EXTRACTED;
  readonly occurredAt: Date;
  readonly payload: MemoryExtractedPayload;

  constructor(sessionId: string, memories: ExtractedMemory[], messageCount: number) {
    this.occurredAt = new Date();
    this.payload = {
      sessionId,
      memories,
      messageCount,
    };
  }
}

/**
 * Payload for memory written event
 */
export interface MemoryWrittenPayload {
  /**
   * Session ID
   */
  sessionId: string;

  /**
   * File path where memories were written
   */
  filePath: string;

  /**
   * Number of memories written
   */
  memoryCount: number;
}

/**
 * Event published when memories are written to file
 */
export class MemoryWrittenEvent implements DomainEvent<MemoryWrittenPayload> {
  readonly eventName = ContextEvents.MEMORY_WRITTEN;
  readonly occurredAt: Date;
  readonly payload: MemoryWrittenPayload;

  constructor(sessionId: string, filePath: string, memoryCount: number) {
    this.occurredAt = new Date();
    this.payload = {
      sessionId,
      filePath,
      memoryCount,
    };
  }
}

/**
 * Payload for session created event
 */
export interface SessionCreatedPayload {
  /**
   * Session ID
   */
  sessionId: string;

  /**
   * Model being used
   */
  model: string;

  /**
   * Whether infinite sessions are enabled
   */
  infiniteSessions: boolean;
}

/**
 * Event published when a session is created
 */
export class SessionCreatedEvent implements DomainEvent<SessionCreatedPayload> {
  readonly eventName = ContextEvents.SESSION_CREATED;
  readonly occurredAt: Date;
  readonly payload: SessionCreatedPayload;

  constructor(sessionId: string, model: string, infiniteSessions: boolean) {
    this.occurredAt = new Date();
    this.payload = {
      sessionId,
      model,
      infiniteSessions,
    };
  }
}
