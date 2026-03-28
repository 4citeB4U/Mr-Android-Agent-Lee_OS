/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SESSIONERROR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SessionError module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\SessionError.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { DomainError } from './DomainError.js';

/**
 * Error thrown when agent session encounters an issue
 * 
 * Captures:
 * - Session ID
 * - Session state
 * - Error reason
 * 
 * @example
 * ```typescript
 * throw new SessionError(
 *   'session-123',
 *   'Session expired after timeout'
 * );
 * ```
 */
export class SessionError extends DomainError {
  constructor(sessionId: string, reason: string, context?: Record<string, unknown>) {
    super('SESSION_ERROR', `Session '${sessionId}' error: ${reason}`, {
      sessionId,
      ...context,
    });
  }
}

/**
 * Error thrown when session creation fails
 */
export class SessionCreationError extends DomainError {
  constructor(model: string, reason: string) {
    super('SESSION_CREATION_ERROR', `Failed to create session with model '${model}': ${reason}`, {
      model,
    });
  }
}

/**
 * Error thrown when session not found
 */
export class SessionNotFoundError extends DomainError {
  constructor(sessionId: string) {
    super('SESSION_NOT_FOUND', `Session '${sessionId}' not found`, {
      sessionId,
    });
  }
}

/**
 * Error thrown when model is unavailable
 */
export class ModelUnavailableError extends DomainError {
  constructor(model: string, availableModels?: string[]) {
    super('MODEL_UNAVAILABLE', `Model '${model}' is not available`, {
      model,
      availableModels,
    });
  }
}
