/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CONTEXTEXTRACTOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ContextExtractor module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\sub-agents\ContextExtractor.ts
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
 * ContextExtractor - Structured extraction for fork context
 * 
 * Treats conversation as structured state, not narrative.
 * Extracts facts into strict schema to avoid lossy summarization.
 * 
 * Philosophy: Structured extraction > narrative summarization
 * - No reinterpretation or rewriting
 * - Preserves constraints, decisions, technical details
 * - Deterministic merge, zero drift
 * - Last N messages kept verbatim for continuity
 */

import { SessionMessage } from './fork-types.js';

/**
 * Structured context extracted from conversation
 */
export interface ExtractedContext {
  /** Project/topic being discussed */
  subject?: {
    name: string;
    description: string;
    status?: string;
  };

  /** Technical decisions made */
  decisions: Array<{
    what: string;
    rationale?: string;
    alternatives?: string;
  }>;

  /** Constraints and requirements */
  constraints: Array<{
    type: 'technical' | 'business' | 'security' | 'performance';
    description: string;
  }>;

  /** Assumptions stated */
  assumptions: string[];

  /** Open tasks and blockers */
  tasks: {
    open: Array<{ task: string; priority?: 'high' | 'medium' | 'low'; blockers?: string[] }>;
    completed: string[];
  };

  /** Technical details */
  technical: {
    schemas?: Array<{ name: string; fields: string[]; notes?: string }>;
    apis?: Array<{ name: string; endpoint?: string; method?: string }>;
    config?: Record<string, any>;
    bugs?: Array<{ description: string; status: string }>;
    dependencies?: string[];
  };

  /** Key facts and data points */
  facts: Array<{
    category: string;
    value: string;
  }>;

  /** Recent verbatim messages (last N for continuity) */
  recentMessages: SessionMessage[];
}

export class ContextExtractor {
  /**
   * Number of recent messages to keep verbatim
   */
  private static readonly VERBATIM_MESSAGE_COUNT = 5;

  /**
   * Minimum conversation length to trigger extraction
   * Below this, just use verbatim messages (no extraction needed)
   */
  private static readonly MIN_EXTRACTION_LENGTH = 4;

  /**
   * Extract structured context from conversation messages
   * 
   * @param messages - Full conversation history
   * @param llmComplete - Function to call LLM for extraction
   * @returns Extracted structured context
   */
  static async extract(
    messages: SessionMessage[],
    llmComplete: (prompt: string) => Promise<string>
  ): Promise<ExtractedContext> {
    // For very short conversations, skip extraction — just use verbatim
    if (messages.length <= this.MIN_EXTRACTION_LENGTH) {
      return {
        decisions: [],
        constraints: [],
        assumptions: [],
        tasks: { open: [], completed: [] },
        technical: {},
        facts: [],
        recentMessages: messages,
      };
    }

    // Keep last N messages verbatim
    const recentMessages = messages.slice(-this.VERBATIM_MESSAGE_COUNT);
    
    // Extract structured data from ALL messages (not just early ones)
    // The extraction prompt will analyze the full conversation
    // Then we append recent verbatim for continuity
    const messagesToExtract = messages;

    // Build extraction prompt
    const prompt = this.buildExtractionPrompt(messagesToExtract);
    
    // Call LLM
    const response = await llmComplete(prompt);
    
    // Parse structured response
    const extracted = this.parseExtractedData(response);
    
    return {
      ...extracted,
      recentMessages,
    };
  }

  /**
   * Build extraction prompt for structured data extraction
   */
  private static buildExtractionPrompt(messages: SessionMessage[]): string {
    const conversation = messages
      .map(msg => `[${msg.role.toUpperCase()}]: ${msg.content}`)
      .join('\n\n');

    return `Extract structured information from this conversation into JSON format.

DO NOT interpret, rewrite, or infer. ONLY extract facts explicitly stated.

Required JSON schema:
{
  "subject": { "name": string, "description": string, "status"?: string },
  "decisions": [{ "what": string, "rationale"?: string, "alternatives"?: string }],
  "constraints": [{ "type": "technical"|"business"|"security"|"performance", "description": string }],
  "assumptions": [string],
  "tasks": {
    "open": [{ "task": string, "priority"?: "high"|"medium"|"low", "blockers"?: [string] }],
    "completed": [string]
  },
  "technical": {
    "schemas"?: [{ "name": string, "fields": [string], "notes"?: string }],
    "apis"?: [{ "name": string, "endpoint"?: string, "method"?: string }],
    "config"?: { [key: string]: any },
    "bugs"?: [{ "description": string, "status": string }],
    "dependencies"?: [string]
  },
  "facts": [{ "category": string, "value": string }]
}

RULES:
1. Extract ONLY information explicitly mentioned
2. Do NOT add your own interpretations
3. Preserve exact technical terms (library names, versions, commands)
4. Keep constraint wording precise
5. Return ONLY valid JSON (no markdown, no commentary)

CONVERSATION:
${conversation}

EXTRACTED JSON:`;
  }

