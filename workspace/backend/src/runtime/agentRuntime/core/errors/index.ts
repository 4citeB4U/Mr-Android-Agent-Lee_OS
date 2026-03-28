/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ERRORS_INDEX.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = index module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\index.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

// Base error
export { DomainError } from './DomainError.js';

// Existing error types
export { ValidationError } from './ValidationError.js';
export { NotFoundError } from './NotFoundError.js';
export { ConfigurationError } from './ConfigurationError.js';
export { PluginError } from './PluginError.js';

// New error types (PBI-0.11)
export { 
  ToolExecutionError, 
  ToolParameterError, 
  ToolNotFoundError 
} from './ToolExecutionError.js';
export { 
  SessionError, 
  SessionCreationError, 
  SessionNotFoundError, 
  ModelUnavailableError 
} from './SessionError.js';
export { 
  NetworkError, 
  ConnectionError, 
  DNSError 
} from './NetworkError.js';
export { RateLimitError } from './RateLimitError.js';
export { TimeoutError } from './TimeoutError.js';

// Error handling utilities (PBI-0.11)
export { RetryStrategy, RetryConfig, RetryAttempt, CircuitState } from './RetryStrategy.js';
export { ErrorFormatter, ErrorSeverity, FormattedError } from './ErrorFormatter.js';
export { ErrorRecovery, DegradationLevel, DegradedResult } from './ErrorRecovery.js';
export { ErrorEvent, ErrorEventPayload } from './ErrorEvent.js';
export { ErrorTelemetry } from './ErrorTelemetry.js';
