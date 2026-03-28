/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.LLMCOMMANDEVALUATOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = LLMCommandEvaluator module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\builtin\LLMCommandEvaluator.ts
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
 * LLMCommandEvaluator - Agent Lee native security policy evaluator
 *
 * Uses aiService.process() to evaluate shell commands and permission requests.
 * Replaces ICopilotClient-backed session with direct aiService call.
 */

import { ILLMCommandEvaluator, ILLMPermissionEvaluator, SafetyDecision, CommandContext } from './CommandSafetyGuard.js';
import { SDKPermissionRequest } from './IPermissionGuard.js';
import { ILogger } from '../../core/interfaces/ILogger.js';
import { aiService } from '../../../../services/ai.js';

const SAFETY_PROMPT = `You are a security policy evaluator for an AI coding agent. You assess whether operations should be allowed, blocked, or require user approval.

For SHELL commands, classify based on:
- "allow" — read-only, non-destructive, within workspace
- "block" — dangerous (data loss, system modification, security risk)
- "approve" — ambiguous or potentially risky (needs user confirmation)

For READ/WRITE file access, classify based on:
- "allow" — path is within the workspace or a known safe location (/tmp)
- "block" — sensitive system path (/etc/passwd, /root, etc.)
- "approve" — outside workspace but not obviously dangerous

For URL access, classify based on:
- "allow" — well-known, safe domain (e.g. github.com, npmjs.com, docs sites)
- "block" — known malicious or data-exfiltration pattern
- "approve" — unknown or ambiguous URL

For MCP server access, classify based on:
- "allow" — server name matches a common, trusted local tool
- "block" — server name suggests a dangerous or exfiltration capability
- "approve" — unknown server

Always respond with ONLY a JSON object (no markdown, no explanation).
The "reason" field MUST be a human-readable explanation shown directly to the user:
{"action": "allow"|"block"|"approve", "reason": "brief explanation"}`;

export class LLMCommandEvaluator implements ILLMCommandEvaluator, ILLMPermissionEvaluator {
  constructor(
    private readonly logger: ILogger,
  ) {}

  async evaluate(
    command: string,
    args: string[],
    context: CommandContext,
  ): Promise<SafetyDecision> {
    const cmdStr = [command, ...args].join(' ');
    const prompt = `Command: ${cmdStr}\nWorkspace: ${context.workspacePath}\nCWD: ${context.workingDirectory}`;
    return this.queryLLM(prompt);
  }

  private async queryLLM(userQuery: string): Promise<SafetyDecision> {
    try {
      const fullPrompt = `${SAFETY_PROMPT}\n\n---REQUEST---\n${userQuery}\n\nRespond with JSON only:`;
      const text = await aiService.process(fullPrompt);

      const jsonMatch = text.match(/\{[^}]+\}/);
      if (!jsonMatch) throw new Error('No JSON in response');

      const parsed = JSON.parse(jsonMatch[0]) as { action?: string; reason?: string };
      const action = parsed.action as 'allow' | 'block' | 'approve';

      if (!['allow', 'block', 'approve'].includes(action)) {
        throw new Error(`Invalid action: ${action}`);
      }

      return { action, reason: parsed.reason ?? 'LLM evaluation' };
    } catch (parseError) {
      this.logger.warn('Failed to parse LLM safety response, defaulting to approve', {
        error: (parseError as Error).message,
      });
      return { action: 'approve', reason: 'LLM response could not be parsed — requires user approval' };
    }
  }

  async evaluateRequest(request: SDKPermissionRequest): Promise<SafetyDecision> {
    const prompt = this.buildPermissionPrompt(request);
    return this.queryLLM(prompt);
  }

  private buildPermissionPrompt(request: SDKPermissionRequest): string {
    switch (request.kind) {
      case 'shell': {
        const cmd = request.command ?? request.fullCommandText ?? '(unknown)';
        return `Permission kind: shell\nCommand: ${cmd}`;
      }
      case 'read':
        return `Permission kind: read\nPath: ${request.path ?? '(unknown)'}`;
      case 'write':
        return `Permission kind: write\nPath: ${request.path ?? '(unknown)'}`;
      case 'url':
        return `Permission kind: url\nURL: ${request.url ?? '(unknown)'}`;
      case 'mcp':
        return `Permission kind: mcp\nServer: ${request.serverName ?? '(unknown)'}${request.toolName ? `\nTool: ${request.toolName}` : ''}`;
      default:
        return `Permission kind: ${request.kind}\nRequest: ${JSON.stringify(request)}`;
    }
  }

  async cleanup(): Promise<void> {
    // No session to clean up — stateless aiService calls
  }
}
