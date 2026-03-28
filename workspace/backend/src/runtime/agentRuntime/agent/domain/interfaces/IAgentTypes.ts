/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.IAGENTTYPES.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IAgentTypes module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\domain\interfaces\IAgentTypes.ts
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
 * Agent Lee Runtime — Core Message Types
 *
 * Replaces ICopilotClient types with Agent Lee-native equivalents.
 * All session communication uses these types instead of Copilot SDK types.
 */

// ── Message ──────────────────────────────────────────────────────────────────

export interface Message {
  /** 'user' | 'assistant' | 'system' */
  role: "user" | "assistant" | "system";
  /** Text content of the message */
  content: string;
  /** Optional timestamp */
  timestamp?: Date;
}

// ── Assistant Response ────────────────────────────────────────────────────────

export interface AssistantResponse {
  /** The text reply from Agent Lee (GLM-4.7-Flash) */
  content: string;
  /** Model used to generate the response */
  model?: string;
  /** Token counts if available */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

// ── Session Config ────────────────────────────────────────────────────────────

export interface SessionConfig {
  /** Model identifier (e.g. 'glm-4-flash') */
  model?: string;
  /** Sampling temperature 0–1 */
  temperature?: number;
  /** Max tokens in response */
  maxTokens?: number;
  /** System prompt override */
  systemPrompt?: string;
}

// ── Agent Error ───────────────────────────────────────────────────────────────

export class AgentError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AgentError";
  }
}

/** @deprecated alias kept for compatibility during migration */
export type CopilotError = AgentError;
