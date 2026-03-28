/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.INMEMORYTOOLREGISTRY.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = InMemoryToolRegistry module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\infrastructure\InMemoryToolRegistry.ts
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
 * InMemoryToolRegistry - In-memory implementation of IToolRegistry
 * 
 * Stores tools in a Map and provides thread-safe access.
 * Publishes events when tools are registered or unregistered.
 */

import { IToolRegistry } from '../domain/interfaces/IToolRegistry.js';
import { ITool } from '../domain/interfaces/ITool.js';
import { Result } from '../../core/types/Result.js';
import { ILogger } from '../../core/interfaces/ILogger.js';
import { IEventBus } from '../../core/interfaces/IEventBus.js';
import { ToolRegisteredEvent } from '../domain/events/ToolRegisteredEvent.js';
import { ToolUnregisteredEvent } from '../domain/events/ToolUnregisteredEvent.js';

export class InMemoryToolRegistry implements IToolRegistry {
  /**
   * Tool storage: name → tool
   * Using Map for O(1) lookups
   */
  private readonly tools = new Map<string, ITool>();

  constructor(
    private readonly logger: ILogger,
    private readonly eventBus: IEventBus
  ) {
    this.logger.debug('InMemoryToolRegistry initialized');
  }

  async register(tool: ITool): Promise<Result<void, Error>> {
    this.logger.debug('Attempting to register tool', {
      toolName: tool.name,
    });

    if (this.tools.has(tool.name)) {
      const error = new Error(`Tool '${tool.name}' already registered`);
      this.logger.warn('Tool registration failed: duplicate name', {
        toolName: tool.name,
      });
      return Result.fail(error);
    }

    this.tools.set(tool.name, tool);

    await this.eventBus.publish(
      new ToolRegisteredEvent({
        toolName: tool.name,
        description: tool.description,
      })
    );

    this.logger.info('Tool registered successfully', {
      toolName: tool.name,
    });

    return Result.ok(undefined);
  }

  async unregister(toolName: string): Promise<Result<void, Error>> {
    this.logger.debug('Attempting to unregister tool', { toolName });

    if (!this.tools.has(toolName)) {
      const error = new Error(`Tool '${toolName}' not found`);
      this.logger.warn('Tool unregistration failed: not found', { toolName });
      return Result.fail(error);
    }

    this.tools.delete(toolName);

    await this.eventBus.publish(
      new ToolUnregisteredEvent({
        toolName,
      })
    );

    this.logger.info('Tool unregistered successfully', { toolName });

    return Result.ok(undefined);
  }

  async get(toolName: string): Promise<Result<ITool | null, Error>> {
    this.logger.debug('Retrieving tool', { toolName });

    const tool = this.tools.get(toolName);

    if (tool) {
      this.logger.debug('Tool found', {
        toolName: tool.name,
      });
    } else {
      this.logger.debug('Tool not found', { toolName });
    }

    return Result.ok(tool || null);
  }

  async list(): Promise<Result<ITool[], Error>> {
    this.logger.debug('Listing all tools', {
      totalTools: this.tools.size,
    });

    const toolList = Array.from(this.tools.values());

    return Result.ok(toolList);
  }
}
