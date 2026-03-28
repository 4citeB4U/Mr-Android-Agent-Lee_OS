/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SHUTDOWNMANAGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ShutdownManager module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\application\ShutdownManager.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { ILogger } from "../core/interfaces/ILogger.js";

/**
 * Shutdown manager
 *
 * Handles graceful shutdown with timeout protection
 */
export class ShutdownManager {
  private shutdownInProgress = false;

  constructor(
    private readonly logger: ILogger,
    private readonly timeoutMs: number = 30000, // 30 seconds default
  ) {}

  /**
   * Execute shutdown with timeout protection
   *
   * @param shutdownFn - Shutdown function to execute
   * @returns Success or timeout error
   */
  async shutdown(shutdownFn: () => Promise<void>): Promise<void> {
    if (this.shutdownInProgress) {
      this.logger.warn("Shutdown already in progress");
      return;
    }

    this.shutdownInProgress = true;

    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
      // Race between shutdown and timeout
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Shutdown timeout after ${this.timeoutMs}ms`));
        }, this.timeoutMs);
      });

      await Promise.race([shutdownFn(), timeout]);

      this.logger.info("Shutdown completed successfully");
    } catch (error: any) {
      this.logger.error("Shutdown failed", error);
      throw error;
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      this.shutdownInProgress = false;
    }
  }
}
