/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.COMMANDPARSING.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = commandParsing module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\builtin\commandParsing.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

export interface ParsedCommand {
  command: string;
  args: string[];
}

const SHELL_META_REGEX = /[;&|`$<>]/;
const COMMAND_SUBSTITUTION_REGEX = /\$\([^)]*\)|`[^`]*`/;

export function containsShellMetacharacters(input: string): boolean {
  return SHELL_META_REGEX.test(input);
}

export function containsCommandSubstitution(input: string): boolean {
  return COMMAND_SUBSTITUTION_REGEX.test(input);
}

export function parseCommandLine(input: string): ParsedCommand {
  const tokens: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let escapeNext = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (!inSingle && char === '\\') {
      escapeNext = true;
      continue;
    }

    if (!inDouble && char === '\'') {
      inSingle = !inSingle;
      continue;
    }

    if (!inSingle && char === '"') {
      inDouble = !inDouble;
      continue;
    }

    if (!inSingle && !inDouble && /\s/.test(char)) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (escapeNext) {
    current += '\\';
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return {
    command: tokens[0] ?? '',
    args: tokens.slice(1),
  };
}

export function splitShellSegments(input: string): string[] {
  const segments: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let escapeNext = false;

  const pushSegment = () => {
    const trimmed = current.trim();
    if (trimmed.length > 0) {
      segments.push(trimmed);
    }
    current = '';
  };

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (!inSingle && char === '\\') {
      escapeNext = true;
      continue;
    }

    if (!inDouble && char === '\'') {
      inSingle = !inSingle;
      current += char;
      continue;
    }

    if (!inSingle && char === '"') {
      inDouble = !inDouble;
      current += char;
      continue;
    }

    if (!inSingle && !inDouble) {
      if (char === '&' && next === '&') {
        pushSegment();
        i += 1;
        continue;
      }

      if (char === '|' && next === '|') {
        pushSegment();
        i += 1;
        continue;
      }

      if (char === '|' || char === ';') {
        pushSegment();
        continue;
      }
    }

    current += char;
  }

  pushSegment();
  return segments;
}
