/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.CORTEX.ADAM
TAG: AI.ORCHESTRATION.AGENT.ADAMCORTEX.GRAPH

COLOR_ONION_HEX:
NEON=#6366F1
FLUO=#818CF8
PASTEL=#C7D2FE

ICON_ASCII:
family=lucide
glyph=network

5WH:
WHAT = Adam Cortex — Graph Architect; builds, queries, and optimises complex knowledge graphs across the system
WHY = Agent Lee needs structured knowledge mapping to cross-reference concepts, agents, tasks, and outcomes across sessions
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/AdamCortex.ts
WHEN = 2026-04-04
HOW = Static class using GeminiClient to generate and query Cypher-style knowledge graph structures backed by MemoryDB

AGENTS:
ASSESS
AUDIT
CORTEX

LICENSE:
MIT
*/

// agents/AdamCortex.ts — Knowledge Graph Architect
// Manages conceptual knowledge graphs: nodes, edges, traversal, and semantic queries.
// Activated when Atlas, Sage, or AgentLee needs cross-domain relationship mapping.

import { GeminiClient } from '../core/GeminiClient';
import { eventBus } from '../core/EventBus';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';
import { ReportWriter } from '../core/ReportWriter';

const CORE_SYSTEM = buildAgentLeeCorePrompt();

const ADAM_SPECIFIC = `
You are Adam Cortex — Agent Lee's Knowledge Graph Architect.

Your purpose:
- Model complex domains as nodes (entities) and edges (relationships)
- Answer graph traversal queries: "What connects X to Y?", "Which agents share domain Z?"
- Identify structural gaps and propose new links to improve system self-understanding
- Compress knowledge clusters into canonical summaries for Sage to archive

Rules:
- Always label nodes with: entity_type, name, properties
- Always label edges with: relationship_type, direction, weight (0–1), evidence
- When uncertain about a link, mark it as INFERRED (not CONFIRMED)
- Output graph JSON when asked; output prose explanations for laypeople
- Flag circular dependencies or orphan nodes as anomalies`;

const ADAM_SYSTEM = `${CORE_SYSTEM}\n\nSPECIALIST ROLE — ADAM CORTEX (GRAPH ARCHITECT):\n${ADAM_SPECIFIC}`;

export interface GraphNode {
  id: string;
  entity_type: string;
  name: string;
  properties: Record<string, string>;
}

export interface GraphEdge {
  from: string;
  to: string;
  relationship: string;
  weight: number;
  status: 'CONFIRMED' | 'INFERRED';
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: string;
}

export class AdamCortex {
  /**
   * Build a knowledge graph for a given topic or domain.
   */
  static async buildGraph(topic: string, context?: string): Promise<KnowledgeGraph> {
    eventBus.emit('agent:active', { agent: 'AdamCortex', task: `Building graph: ${topic}` });

    const result = await GeminiClient.generate({
      prompt: `
Map the knowledge graph for: "${topic}"
${context ? `Additional context: ${context}` : ''}

Return a JSON object with:
{
  "nodes": [{ "id": "...", "entity_type": "...", "name": "...", "properties": {} }],
  "edges": [{ "from": "...", "to": "...", "relationship": "...", "weight": 0.8, "status": "CONFIRMED|INFERRED" }],
  "summary": "One paragraph prose summary of the domain structure"
}`,
      systemPrompt: ADAM_SYSTEM,
      agent: 'AdamCortex',
      model: 'gemini-2.0-flash',
      temperature: 0.2,
    });

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    let graph: KnowledgeGraph = { nodes: [], edges: [], summary: result.text };

    if (jsonMatch) {
      try {
        graph = JSON.parse(jsonMatch[0]) as KnowledgeGraph;
      } catch {
        graph.summary = result.text;
      }
    }

    await ReportWriter.write({
      ts: new Date().toISOString(),
      report_class: 'AGENT',
      family: 'CORTEX',
      severity: 'INFO',
      event: 'STEP_COMPLETE',
      message: `AdamCortex graph built for "${topic}" — ${graph.nodes.length} nodes, ${graph.edges.length} edges`,
      agent_id: 'AdamCortex',
    });

    eventBus.emit('agent:done', { agent: 'AdamCortex', result: `graph:${graph.nodes.length}nodes` });
    return graph;
  }

  /**
   * Query a knowledge graph with a natural language question.
   */
  static async query(graph: KnowledgeGraph, question: string): Promise<string> {
    eventBus.emit('agent:active', { agent: 'AdamCortex', task: `Graph query: ${question}` });

    const graphText = `Nodes: ${JSON.stringify(graph.nodes)}\nEdges: ${JSON.stringify(graph.edges)}`;

    const result = await GeminiClient.generate({
      prompt: `Graph Data:\n${graphText}\n\nQuestion: ${question}\n\nAnswer by traversing the graph relationships.`,
      systemPrompt: ADAM_SYSTEM,
      agent: 'AdamCortex',
      model: 'gemini-2.0-flash',
      temperature: 0.3,
    });

    eventBus.emit('agent:done', { agent: 'AdamCortex', result: 'graph:query complete' });
    return result.text;
  }
}
