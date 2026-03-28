/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.OPENCLAWSTYLEORCHESTRATOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = OpenClawStyleOrchestrator module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\sub-agents\OpenClawStyleOrchestrator.ts
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
 * OpenClaw-style orchestrator for sub-agent spawning
 *
 * Provides an ergonomic API that mimics OpenClaw's sessions_spawn() pattern.
 * Wraps SubAgentManager with simpler interface and auto-cleanup by default.
 *
 * Key differences from SubAgentManager:
 * - Simpler API: just spawn({ task: "..." })
 * - Auto-cleanup by default (cleanup='delete')
 * - Returns agentId immediately (non-blocking)
 * - Child agents notify parent when complete via sessions_send tool
 *
 * @example
 * ```typescript
 * const orchestrator = new OpenClawStyleOrchestrator(subAgentManager);
 *
 * // Simple spawn - auto-cleanup, non-blocking
 * const agentId = await orchestrator.spawn({
 *   task: 'Analyze this log file for errors'
 * });
 *
 * // Check status later
 * const status = orchestrator.getAgentStatus(agentId);
 * console.log('Status:', status.status);
 *
 * // Keep-alive mode
 * const agentId2 = await orchestrator.spawn({
 *   task: 'Monitor this API endpoint',
 *   cleanup: 'keep'
 * });
 * ```
 */

import { SubAgentManager } from "./SubAgentManager.js";
import { SpawnResult } from "./types.js";

/**
 * Options for spawning a sub-agent in OpenClaw style
 */
export interface OpenClawSpawnOptions {
  /**
   * Task description for the sub-agent
   */
  task: string;

  /**
   * Optional agent ID (generated if not provided)
   */
  agentId?: string;

  /**
   * Cleanup mode: 'delete' (default) or 'keep'
   * - 'delete': Auto-cleanup after completion
   * - 'keep': Keep session alive for further interaction
   */
  cleanup?: "delete" | "keep";

  /**
   * Optional model to use (auto-selected if not provided)
   */
  model?: string;

  /**
   * Timeout in seconds (default: 1800)
   */
  timeout?: number;

  /**
   * Whether to announce results back to the parent session
   */
  announceBack?: boolean;

  /**
   * Optional label for identifying the session
   */
  label?: string;
}

/**
 * OpenClaw-style orchestrator
 *
 * Wraps SubAgentManager with ergonomic API that matches OpenClaw patterns.
 * Now supports non-blocking spawn with agent-to-agent communication.
 */
export class OpenClawStyleOrchestrator {
  constructor(
    private readonly subAgentManager: SubAgentManager,
    private readonly parentSessionId?: string,
  ) {}

  /**
   * Spawn a sub-agent with OpenClaw-style semantics (non-blocking)
   *
   * Algorithm:
   * 1. Set defaults (cleanup='delete')
   * 2. Convert OpenClaw options to SubAgentManager options
   * 3. Call SubAgentManager.spawn() with parent session ID
   * 4. Return agentId immediately
   *
   * Note: This is non-blocking. The child agent will notify the parent
   * when complete via sessions_send tool. Use sessions_status to check progress.
   *
   * @param options - Spawn options
   * @returns Promise resolving to agentId
   *
   * @throws Error if spawn setup fails
   */
  async spawn(options: OpenClawSpawnOptions): Promise<string> {
    // 1. Set defaults
    const cleanup = options.cleanup ?? "delete";

    // 2. Convert to SubAgentManager options
    const spawnOptions = {
      task: options.task,
      agentId: options.agentId,
      model: options.model,
      timeout: options.timeout,
      keepAlive: cleanup === "keep", // Invert: cleanup='delete' → keepAlive=false
    };

    // 3. Call SubAgentManager.spawn() (non-blocking)
    const result: SpawnResult = await this.subAgentManager.spawn(spawnOptions);

    // 4. Return agentId immediately
    console.log(`🚀 Sub-agent ${result.agentId} spawned (non-blocking)`);
    return result.agentId;
  }

  /**
   * Get status of a spawned agent
   *
   * @param agentId - Agent ID to check
   * @returns Agent status or undefined if not found
   */
  getAgentStatus(agentId: string) {
    return this.subAgentManager.getAgentStatus(agentId);
  }

  /**
   * List all active agents
   *
   * Delegates to SubAgentManager.
   *
   * @returns Array of agent info
   */
  async listAgents() {
    return this.subAgentManager.listAgents();
  }

  /**
   * Get info about a specific agent
   *
   * Delegates to SubAgentManager.
   *
   * @param agentId - Agent ID to query
   * @returns Agent info or undefined if not found
   */
  getAgentInfo(agentId: string) {
    return this.subAgentManager.getAgentInfo(agentId);
  }

  /**
   * Wait for an agent to complete, with timeout.
   */
  async waitForCompletion(agentId: string, timeoutMs?: number) {
    return this.subAgentManager.waitForCompletion(agentId, timeoutMs);
  }

  /**
   * Destroy a specific agent
   *
   * Delegates to SubAgentManager.
   *
   * @param agentId - Agent ID to destroy
   */
  async destroyAgent(agentId: string): Promise<void> {
    return this.subAgentManager.destroyAgent(agentId);
  }
}