  /**
   * Parse LLM response into structured context
   */
  private static parseExtractedData(response: string): Omit<ExtractedContext, 'recentMessages'> {
    try {
      // Strip markdown code blocks if present
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
      }
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned);

      // Validate and return with defaults
      return {
        subject: parsed.subject || undefined,
        decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
        constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
        assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
        tasks: {
          open: Array.isArray(parsed.tasks?.open) ? parsed.tasks.open : [],
          completed: Array.isArray(parsed.tasks?.completed) ? parsed.tasks.completed : [],
        },
        technical: {
          schemas: parsed.technical?.schemas || undefined,
          apis: parsed.technical?.apis || undefined,
          config: parsed.technical?.config || undefined,
          bugs: parsed.technical?.bugs || undefined,
          dependencies: parsed.technical?.dependencies || undefined,
        },
        facts: Array.isArray(parsed.facts) ? parsed.facts : [],
      };
    } catch (error) {
      // If parsing fails, return empty structure
      return {
        decisions: [],
        constraints: [],
        assumptions: [],
        tasks: { open: [], completed: [] },
        technical: {},
        facts: [],
      };
    }
  }

  /**
   * Format extracted context for agent consumption
   * 
   * @param context - Extracted structured context
   * @returns Formatted string ready for system prompt
   */
  static format(context: ExtractedContext): string {
    const sections: string[] = [];

    // Subject
    if (context.subject) {
      sections.push(`**Subject:** ${context.subject.name}`);
      sections.push(`**Description:** ${context.subject.description}`);
      if (context.subject.status) {
        sections.push(`**Status:** ${context.subject.status}`);
      }
      sections.push('');
    }

    // Decisions
    if (context.decisions.length > 0) {
      sections.push('**Decisions Made:**');
      context.decisions.forEach(d => {
        sections.push(`- ${d.what}`);
        if (d.rationale) sections.push(`  Rationale: ${d.rationale}`);
        if (d.alternatives) sections.push(`  Alternatives considered: ${d.alternatives}`);
      });
      sections.push('');
    }

    // Constraints
    if (context.constraints.length > 0) {
      sections.push('**Constraints:**');
      context.constraints.forEach(c => {
        sections.push(`- [${c.type}] ${c.description}`);
      });
      sections.push('');
    }

    // Assumptions
    if (context.assumptions.length > 0) {
      sections.push('**Assumptions:**');
      context.assumptions.forEach(a => sections.push(`- ${a}`));
      sections.push('');
    }

    // Open Tasks
    if (context.tasks.open.length > 0) {
      sections.push('**Open Tasks:**');
      context.tasks.open.forEach(t => {
        const priority = t.priority ? ` [${t.priority}]` : '';
        sections.push(`- ${t.task}${priority}`);
        if (t.blockers && t.blockers.length > 0) {
          sections.push(`  Blockers: ${t.blockers.join(', ')}`);
        }
      });
      sections.push('');
    }

    // Technical Details
    const tech = context.technical;
    const hasTech = tech.schemas || tech.apis || tech.config || tech.bugs || tech.dependencies;
    
    if (hasTech) {
      sections.push('**Technical Details:**');
      
      if (tech.schemas && tech.schemas.length > 0) {
        sections.push('  Schemas:');
        tech.schemas.forEach(s => {
          sections.push(`  - ${s.name}: ${s.fields.join(', ')}`);
          if (s.notes) sections.push(`    Notes: ${s.notes}`);
        });
      }
      
      if (tech.apis && tech.apis.length > 0) {
        sections.push('  APIs:');
        tech.apis.forEach(a => {
          const method = a.method || 'GET';
          const endpoint = a.endpoint || '';
          sections.push(`  - ${a.name}: ${method} ${endpoint}`);
        });
      }
      
      if (tech.bugs && tech.bugs.length > 0) {
        sections.push('  Known Issues:');
        tech.bugs.forEach(b => {
          sections.push(`  - [${b.status}] ${b.description}`);
        });
      }
      
      if (tech.dependencies && tech.dependencies.length > 0) {
        sections.push(`  Dependencies: ${tech.dependencies.join(', ')}`);
      }
      
      sections.push('');
    }

    // Facts
    if (context.facts.length > 0) {
      sections.push('**Key Facts:**');
      const grouped = context.facts.reduce((acc, f) => {
        if (!acc[f.category]) acc[f.category] = [];
        acc[f.category].push(f.value);
        return acc;
      }, {} as Record<string, string[]>);
      
      Object.entries(grouped).forEach(([cat, values]) => {
        sections.push(`  ${cat}:`);
        values.forEach(v => sections.push(`  - ${v}`));
      });
      sections.push('');
    }

    // Recent verbatim messages
    if (context.recentMessages.length > 0) {
      sections.push('**Recent Conversation (verbatim):**');
      context.recentMessages.forEach(msg => {
        const role = msg.role.toUpperCase();
        sections.push(`[${role}]: ${msg.content}`);
        sections.push('');
      });
    }

    return sections.join('\n');
  }
}
