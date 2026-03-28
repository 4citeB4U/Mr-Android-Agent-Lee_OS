/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.NETWORKERROR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = NetworkError module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\NetworkError.ts
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
 * Error thrown for network-related failures
 * 
 * Captures:
 * - Operation that failed
 * - Retry information
 * - Network details
 * 
 * @example
 * ```typescript
 * throw new NetworkError(
 *   'API request',
 *   'Connection refused',
 *   { attempt: 3, maxRetries: 3 }
 * );
 * ```
 */
export class NetworkError extends DomainError {
  constructor(operation: string, reason: string, context?: Record<string, unknown>) {
    super('NETWORK_ERROR', `Network error during ${operation}: ${reason}`, context);
  }
}

/**
 * Error thrown when connection fails
 */
export class ConnectionError extends NetworkError {
  constructor(host: string, port?: number) {
    super('connection', `Failed to connect to ${host}${port ? `:${port}` : ''}`, {
      host,
      port,
    });
  }
}

/**
 * Error thrown when DNS resolution fails
 */
export class DNSError extends NetworkError {
  constructor(hostname: string) {
    super('DNS lookup', `Failed to resolve hostname: ${hostname}`, {
      hostname,
    });
  }
}
