/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.TOOLS_APPLICATION_TOOLEXECUTOR_TS.MAIN_TOOLEXECUTOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ToolExecutor module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\application\ToolExecutor.ts
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
 * Tool execution logic - Functional core + imperative shell (Tool system layer)
 * 
 * This module contains:
 * - validateParameters: Pure function for JSON schema validation
 * - ToolInvoker: Orchestrator for tool invocation with full tracing
 * 
 * Note: A separate ToolExecutor exists in agent/application/ToolExecutor.ts
 * which provides agent-level tool orchestration with lifecycle events and
 * domain error types. The two serve different architectural layers:
 * - ToolInvoker (this file): Tool system core (schema validation, direct invocation)
 * - ToolExecutor (agent layer): Agent orchestration (lifecycle events, domain errors)
 * 
 * Follows FCIS pattern:
 * - Pure logic: validateParameters (no I/O, 100% testable)
 * - Imperative shell: ToolInvoker (coordinates I/O, registry, tracing)
 */

import AjvModule, { ValidateFunction, ErrorObject } from 'ajv';
// Handle both CJS default export and ESM module resolution
const Ajv = (AjvModule as any).default || AjvModule;
import { IToolRegistry } from '../domain/interfaces/IToolRegistry.js';
import { ILogger } from '../../core/interfaces/ILogger.js';
import { ITracer, ISpan } from '../../core/interfaces/ITracer.js';
import { Result } from '../../core/types/Result.js';
import { ToolResult } from '../domain/value-objects/ToolResult.js';
import { JSONSchema } from '../domain/types/JSONSchema.js';
import { ToolOutputFileManager } from '../infrastructure/ToolOutputFileManager.js';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Validate parameters against JSON schema (Pure function)
 * 
 * Uses ajv (Another JSON Schema Validator) for validation.
 * This is a pure function with no side effects or I/O.
 * 
 * @param parameters - Parameters to validate
 * @param schema - JSON schema to validate against
 * @returns ValidationResult with valid flag and optional errors
 * 
 * @example
 * ```typescript
 * const schema = {
 *   type: 'object',
 *   properties: { name: { type: 'string' } },
 *   required: ['name']
 * };
 * 
 * const result = validateParameters({ name: 'Alice' }, schema);
 * console.log(result.valid); // true
 * 
 * const invalidResult = validateParameters({}, schema);
 * console.log(invalidResult.valid); // false
 * console.log(invalidResult.errors); // ["must have required property 'name'"]
 * ```
 */
export function validateParameters(
  parameters: unknown,
  schema: JSONSchema
): ValidationResult {
  // Create ajv instance
  const ajv = new Ajv({
    allErrors: true, // Collect all errors, not just the first
    strict: false, // Allow additional keywords (flexibility)
    coerceTypes: false,
    useDefaults: false,
  });

  // Compile schema
  let validate: ValidateFunction;
  try {
    validate = ajv.compile(schema);
  } catch (error) {
    // Schema compilation error (programming error, not validation error)
    return {
      valid: false,
      errors: [`Invalid schema: ${(error as Error).message}`],
    };
  }

  // Validate parameters
  const valid = validate(parameters);

  if (valid) {
    return { valid: true };
  }

  // Format errors
  const errors = validate.errors?.map((err: ErrorObject) => {
    const path = err.instancePath || '(root)';
    return `${path}: ${err.message}`;
  }) || ['Unknown validation error'];

  return {
    valid: false,
    errors,
  };
}

/**
 * ToolInvoker - Orchestrates tool invocation
 * 
 * Coordinates the tool invocation flow:
 * 1. Validate parameters against tool schema
 * 2. Get tool from registry
 * 3. Execute tool
 * 4. Return result
 * 
 * Includes full tracing and error handling.
 * 
 * @example
 * ```typescript
 * const invoker = new ToolInvoker(registry, logger, tracer);
 * 
 * const result = await invoker.invoke('get_weather', { location: 'London' });
 * 
 * if (result.isSuccess()) {
 *   const toolResult = result.getValue();
 *   console.log(toolResult.getData());
 * }
 * ```
 */
export class ToolInvoker {
  constructor(
    private readonly registry: IToolRegistry,
    private readonly logger: ILogger,
    private readonly tracer: ITracer,
    private readonly outputFileManager?: ToolOutputFileManager,
  ) {}

