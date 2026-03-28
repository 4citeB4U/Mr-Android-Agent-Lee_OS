/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENTRUNTIME_SUB_AGENTS_TOOL_SCHEMAS_TS.MAIN_AGENTS_TOOL.MAIN_SCHEMAS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = tool-schemas module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\sub-agents\tool-schemas.ts
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
 * Tool schema definitions for sub-agent management tools
 *
 * Defines the interface between Phase 0 tool system and Phase 2 sub-agent
 * functionality. These schemas enable the main agent to spawn and manage
 * sub-agents via natural language commands.
 *
 * @module tool-schemas
 */

/**
 * Tool schema for sessions_spawn
 *
 * Spawns a new sub-agent to handle a specific task in parallel (non-blocking).
 * The sub-agent runs independently with its own context and can be
 * automatically cleaned up after completion.
 */
export const SessionsSpawnToolSchema = {
  name: 'sessions_spawn',
  description:
    'Spawn a new sub-agent to handle a specific task in parallel (non-blocking). Use this when you need to delegate work, perform parallel analysis, or handle multiple concerns simultaneously. The sub-agent runs independently with its own context. Returns immediately with agentId - use sessions_status to check completion.',
  parameters: {
    type: 'object' as const,
    properties: {
      task: {
        type: 'string' as const,
        description:
          'Detailed description of the task for the sub-agent to perform. Be specific about the goal, context, and expected output. Example: "Analyze the security vulnerabilities in SubAgentManager.ts and provide a detailed report with recommendations."',
      },
      agentId: {
        type: 'string' as const,
        description:
          'Optional custom identifier for the sub-agent. If not provided, a unique ID will be auto-generated. Use meaningful names for easier tracking (e.g., "security-audit", "perf-analyzer").',
      },
      cleanup: {
        type: 'string' as const,
        enum: ['delete', 'keep'],
        description:
          'Whether to automatically cleanup the sub-agent after task completion. "delete" (default) removes the agent when done, "keep" leaves it running for follow-up interactions.',
        default: 'delete',
      },
      model: {
        type: 'string' as const,
        description:
          'Override automatic model selection. By default, the system auto-selects based on task complexity. Only specify if you need a specific model (e.g., "github-copilot/gpt-codex-5.3" for code tasks).',
      },
      timeout: {
        type: 'number' as const,
        description:
          'Task timeout in seconds. Default is 1800 (30 minutes). Increase for complex long-running tasks.',
        default: 1800,
      },
    },
    required: ['task'],
  },
};

/**
 * Tool schema for sessions_fork
 *
 * Forks the current session with context to handle a related subtask.
 * Unlike spawn, fork carries conversation context from the parent session.
 */
export const SessionsForkToolSchema = {
  name: 'sessions_fork',
  description:
    'Fork the current session to handle a related subtask. The forked session can either get an exact copy of conversation context (hits LLM KV cache — fast and cheap) or a compacted summary (smaller but misses cache). You MUST specify contextMode.',
  parameters: {
    type: 'object' as const,
    properties: {
      task: {
        type: 'string' as const,
        description:
          'Task description for the forked session. This should be related to the current conversation context.',
      },
      contextMode: {
        type: 'string' as const,
        enum: ['exact', 'summary'],
        description:
          'Required. "exact" = identical copy of conversation history (hits LLM provider KV cache — fast prefix matching, cheaper). "summary" = compacted approximation of context (smaller token count but no cache hit, requires full computation).',
      },
      timeout: {
        type: 'number' as const,
        description:
          'Task timeout in seconds. Default is 1800 (30 minutes). Increase for complex long-running tasks.',
        default: 1800,
      },
    },
    required: ['task', 'contextMode'],
  },
};

/**
 * Tool schema for sessions_list
 *
 * Lists all active sub-agent sessions with their current status.
 */
export const SessionsListToolSchema = {
  name: 'sessions_list',
  description:
    'List all active sub-agent sessions. Returns information about each agent including ID, status, task, model, and resource usage. Use this to check on spawned agents or find an agent ID for sending messages.',
  parameters: {
    type: 'object' as const,
    properties: {},
  },
};

/**
 * Tool schema for sessions_send
 *
 * Sends a message to an existing sub-agent session.
 */
export const SessionsSendToolSchema = {
  name: 'sessions_send',
  description:
    'Send a message to another agent session. Child agents: use this ONCE to send "Task complete: [summary]" when done. Parent agents: use to communicate mid-task if needed. The agent must be in "keep" mode (not auto-deleted).',
  parameters: {
    type: 'object' as const,
    properties: {
      agentId: {
        type: 'string' as const,
        description:
          'ID of the sub-agent to send the message to. Use sessions_list to get available agent IDs.',
      },
      message: {
        type: 'string' as const,
        description:
          'Message content to send to the sub-agent. This will be added to the agent\'s conversation as a user message. Example: "Please also analyze edge cases and error handling."',
      },
    },
    required: ['agentId', 'message'],
  },
};

/**
 * Tool schema for sessions_status
 *
 * Checks the status of a spawned sub-agent.
 */
export const SessionsStatusToolSchema = {
  name: 'sessions_status',
  description:
    'Check the current status of a spawned sub-agent. Returns status (running/completed/failed), response (if completed), duration, and health info. Note: you do NOT need to poll this — sub-agents automatically send you a message when they complete.',
  parameters: {
    type: 'object' as const,
    properties: {
      agentId: {
        type: 'string' as const,
        description:
          'ID of the sub-agent to check. This is the agentId returned from sessions_spawn.',
      },
    },
    required: ['agentId'],
  },
};

/**
 * Collection of all sub-agent tool schemas
 *
 * Exported as a single object for easy iteration and registration.
 */
export const SubAgentToolSchemas = {
  sessions_spawn: SessionsSpawnToolSchema,
  sessions_fork: SessionsForkToolSchema,
  sessions_list: SessionsListToolSchema,
  sessions_send: SessionsSendToolSchema,
  sessions_status: SessionsStatusToolSchema,
} as const;

/**
 * Type representing all available sub-agent tool names
 */
export type SubAgentToolName = keyof typeof SubAgentToolSchemas;

/**
 * Type guard to check if a string is a valid sub-agent tool name
 */
export function isSubAgentToolName(name: string): name is SubAgentToolName {
  return name in SubAgentToolSchemas;
}
