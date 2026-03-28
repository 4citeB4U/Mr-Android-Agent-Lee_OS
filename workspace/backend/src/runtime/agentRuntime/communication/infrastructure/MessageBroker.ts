/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.MESSAGEBROKER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = MessageBroker module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\communication\infrastructure\MessageBroker.ts
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
 * MessageBroker - Central message routing for agent communication
 * 
 * Imperative Shell: manages subscriptions, routing, and delivery.
 */

import type { Message, MessageHandler, AgentFilter, MessageType } from '../domain/Message.js';
import type { IMessageBroker } from '../domain/IMessageBroker.js';
import { MessageQueue } from '../logic/MessageQueue.js';
import { ILogger } from '../../core/interfaces/ILogger.js';
import { randomUUID } from 'crypto';

export interface MessageBrokerConfig {
  queueSize: number;
  deliveryTimeout: number;
  retryAttempts: number;
}

const DEFAULT_CONFIG: MessageBrokerConfig = {
  queueSize: 1000,
  deliveryTimeout: 5000,
  retryAttempts: 3,
};

export class MessageBroker implements IMessageBroker {
  private readonly queues = new Map<string, MessageQueue>();
  private readonly subscribers = new Map<string, Set<MessageHandler>>();
  private readonly parentMap = new Map<string, string>(); // child → parent
  private readonly childMap = new Map<string, Set<string>>(); // parent → children
  private readonly deadLetters: Message[] = [];

  constructor(
    private readonly logger: ILogger,
    private readonly config: MessageBrokerConfig = DEFAULT_CONFIG
  ) {}

  async send(message: Message): Promise<void> {
    this.logger.info('MessageBroker routing message', {
      from: message.from,
      to: message.to,
      type: message.type,
    });

    if (message.to === 'broadcast') {
      await this.deliverBroadcast(message);
      return;
    }

    await this.deliverToAgent(message.to, message);
  }

  async sendToParent(fromAgentId: string, content: string, type: MessageType = 'notification'): Promise<void> {
    const parentId = this.parentMap.get(fromAgentId);
    if (!parentId) {
      this.logger.warn('No parent registered for agent', { agentId: fromAgentId });
      return;
    }

    const message: Message = {
      id: randomUUID(),
      from: fromAgentId,
      to: parentId,
      type,
      content,
      priority: 'normal',
      timestamp: Date.now(),
    };

    await this.deliverToAgent(parentId, message);
  }

  async broadcast(fromAgentId: string, content: string, filter?: AgentFilter): Promise<void> {
    const children = this.childMap.get(fromAgentId) ?? new Set();
    const targets = this.applyFilter([...children], filter);

    for (const targetId of targets) {
      const message: Message = {
        id: randomUUID(),
        from: fromAgentId,
        to: targetId,
        type: 'notification',
        content,
        priority: 'normal',
        timestamp: Date.now(),
      };

      await this.deliverToAgent(targetId, message);
    }
  }

  subscribe(agentId: string, handler: MessageHandler): void {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, new Set());
    }
    this.subscribers.get(agentId)!.add(handler);

    // Deliver any pending messages
    const queue = this.queues.get(agentId);
    if (queue && !queue.isEmpty) {
      const pending = queue.drain();
      for (const msg of pending) {
        this.notifySubscribers(agentId, msg);
      }
    }
  }

  unsubscribe(agentId: string, handler: MessageHandler): void {
    this.subscribers.get(agentId)?.delete(handler);
  }

  getPending(agentId: string): Message[] {
    return [...(this.queues.get(agentId)?.getAll() ?? [])];
  }

  getQueueSize(agentId: string): number {
    return this.queues.get(agentId)?.size ?? 0;
  }

  clearQueue(agentId: string): void {
    this.queues.get(agentId)?.clear();
  }

  registerRelationship(childId: string, parentId: string): void {
    this.parentMap.set(childId, parentId);
    if (!this.childMap.has(parentId)) {
      this.childMap.set(parentId, new Set());
    }
    this.childMap.get(parentId)!.add(childId);
  }

  getParent(agentId: string): string | undefined {
    return this.parentMap.get(agentId);
  }

  getChildren(agentId: string): string[] {
    return [...(this.childMap.get(agentId) ?? [])];
  }

  /** Get dead letter queue (for debugging) */
  getDeadLetters(): readonly Message[] {
    return this.deadLetters;
  }

  // --- Private ---

  private async deliverToAgent(agentId: string, message: Message): Promise<void> {
    const handlers = this.subscribers.get(agentId);

    if (handlers && handlers.size > 0) {
      this.logger.debug('Delivering message to subscriber', {
        agentId,
        from: message.from,
        type: message.type,
        handlerCount: handlers.size,
      });
      this.notifySubscribers(agentId, message);
    } else {
      // No subscriber — queue for later
      if (!this.queues.has(agentId)) {
        this.queues.set(agentId, new MessageQueue({ maxSize: this.config.queueSize }));
      }

      const enqueued = this.queues.get(agentId)!.enqueue(message);
      if (!enqueued) {
        this.logger.warn('Queue full, message sent to dead letter', {
          agentId,
          messageId: message.id,
        });
        this.deadLetters.push(message);
      }
    }
  }

  private async deliverBroadcast(message: Message): Promise<void> {
    // Deliver to all agents except sender
    const allAgents = new Set([
      ...this.subscribers.keys(),
      ...this.queues.keys(),
    ]);

    for (const agentId of allAgents) {
      if (agentId !== message.from) {
        const targeted = { ...message, to: agentId, id: randomUUID() };
        await this.deliverToAgent(agentId, targeted);
      }
    }
  }

  private notifySubscribers(agentId: string, message: Message): void {
    const handlers = this.subscribers.get(agentId);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        handler(message);
      } catch (error) {
        this.logger.error('Message handler error', error as Error);
      }
    }
  }

  private applyFilter(agentIds: string[], filter?: AgentFilter): string[] {
    if (!filter) return agentIds;

    let result = agentIds;

    if (filter.agentIds) {
      const allowed = new Set(filter.agentIds);
      result = result.filter(id => allowed.has(id));
    }

    if (filter.exclude) {
      const excluded = new Set(filter.exclude);
      result = result.filter(id => !excluded.has(id));
    }

    return result;
  }
}
