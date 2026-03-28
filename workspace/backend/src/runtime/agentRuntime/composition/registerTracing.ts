/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.REGISTERTRACING.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = registerTracing module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\composition\registerTracing.ts
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
 * Register tracing infrastructure
 * Uses FileLogger + CompositeLogger. No OpenTelemetry.
 */

import { randomUUID } from 'crypto';
import { Container, Tokens } from './Container.js';
import { ITracer } from '../core/interfaces/ITracer.js';
import { ILogger } from '../core/interfaces/ILogger.js';
import { IPlatformPaths } from '../core/interfaces/IPlatformPaths.js';
import { FileLogger } from '../tracing/infrastructure/FileLogger.js';
import { CompositeLogger } from '../tracing/infrastructure/CompositeLogger.js';
import { SessionDirectory } from '../tracing/domain/SessionDirectory.js';
import { SessionMetadata } from '../tracing/domain/entities/SessionMetadata.js';

export async function registerTracing(customSessionsDir?: string): Promise<void> {
  const platformPaths = Container.resolve<IPlatformPaths>(Tokens.IPlatformPaths);

  const sessionsDir = customSessionsDir || platformPaths.getSessionsDir();
  const sessionId = randomUUID();
  const sessionDir = await SessionDirectory.create(sessionsDir, sessionId, new Date());

  const metadata = SessionMetadata.start(sessionId, 'glm-4-flash');
  await metadata.writeTo(sessionDir.metadataFile);

  Container.registerInstance<SessionDirectory>(Tokens.SessionDirectory, sessionDir);
  Container.registerInstance<SessionMetadata>(Tokens.SessionMetadata, metadata);

  // Upgrade ILogger to composite (console + file)
  const consoleLogger = Container.resolve<ILogger>(Tokens.ILogger);
  const fileLogger = new FileLogger(sessionDir.logFile);
  const compositeLogger = new CompositeLogger([consoleLogger, fileLogger]);
  Container.registerInstance<ILogger>(Tokens.ILogger, compositeLogger);
}
