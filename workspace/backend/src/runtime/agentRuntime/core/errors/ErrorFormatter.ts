/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ERRORFORMATTER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ErrorFormatter module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\errors\ErrorFormatter.ts
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
 * Error severity levels for user-facing messages
 */
export enum ErrorSeverity {
  /** Informational - not really an error */
  INFO = 'INFO',
  /** Warning - something unusual but not critical */
  WARNING = 'WARNING',
  /** Error - operation failed but recoverable */
  ERROR = 'ERROR',
  /** Critical - system-level failure */
  CRITICAL = 'CRITICAL',
}

/**
 * Formatted error message with actionable suggestions
 */
export interface FormattedError {
  /** Error severity */
  severity: ErrorSeverity;
  /** User-friendly title */
  title: string;
  /** Detailed description */
  message: string;
  /** Actionable suggestions */
  suggestions: string[];
  /** Technical details (for developers) */
  technicalDetails?: {
    code: string;
    originalError?: string;
    context?: Record<string, unknown>;
  };
}

/**
 * ErrorFormatter - Convert technical errors to user-friendly messages
 * 
 * Provides:
 * - User-friendly error messages
 * - Actionable suggestions ("Try X to fix this")
 * - Contextual help based on error type
 * 
 * @example
 * ```typescript
 * const formatter = new ErrorFormatter();
 * const formatted = formatter.format(error);
 * 
 * console.log(formatted.title);
 * console.log(formatted.message);
 * formatted.suggestions.forEach(s => console.log(`  - ${s}`));
 * ```
 */
export class ErrorFormatter {
  /**
   * Format an error for display to users
   */
  format(error: Error): FormattedError {
    // Handle domain errors
    if (error instanceof DomainError) {
      return this.formatDomainError(error);
    }

    // Check more specific error types first before generic ones
    // Timeout is more specific than network error (since timeouts can mention "connection")
    if (this.isTimeoutError(error)) {
      return this.formatTimeoutError(error);
    }

    if (this.isRateLimitError(error)) {
      return this.formatRateLimitError(error);
    }

    if (this.isNetworkError(error)) {
      return this.formatNetworkError(error);
    }

    // Check for fatal/critical errors
    if (this.isCriticalError(error)) {
      return this.formatCriticalError(error);
    }

    // Fallback for unknown errors
    return this.formatGenericError(error);
  }

  /**
   * Format a domain error with specific context
   * Uses pattern matching on error codes for flexibility
   */
  private formatDomainError(error: DomainError): FormattedError {
    const { code, message, context } = error;

    // Pattern-based matching (order matters - most specific first)
    
    // Not Found errors: *_NOT_FOUND
    if (code.endsWith('_NOT_FOUND') || code === 'NOT_FOUND') {
      return {
        severity: ErrorSeverity.ERROR,
        title: 'Resource Not Found',
        message: message || 'The requested resource could not be found',
        suggestions: this.getNotFoundSuggestions(context),
        technicalDetails: {
          code,
          context,
        },
      };
    }

    // Validation errors: INVALID_* or *_VALIDATION_ERROR
    if (code.startsWith('INVALID_') || code.endsWith('_VALIDATION_ERROR') || code === 'VALIDATION_ERROR') {
      return {
        severity: ErrorSeverity.ERROR,
        title: 'Invalid Input',
        message: message || 'The provided input is not valid',
        suggestions: this.getValidationSuggestions(context),
        technicalDetails: {
          code,
          context,
        },
      };
    }

    // Configuration errors: CONFIG_* or *_CONFIG_ERROR
    if (code.startsWith('CONFIG_') || code.endsWith('_CONFIG_ERROR') || code === 'CONFIGURATION_ERROR') {
      return {
        severity: ErrorSeverity.ERROR,
        title: 'Configuration Error',
        message: message || 'There is an issue with your configuration',
        suggestions: this.getConfigSuggestions(context),
        technicalDetails: {
          code,
          context,
        },
      };
    }

    // Plugin errors: PLUGIN_* or *_PLUGIN_ERROR
    if (code.startsWith('PLUGIN_') || code.endsWith('_PLUGIN_ERROR')) {
      return {
        severity: ErrorSeverity.ERROR,
        title: 'Plugin Error',
        message: message || 'Failed to load or execute plugin',
        suggestions: this.getPluginSuggestions(context),
        technicalDetails: {
          code,
          context,
        },
      };
    }

    // Tool errors: TOOL_* or *_TOOL_ERROR
    if (code.startsWith('TOOL_') || code.endsWith('_TOOL_ERROR')) {
      return {
        severity: ErrorSeverity.ERROR,
        title: 'Tool Execution Failed',
        message: message || 'The tool failed to execute',
        suggestions: this.getToolSuggestions(context),
        technicalDetails: {
          code,
          context,
        },
      };
    }

    // Session errors: SESSION_*
    if (code.startsWith('SESSION_')) {
      return {
        severity: ErrorSeverity.ERROR,
        title: 'Session Error',
        message: message || 'The agent session encountered an error',
        suggestions: this.getSessionSuggestions(context),
        technicalDetails: {
          code,
          context,
        },
      };
    }

    // Fallback for unknown patterns
    return {
      severity: ErrorSeverity.ERROR,
      title: 'Error',
      message: message || 'An error occurred',
      suggestions: ['Check the logs for more details', 'Contact support if the issue persists'],
      technicalDetails: {
        code,
        originalError: error.message,
        context,
      },
    };
  }

