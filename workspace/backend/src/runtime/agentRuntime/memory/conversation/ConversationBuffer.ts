/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CONVERSATIONBUFFER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ConversationBuffer module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\conversation\ConversationBuffer.ts
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
 * ConversationBuffer - Buffers messages for batch indexing
 * 
 * Accumulates messages and triggers flush when threshold reached.
 * Pure logic for buffer management; flush callback is injected.
 */

import {
  ConversationMessage,
  BufferConfig,
  DEFAULT_BUFFER_CONFIG,
} from './ConversationMessage.js';

export type FlushCallback = (messages: ConversationMessage[]) => Promise<void>;

export class ConversationBuffer {
  private buffer: ConversationMessage[] = [];
  private lastFlushTime: number = Date.now();
  private flushTimer: NodeJS.Timeout | null = null;
  private flushing = false;

  constructor(
    private readonly onFlush: FlushCallback,
    private readonly config: BufferConfig = DEFAULT_BUFFER_CONFIG
  ) {
    this.startTimer();
  }

  /**
   * Add a message to the buffer
   * Triggers flush if threshold reached
   */
  async add(message: ConversationMessage): Promise<void> {
    this.buffer.push(message);

    if (this.buffer.length >= this.config.maxMessages) {
      await this.flush();
    }
  }

  /**
   * Flush all buffered messages
   */
  async flush(): Promise<number> {
    if (this.flushing || this.buffer.length === 0) {
      return 0;
    }

    this.flushing = true;
    const messages = [...this.buffer];
    this.buffer = [];

    try {
      await this.onFlush(messages);
      this.lastFlushTime = Date.now();
      return messages.length;
    } catch (error) {
      // Put messages back on failure
      this.buffer.unshift(...messages);
      throw error;
    } finally {
      this.flushing = false;
    }
  }

  /**
   * Get current buffer size
   */
  get size(): number {
    return this.buffer.length;
  }

  /**
   * Get time since last flush in ms
   */
  get timeSinceFlush(): number {
    return Date.now() - this.lastFlushTime;
  }

  /**
   * Stop the flush timer
   */
  dispose(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Start the periodic flush timer
   */
  private startTimer(): void {
    this.flushTimer = setInterval(async () => {
      if (this.buffer.length > 0 && this.timeSinceFlush >= this.config.flushIntervalMs) {
        try {
          await this.flush();
        } catch {
          // Timer flushes are best-effort
        }
      }
    }, Math.min(this.config.flushIntervalMs, 60000));

    // Don't keep process alive just for the timer
    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }
}
