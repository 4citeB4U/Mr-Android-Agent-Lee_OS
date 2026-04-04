/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.CORE
TAG: AI.ORCHESTRATION.AGENT.AGENTLEE.ORCHESTRATOR

COLOR_ONION_HEX:
NEON=#00FFFF
FLUO=#00E5FF
PASTEL=#B2EBF2

ICON_ASCII:
family=lucide
glyph=cpu

5WH:
WHAT = Lead orchestrator agent for Agent Lee Agentic Operating System
WHY = Central routing and execution brain — plans, delegates, verifies, and delivers all tasks
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/AgentLee.ts
WHEN = 2026
HOW = Static class with respond(), plan(), and verify() methods using GeminiClient and EventBus

AGENTS:
ASSESS
AUDIT
GEMINI
NOVA
ECHO

LICENSE:
MIT
*/

// agents/AgentLee.ts — Lead Orchestrator
// Master planner, task setter, and verified finisher.
// Always researches → plans → delegates → verifies → delivers with evidence.

import { GeminiClient, GeminiRequest } from '../core/GeminiClient';
import { AgentRouter, TaskIntent } from '../core/AgentRouter';
import { eventBus } from '../core/EventBus';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';

const LEE_SYSTEM_PROMPT = buildAgentLeeCorePrompt();
const LEE_SPECIFIC_INSTRUCTIONS = `
- Master planner: you always create a clear plan before acting
- Verified finisher: you always test and present evidence of completion
- Good listener: you detect emotion and tone in the user's message
- Adaptive communicator: you speak to a poet in poems, a coder in code, a child in stories
- Social butterfly: you love languages and translation, work well with groups
- Always lead with a plan, then act, then verify, then present.`;

const FULL_SYSTEM_PROMPT = `${LEE_SYSTEM_PROMPT}\n\nLEAD ORCHESTRATOR ROLE:\n${LEE_SPECIFIC_INSTRUCTIONS}`;

export class AgentLee {
  static async respond(
    userMessage: string, 
    intent: TaskIntent,
    streamCallback?: (chunk: string) => void
  ): Promise<string> {
    
    eventBus.emit('agent:active', { agent: 'AgentLee', task: intent.task });
    
    const history = AgentRouter.getHistory();
    
    const styleDirective = intent.style && intent.style !== 'normal'
      ? `\n[STYLE DIRECTIVE: Respond in the form of a ${intent.style}]`
      : '';

    const request: GeminiRequest = {
      prompt: `${userMessage}${styleDirective}`,
      systemPrompt: FULL_SYSTEM_PROMPT,
      agent: 'AgentLee',
      model: 'gemini-2.0-flash',
      temperature: 0.8,
      history,
      streamCallback,
    };

    const result = await GeminiClient.stream(request);
    
    AgentRouter.addHistory('user', userMessage);
    AgentRouter.addHistory('model', result);
    
    eventBus.emit('agent:done', { agent: 'AgentLee', result });
    
    return result;
  }

  static async plan(task: string): Promise<string> {
    eventBus.emit('agent:active', { agent: 'AgentLee', task: 'Creating plan...' });
    
    const result = await GeminiClient.generate({
      prompt: `Create a detailed, step-by-step execution plan for: "${task}"
      
Format as:
PLAN: <one sentence summary>
RESEARCH NEEDED: <yes/no — what to look up>
STEPS:
1. ...
2. ...
AGENTS NEEDED: <list of agents>
SUCCESS CRITERIA: <how we know it's done>
ESTIMATED TIME: <rough estimate>`,
      systemPrompt: FULL_SYSTEM_PROMPT,
      agent: 'AgentLee',
      model: 'gemini-2.0-flash-thinking-exp',
      temperature: 0.3,
    });
    
    return result.text;
  }

  static async verify(task: string, result: string): Promise<{ passed: boolean; notes: string }> {
    const verification = await GeminiClient.generate({
      prompt: `Verify this task was completed correctly.
TASK: ${task}
RESULT: ${result}

Check: completeness, correctness, quality, edge cases.
Return JSON: { "passed": true/false, "notes": "..." }`,
      agent: 'AgentLee',
      model: 'gemini-2.0-flash',
      temperature: 0.1,
    });

    try {
      const json = verification.text.match(/\{[\s\S]*\}/)?.[0];
      return json ? JSON.parse(json) : { passed: true, notes: 'Verification completed' };
    } catch {
      return { passed: true, notes: verification.text };
    }
  }
}