  /**
   * Format network-related errors
   */
  private formatNetworkError(error: Error): FormattedError {
    return {
      severity: ErrorSeverity.ERROR,
      title: 'Network Error',
      message: 'Unable to connect to the service',
      suggestions: [
        'Check your internet connection',
        'Verify the service is running',
        'Check firewall settings',
        'The operation will be retried automatically',
      ],
      technicalDetails: {
        code: 'NETWORK_ERROR',
        originalError: error.message,
      },
    };
  }

  /**
   * Format timeout errors
   */
  private formatTimeoutError(error: Error): FormattedError {
    return {
      severity: ErrorSeverity.WARNING,
      title: 'Operation Timed Out',
      message: 'The operation took too long to complete',
      suggestions: [
        'Check network connection speed',
        'The service might be experiencing high load',
        'Try again in a few moments',
        'Consider increasing timeout settings',
      ],
      technicalDetails: {
        code: 'TIMEOUT_ERROR',
        originalError: error.message,
      },
    };
  }

  /**
   * Format rate limit errors
   */
  private formatRateLimitError(error: Error): FormattedError {
    return {
      severity: ErrorSeverity.WARNING,
      title: 'Rate Limit Exceeded',
      message: 'Too many requests in a short time',
      suggestions: [
        'Wait a moment before trying again',
        'The operation will be retried automatically with backoff',
        'Consider reducing request frequency',
      ],
      technicalDetails: {
        code: 'RATE_LIMIT_ERROR',
        originalError: error.message,
      },
    };
  }

  /**
   * Format generic unknown errors
   */
  private formatGenericError(error: Error): FormattedError {
    return {
      severity: ErrorSeverity.ERROR,
      title: 'Unexpected Error',
      message: error.message || 'An unexpected error occurred',
      suggestions: [
        'Check the logs for more information',
        'Try restarting the operation',
        'Report this issue if it persists',
      ],
      technicalDetails: {
        code: 'UNKNOWN_ERROR',
        originalError: error.message,
      },
    };
  }

  /**
   * Format critical/fatal errors
   */
  private formatCriticalError(error: Error): FormattedError {
    return {
      severity: ErrorSeverity.CRITICAL,
      title: 'Critical Error',
      message: error.message || 'A critical system error occurred',
      suggestions: [
        'Restart the application immediately',
        'Check system logs for details',
        'Contact support with error details',
        'Data may be at risk',
      ],
      technicalDetails: {
        code: 'CRITICAL_ERROR',
        originalError: error.message,
      },
    };
  }

  // Helper methods to detect error types

