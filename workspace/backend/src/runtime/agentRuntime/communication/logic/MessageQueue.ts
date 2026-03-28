/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.MESSAGEQUEUE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = MessageQueue module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\communication\logic\MessageQueue.ts
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
 * MessageQueue - Per-agent message queue with priority ordering
 * 
 * Pure logic: deterministic queue operations, no I/O.
 */

import type { Message, MessagePriority } from '../domain/Message.js';
import { PRIORITY_ORDER } from '../domain/Message.js';

export interface QueueConfig {
  /** Max queue size (default: 1000) */
  maxSize: number;
}

const DEFAULT_CONFIG: QueueConfig = { maxSize: 1000 };

export class MessageQueue {
  private queue: Message[] = [];
  private readonly config: QueueConfig;

  constructor(config?: Partial<QueueConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Enqueue a message, maintaining priority order
   * Returns false if queue is full
   */
  enqueue(message: Message): boolean {
    if (this.queue.length >= this.config.maxSize) {
      return false;
    }

    // Insert maintaining priority order (highest priority first)
    const insertIdx = this.findInsertIndex(message.priority);
    this.queue.splice(insertIdx, 0, message);
    return true;
  }

  /**
   * Dequeue highest-priority message
   */
  dequeue(): Message | undefined {
    return this.queue.shift();
  }

  /**
   * Peek at next message without removing
   */
  peek(): Message | undefined {
    return this.queue[0];
  }

  /**
   * Drain all messages from queue
   */
  drain(): Message[] {
    const messages = [...this.queue];
    this.queue = [];
    return messages;
  }

  /**
   * Get all messages without removing
   */
  getAll(): readonly Message[] {
    return this.queue;
  }

  get size(): number {
    return this.queue.length;
  }

  get isEmpty(): boolean {
    return this.queue.length === 0;
  }

  get isFull(): boolean {
    return this.queue.length >= this.config.maxSize;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Find insertion index to maintain priority ordering
   * Higher priority messages go first; within same priority, FIFO
   */
  private findInsertIndex(priority: MessagePriority): number {
    const order = PRIORITY_ORDER[priority];
    // Find first message with lower priority
    for (let i = 0; i < this.queue.length; i++) {
      if (PRIORITY_ORDER[this.queue[i].priority] < order) {
        return i;
      }
    }
    return this.queue.length; // Append at end
  }
}
