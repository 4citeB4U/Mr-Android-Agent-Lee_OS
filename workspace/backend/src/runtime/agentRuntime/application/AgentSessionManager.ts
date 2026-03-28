/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.AGENTSESSIONMANAGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = AgentSessionManager module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\application\AgentSessionManager.ts
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
 * Agent Session Manager — Agent Lee native implementation
 *
 * Replaces CopilotClient with direct aiService.process() calls.
 * Manages conversation history, tools, and workspace instruction context.
 */

import { randomUUID } from "crypto";
import { aiService } from "../../../services/ai.js";
import type {
    StreamingEvent,
    ToolEvent,
} from "../agent/domain/events/StreamingEvents.js";
import type {
    AgentSessionConfig,
    IAgentSessionManager,
} from "../agent/domain/interfaces/IAgentSessionManager.js";
import type { Message } from "../agent/domain/interfaces/IAgentTypes.js";
import { SessionTranscript } from "../agent/domain/value-objects/SessionTranscript.js";
import type { IMessageBroker } from "../communication/domain/IMessageBroker.js";
import { DomainError } from "../core/errors/DomainError.js";
import type { DomainEvent, IEventBus } from "../core/interfaces/IEventBus.js";
import type { ILogger } from "../core/interfaces/ILogger.js";
import type { ITracer } from "../core/interfaces/ITracer.js";
import { Result } from "../core/types/Result.js";
import type { IToolRegistry } from "../tools/domain/interfaces/IToolRegistry.js";

/** Simple concrete error for session-level failures */
class SessionError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("SESSION_ERROR", message, context);
  }
}

export class AgentSessionManager implements IAgentSessionManager {
  private sessionId: string | null = null;
  private running = false;
  private history: Message[] = [];
  private transcript: SessionTranscript = SessionTranscript.empty();
  private systemPrompt = "";
  private config: AgentSessionConfig | null = null;

  private asyncResponseCallbacks: Array<
    (response: string, source?: string) => void
  > = [];
  private streamingCallbacks: Array<(event: StreamingEvent) => void> = [];
  private toolCallbacks: Array<(event: ToolEvent) => void> = [];
  private messageBroker: IMessageBroker | null = null;

  constructor(
    private readonly toolRegistry: IToolRegistry,
    private readonly logger: ILogger,
    private readonly tracer: ITracer,
    private readonly eventBus: IEventBus,
  ) {}

  private pub<T>(eventName: string, payload: T): Promise<void> {
    return this.eventBus.publish({
      eventName,
      occurredAt: new Date(),
      payload,
    } as DomainEvent<T>);
  }

  async initialize(config: AgentSessionConfig): Promise<Result<void, Error>> {
    return this.tracer.span("AgentSessionManager.initialize", async (span) => {
      try {
        this.config = config;
        this.sessionId = randomUUID();
        this.history = [];
        this.transcript = SessionTranscript.empty();

        this.systemPrompt =
          config.systemPrompt ??
          "You are Agent Lee, a sovereign AI assistant. Be concise, accurate, and helpful.";

        span.setAttribute("session.id", this.sessionId);
        span.setStatus("ok");

        await this.pub("agent.initializing", { sessionId: this.sessionId });
        await this.pub("agent.initialized", { sessionId: this.sessionId });

        this.logger.info(
          `AgentSessionManager initialized — session ${this.sessionId}`,
        );
        return Result.ok(undefined);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        span.setStatus("error", msg);
        await this.pub("agent.init_failed", { error: msg });
        return Result.fail(err instanceof Error ? err : new Error(msg));
      }
    });
  }

  async start(): Promise<Result<void, Error>> {
    if (!this.sessionId) {
      return Result.fail(
        new Error("Session not initialized — call initialize() first"),
      );
    }
    this.running = true;
    await this.pub("agent.started", { sessionId: this.sessionId });
    this.logger.info(`Agent session started: ${this.sessionId}`);
    return Result.ok(undefined);
  }

  async stop(): Promise<Result<void, Error>> {
    this.running = false;
    if (this.sessionId) {
      await this.pub("agent.stopped", { sessionId: this.sessionId });
      this.logger.info(`Agent session stopped: ${this.sessionId}`);
    }
    return Result.ok(undefined);
  }

  isRunning(): boolean {
    return this.running;
  }

  async sendMessage(message: string): Promise<Result<string, Error>> {
    return this.tracer.span("AgentSessionManager.sendMessage", async (span) => {
      try {
        span.setAttribute("message.length", message.length);

        const historyText = this.history
          .map(
            (m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
          )
          .join("\n");

        const prompt = [
          this.systemPrompt,
          historyText ? `\nConversation so far:\n${historyText}` : "",
          `\nUser: ${message}`,
          "Assistant:",
        ].join("\n");

        const response = await aiService.process(prompt);

        this.history.push({ role: "user", content: message });
        this.history.push({ role: "assistant", content: response });

        span.setStatus("ok");
        return Result.ok(response);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        span.setStatus("error", msg);
        this.logger.error(
          "sendMessage failed",
          err instanceof Error ? err : new Error(msg),
        );
        return Result.fail(err instanceof Error ? err : new Error(msg));
      }
    });
  }

  async injectMessage(
    content: string,
    source?: string,
  ): Promise<Result<string, Error>> {
    const result = await this.sendMessage(content);
    if (result.isSuccess()) {
      const responseText = result.getValue();
      for (const cb of this.asyncResponseCallbacks) {
        cb(responseText, source);
      }
    }
    return result;
  }

  onAsyncResponse(callback: (response: string, source?: string) => void): void {
    this.asyncResponseCallbacks.push(callback);
  }

  onStreamingEvent(callback: (event: StreamingEvent) => void): void {
    this.streamingCallbacks.push(callback);
  }

  onToolEvent(callback: (event: ToolEvent) => void): void {
    this.toolCallbacks.push(callback);
  }

  async abort(): Promise<Result<void, Error>> {
    this.logger.info("Abort requested — no in-flight request to cancel");
    return Result.ok(undefined);
  }

  setMessageBroker(broker: IMessageBroker): void {
    this.messageBroker = broker;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  async getHistory(): Promise<Result<Message[], Error>> {
    return Result.ok([...this.history]);
  }

  async executeTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<Result<unknown, DomainError>> {
    return this.tracer.span("AgentSessionManager.executeTool", async (span) => {
      try {
        span.setAttribute("tool.name", toolName);
        const toolResult = await this.toolRegistry.get(toolName);
        if (toolResult.isFailure()) {
          span.setStatus("error", "tool not found");
          return Result.fail(toolResult.getError() as unknown as DomainError);
        }
        const tool = toolResult.getValue();
        if (!tool) {
          span.setStatus("error", "tool null");
          return Result.fail(new SessionError(`Tool not found: ${toolName}`));
        }
        const execResult = await tool.execute(args);
        span.setStatus("ok");
        return execResult as Result<unknown, DomainError>;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        span.setStatus("error", msg);
        return Result.fail(new SessionError(msg));
      }
    });
  }

  async getAvailableTools(): Promise<string[]> {
    try {
      const listResult = await this.toolRegistry.list();
      if (listResult.isFailure()) return [];
      return listResult
        .getValue()
        .map((t) => (t as { name?: string }).name ?? String(t));
    } catch {
      return [];
    }
  }

  getTranscript(): SessionTranscript {
    return this.transcript;
  }
}
