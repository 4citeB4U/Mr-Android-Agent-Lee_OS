/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.FILELOGGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = FileLogger module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tracing\infrastructure\FileLogger.ts
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
 * FileLogger — writes JSON lines to a file with sensitive data redaction.
 * 
 * Each log entry is one JSON line (JSONL format) for easy grep/parsing.
 * Uses synchronous append writes for simplicity and crash safety.
 */

import * as fs from 'fs';
import { ILogger } from '../../core/interfaces/ILogger.js';
import { SensitiveDataRedactor } from '../application/SensitiveDataRedactor.js';

export class FileLogger implements ILogger {
  constructor(private readonly filePath: string) {}

  debug(message: string, context?: Record<string, unknown>): void {
    this.write('debug', message, undefined, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.write('info', message, undefined, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write('warn', message, undefined, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.write('error', message, error, context);
  }

  private write(
    level: string,
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): void {
    const entry: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      msg: SensitiveDataRedactor.redact(message),
    };

    if (context !== undefined) {
      entry.ctx = SensitiveDataRedactor.redactObject(context);
    }

    if (error !== undefined) {
      entry.error = SensitiveDataRedactor.redact(error.message);
      if (error.stack) {
        entry.stack = SensitiveDataRedactor.redact(error.stack);
      }
    }

    fs.appendFileSync(this.filePath, JSON.stringify(entry) + '\n', 'utf-8');
  }
}
