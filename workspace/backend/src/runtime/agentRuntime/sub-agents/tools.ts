/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.TOOLS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = tools module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\sub-agents\tools.ts
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
 * Sub-agent tool registration and handlers
 *
 * Integrates Phase 2 sub-agent functionality with Phase 0 tool system.
 * Registers 4 tools: sessions_spawn, sessions_fork, sessions_list, sessions_send
 *
 * These tools enable the main agent to spawn and manage sub-agents via
 * natural language commands.
 */

import type { IMessageBroker } from "../communication/domain/IMessageBroker.js";
import type { AgentStateManager } from "../communication/infrastructure/AgentStateManager.js";
import { Result } from "../core/types/Result.js";
import { ITool } from "../tools/domain/interfaces/ITool.js";
import { IToolRegistry } from "../tools/domain/interfaces/IToolRegistry.js";
import { ToolResult } from "../tools/domain/value-objects/ToolResult.js";
import { ForkableSession } from "./ForkableSession.js";
import { OpenClawStyleOrchestrator } from "./OpenClawStyleOrchestrator.js";
import {
    SessionsForkToolSchema,
    SessionsListToolSchema,
    SessionsSendToolSchema,
    SessionsSpawnToolSchema,
    SessionsStatusToolSchema,
} from "./tool-schemas.js";
import { AgentInfo } from "./types.js";

/**
 * SessionsSpawnTool - Spawns a new sub-agent to handle a task
 */
class SessionsSpawnTool implements ITool {
  readonly name = SessionsSpawnToolSchema.name;
  readonly description = SessionsSpawnToolSchema.description;
  readonly schema = SessionsSpawnToolSchema.parameters;

  constructor(private readonly orchestrator: OpenClawStyleOrchestrator) {}

