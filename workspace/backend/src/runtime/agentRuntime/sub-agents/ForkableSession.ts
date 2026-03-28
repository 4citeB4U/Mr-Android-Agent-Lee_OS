/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.FORKABLESESSION.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ForkableSession module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\sub-agents\ForkableSession.ts
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
 * Forkable Session — context cloning for sub-agents
 *
 * Extracts parent conversation context and spawns a focused sub-agent
 * via SubAgentManager. No CopilotClient dependency.
 */

import { ILogger } from "../core/interfaces/ILogger.js";
import { ITracer } from "../core/interfaces/ITracer.js";
import { ForkOptions } from "./fork-types.js";
import { SubAgentManager } from "./SubAgentManager.js";
import { SpawnResult } from "./types.js";

export class ForkableSession {
  constructor(
    private readonly subAgentManager: SubAgentManager,
    private readonly logger: ILogger,
    private readonly tracer: ITracer,
  ) {}

  /**
   * Fork a sub-agent from parent context.
   * Copies context messages as a prefix prompt, then spawns the task agent.
   */
  async fork(
    options: ForkOptions,
    parentMessages: Array<{ role: string; content: string }> = [],
  ): Promise<SpawnResult> {
    return this.tracer.span("ForkableSession.fork", async (span) => {
      span.setAttribute("fork.parentSessionId", options.parentSessionId);
      span.setAttribute("fork.contextMode", options.contextMode);

      const recentCount = options.recentCount ?? 10;

      // Build context prefix from parent history
      let contextPrefix = "";
      if (options.contextMode === "exact" && parentMessages.length > 0) {
        const recent = parentMessages.slice(-recentCount);
        contextPrefix = recent
          .map(
            (m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
          )
          .join("\n");
      }

      const taskWithContext = contextPrefix
        ? `Context from parent session:\n${contextPrefix}\n\n---\nTask: ${options.task}`
        : options.task;

      this.logger.debug(
        `Forking sub-agent from session ${options.parentSessionId}`,
        {
          contextMode: options.contextMode,
          parentMessages: parentMessages.length,
        },
      );

      const result = await this.subAgentManager.spawn({
        task: taskWithContext,
      });

      span.setStatus(result.status === "failed" ? "error" : "ok");
      return { ...result, forkId: result.agentId };
    });
  }
}
