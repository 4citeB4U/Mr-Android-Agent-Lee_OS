/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SUBAGENTMANAGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SubAgentManager module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\sub-agents\SubAgentManager.ts
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
 * Sub-Agent Manager — Agent Lee native implementation
 *
 * Spawns lightweight task agents using aiService.process().
 * No CopilotClient dependency.
 */

import { randomUUID } from "crypto";
import { aiService } from "../../../services/ai.js";
import { ModelSelector } from "../agent/model-selection/ModelSelector.js";
import { DomainEvent, IEventBus } from "../core/interfaces/IEventBus.js";
import { ILogger } from "../core/interfaces/ILogger.js";
import { ITracer } from "../core/interfaces/ITracer.js";
import { AgentInfo, SpawnOptions, SpawnResult } from "./types.js";

export class SubAgentManager {
  private activeAgents: Map<string, AgentInfo> = new Map();

  constructor(
    private readonly modelSelector: ModelSelector,
    private readonly logger: ILogger,
    private readonly tracer: ITracer,
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * Spawn a sub-agent to execute a task.
   * Runs synchronously via aiService.process() and records the result.
   */
  async spawn(options: SpawnOptions): Promise<SpawnResult> {
    return this.tracer.span("SubAgentManager.spawn", async (span) => {
      const agentId = options.agentId ?? randomUUID();
      const sessionId = randomUUID();
      const model = options.model ?? this.modelSelector.getDefaultModel();
      const startTime = Date.now();

      span.setAttribute("sub_agent.id", agentId);
      span.setAttribute("sub_agent.model", model);

      const agentInfo: AgentInfo = {
        agentId,
        model,
        spawned: new Date(),
        status: "running",
        task: options.task,
        sessionId,
      };

      this.activeAgents.set(agentId, agentInfo);

      await this.eventBus.publish({
        eventName: "sub_agent.spawned",
        occurredAt: new Date(),
        payload: { agentId, task: options.task, model },
      } as DomainEvent<unknown>);

      try {
        const taskPrompt = [
          `You are a focused sub-agent. Complete the following task concisely and accurately.`,
          ``,
          `Task: ${options.task}`,
        ].join("\n");

        const response = await aiService.process(taskPrompt);
        const durationMs = Date.now() - startTime;

        agentInfo.status = "completed";
        agentInfo.response = response;
        agentInfo.durationMs = durationMs;

        await this.eventBus.publish({
          eventName: "sub_agent.completed",
          occurredAt: new Date(),
          payload: { agentId, durationMs },
        } as DomainEvent<unknown>);

        span.setStatus("ok");

        return {
          agentId,
          sessionId,
          status: "completed",
          model,
          task: options.task,
          response,
          success: true,
          durationMs,
        };
      } catch (err: any) {
        const durationMs = Date.now() - startTime;
        agentInfo.status = "failed";
        agentInfo.error = err.message;
        agentInfo.durationMs = durationMs;

        await this.eventBus.publish({
          eventName: "sub_agent.failed",
          occurredAt: new Date(),
          payload: { agentId, error: (err as Error).message },
        } as DomainEvent<unknown>);

        span.setStatus("error", err.message);
        this.logger.error(`Sub-agent ${agentId} failed`, err);

        return {
          agentId,
          sessionId,
          status: "failed",
          model,
          task: options.task,
          success: false,
          durationMs,
        };
      }
    });
  }

  getAgent(agentId: string): AgentInfo | undefined {
    return this.activeAgents.get(agentId);
  }

  getAgentStatus(agentId: string): AgentInfo | undefined {
    return this.activeAgents.get(agentId);
  }

  getAgentInfo(agentId: string): AgentInfo | undefined {
    return this.activeAgents.get(agentId);
  }

  async waitForCompletion(agentId: string, _timeoutMs?: number): Promise<void> {
    // Agents run synchronously in this implementation, so they're already done by the time we're called.
    const info = this.activeAgents.get(agentId);
    if (!info || info.status === "completed" || info.status === "failed")
      return;
  }

  async destroyAgent(agentId: string): Promise<void> {
    this.activeAgents.delete(agentId);
  }

  listAgents(): AgentInfo[] {
    return Array.from(this.activeAgents.values());
  }

  clearCompleted(): void {
    for (const [id, info] of this.activeAgents) {
      if (info.status === "completed" || info.status === "failed") {
        this.activeAgents.delete(id);
      }
    }
  }
}
