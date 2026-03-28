/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CONFIGLOADER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ConfigLoader module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\config\ConfigLoader.ts
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
 * ConfigLoader — simplified (Zod-free) implementation for Agent Lee runtime.
 * Reads JSON from disk and merges with defaults via parseConfig().
 */

import fs from 'fs/promises';
import path from 'path';
import { AppConfig, getDefaultConfig, parseConfig } from './AppConfig.js';
import type { IPlatformPaths } from '../interfaces/IPlatformPaths.js';
import { Result } from '../types/Result.js';
import { ConfigurationError } from '../errors/ConfigurationError.js';

export class ConfigLoader {
  constructor(private readonly platformPaths: IPlatformPaths) {}

  async load(configPath?: string): Promise<Result<AppConfig, ConfigurationError>> {
    try {
      const filePath = configPath ?? path.join(this.platformPaths.getConfigDir(), 'config.json');
      let partial: Partial<AppConfig> = {};
      try {
        const raw = await fs.readFile(filePath, 'utf-8');
        partial = JSON.parse(raw) as Partial<AppConfig>;
      } catch {
        // File missing or unreadable — use defaults
      }
      return Result.ok(parseConfig(partial));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return Result.fail(new ConfigurationError('LOAD_FAILED', msg));
    }
  }

  async save(config: AppConfig, filePath: string): Promise<Result<void, ConfigurationError>> {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8');
      return Result.ok(undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return Result.fail(new ConfigurationError('SAVE_FAILED', msg, { filePath }));
    }
  }

  async generateDefault(filePath: string): Promise<Result<void, ConfigurationError>> {
    return this.save(getDefaultConfig(), filePath);
  }
}
