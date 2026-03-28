/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENTRUNTIME_APPLICATION_TOOLEXECUTOR_TS.MAIN_TOOLEXECUTOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ToolExecutor module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\application\ToolExecutor.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { DomainError } from "../core/errors/DomainError.js";
import {
    ToolExecutionError,
    ToolNotFoundError,
} from "../core/errors/ToolExecutionError.js";
import { IEventBus } from "../core/interfaces/IEventBus.js";
import { ILogger } from "../core/interfaces/ILogger.js";
import { ITracer } from "../core/interfaces/ITracer.js";
import { Result } from "../core/types/Result.js";
import {
    IToolExecutor,
    ToolExecutionResult,
} from "../domain/interfaces/IToolExecutor.js";
import { IToolRegistry } from "../tools/domain/interfaces/IToolRegistry.js";

/**
 * Tool executor implementation (Agent layer)
 *
 * Routes tool execution to plugin or MCP handlers with comprehensive
 * tracing, error handling, and lifecycle events.
 *
 * Note: This is the agent-layer tool executor implementing IToolExecutor.
 * It returns ToolExecutionResult with timing and lifecycle events.
 *
 * A separate ToolInvoker exists in tools/application/ToolExecutor.ts which
 * provides lower-level tool invocation with JSON schema validation (ajv).
 * The two serve different architectural layers:
 * - This ToolExecutor: Agent orchestration (lifecycle events, domain errors)
 * - ToolInvoker: Tool system core (schema validation, direct invocation)
 */
