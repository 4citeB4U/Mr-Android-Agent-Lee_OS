/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.IAGENTSESSION.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = IAgentSession module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\domain\interfaces\IAgentSession.ts
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
 * Agent session interface
 *
 * Represents a conversational session with the Copilot model.
 * Wraps the Copilot SDK session lifecycle and manages conversation history.
 *
 * @example
 * ```typescript
 * const session = container.resolve<IAgentSession>(Tokens.IAgentSession);
 *
 * // Start session
 * const startResult = await session.start();
 * if (startResult.isSuccess()) {
 *   // Send message
 *   const messageResult = await session.sendMessage('Hello!');
 *   if (messageResult.isSuccess()) {
 *     console.log(messageResult.getValue().content);
 *   }
 *
 *   // Get history
 *   const historyResult = await session.getHistory();
 *
 *   // End session
 *   await session.end();
 * }
 * ```
 */

import { Result } from "../../../core/types/Result.js";
import { AssistantResponse, Message } from "./IAgentTypes.js";

/**
 * Session state
 * Represents the current lifecycle state of a session
 */
export type SessionState = "idle" | "running" | "stopped";

/**
 * Agent session interface
 *
 * Manages a conversational session with lifecycle, history, and state tracking.
 */
export interface IAgentSession {
  /**
   * Start the session
   *
   * Creates the underlying Copilot session and transitions to 'running' state.
   * Publishes SessionStartedEvent on success.
   *
   * @returns Result indicating success or failure
   * @throws Never throws - returns Result.fail on error
   */
  start(): Promise<Result<void, Error>>;

  /**
   * Send a message to the agent
   *
   * @param content - Message content to send
   * @returns Result containing assistant response on success, or error on failure
   * @throws Never throws - returns Result.fail on error
   */
  sendMessage(content: string): Promise<Result<AssistantResponse, Error>>;

  /**
   * Get conversation history
   *
   * @returns Result containing array of messages (user + assistant)
   * @throws Never throws - returns Result.fail on error
   */
  getHistory(): Promise<Result<Message[], Error>>;

  /**
   * End the session
   *
   * Closes the underlying Copilot session and transitions to 'stopped' state.
   * Publishes SessionEndedEvent on success.
   *
   * @returns Result indicating success or failure
   * @throws Never throws - returns Result.fail on error
   */
  end(): Promise<Result<void, Error>>;

  /**
   * Get current session state
   *
   * @returns Current state ('idle', 'running', or 'stopped')
   */
  getState(): SessionState;
}