  private isCriticalError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('fatal') ||
      message.includes('crash') ||
      message.includes('panic') ||
      message.includes('out of memory') ||
      message.includes('segfault')
    );
  }

  private isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('enotfound') ||
      message.includes('connection')
    );
  }

  private isTimeoutError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('etimedout')
    );
  }

  private isRateLimitError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const statusCode = (error as any).statusCode || (error as any).status;
    return message.includes('rate limit') || statusCode === 429;
  }

  // Suggestion generators for specific error types

  private getValidationSuggestions(_context?: Record<string, unknown>): string[] {
    const suggestions: string[] = [];

    if (_context?.field) {
      suggestions.push(`Check the value provided for '${_context.field}'`);
    }

    if (_context?.expectedType) {
      suggestions.push(`Expected type: ${_context.expectedType}`);
    }

    suggestions.push('Review the input format and try again');

    return suggestions;
  }

  private getNotFoundSuggestions(_context?: Record<string, unknown>): string[] {
    const suggestions: string[] = [];

    if (_context?.id || _context?.name) {
      const identifier = _context.id || _context.name;
      suggestions.push(`Verify that '${identifier}' exists`);
    }

    suggestions.push('Check for typos in the resource name');
    suggestions.push('Ensure the resource has been created');

    return suggestions;
  }

  private getConfigSuggestions(_context?: Record<string, unknown>): string[] {
    const suggestions = [
      'Review your configuration file for syntax errors',
      'Verify all required fields are present',
      'Check the configuration documentation',
    ];

    if (_context?.configPath) {
      suggestions.push(`Configuration file: ${_context.configPath}`);
    }

    return suggestions;
  }

  private getPluginSuggestions(_context?: Record<string, unknown>): string[] {
    const suggestions: string[] = [];

    if (_context?.pluginId || _context?.pluginName) {
      const name = _context.pluginId || _context.pluginName;
      suggestions.push(`Check that plugin '${name}' is installed correctly`);
    }

    suggestions.push('Verify the plugin manifest (skill.json) is valid');
    suggestions.push('Check plugin dependencies are met');
    suggestions.push('Review plugin logs for details');

    return suggestions;
  }

  private getToolSuggestions(_context?: Record<string, unknown>): string[] {
    const suggestions: string[] = [];

    if (_context?.toolName) {
      suggestions.push(`Check that tool '${_context.toolName}' is properly configured`);
    }

    suggestions.push('Verify tool parameters are correct');
    suggestions.push('Ensure required permissions are granted');

    return suggestions;
  }

  private getSessionSuggestions(_context?: Record<string, unknown>): string[] {
    return [
      'Try restarting the session',
      'Check if the model service is available',
      'Verify API credentials are valid',
      'Review session configuration',
    ];
  }

  /**
   * Format error for console/terminal display
   */
  formatForConsole(error: Error, includeStackTrace = false): string {
    const formatted = this.format(error);
    const lines: string[] = [];

    // Title with severity indicator
    const severityIcon = this.getSeverityIcon(formatted.severity);
    lines.push(`${severityIcon} ${formatted.title}`);
    lines.push('');

    // Message
    lines.push(formatted.message);
    lines.push('');

    // Suggestions
    if (formatted.suggestions.length > 0) {
      lines.push('Suggestions:');
      formatted.suggestions.forEach((suggestion) => {
        lines.push(`  • ${suggestion}`);
      });
      lines.push('');
    }

    // Technical details
    if (formatted.technicalDetails) {
      lines.push('Technical Details:');
      lines.push(`  Code: ${formatted.technicalDetails.code}`);
      if (formatted.technicalDetails.originalError) {
        lines.push(`  Error: ${formatted.technicalDetails.originalError}`);
      }
      lines.push('');
    }

    // Stack trace if requested
    if (includeStackTrace && error.stack) {
      lines.push('Stack Trace:');
      lines.push(error.stack);
    }

    return lines.join('\n');
  }

  /**
   * Get icon for severity level
   */
  private getSeverityIcon(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.INFO:
        return 'ℹ️';
      case ErrorSeverity.WARNING:
        return '⚠️';
      case ErrorSeverity.ERROR:
        return '❌';
      case ErrorSeverity.CRITICAL:
        return '🔥';
      default:
        return '❌';
    }
  }
}