export class ToolExecutor implements IToolExecutor {
  constructor(
    private readonly toolRegistry: IToolRegistry,
    private readonly logger: ILogger,
    private readonly tracer: ITracer,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<Result<ToolExecutionResult, DomainError>> {
    return await this.tracer.span("ToolExecutor.execute", async (span) => {
      const startTime = Date.now();

      try {
        span.setAttribute("tool.name", toolName);
        span.setAttribute("tool.args_count", Object.keys(args).length);

        // 1. Lookup tool
        const toolResult = await this.toolRegistry.get(toolName);

        if (toolResult.isFailure()) {
          const error = new ToolExecutionError(
            toolName,
            args,
            `Failed to query tool registry: ${toolResult.getError().message}`,
            toolResult.getError(),
          );

          span.setStatus("error", error.message);
          span.setAttribute("tool.found", false);

          return Result.fail(error);
        }

        const tool = toolResult.getValue();

        if (!tool) {
          const error = new ToolNotFoundError(toolName);

          span.setStatus("error", error.message);
          span.setAttribute("tool.found", false);

          return Result.fail(error);
        }

        const source =
          toolName.startsWith("mcp:") || tool.name.startsWith("mcp:")
            ? "mcp"
            : "custom";

        span.setAttribute("tool.source", source);
        span.setAttribute("tool.found", true);

        this.logger.info("Invoking tool", {
          toolName,
          source,
          parametersProvided: Object.keys(args),
        });

        // Log full parameters at DEBUG level
        this.logger.debug("Tool parameters", {
          toolName,
          parameters: args,
        });

        // 2. Emit pre-execution event
        await this.eventBus.publish({
          eventName: "tool.before_execute",
          occurredAt: new Date(),
          payload: {
            toolName,
            source,
            args,
          },
        });

        // 3. Execute tool
        span.addEvent("tool.executing");

        let output: unknown;
        try {
          const executeResult = await tool.execute(args);

          if (executeResult.isFailure()) {
            const durationMs = Date.now() - startTime;
            const executeError = executeResult.getError();

            this.logger.error(
              `Tool ${toolName} execution failed after ${durationMs}ms`,
              executeError,
              {
                toolName,
                source,
                durationMs,
                errorMessage: executeError.message,
              },
            );

            span.setStatus("error", executeError.message);
            span.setAttribute("tool.duration_ms", durationMs);

            // Emit failure event
            await this.eventBus.publish({
              eventName: "tool.execute_failed",
              occurredAt: new Date(),
              payload: {
                toolName,
                source,
                error: executeError.message,
                durationMs,
              },
            });

            return Result.fail(
              new ToolExecutionError(
                toolName,
                args,
                executeError.message,
                executeError,
              ),
            );
          }

          // Extract data from ToolResult
          const toolResult = executeResult.getValue();
          if (toolResult.isError()) {
            const durationMs = Date.now() - startTime;
            const toolError = toolResult.getError();

            this.logger.error(
              `Tool ${toolName} returned error result after ${durationMs}ms`,
              toolError,
              {
                toolName,
                source,
                durationMs,
                errorMessage: toolError.message,
              },
            );

            span.setStatus("error", toolError.message);
            span.setAttribute("tool.duration_ms", durationMs);

            // Emit failure event
            await this.eventBus.publish({
              eventName: "tool.execute_failed",
              occurredAt: new Date(),
              payload: {
                toolName,
                source,
                error: toolError.message,
                durationMs,
              },
            });

            return Result.fail(
              new ToolExecutionError(
                toolName,
                args,
                toolError.message,
                toolError,
              ),
            );
          }

          output = toolResult.getData();
        } catch (executeError: any) {
          const durationMs = Date.now() - startTime;

          this.logger.error(
            `Tool ${toolName} threw exception after ${durationMs}ms`,
            executeError,
            {
              toolName,
              source,
              durationMs,
              errorMessage: executeError.message,
            },
          );

          span.setStatus("error", executeError.message);
          span.setAttribute("tool.duration_ms", durationMs);

          // Emit failure event
          await this.eventBus.publish({
            eventName: "tool.execute_failed",
            occurredAt: new Date(),
            payload: {
              toolName,
              source,
              error: executeError.message,
              durationMs,
            },
          });

          return Result.fail(
            new ToolExecutionError(
              toolName,
              args,
              executeError.message,
              executeError,
            ),
          );
        }

        const durationMs = Date.now() - startTime;

        span.setAttribute("tool.duration_ms", durationMs);
        span.setAttribute("tool.success", true);
        span.addEvent("tool.executed", {
          "tool.duration_ms": durationMs,
        });

        // Log successful completion with timing
        this.logger.info(
          `Tool ${toolName} completed successfully in ${durationMs}ms`,
          {
            toolName,
            source,
            durationMs,
            success: true,
          },
        );

        // Log result at DEBUG level (truncate if too large)
        const resultStr =
          typeof output === "string"
            ? output.substring(0, 1000)
            : JSON.stringify(output)?.substring(0, 1000) || "(no output)";

        this.logger.debug("Tool result", {
          toolName,
          result: resultStr,
          resultType: typeof output,
        });

        // 4. Emit post-execution event
        await this.eventBus.publish({
          eventName: "tool.executed",
          occurredAt: new Date(),
          payload: {
            toolName,
            source,
            durationMs,
            success: true,
          },
        });

        const result: ToolExecutionResult = {
          success: true,
          output,
          durationMs,
        };

        span.setStatus("ok");

        return Result.ok(result);
      } catch (error: any) {
        const durationMs = Date.now() - startTime;

        this.logger.error("Unexpected error in tool execution", error, {
          toolName,
          durationMs,
        });

        span.setStatus("error", error.message);
        span.setAttribute("tool.duration_ms", durationMs);

        return Result.fail(
          new ToolExecutionError(toolName, args, error.message, error),
        );
      }
    });
  }

  async hasTool(toolName: string): Promise<boolean> {
    const result = await this.toolRegistry.get(toolName);

    if (result.isFailure()) {
      this.logger.warn("Error checking if tool exists", {
        toolName,
        error: result.getError().message,
      });
      return false;
    }

    return result.getValue() !== null;
  }

  async getAvailableTools(): Promise<string[]> {
    const result = await this.toolRegistry.list();

    if (result.isFailure()) {
      this.logger.error("Error listing tools", result.getError());
      return [];
    }

    const tools = result.getValue();
    return tools.map((tool) => tool.name);
  }
}
