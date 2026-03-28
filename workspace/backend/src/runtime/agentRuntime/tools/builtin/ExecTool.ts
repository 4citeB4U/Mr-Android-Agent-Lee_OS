/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.EXECTOOL.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ExecTool module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\builtin\ExecTool.ts
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
 * ExecTool - Execute shell commands
 *
 * Built-in tool that allows agents to run commands and capture
 * stdout, stderr, and exit code. Shell execution is optional and
 * must be enabled explicitly for pipes, redirects, or globs.
 *
 * Safety is enforced by the CommandSafetyGuard (pattern rules + LLM
 * fallback + user approval), and shell metacharacters are blocked
 * unless shell mode is enabled.
 */

import { spawn } from 'child_process';
import { ITool } from '../domain/interfaces/ITool.js';
import { ToolResult } from '../domain/value-objects/ToolResult.js';
import { Result } from '../../core/types/Result.js';
import { CommandContext } from './CommandSafetyGuard.js';
import type { IPermissionGuard } from './IPermissionGuard.js';
import { IUserApprovalProvider } from './IUserApprovalProvider.js';
import { containsShellMetacharacters, parseCommandLine } from './commandParsing.js';
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_BYTES = 1_048_576; // 1MB

export class ExecTool implements ITool {
  readonly name = 'exec';
  readonly description =
    'Execute a command and return stdout, stderr, and exit code. ' +
    'Shell features (pipes, redirects, globs) are disabled by default; ' +
    'enable shell mode explicitly when needed.';
  readonly schema = {
    type: 'object' as const,
    properties: {
      command: {
        type: 'string' as const,
        description: 'Shell command to run (e.g. "ls -la", "grep foo *.ts | wc -l", "git status")',
      },
      args: {
        type: 'array' as const,
        items: { type: 'string' as const },
        description: 'Additional arguments appended to the command (optional, for backwards compatibility)',
      },
      cwd: {
        type: 'string' as const,
        description: 'Working directory (default: workspace root)',
      },
      timeout: {
        type: 'number' as const,
        description: 'Timeout in milliseconds (default: 30000)',
      },
      stdin: {
        type: 'string' as const,
        description: 'Optional string to pipe to stdin',
      },
      shell: {
        type: 'boolean' as const,
        description: 'Enable shell features like pipes or redirects (default: false)',
      },
    },
    required: ['command'] as string[],
  };
  constructor(
    private readonly workspaceRoot: string,
    private readonly safetyGuard?: IPermissionGuard,
    private readonly approvalProvider?: IUserApprovalProvider,
  ) {}