  async execute(parameters: unknown): Promise<Result<ToolResult, Error>> {
    try {
      const params = parameters as {
        task: string;
        agentId?: string;
        cleanup?: string;
        model?: string;
        timeout?: number;
      };

      // Validate cleanup parameter
      const cleanup = params.cleanup === "keep" ? "keep" : "delete";

      const agentId = await this.orchestrator.spawn({
        task: params.task,
        agentId: params.agentId,
        cleanup,
        model: params.model,
        timeout: params.timeout,
      });

      return Result.ok(
        ToolResult.success({
          agentId,
          task: params.task,
          cleanup,
          message: `Sub-agent '${agentId}' spawned successfully`,
        }),
      );
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}

/**
 * SessionsForkTool - Forks current session with context
 */
class SessionsForkTool implements ITool {
  readonly name = SessionsForkToolSchema.name;
  readonly description = SessionsForkToolSchema.description;
  readonly schema = SessionsForkToolSchema.parameters;

  constructor(
    private readonly forkable: ForkableSession,
    private readonly getParentSessionId?: () => string | null,
  ) {}

  /**
   * Resolve the actual parent session ID.
   * Uses getParentSessionId callback (returns real Copilot session UUID),
   * falls back to 'main' if unavailable.
   */
  private resolveParentSessionId(): string {
    return this.getParentSessionId?.() ?? "main";
  }

  async execute(parameters: unknown): Promise<Result<ToolResult, Error>> {
    try {
      const params = parameters as {
        task: string;
        contextMode?: "exact" | "summary";
        timeout?: number;
      };

      if (!params.contextMode) {
        return Result.ok(
          ToolResult.success({
            error: "contextMode parameter is required",
            message:
              'You must specify contextMode: "exact" (identical context copy, hits LLM KV cache — fast and cheap) or "summary" (compacted approximation, smaller but no cache hit). Choose based on whether the subtask needs full fidelity or just key points.',
          }),
        );
      }

      if (params.contextMode === "exact") {
        const sourceSessionId = this.getParentSessionId?.();
        if (!sourceSessionId) {
          return Result.ok(
            ToolResult.success({
              error: "no_active_session",
              message:
                "Cannot perform exact fork: no active parent session found. The parent session must be running for exact context cloning.",
            }),
          );
        }

        const result = await this.forkable.fork({
          task: params.task,
          parentSessionId: "main",
          contextMode: "exact",
          sourceSessionId,
          timeout: params.timeout,
        });

        return Result.ok(
          ToolResult.success({
            forkId: result.forkId,
            task: params.task,
            contextMode: "exact",
            success: result.success,
            message: `Session forked with exact context copy as '${result.forkId}' (KV cache eligible)`,
          }),
        );
      }

      // summary mode
      const parentSessionId = this.resolveParentSessionId();
      const result = await this.forkable.fork({
        task: params.task,
        parentSessionId,
        contextMode: "summary",
        timeout: params.timeout,
      });

      return Result.ok(
        ToolResult.success({
          forkId: result.forkId,
          task: params.task,
          contextMode: "summary",
          contextUsed: result.contextUsed,
          success: result.success,
          message: `Session forked with summarized context as '${result.forkId}'`,
        }),
      );
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}

/**
 * SessionsListTool - Lists all active sub-agent sessions
 */
class SessionsListTool implements ITool {
  readonly name = SessionsListToolSchema.name;
  readonly description = SessionsListToolSchema.description;
  readonly schema = SessionsListToolSchema.parameters;

  constructor(private readonly orchestrator: OpenClawStyleOrchestrator) {}

  async execute(_parameters: unknown): Promise<Result<ToolResult, Error>> {
    try {
      const agents = await this.orchestrator.listAgents();

      return Result.ok(
        ToolResult.success({
          agents,
          count: agents.length,
          message: `Found ${agents.length} active sub-agent(s)`,
        }),
      );
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}

/**
 * SessionsSendTool - Sends a message to an existing sub-agent
 */
class SessionsSendTool implements ITool {
  readonly name = SessionsSendToolSchema.name;
  readonly description = SessionsSendToolSchema.description;
  readonly schema = SessionsSendToolSchema.parameters;

  constructor(
    private readonly orchestrator: OpenClawStyleOrchestrator,
    private readonly messageBroker?: IMessageBroker,
  ) {}

  async execute(parameters: unknown): Promise<Result<ToolResult, Error>> {
    try {
      const params = parameters as {
        agentId: string;
        message: string;
      };

      // Verify agent exists
      const agentInfo = this.orchestrator.getAgentInfo(params.agentId);
      if (!agentInfo) {
        return Result.fail(new Error(`Agent not found: ${params.agentId}`));
      }

      // Route through MessageBroker if available
      if (this.messageBroker) {
        await this.messageBroker.send({
          id: `send-${Date.now()}`,
          from: "main",
          to: params.agentId,
          type: "request",
          content: params.message,
          priority: "normal",
          timestamp: Date.now(),
        });

        return Result.ok(
          ToolResult.success({
            agentId: params.agentId,
            message: params.message,
            status: "delivered",
            note: "Message routed via MessageBroker",
          }),
        );
      }

      // Fallback: direct log (no broker available)
      console.log(
        `[sessions_send] Message to agent ${params.agentId}: ${params.message}`,
      );

      return Result.ok(
        ToolResult.success({
          agentId: params.agentId,
          message: params.message,
          status: "queued",
          note: "Message queued (MessageBroker not available)",
        }),
      );
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}

/**
 * SessionsStatusTool - Check status of a spawned sub-agent
 */
class SessionsStatusTool implements ITool {
  readonly name = SessionsStatusToolSchema.name;
  readonly description = SessionsStatusToolSchema.description;
  readonly schema = SessionsStatusToolSchema.parameters;

  constructor(
    private readonly orchestrator: OpenClawStyleOrchestrator,
    private readonly agentStateManager?: AgentStateManager,
  ) {}

  async execute(parameters: unknown): Promise<Result<ToolResult, Error>> {
    try {
      const params = parameters as {
        agentId: string;
      };

      const status = this.orchestrator.getAgentStatus(params.agentId);

      if (!status) {
        return Result.ok(
          ToolResult.success({
            agentId: params.agentId,
            status: "not_found",
            error: "Agent not found - may have been deleted or never existed",
            message: `Agent ${params.agentId} not found`,
          }),
        );
      }

      // Enrich with AgentStateManager data if available
      const commState = this.agentStateManager?.getState(params.agentId);
      const health = this.agentStateManager?.checkHealth(params.agentId);

      return Result.ok(
        ToolResult.success({
          agentId: status.agentId,
          status: status.status,
          response: status.response,
          durationMs: status.durationMs,
          error: status.error,
          // Phase 3B enrichments
          health: health ?? "unknown",
          progress: commState?.progress,
          currentAction: commState?.currentAction,
          currentTool: commState?.currentTool,
          metrics: commState?.metrics
            ? {
                toolCallCount: commState.metrics.toolCallCount,
                messageCount: commState.metrics.messageCount,
                tokensUsed: commState.metrics.tokensUsed,
              }
            : undefined,
          pendingMessages: commState?.pendingInjections ?? 0,
          message: `Agent ${params.agentId} status: ${status.status}`,
        }),
      );
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}

/**
 * Register sub-agent tools with Phase 0 tool system
 *
 * Creates ITool instances for all sub-agent tools and registers them
 * with the tool registry. This enables the main agent to spawn and manage
 * sub-agents via natural language commands.
 *
 * @param toolRegistry - Phase 0 tool registry
 * @param orchestrator - OpenClawStyleOrchestrator instance
 * @param forkable - ForkableSession instance
 *
 * @example
 * ```typescript
 * const registry = Container.resolve<IToolRegistry>(Tokens.IToolRegistry);
 * const orchestrator = Container.resolve<OpenClawStyleOrchestrator>(Tokens.OpenClawStyleOrchestrator);
 * const forkable = Container.resolve<ForkableSession>(Tokens.ForkableSession);
 *
 * await registerSubAgentTools(registry, orchestrator, forkable);
 * ```
 */
export async function registerSubAgentTools(
  toolRegistry: IToolRegistry,
  orchestrator: OpenClawStyleOrchestrator,
  forkable: ForkableSession,
  messageBroker?: IMessageBroker,
  agentStateManager?: AgentStateManager,
  getParentSessionId?: () => string | null,
): Promise<void> {
  // 1. Register sessions_spawn tool
  const spawnTool = new SessionsSpawnTool(orchestrator);
  const spawnResult = await toolRegistry.register(spawnTool);
  if (spawnResult.isFailure()) {
    throw spawnResult.getError();
  }

  // 2. Register sessions_fork tool
  const forkTool = new SessionsForkTool(forkable, getParentSessionId);
  const forkResult = await toolRegistry.register(forkTool);
  if (forkResult.isFailure()) {
    throw forkResult.getError();
  }

  // 3. Register sessions_list tool
  const listTool = new SessionsListTool(orchestrator);
  const listResult = await toolRegistry.register(listTool);
  if (listResult.isFailure()) {
    throw listResult.getError();
  }

  // 4. Register sessions_send tool (with MessageBroker)
  const sendTool = new SessionsSendTool(orchestrator, messageBroker);
  const sendResult = await toolRegistry.register(sendTool);
  if (sendResult.isFailure()) {
    throw sendResult.getError();
  }

  // 5. Register sessions_status tool (with AgentStateManager)
  const statusTool = new SessionsStatusTool(orchestrator, agentStateManager);
  const statusResult = await toolRegistry.register(statusTool);
  if (statusResult.isFailure()) {
    throw statusResult.getError();
  }

  console.log("✅ Registered 5 sub-agent tools with tool system");
  console.log("   - sessions_spawn: Spawn new sub-agent (non-blocking)");
  console.log("   - sessions_fork: Fork with context");
  console.log("   - sessions_list: List active agents");
  console.log(
    `   - sessions_send: Send message to agent${messageBroker ? " (via MessageBroker)" : " (direct)"}`,
  );
  console.log(
    `   - sessions_status: Check agent status${agentStateManager ? " (enriched)" : ""}`,
  );
}

// Export legacy handler functions for backward compatibility
// These are now used internally by the ITool implementations

/**
 * @deprecated Use SessionsSpawnTool instead
 */
export async function sessionsSpawnTool(
  orchestrator: OpenClawStyleOrchestrator,
  params: {
    task: string;
    agentId?: string;
    cleanup?: string;
    model?: string;
  },
): Promise<string> {
  const cleanup = params.cleanup === "keep" ? "keep" : "delete";

  return orchestrator.spawn({
    task: params.task,
    agentId: params.agentId,
    cleanup,
    model: params.model,
  });
}

/**
 * @deprecated Use SessionsListTool instead
 */
export async function sessionsListTool(
  orchestrator: OpenClawStyleOrchestrator,
): Promise<AgentInfo[]> {
  return orchestrator.listAgents();
}

/**
 * @deprecated Use SessionsSendTool instead
 */
export async function sessionsSendTool(
  orchestrator: OpenClawStyleOrchestrator,
  params: {
    agentId: string;
    message: string;
  },
): Promise<string> {
  const agentInfo = orchestrator.getAgentInfo(params.agentId);
  if (!agentInfo) {
    throw new Error(`Agent not found: ${params.agentId}`);
  }

  console.log(
    `TODO: Send message to agent ${params.agentId}: ${params.message}`,
  );
  return `Message queued for agent ${params.agentId} (placeholder)`;
}

/**
 * @deprecated Use SessionsSpawnTool instead
 */
export async function sessionsHistoryTool(
  orchestrator: OpenClawStyleOrchestrator,
  params: {
    agentId: string;
    limit?: number;
  },
): Promise<Array<{ role: string; content: string }>> {
  const agentInfo = orchestrator.getAgentInfo(params.agentId);
  if (!agentInfo) {
    throw new Error(`Agent not found: ${params.agentId}`);
  }

  console.log(
    `TODO: Retrieve history for agent ${params.agentId}, limit: ${params.limit ?? "all"}`,
  );
  return [
    {
      role: "system",
      content: "History retrieval not yet implemented (placeholder)",
    },
  ];
}

/**
 * @deprecated Use orchestrator.destroyAgent() directly
 */
export async function sessionsDestroyTool(
  orchestrator: OpenClawStyleOrchestrator,
  params: {
    agentId: string;
  },
): Promise<string> {
  await orchestrator.destroyAgent(params.agentId);
  return `Agent ${params.agentId} destroyed`;
}
