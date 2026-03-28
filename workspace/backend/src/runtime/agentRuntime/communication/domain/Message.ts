/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.MESSAGE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = Message module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\communication\domain\Message.ts
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
 * Message - Core types for agent-to-agent messaging
 * 
 * Pure types, no I/O.
 */

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';
export type MessageType = 'request' | 'response' | 'notification' | 'progress' | 'completion';

export interface Message {
  /** Unique message ID */
  id: string;
  /** Sender agent ID */
  from: string;
  /** Recipient: agent ID, 'parent', or 'broadcast' */
  to: string;
  /** Message type */
  type: MessageType;
  /** Message content */
  content: string;
  /** Priority level */
  priority: MessagePriority;
  /** Timestamp (epoch ms) */
  timestamp: number;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

export interface AgentFilter {
  /** Filter by agent IDs */
  agentIds?: string[];
  /** Filter by labels */
  labels?: string[];
  /** Exclude specific agent IDs */
  exclude?: string[];
}

export type MessageHandler = (message: Message) => void | Promise<void>;

/**
 * Priority ordering for queue sorting
 */
export const PRIORITY_ORDER: Record<MessagePriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
};
