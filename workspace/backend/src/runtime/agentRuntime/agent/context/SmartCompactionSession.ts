/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.SMARTCOMPACTIONSESSION.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = SmartCompactionSession module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\context\SmartCompactionSession.ts
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
 * SmartCompactionSession - Agent Lee native session management
 *
 * Replaces ICopilotClient-backed session with in-memory Map store.
 * Uses aiService.process() for compaction summarization.
 * Publishes compaction events to the Phase 0 event bus.
 */

import { randomUUID } from 'crypto';
import { aiService } from '../../../../services/ai.js';
import { ITracer } from '../../core/interfaces/ITracer.js';
import { IEventBus } from '../../core/interfaces/IEventBus.js';
import { SessionConfig, SessionEvent, Message, CompactionResult } from './types.js';
import {
  CompactionStartedEvent,
  CompactionCompleteEvent,
  CompactionTriggeredEvent,
  SessionCreatedEvent,
} from './events.js';
import { Result } from '../../core/types/Result.js';
import { AgentError } from '../domain/interfaces/IAgentTypes.js';
import { ModelSelector } from '../model-selection/ModelSelector.js';

/** In-memory session record */
interface SessionRecord {
  messages: Message[];
  config: SessionConfig;
  createdAt: number;
}

/**
 * SmartCompactionSession - Agent Lee native in-memory session management.
 * Manages chat sessions as Maps; uses aiService.process() for compaction.
 */
export class SmartCompactionSession {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly compactionStartTimes = new Map<string, number>();

  constructor(
    private readonly tracer: ITracer,
    private readonly eventBus: IEventBus,
    private readonly modelSelector?: ModelSelector
  ) {}

  async createSession(config: SessionConfig): Promise<Result<string, AgentError>> {
    return this.tracer.span('context.session.create', async (span) => {
      span.setAttribute('model', config.model ?? 'glm-4-flash');
      span.setAttribute('hasSystemPrompt', !!config.systemPrompt);

      const sessionId = (config as any).sessionId ?? randomUUID();
      this.sessions.set(sessionId, { messages: [], config, createdAt: Date.now() });
      span.setAttribute('sessionId', sessionId);

      await this.eventBus.publish(
        new SessionCreatedEvent(sessionId, config.model ?? 'glm-4-flash', true)
      );

      span.setStatus('ok');
      return Result.ok(sessionId);
    });
  }

  async closeSession(sessionId: string): Promise<Result<void, AgentError>> {
    return this.tracer.span('context.session.close', async (span) => {
      span.setAttribute('sessionId', sessionId);
      this.sessions.delete(sessionId);
      this.compactionStartTimes.delete(sessionId);
      span.setStatus('ok');
      return Result.ok(undefined);
    });
  }

  async cloneSession(
    sourceSessionId: string,
    config: SessionConfig
  ): Promise<Result<string, AgentError>> {
    return this.tracer.span('context.session.clone', async (span) => {
      span.setAttribute('sourceSessionId', sourceSessionId);
      const source = this.sessions.get(sourceSessionId);
      const newSessionId = randomUUID();
      this.sessions.set(newSessionId, {
        messages: source ? [...source.messages] : [],
        config,
        createdAt: Date.now(),
      });
      span.setAttribute('newSessionId', newSessionId);
      span.setStatus('ok');
      return Result.ok(newSessionId);
    });
  }

