/**
 * types.ts – Shared TypeScript types for the Agent Lee WebSocket protocol.
 */

export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';
export type RouteMode = 'local' | 'gemini';

// ── Client → Server ──────────────────────────────────────────────────────────

export interface HelloEvent {
  type: 'hello';
  version: string;
  capabilities: string[];
  sample_rate: number;
  channels: number;
}

export interface InterruptEvent {
  type: 'interrupt';
}

export interface TextEvent {
  type: 'text';
  text: string;
}

// ── Server → Client ──────────────────────────────────────────────────────────

export interface StateEvent {
  type: 'state';
  state: AgentState;
}

export interface PartialTranscriptEvent {
  type: 'partial_transcript';
  text: string;
  confidence: number;
}

export interface FinalTranscriptEvent {
  type: 'final_transcript';
  text: string;
  confidence: number;
}

export interface PartialResponseTextEvent {
  type: 'partial_response_text';
  text: string;
  token_index: number;
}

export interface FinalResponseTextEvent {
  type: 'final_response_text';
  text: string;
  route: RouteMode;
}

export interface AudioOutMetadata {
  type: 'audio_out';
  sample_rate: number;
  channels: number;
  encoding: string;
  chunk_index: number;
  is_last: boolean;
}

export interface ErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export interface HelloAckEvent {
  type: 'hello_ack';
  session_id: string;
}

export type ServerEvent =
  | StateEvent
  | PartialTranscriptEvent
  | FinalTranscriptEvent
  | PartialResponseTextEvent
  | FinalResponseTextEvent
  | AudioOutMetadata
  | ErrorEvent
  | HelloAckEvent;