  /**
   * Invoke a tool by name with parameters
   * 
   * @param toolName - Name of the tool to invoke
   * @param parameters - Parameters for the tool
   * @returns Result containing ToolResult on success, or Error on failure
   * 
   * Error cases:
   * - Tool not found
   * - Parameter validation failed
   * - Tool execution failed
   */
  async invoke(
    toolName: string,
    parameters: unknown
  ): Promise<Result<ToolResult, Error>> {
    return this.tracer.span('tool.invoke', async (span: ISpan) => {
      const startTime = Date.now();
      span.setAttribute('tool.name', toolName);

      // Log invocation at INFO level for visibility
      this.logger.info('Invoking tool', {
        toolName,
        parametersProvided: typeof parameters === 'object' && parameters !== null 
          ? Object.keys(parameters as Record<string, unknown>) 
          : [],
      });
      
      // Log full parameters at DEBUG level
      this.logger.debug('Tool parameters', {
        toolName,
        parameters,
      });

      try {
        // Step 1: Get tool from registry
        const getResult = await this.registry.get(toolName);

        if (getResult.isFailure()) {
          this.logger.error('Failed to get tool from registry', getResult.getError(), {
            toolName,
          });
          span.setStatus('error', getResult.getError().message);
          return Result.fail(getResult.getError());
        }

        const tool = getResult.getValue();

        if (tool === null) {
          const error = new Error(`Tool '${toolName}' not found`);
          this.logger.error('Tool not found', error, { toolName });
          span.setAttribute('tool.found', false);
          span.setStatus('error', error.message);
          return Result.fail(error);
        }

        span.setAttribute('tool.found', true);

        // Step 2: Validate parameters
        const validationResult = validateParameters(parameters, tool.schema);

        if (!validationResult.valid) {
          const errorMsg = `Parameter validation failed: ${validationResult.errors?.join(', ')}`;
          const error = new Error(errorMsg);
          this.logger.warn('Parameter validation failed', {
            toolName,
            errors: validationResult.errors,
          });
          span.setAttribute('validation.valid', false);
          span.setAttribute('validation.errors', validationResult.errors?.join('; ') || '');
          span.setStatus('error', error.message);
          return Result.fail(error);
        }

        span.setAttribute('validation.valid', true);

        // Step 3: Execute tool
        this.logger.debug('Executing tool', { toolName });

        const executeResult = await tool.execute(parameters);

        if (executeResult.isFailure()) {
          const durationMs = Date.now() - startTime;
          this.logger.error(`Tool ${toolName} execution failed after ${durationMs}ms`, executeResult.getError(), {
            toolName,
            durationMs,
          });
          span.setAttribute('execution.success', false);
          span.setAttribute('tool.duration_ms', durationMs);
          span.setStatus('error', executeResult.getError().message);
          return Result.fail(executeResult.getError());
        }

        const toolResult = executeResult.getValue();

        // Check if tool returned error result
        if (toolResult.isError()) {
          const durationMs = Date.now() - startTime;
          const error = toolResult.getError();
          this.logger.warn(`Tool ${toolName} returned error result after ${durationMs}ms`, {
            toolName,
            durationMs,
            error: error.message,
          });
          span.setAttribute('execution.success', false);
          span.setAttribute('tool.result.error', error.message);
          span.setAttribute('tool.duration_ms', durationMs);
          // Note: Still return success Result, but ToolResult contains error
          span.setStatus('ok');
          return Result.ok(toolResult);
        }

        // Success!
        const durationMs = Date.now() - startTime;
        
        this.logger.info(`Tool ${toolName} completed successfully in ${durationMs}ms`, {
          toolName,
          durationMs,
          hasData: toolResult.getData() !== undefined,
        });
        
        // Log result at DEBUG level (truncate if too large)
        const data = toolResult.getData();
        const resultStr = typeof data === 'string' 
          ? data.substring(0, 1000)
          : JSON.stringify(data)?.substring(0, 1000) || '(no data)';
        
        this.logger.debug('Tool result', {
          toolName,
          result: resultStr,
          resultType: typeof data,
        });

        span.setAttribute('execution.success', true);
        span.setStatus('ok');

        // Check for large output — intercept and save to file
        // Skip passthrough tools (read_file etc.) that should always return full output
        if (this.outputFileManager && toolResult.isSuccess()
            && !this.outputFileManager.isPassthrough(toolName)) {
          const outputStr = typeof data === 'string'
            ? data
            : JSON.stringify(data) ?? '';
          if (this.outputFileManager.exceedsThreshold(outputStr)) {
            const metadata = this.outputFileManager.save(outputStr, toolName);
            span.setAttribute('tool.output.large', true);
            span.setAttribute('tool.output.size', metadata.size);
            this.logger.info('Tool output exceeded threshold, saved to file', {
              toolName,
              size: metadata.size,
              path: metadata.path,
            });
            return Result.ok(ToolResult.success(metadata));
          }
        }

        return Result.ok(toolResult);
      } catch (error) {
        // Unexpected error (programming error)
        const durationMs = Date.now() - startTime;
        this.logger.error(`Unexpected error during tool ${toolName} invocation after ${durationMs}ms`, error as Error, {
          toolName,
          durationMs,
        });
        span.setAttribute('tool.duration_ms', durationMs);
        span.setStatus('error', (error as Error).message);
        return Result.fail(error as Error);
      }
    });
  }
}
