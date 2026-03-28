/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.JSONSCHEMA.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = JSONSchema module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\domain\types\JSONSchema.ts
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
 * JSON Schema type definitions for tool parameter validation
 * 
 * Simplified JSON Schema types covering the most common validation scenarios.
 * Compatible with ajv (Another JSON Schema Validator).
 * 
 * @see https://json-schema.org/
 * @see https://ajv.js.org/
 */

/**
 * JSON Schema primitive types
 */
export type JSONSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

/**
 * JSON Schema for a property
 */
export interface JSONSchemaProperty {
  /**
   * Type of the property
   */
  type?: JSONSchemaType | JSONSchemaType[];

  /**
   * Description of the property
   */
  description?: string;

  /**
   * Default value
   */
  default?: unknown;

  /**
   * Enum values (allowed values)
   */
  enum?: unknown[];

  /**
   * For objects: nested properties
   */
  properties?: Record<string, JSONSchemaProperty>;

  /**
   * For objects: required property names
   */
  required?: string[];

  /**
   * For arrays: schema for items
   */
  items?: JSONSchemaProperty;

  /**
   * For arrays: minimum number of items
   */
  minItems?: number;

  /**
   * For arrays: maximum number of items
   */
  maxItems?: number;

  /**
   * For strings: minimum length
   */
  minLength?: number;

  /**
   * For strings: maximum length
   */
  maxLength?: number;

  /**
   * For strings: regex pattern
   */
  pattern?: string;

  /**
   * For numbers: minimum value
   */
  minimum?: number;

  /**
   * For numbers: maximum value
   */
  maximum?: number;

  /**
   * Allow additional properties (for objects)
   */
  additionalProperties?: boolean | JSONSchemaProperty;
}

/**
 * JSON Schema for tool parameters
 * 
 * Tool parameters are always objects with named properties.
 * 
 * @example
 * ```typescript
 * const schema: JSONSchema = {
 *   type: 'object',
 *   properties: {
 *     location: {
 *       type: 'string',
 *       description: 'City name',
 *     },
 *     units: {
 *       type: 'string',
 *       enum: ['metric', 'imperial'],
 *       default: 'metric',
 *     },
 *   },
 *   required: ['location'],
 * };
 * ```
 */
export interface JSONSchema {
  /**
   * Schema type (always 'object' for tool parameters)
   */
  type: 'object';

  /**
   * Parameter definitions
   */
  properties: Record<string, JSONSchemaProperty>;

  /**
   * Required parameter names
   */
  required?: string[];

  /**
   * Allow additional properties not defined in schema
   * @default true (ajv default)
   */
  additionalProperties?: boolean;

  /**
   * Schema description
   */
  description?: string;
}

/**
 * Type guard to check if a value is a valid JSON Schema
 */
export function isJSONSchema(value: unknown): value is JSONSchema {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const schema = value as Record<string, unknown>;

  return (
    schema.type === 'object' &&
    typeof schema.properties === 'object' &&
    schema.properties !== null
  );
}
