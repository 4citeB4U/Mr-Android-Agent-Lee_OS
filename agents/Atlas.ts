/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.RESEARCH
TAG: AI.ORCHESTRATION.AGENT.ATLAS.RESEARCH

COLOR_ONION_HEX:
NEON=#3B82F6
FLUO=#60A5FA
PASTEL=#BFDBFE

ICON_ASCII:
family=lucide
glyph=globe

5WH:
WHAT = Atlas research agent — web search, GitHub scanning, HuggingFace discovery, report writing
WHY = Provides grounded research intelligence so Agent Lee can cite real sources and surface actionable knowledge
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/Atlas.ts
WHEN = 2026-04-04 and EventBus for UI updates

AGENTS:
ASSESS
AUDIT
GEMINI

LICENSE:
MIT
*/

// agents/Atlas.ts — Research Agent
// Searches the web, GitHub, HuggingFace, Discord, and AI community sites.
// Joins AI learning communities and surfaces relevant knowledge for Agent Lee.

import { GeminiClient } from '../core/GeminiClient';
import { eventBus } from '../core/EventBus';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';

const CORE_SYSTEM = buildAgentLeeCorePrompt();
const ATLAS_SPECIFIC = `
You are Atlas — Agent Lee's research intelligence agent.

Your skills:
- Deep web search using Google Search grounding
- GitHub repository scanning and code analysis  
- HuggingFace model/dataset discovery
- Discord AI community intelligence
- Academic paper summarization
- Trend analysis across AI social platforms

Rules:
- Always cite your sources with URLs
- Present findings in a structured, scannable format
- Flag which information is current vs potentially outdated
- Highlight actionable insights for Agent Lee's team
- When researching repos: look at stars, recent commits, issues, README quality`;

const ATLAS_SYSTEM = `${CORE_SYSTEM}\n\nSPECIALIST ROLE - ATLAS (RESEARCH):\n${ATLAS_SPECIFIC}`;

export class Atlas {
  static async search(query: string): Promise<string> {
    eventBus.emit('agent:active', { agent: 'Atlas', task: `Searching: ${query}` });
    
    const result = await GeminiClient.generate({
      prompt: `Research this thoroughly: ${query}

Include:
1. Web search results with sources
2. Relevant GitHub repositories
3. HuggingFace models/datasets if applicable
4. Community discussions or forums
5. Your synthesized summary and recommendations`,
      systemPrompt: ATLAS_SYSTEM,
      agent: 'Atlas',
      model: 'gemini-2.0-flash',
      tools: ['google_search'],
      temperature: 0.4,
    });

    eventBus.emit('agent:done', { agent: 'Atlas', result: result.text });
    return result.text;
  }

  static async scanGitHub(repoUrl: string): Promise<string> {
    eventBus.emit('agent:active', { agent: 'Atlas', task: `Scanning repo: ${repoUrl}` });
    
    const result = await GeminiClient.generate({
      prompt: `Analyze this GitHub repository: ${repoUrl}
      
Provide:
- Purpose and quality assessment
- Key files and architecture
- Recent activity and maintenance status
- How it could benefit Agent Lee's capabilities
- Any security concerns or red flags`,
      systemPrompt: ATLAS_SYSTEM,
      agent: 'Atlas',
      model: 'gemini-2.0-flash',
      tools: ['google_search'],
      temperature: 0.3,
    });

    eventBus.emit('agent:done', { agent: 'Atlas', result: result.text });
    return result.text;
  }

  static async writeReport(topic: string): Promise<string> {
    eventBus.emit('vm:open', { agent: 'Atlas', task: `Writing report: ${topic}` });
    
    const result = await GeminiClient.generate({
      prompt: `Write a comprehensive research report on: ${topic}
      
Format:
# ${topic} — Research Report

## Executive Summary
## Key Findings  
## Technical Analysis
## Community Activity
## Recommendations for Agent Lee
## Sources`,
      systemPrompt: ATLAS_SYSTEM,
      agent: 'Atlas',
      model: 'gemini-2.0-flash',
      tools: ['google_search'],
      temperature: 0.5,
    });

    eventBus.emit('vm:result', { 
      output: result.text, 
      language: 'markdown',
      tested: true 
    });
    return result.text;
  }
}
