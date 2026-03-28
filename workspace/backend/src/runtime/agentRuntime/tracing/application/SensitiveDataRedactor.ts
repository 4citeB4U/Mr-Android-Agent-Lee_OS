/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SENSITIVEDATAREDACTOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SensitiveDataRedactor module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tracing\application\SensitiveDataRedactor.ts
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
 * SensitiveDataRedactor — pure functional core for redacting secrets from text and objects.
 * 
 * Used by FileLogger and RedactingSpanExporter to sanitize persisted data.
 */

interface RedactionRule {
  pattern: RegExp;
  replacement: string;
}

const RULES: RedactionRule[] = [
  // Private key blocks (must be before line-level patterns)
  { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, replacement: '***PRIVATE_KEY***' },
  // Bearer tokens
  { pattern: /Bearer\s+[A-Za-z0-9\-_.~+/]+=*/g, replacement: 'Bearer ***' },
  // GitHub tokens (ghp_, gho_, ghs_, ghr_)
  { pattern: /gh[posr]_[A-Za-z0-9_]{1,255}/g, replacement: '***' },
  // sk- style API keys (OpenAI, Anthropic, etc.)
  { pattern: /sk-[A-Za-z0-9]{8,}/g, replacement: '***' },
  // password in JSON: "password":"value"
  { pattern: /("password"\s*:\s*")[^"]*(")/gi, replacement: '$1***$2' },
  // password in YAML/config: password: value
  { pattern: /(password:\s*).+/gi, replacement: '$1***' },
];

export class SensitiveDataRedactor {
  /**
   * Redact sensitive patterns from a string.
   */
  static redact(text: string): string {
    let result = text;
    for (const rule of RULES) {
      result = result.replace(rule.pattern, rule.replacement);
    }
    return result;
  }

  /**
   * Deep-clone an object, redacting all string values.
   * Non-string primitives are preserved. Arrays and nested objects are handled recursively.
   */
  static redactObject(obj: Record<string, unknown>): Record<string, unknown> {
    return SensitiveDataRedactor.deepRedact(obj) as Record<string, unknown>;
  }

  private static deepRedact(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return SensitiveDataRedactor.redact(value);
    if (Array.isArray(value)) return value.map(v => SensitiveDataRedactor.deepRedact(v));
    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        result[k] = SensitiveDataRedactor.deepRedact(v);
      }
      return result;
    }
    return value;
  }
}
