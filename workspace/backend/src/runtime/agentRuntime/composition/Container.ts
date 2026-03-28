/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CONTAINER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = Container module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\composition\Container.ts
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
 * Container - Simple Map-based dependency injection for Agent Lee runtime
 *
 * Replaces tsyringe with a lightweight service registry using Map<symbol, T>.
 * Supports both singleton instances and lazy factory registration.
 */

type Factory<T> = (c: typeof Container) => T;

const _instances = new Map<symbol, unknown>();
const _factories = new Map<symbol, Factory<unknown>>();

/** Dependency injection tokens for Agent Lee runtime */
export const Tokens = {
  // Core infrastructure
  ILogger: Symbol.for("ILogger"),
  ITracer: Symbol.for("ITracer"),
  IEventBus: Symbol.for("IEventBus"),
  IPlatform: Symbol.for("IPlatform"),
  IPlatformPaths: Symbol.for("IPlatformPaths"),
  IProcessManager: Symbol.for("IProcessManager"),

  // Tool system
  IToolRegistry: Symbol.for("IToolRegistry"),
  ToolInvoker: Symbol.for("ToolInvoker"),
  IPermissionGuard: Symbol.for("IPermissionGuard"),
  IUserApprovalProvider: Symbol.for("IUserApprovalProvider"),

  // MCP
  IMCPManager: Symbol.for("IMCPManager"),
  IMCPToolRegistry: Symbol.for("IMCPToolRegistry"),

  // Agent session
  IAgentSessionManager: Symbol.for("IAgentSessionManager"),
  IWorkspaceInstructionLoader: Symbol.for("IWorkspaceInstructionLoader"),
  IToolExecutor: Symbol.for("IToolExecutor"),

  // Communication
  IMessageBroker: Symbol.for("IMessageBroker"),
  AgentStateManager: Symbol.for("AgentStateManager"),
  ISteeringManager: Symbol.for("ISteeringManager"),
  ProgressReporter: Symbol.for("ProgressReporter"),
  SharedState: Symbol.for("SharedState"),
  Coordination: Symbol.for("Coordination"),

  // Sub-agent components
  ModelSelector: Symbol.for("ModelSelector"),
  SmartCompactionSession: Symbol.for("SmartCompactionSession"),
  SubAgentManager: Symbol.for("SubAgentManager"),
  OpenClawStyleOrchestrator: Symbol.for("OpenClawStyleOrchestrator"),
  ForkableSession: Symbol.for("ForkableSession"),
  SchedulerService: Symbol.for("SchedulerService"),
  ISchedulerStore: Symbol.for("ISchedulerStore"),

  // Tracing session
  SessionDirectory: Symbol.for("SessionDirectory"),
  SessionMetadata: Symbol.for("SessionMetadata"),

  // Config
  AppConfig: Symbol.for("AppConfig"),
} as const;

/** Simple, synchronous service container */
export const Container = {
  /**
   * Register a singleton instance (replaces any existing instance or factory)
   */
  registerInstance<T>(token: symbol, instance: T): void {
    _instances.set(token, instance);
    _factories.delete(token);
  },

  /**
   * Register a lazy factory (created on first resolve, then cached)
   * Does NOT override an existing instance.
   */
  registerFactory<T>(token: symbol, factory: Factory<T>): void {
    if (!_instances.has(token)) {
      _factories.set(token, factory as Factory<unknown>);
    }
  },

  /**
   * Resolve a registered service (throws if not registered)
   */
  resolve<T>(token: symbol): T {
    if (_instances.has(token)) return _instances.get(token) as T;
    if (_factories.has(token)) {
      const factory = _factories.get(token)!;
      const instance = factory(Container);
      _instances.set(token, instance);
      _factories.delete(token);
      return instance as T;
    }
    throw new Error(`Service not registered: ${String(token)}`);
  },

  /** Check if a service is registered */
  has(token: symbol): boolean {
    return _instances.has(token) || _factories.has(token);
  },

  /** Clear all registrations (for testing or full restart) */
  reset(): void {
    _instances.clear();
    _factories.clear();
  },
};
