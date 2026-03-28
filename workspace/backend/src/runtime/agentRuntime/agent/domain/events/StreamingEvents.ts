/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.STREAMINGEVENTS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = StreamingEvents module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\domain\events\StreamingEvents.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

export type StreamingEvent =
  | { type: 'delta'; messageId: string; content: string }
  | { type: 'reasoning_delta'; reasoningId: string; content: string }
  | { type: 'reasoning'; content: string };

export type ToolEvent =
  | { type: 'tool_start'; callId: string; name: string; args?: unknown }
  | { type: 'tool_progress'; callId: string; message: string }
  | { type: 'tool_complete'; callId: string; name: string; success: boolean; result?: string }
  | { type: 'tool_permission'; action: 'allowed' | 'blocked'; reason: string; kind: string };
