/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.APPCONFIG.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = AppConfig module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\config\AppConfig.ts
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
 * Application configuration schema for Agent Lee runtime
 * Simple TypeScript interfaces — no external validation library.
 */

export interface MCPServerConfigType {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  type?: 'stdio' | 'sse';
}

export interface AgentModelConfig {
  defaultModel: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentConfig {
  model: AgentModelConfig;
  instructionFiles: string[];
  skillDirectories: string[];
  excludedTools: string[];
}

export interface MCPConfig {
  servers?: Record<string, MCPServerConfigType>;
}

export interface TracingConfig {
  samplingRate?: number;
  sessionMaxAgeDays?: number;
}

export interface LoggingConfig {
  level?: 'debug' | 'info' | 'warn' | 'error';
}

export interface AppConfig {
  agent: AgentConfig;
  mcp?: MCPConfig;
  tracing?: TracingConfig;
  logging?: LoggingConfig;
}

const DEFAULTS: AppConfig = {
  agent: {
    model: {
      defaultModel: 'glm-4-flash',
      temperature: 0.7,
      maxTokens: 4096,
    },
    instructionFiles: ['SOUL.md', 'AGENTS.md', 'USER.md', 'TOOLS.md'],
    skillDirectories: [],
    excludedTools: [],
  },
  mcp: {
    servers: {},
  },
  tracing: {
    samplingRate: 1.0,
    sessionMaxAgeDays: 30,
  },
  logging: {
    level: 'info',
  },
};

export function parseConfig(partial: Partial<AppConfig>): AppConfig {
  return {
    agent: {
      model: {
        ...DEFAULTS.agent.model,
        ...(partial.agent?.model ?? {}),
      },
      instructionFiles: partial.agent?.instructionFiles ?? DEFAULTS.agent.instructionFiles,
      skillDirectories: partial.agent?.skillDirectories ?? DEFAULTS.agent.skillDirectories,
      excludedTools: partial.agent?.excludedTools ?? DEFAULTS.agent.excludedTools,
    },
    mcp: {
      servers: partial.mcp?.servers ?? DEFAULTS.mcp?.servers ?? {},
    },
    tracing: {
      ...DEFAULTS.tracing,
      ...(partial.tracing ?? {}),
    },
    logging: {
      ...DEFAULTS.logging,
      ...(partial.logging ?? {}),
    },
  };
}

export function getDefaultConfig(): AppConfig {
  return parseConfig({});
}
