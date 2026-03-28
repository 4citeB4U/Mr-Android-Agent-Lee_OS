/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.COMMUNICATION_INDEX.MAIN

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
WHERE = backend\src\runtime\agentRuntime\communication\index.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

// Communication module public API

// Domain
export type { Message, MessagePriority, MessageType, MessageHandler, AgentFilter } from './domain/Message.js';
export { PRIORITY_ORDER } from './domain/Message.js';
export type { IMessageBroker } from './domain/IMessageBroker.js';

// Logic
export { MessageQueue, type QueueConfig } from './logic/MessageQueue.js';

// Infrastructure
export { MessageBroker, type MessageBrokerConfig } from './infrastructure/MessageBroker.js';

// Steering (PBI-3B.2)
export type { ISteeringManager, InjectOptions, PendingInjection } from './domain/ISteeringManager.js';
export { SteeringManager, type SteeringConfig } from './infrastructure/SteeringManager.js';

// Agent State (PBI-3B.3)
export type { AgentState, AgentStatus, AgentMetrics, StateChangeCallback } from './domain/AgentState.js';
export { INITIAL_METRICS } from './domain/AgentState.js';
export { AgentStateManager, type AgentStateConfig } from './infrastructure/AgentStateManager.js';

// Progress Reporting (PBI-3B.4)
export { ProgressReporter, type ProgressUpdate, type ProgressCallback, type ProgressConfig } from './infrastructure/ProgressReporter.js';

// Shared State & Coordination (PBI-3B.5)
export type { ISharedState, ChangeCallback } from './domain/ISharedState.js';
export type { ICoordination, Lock } from './domain/ICoordination.js';
export { SharedState } from './infrastructure/SharedState.js';
export { Coordination } from './infrastructure/Coordination.js';