  async execute(parameters: unknown): Promise<Result<ToolResult, Error>> {
    const params = parameters as {
      command: string;
      args?: string[];
      cwd?: string;
      timeout?: number;
      stdin?: string;
      shell?: boolean;
    };

    const cwd = params.cwd ?? this.workspaceRoot;
    const timeout = params.timeout ?? DEFAULT_TIMEOUT_MS;
    const shell = params.shell ?? false;
    const providedArgs = params.args ?? [];

    const hasExplicitArgs = providedArgs.length > 0;
    const parsed = hasExplicitArgs
      ? { command: params.command, args: providedArgs }
      : parseCommandLine(params.command);

    if (!parsed.command) {
      return Result.fail(new Error('Command is required'));
    }

    const fullCommand = hasExplicitArgs
      ? `${params.command} ${providedArgs.map(a => this.shellEscape(a)).join(' ')}`.trim()
      : params.command;

    if (!shell && !hasExplicitArgs && containsShellMetacharacters(params.command)) {
      return Result.ok(
        ToolResult.success({
          stdout: '',
          stderr: 'BLOCKED: Shell metacharacters require shell mode',
          exitCode: 126,
          timedOut: false,
          blocked: true,
        })
      );
    }

    // Safety guard check — evaluate the full command line
    if (this.safetyGuard) {
      const safetyContext: CommandContext = {
        workingDirectory: cwd,
        workspacePath: this.workspaceRoot,
      };

      const decision = await this.safetyGuard.evaluateCommand(
        parsed.command,
        parsed.args,
        safetyContext,
        {
          rawCommand: hasExplicitArgs && !shell ? undefined : fullCommand,
          allowShell: shell,
        }
      );

      if (decision.action === 'block') {
        return Result.ok(
          ToolResult.success({
            stdout: '',
            stderr: `BLOCKED: ${decision.reason}` +
              (decision.suggestedAlternative ? `\nSuggestion: ${decision.suggestedAlternative}` : ''),
            exitCode: 126,
            timedOut: false,
            blocked: true,
          })
        );
      }

      if (decision.action === 'approve') {
        if (this.approvalProvider) {
          const approvalCommand = shell ? fullCommand : parsed.command;
          const approvalArgs = shell ? [] : parsed.args;
          const approved = await this.approvalProvider.requestApproval({
            command: approvalCommand,
            args: approvalArgs,
            reason: decision.reason,
            kind: 'exec',
          });
          if (!approved) {
            return Result.ok(
              ToolResult.success({
                stdout: '',
                stderr: `DENIED: User denied approval for "${approvalCommand} ${approvalArgs.join(' ')}"`,
                exitCode: 126,
                timedOut: false,
                denied: true,
              })
            );
          }
          // User approved — fall through to execution
        } else {
          const approvalCommand = shell ? fullCommand : parsed.command;
          const approvalArgs = shell ? [] : parsed.args;
          // No approval provider — return approval-required status
          return Result.ok(
            ToolResult.success({
              stdout: '',
              stderr: `APPROVAL REQUIRED: ${decision.reason}. ` +
                `Command: ${approvalCommand} ${approvalArgs.join(' ')}`,
              exitCode: 126,
              timedOut: false,
              approvalRequired: true,
            })
          );
        }
      }
    }

    return await this.executeCommand({
      command: shell ? fullCommand : parsed.command,
      args: shell ? [] : parsed.args,
      cwd,
      timeout,
      stdin: params.stdin,
      shell,
    });
  }

  /**
   * Escape a string for safe inclusion in a shell command.
   * Wraps in single quotes, escaping any embedded single quotes.
   */
  private shellEscape(arg: string): string {
    // If arg has no special chars, return as-is
    if (/^[a-zA-Z0-9_./:@=-]+$/.test(arg)) {
      return arg;
    }
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }

  private executeCommand(options: {
    command: string;
    args: string[];
    cwd: string;
    timeout: number;
    stdin?: string;
    shell: boolean;
  }): Promise<Result<ToolResult, Error>> {
    return new Promise((resolve) => {
      const child = options.shell
        ? spawn(options.command, {
            cwd: options.cwd,
            env: { ...process.env },
            shell: '/bin/sh',
          })
        : spawn(options.command, options.args, {
            cwd: options.cwd,
            env: { ...process.env },
            shell: false,
          });

      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let outputSize = 0;

      const timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, options.timeout);

      child.stdout.on('data', (chunk: Buffer) => {
        outputSize += chunk.length;
        if (outputSize <= MAX_OUTPUT_BYTES) {
          stdout += chunk.toString();
        }
      });

      child.stderr.on('data', (chunk: Buffer) => {
        outputSize += chunk.length;
        if (outputSize <= MAX_OUTPUT_BYTES) {
          stderr += chunk.toString();
        }
      });

      child.on('error', (err: NodeJS.ErrnoException) => {
        clearTimeout(timeoutId);
        if (err.code === 'ENOENT') {
          resolve(Result.ok(ToolResult.success({
            stdout: '',
            stderr: `Command not found: ${options.command}`,
            exitCode: 127,
            timedOut: false,
          })));
        } else {
          resolve(Result.fail(err));
        }
      });

      child.on('close', (code: number | null, signal: string | null) => {
        clearTimeout(timeoutId);
        if (signal === 'SIGTERM') {
          timedOut = true;
        }
        resolve(Result.ok(ToolResult.success({
          stdout,
          stderr,
          exitCode: code ?? 1,
          timedOut,
        })));
      });

      if (options.stdin !== undefined) {
        child.stdin.write(options.stdin);
        child.stdin.end();
      }
    });
  }
}
