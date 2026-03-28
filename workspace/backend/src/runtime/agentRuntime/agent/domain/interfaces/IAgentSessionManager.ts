/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.IAGENTSESSIONMANAGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IAgentSessionManager module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\domain\interfaces\IAgentSessionManager.ts
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
 * Agent Session Manager Interface
 *
 * Orchestrates the complete agent session lifecycle, integrating:
 * - Workspace instruction loading
 * - Tool registry and execution
 * - Tracing instrumentation
 * - Event coordination
 *
 * @example
 * ```typescript
 * const manager = Container.resolve<IAgentSessionManager>(Tokens.IAgentSessionManager);
 *
 * // Initialize with configuration
 * const initResult = await manager.initialize({
 *   model: 'gpt-4',
 *   temperature: 0.7
 * });
 *
 * if (initResult.isSuccess()) {
 *   await manager.start();
 *   const response = await manager.sendMessage('Hello!');
 *   await manager.stop();
 * }
 * ```
 */

import { IMessageBroker } from "../../../communication/domain/IMessageBroker.js";
import { DomainError } from "../../../core/errors/DomainError.js";
import { Result } from "../../../core/types/Result.js";
import type { StreamingEvent, ToolEvent } from "../events/StreamingEvents.js";
import { SessionTranscript } from "../value-objects/SessionTranscript.js";
import type { Message } from "./IAgentTypes.js";

/**
 * Agent session configuration
 */
export interface AgentSessionConfig {
  /** Model to use (e.g., 'gpt-4', 'claude-3') */
  model: string;

  /** System prompt (optional - workspace instructions are appended automatically) */
  systemPrompt?: string;

  /** Temperature for generation (0-2) */
  temperature?: number;

  /** Maximum tokens for generation */
  maxTokens?: number;

  /** Enable tracing instrumentation */
  enableTracing?: boolean;

  /** Timeout for a single message turn in milliseconds (default: 600000 = 10 minutes). Set to 0 for no timeout. */
  messageTimeout?: number;
}

/**
 * Agent session manager interface
 *
 * High-level orchestrator for agent session lifecycle.
 */
export interface IAgentSessionManager {
  /**
   * Initialize agent session with workspace instructions and tools.
   *
   * @param config - Agent session configuration
   * @returns Success or error
   *
   * Events emitted:
   * - agent.initializing
   * - agent.initialized
   * - agent.init_failed (on error)
   */
  initialize(config: AgentSessionConfig): Promise<Result<void, Error>>;

  /**
   * Start agent session (begin accepting requests)
   *
   * Starts the underlying Copilot SDK session and transitions to running state.
   * Must be called after initialize().
   */
  start(): Promise<Result<void, Error>>;

  /**
   * Stop agent session gracefully
   *
   * Performs graceful shutdown:
   * 1. Stop agent session
   * 2. Cleanup resources
   */
  stop(): Promise<Result<void, Error>>;

  /**
   * Check if agent session is running
   */
  isRunning(): boolean;

  /**
   * Send a message to the agent
   */
  sendMessage(message: string): Promise<Result<string, Error>>;

  /**
   * Inject a system message and trigger an agent turn.
   */
  injectMessage(
    content: string,
    source?: string,
  ): Promise<Result<string, Error>>;

  /**
   * Register a callback for async responses (e.g., from injected messages).
   */
  onAsyncResponse(callback: (response: string, source?: string) => void): void;

  /**
   * Register a callback for streaming assistant deltas.
   */
  onStreamingEvent(callback: (event: StreamingEvent) => void): void;

  /**
   * Register a callback for tool execution events.
   */
  onToolEvent(callback: (event: ToolEvent) => void): void;

  /**
   * Abort an in-flight request.
   */
  abort(): Promise<Result<void, Error>>;

  /**
   * Set the MessageBroker for receiving messages from other agents/systems.
   */
  setMessageBroker(broker: IMessageBroker): void;

  /**
   * Get the underlying Copilot SDK session ID.
   */
  getSessionId(): string | null;

  /**
   * Get conversation history.
   */
  getHistory(): Promise<Result<Message[], Error>>;

  /**
   * Execute a tool
   */
  executeTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<Result<unknown, DomainError>>;

  /**
   * Get available tools
   */
  getAvailableTools(): Promise<string[]>;

  /**
   * Get session transcript for context cloning (if supported).
   */
  getTranscript?(): SessionTranscript;
}