  async compactManually(
    sessionId: string,
    messages: Message[],
    retainRecent = 5
  ): Promise<Result<CompactionResult, AgentError>> {
    return this.tracer.span('context.compaction.manual', async (span) => {
      span.setAttribute('sessionId', sessionId);
      span.setAttribute('messageCount', messages.length);
      span.setAttribute('retainRecent', retainRecent);

      try {
        if (messages.length === 0) {
          span.setStatus('error', 'No messages to compact');
          return Result.fail(new AgentError('INVALID_INPUT', 'No messages to compact'));
        }

        await this.eventBus.publish(
          new CompactionTriggeredEvent(sessionId, true, 'manual-compaction')
        );

        const summaryResult = await this.generateSummary(messages, sessionId);
        if (summaryResult.isFailure()) {
          span.setStatus('error', summaryResult.getError().message);
          return Result.fail(summaryResult.getError());
        }

        const summary = summaryResult.getValue();
        span.setAttribute('summaryLength', summary.length);

        const existingConfig = this.sessions.get(sessionId)?.config ?? { model: 'glm-4-flash' };
        const newSessionId = `${sessionId}-compacted-${Date.now()}`;
        const createResult = await this.createSession({
          ...existingConfig,
          systemPrompt: `Previous conversation summary:\n\n${summary}`,
        } as SessionConfig);

        if (createResult.isFailure()) {
          span.setStatus('error', createResult.getError().message);
          return Result.fail(createResult.getError());
        }

        const actualNewSessionId = createResult.getValue();
        const recentMessages = messages.slice(-retainRecent);

        const result: CompactionResult = {
          success: true,
          newSessionId: actualNewSessionId,
          messagesBefore: messages.length,
          messagesAfter: 1 + recentMessages.length,
          summary,
        };

        span.setAttribute('newSessionId', actualNewSessionId);
        span.setAttribute('messagesAfter', result.messagesAfter);
        span.setStatus('ok');
        return Result.ok(result);
      } catch (error) {
        const errorMsg = (error as Error).message;
        span.setStatus('error', errorMsg);
        return Result.fail(new AgentError('COMPACTION_FAILED', `Manual compaction failed: ${errorMsg}`));
      }
    });
  }

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  appendMessage(sessionId: string, message: Message): void {
    this.sessions.get(sessionId)?.messages.push(message);
  }

  getMessages(sessionId: string): Message[] {
    return this.sessions.get(sessionId)?.messages ?? [];
  }

  private async generateSummary(
    messages: Message[],
    sessionId: string
  ): Promise<Result<string, AgentError>> {
    return this.tracer.span('context.compaction.summary', async (span) => {
      span.setAttribute('sessionId', sessionId);
      span.setAttribute('messageCount', messages.length);

      try {
        const conversationText = messages.map((m) => `${m.role}: ${m.content}`).join('\n\n');
        const summaryPrompt = `Please provide a concise summary of the following conversation, capturing key points, decisions, and context:\n\n${conversationText}\n\nSummary:`;

        const summary = await aiService.process(summaryPrompt);

        span.setAttribute('summaryLength', summary.length);
        span.setStatus('ok');
        return Result.ok(summary);
      } catch (error) {
        const errorMsg = (error as Error).message;
        span.setStatus('error', errorMsg);
        return Result.fail(new AgentError('SUMMARY_FAILED', `Failed to generate summary: ${errorMsg}`));
      }
    });
  }

  private async onCompactionStart(event: SessionEvent): Promise<void> {
    await this.tracer.span('context.compaction.started', async (span) => {
      span.setAttribute('sessionId', event.sessionId);
      this.compactionStartTimes.set(event.sessionId, Date.now());
      const messageCount = event.data?.messageCount as number | undefined;
      if (messageCount) span.setAttribute('messageCount', messageCount);
      await this.eventBus.publish(
        new CompactionStartedEvent(event.sessionId, messageCount, 'sdk-triggered')
      );
      span.setStatus('ok');
    });
  }

  private async onCompactionComplete(event: SessionEvent): Promise<void> {
    await this.tracer.span('context.compaction.complete', async (span) => {
      span.setAttribute('sessionId', event.sessionId);
      const startTime = this.compactionStartTimes.get(event.sessionId);
      let durationMs: number | undefined;
      if (startTime) {
        durationMs = Date.now() - startTime;
        span.setAttribute('durationMs', durationMs);
        this.compactionStartTimes.delete(event.sessionId);
      }
      const remainingMessages = event.data?.remainingMessages as number | undefined;
      if (remainingMessages) span.setAttribute('remainingMessages', remainingMessages);
      await this.eventBus.publish(
        new CompactionCompleteEvent(event.sessionId, remainingMessages, durationMs)
      );
      span.setStatus('ok');
    });
  }

  async cleanup(): Promise<void> {
    for (const sessionId of Array.from(this.sessions.keys())) {
      await this.closeSession(sessionId);
    }
  }
}
