/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.VOICE
TAG: AI.ORCHESTRATION.AGENT.ROUTER.INTENT

COLOR_ONION_HEX:
NEON=#F59E0B
FLUO=#FBBF24
PASTEL=#FEF3C7

ICON_ASCII:
family=lucide
glyph=git-branch

5WH:
WHAT = RouterAgent — classifies each user turn and decides local LLM vs Gemini routing
WHY = Minimises Gemini API spend by handling simple intents locally via llama.cpp
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/RouterAgent.ts
WHEN = 2026-04-04

AGENTS:
ASSESS
AUDIT
GEMINI
ROUTER

LICENSE:
MIT
*/

// agents/RouterAgent.ts
// Client-side companion to the server-side router_agent.py.
// Provides a best-effort client classification for UI pre-rendering hints.
// The authoritative routing decision is always made server-side.

import { GeminiClient } from '../core/GeminiClient';
import { eventBus } from '../core/EventBus';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';

const CORE_SYSTEM = buildAgentLeeCorePrompt();
const ROUTER_SYSTEM = `${CORE_SYSTEM}

SPECIALIST ROLE — ROUTER AGENT:
Classify the user's message and decide whether it should be handled locally or by Gemini.
Respond ONLY with a JSON object:
{
  "intent": "<short label: e.g. greeting | factual_question | code_help | creative | complex_reasoning | safety_concern>",
  "mode": "local" | "gemini",
  "confidence": <0.0–1.0>,
  "reason": "<one sentence>"
}

Route to "local" for: greetings, simple yes/no, time/date, short factual recall, basic math.
Route to "gemini" for: multi-step reasoning, code generation, creative writing, ambiguous or complex queries.`;

// Simple synchronous fast-path rules (no API call needed)
const LOCAL_PATTERNS: RegExp[] = [
  /^(hi|hello|hey|good\s+(morning|afternoon|evening))/i,
  /^(what time|what's the time|what is the time)/i,
  /^(yes|no|ok|okay|sure|thanks|thank you|bye|goodbye)/i,
  /^\d[\d\s+\-*/()]*=?\s*$/,  // pure arithmetic
];

export type RouteDecision = {
  intent: string;
  mode: 'local' | 'gemini';
  confidence: number;
  reason: string;
};

export class RouterAgent {
  /**
   * Classify a user message and emit router:intent.
   * Fast-path rules run synchronously; ambiguous turns are sent to Gemini.
   */
  static async classify(userMessage: string): Promise<RouteDecision> {
    // Fast path
    for (const pattern of LOCAL_PATTERNS) {
      if (pattern.test(userMessage.trim())) {
        const decision: RouteDecision = {
          intent: 'simple',
          mode: 'local',
          confidence: 0.97,
          reason: 'Matched local fast-path pattern.',
        };
        eventBus.emit('router:intent', decision);
        return decision;
      }
    }

    // Gemini-assisted classification
    eventBus.emit('agent:active', { agent: 'Router', task: `Classifying: ${userMessage.slice(0, 60)}` });

    let raw: string;
    try {
      const resp = await GeminiClient.generate({
        prompt: userMessage,
        systemPrompt: ROUTER_SYSTEM,
        agent: 'Router',
        model: 'gemini-2.0-flash',
        temperature: 0.1,
      });
      raw = resp.text;
    } catch {
      // Fallback: route to local on API failure
      const fallback: RouteDecision = { intent: 'unknown', mode: 'local', confidence: 0.5, reason: 'Router API call failed; defaulting to local.' };
      eventBus.emit('router:intent', fallback);
      return fallback;
    }

    try {
      const decision = JSON.parse(raw.trim()) as RouteDecision;
      eventBus.emit('router:intent', decision);
      eventBus.emit('agent:done', { agent: 'Router', result: `${decision.intent} → ${decision.mode}` });
      return decision;
    } catch {
      const fallback: RouteDecision = { intent: 'unknown', mode: 'gemini', confidence: 0.5, reason: 'Could not parse router response.' };
      eventBus.emit('router:intent', fallback);
      return fallback;
    }
  }
}
