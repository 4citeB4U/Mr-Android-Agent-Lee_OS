/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.BOOTSTRAP.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = bootstrap module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\composition\bootstrap.ts
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
 * Agent Lee Runtime Bootstrap
 *
 * Startup sequence: registers all services in the correct dependency order.
 * Call bootstrap() once at application startup.
 */

import { AppConfig, parseConfig } from "../core/config/AppConfig.js";
import { LogLevel } from "../core/infrastructure/ConsoleLogger.js";
import { ILogger } from "../core/interfaces/ILogger.js";
import { IMCPManager } from "../mcp/domain/IMCPManager.js";
import { leewaySkillsService } from "../../../services/leewaySkills.js";
import { Container, Tokens } from "./Container.js";
import { registerAgent } from "./registerAgent.js";
import { registerCommunication } from "./registerCommunication.js";
import { registerCore, registerCoreWithTracing } from "./registerCore.js";
import { registerMCP } from "./registerMCP.js";
import { registerMemory } from "./registerMemory.js";
import { registerScheduler } from "./registerScheduler.js";
import { registerSubAgents } from "./registerSubAgents.js";
import { registerTools } from "./registerTools.js";
import { registerTracing } from "./registerTracing.js";

const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

export interface BootstrapOptions {
  /** Optional partial AppConfig overrides */
  config?: Partial<AppConfig>;
  /** Log level override */
  logLevel?: "debug" | "info" | "warn" | "error";
  /** Custom traces directory */
  tracesDir?: string;
}

let _started = false;
let _startPromise: Promise<void> | null = null;

export async function bootstrap(options: BootstrapOptions = {}): Promise<void> {
  // Idempotent: second call returns the same (or already-resolved) promise
  if (_started) return;
  if (_startPromise) return _startPromise;

  _startPromise = _doBootstrap(options).then(() => {
    _started = true;
  });
  return _startPromise;
}

async function _doBootstrap(options: BootstrapOptions): Promise<void> {
  // 1. Register AppConfig
  const appConfig = parseConfig({
    ...(options.config ?? {}),
    mcp: {
      servers: {
        ...(await leewaySkillsService.getMcpServerConfig()),
        ...(options.config?.mcp?.servers ?? {}),
      },
    },
  });
  Container.registerInstance<AppConfig>(Tokens.AppConfig, appConfig);

  // 2. Register core: Logger, EventBus, Platform, NullTracer, ProcessManager
  const levelStr = options.logLevel ?? appConfig.logging?.level ?? "info";
  registerCore(LOG_LEVEL_MAP[levelStr] ?? LogLevel.INFO);

  const logger = Container.resolve<ILogger>(Tokens.ILogger);
  logger.info("Agent Lee runtime bootstrapping…");

  // 3. Register tracing (FileLogger, SessionDirectory, CompositeLogger)
  await registerTracing(options.tracesDir);

  // 3b. Register ProcessManager (needs Platform + Logger + Tracer from above)
  registerCoreWithTracing();

  // 4. Register tools (ToolRegistry, ToolExecutor, LLMCommandEvaluator)
  registerTools();

  // 5. Register MCP (MCPToolRegistry, MCPManager — no ConfigLoader)
  registerMCP();
  const mcpManager = Container.resolve<IMCPManager>(Tokens.IMCPManager);
  const mcpInit = await mcpManager.initialize();
  if (mcpInit.isFailure()) {
    logger.warn(`MCP manager initialization failed: ${mcpInit.getError().message}`);
  } else {
    const mcpConnect = await mcpManager.connectAll();
    if (mcpConnect.isFailure()) {
      logger.warn(`MCP manager connect failed: ${mcpConnect.getError().message}`);
    }
  }

  // 6. Register memory (MemorySearch, SaveMemoryTool, SearchMemoryTool)
  await registerMemory();

  // 7. Register agent session manager (aiService-based, no CopilotClient)
  registerAgent();

  // 8. Register communication layer (MessageBroker, AgentStateManager, SteeringManager, etc.)
  registerCommunication();

  // 9. Register sub-agents (ModelSelector, SmartCompactionSession, SubAgentManager, ForkableSession)
  await registerSubAgents();

  // 10. Register scheduler (FileSchedulerStore, OpenClawStyleOrchestrator, SchedulerService)
  await registerScheduler();

  logger.info("Agent Lee runtime ready");
}

/**
 * Clean shutdown — stops all services.
 */
export async function shutdown(): Promise<void> {
  try {
    const logger = Container.resolve<ILogger>(Tokens.ILogger);
    logger.info("Agent Lee runtime shutting down…");
  } catch {
    // Logger may not be registered if bootstrap failed early
  }
  Container.reset();
}
