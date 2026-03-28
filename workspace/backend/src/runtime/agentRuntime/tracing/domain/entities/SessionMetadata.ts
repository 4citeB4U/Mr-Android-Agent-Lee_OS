/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SESSIONMETADATA.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SessionMetadata module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tracing\domain\entities\SessionMetadata.ts
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
 * SessionMetadata entity
 * 
 * Tracks session lifecycle and produces `session.json` — a self-describing
 * metadata file the LLM can read to understand what a session was about.
 * 
 * Written at session start (partial), updated at session end (complete).
 */

import * as fs from 'fs/promises';

export type SessionStatus = 'running' | 'completed' | 'error' | 'aborted';

export interface SessionMetadataJSON {
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  model: string;
  parentSessionId: string | null;
  status: SessionStatus;
  summary: {
    messagesCount: number;
    toolCalls: number;
    errors: number;
    subAgentsSpawned: number;
  };
}

export class SessionMetadata {
  private readonly startedAt: Date;
  private endedAt: Date | null = null;
  private status: SessionStatus = 'running';
  private messagesCount = 0;
  private toolCalls = 0;
  private errors = 0;
  private subAgentsSpawned = 0;

  private constructor(
    private readonly sessionId: string,
    private readonly model: string,
    private readonly parentSessionId: string | null,
  ) {
    this.startedAt = new Date();
  }

  static start(sessionId: string, model: string, parentSessionId?: string): SessionMetadata {
    return new SessionMetadata(sessionId, model, parentSessionId ?? null);
  }

  end(status: 'completed' | 'error' | 'aborted'): void {
    this.endedAt = new Date();
    this.status = status;
  }

  recordMessage(): void { this.messagesCount++; }
  recordToolCall(): void { this.toolCalls++; }
  recordError(): void { this.errors++; }
  recordSubAgentSpawn(): void { this.subAgentsSpawned++; }

  toJSON(): SessionMetadataJSON {
    return {
      sessionId: this.sessionId,
      startedAt: this.startedAt.toISOString(),
      endedAt: this.endedAt?.toISOString() ?? null,
      durationMs: this.endedAt ? this.endedAt.getTime() - this.startedAt.getTime() : null,
      model: this.model,
      parentSessionId: this.parentSessionId,
      status: this.status,
      summary: {
        messagesCount: this.messagesCount,
        toolCalls: this.toolCalls,
        errors: this.errors,
        subAgentsSpawned: this.subAgentsSpawned,
      },
    };
  }

  /**
   * Write session.json atomically (write to temp, then rename).
   */
  async writeTo(filePath: string): Promise<void> {
    const tmpPath = filePath + '.tmp';
    await fs.writeFile(tmpPath, JSON.stringify(this.toJSON(), null, 2), 'utf-8');
    await fs.rename(tmpPath, filePath);
  }
}
