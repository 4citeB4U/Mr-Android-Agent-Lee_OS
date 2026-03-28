/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.IMESSAGEBROKER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IMessageBroker module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\communication\domain\IMessageBroker.ts
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
 * IMessageBroker - Interface for agent-to-agent message routing
 * 
 * Domain interface (DIP). Implementations in infrastructure.
 */

import type { Message, MessageHandler, AgentFilter } from './Message.js';

export interface IMessageBroker {
  /** Send message to specific agent */
  send(message: Message): Promise<void>;

  /** Send message to parent (from sub-agent context) */
  sendToParent(fromAgentId: string, content: string, type?: Message['type']): Promise<void>;

  /** Broadcast to multiple agents */
  broadcast(fromAgentId: string, content: string, filter?: AgentFilter): Promise<void>;

  /** Subscribe to messages for an agent */
  subscribe(agentId: string, handler: MessageHandler): void;

  /** Unsubscribe handler */
  unsubscribe(agentId: string, handler: MessageHandler): void;

  /** Get pending messages for an agent */
  getPending(agentId: string): Message[];

  /** Get queue size for an agent */
  getQueueSize(agentId: string): number;

  /** Clear queue for an agent */
  clearQueue(agentId: string): void;

  /** Register parent-child relationship */
  registerRelationship(childId: string, parentId: string): void;

  /** Get parent ID for an agent */
  getParent(agentId: string): string | undefined;

  /** Get children IDs for an agent */
  getChildren(agentId: string): string[];
}
