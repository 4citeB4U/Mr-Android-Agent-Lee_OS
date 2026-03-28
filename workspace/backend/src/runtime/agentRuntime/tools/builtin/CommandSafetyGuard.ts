/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.COMMANDSAFETYGUARD.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = CommandSafetyGuard module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\tools\builtin\CommandSafetyGuard.ts
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
 * CommandSafetyGuard — Pre-screens shell commands before execution.
 *
 * Three-tier approach:
 *  1. Pattern rules (fast, deterministic) for obvious allow/block
 *  2. LLM fallback for ambiguous commands (optional)
 *  3. User approval for elevated/external operations
 *
 * ExecTool can run commands with or without a shell. When shell
 * mode is enabled, pipes, redirects, and globs are supported. The
 * safety guard evaluates full command strings and individual
 * segments before execution is allowed.
 */

import { resolve, relative } from 'path';
import { ILogger } from '../../core/interfaces/ILogger.js';
import {
  containsCommandSubstitution,
  containsShellMetacharacters,
  parseCommandLine,
  splitShellSegments,
} from './commandParsing.js';
import type { IPermissionGuard, SDKPermissionRequest } from './IPermissionGuard.js';

// ── Types ────────────────────────────────────────────────────────

export type SafetyAction = 'allow' | 'block' | 'approve';

export interface SafetyDecision {
  readonly action: SafetyAction;
  readonly reason: string;
  readonly suggestedAlternative?: string;
}

export interface CommandContext {
  readonly workingDirectory: string;
  readonly workspacePath: string;
}

export interface CommandEvaluationOptions {
  readonly rawCommand?: string;
  readonly allowShell?: boolean;
}

export interface ICommandSafetyGuard {
  evaluate(
    command: string,
    args: string[],
    context: CommandContext,
    options?: CommandEvaluationOptions,
  ): Promise<SafetyDecision>;
}

/**
 * Optional LLM evaluator for ambiguous commands.
 * Implementations should use a fast model and return structured decisions.
 */
export interface ILLMCommandEvaluator {
  evaluate(command: string, args: string[], context: CommandContext): Promise<SafetyDecision>;
}

/**
 * Optional LLM evaluator for full SDK permission requests.
 * Receives the whole request (shell, read, write, url, mcp) so it can apply
 * richer reasoning — e.g. "is this URL a known registry?" or "is this path
 * likely a config file the user would want to protect?".
 * Only called when pattern-based rules produce an `approve` result.
 *
 * IMPORTANT: Implementations MUST always populate `reason` with a meaningful
 * human-readable explanation. It is shown directly to the user in CLI approval
 * prompts, web approval cards, and block messages.
 */
export interface ILLMPermissionEvaluator {
  evaluateRequest(request: SDKPermissionRequest): Promise<SafetyDecision>;
}

// ── Pattern Rules ────────────────────────────────────────────────

/** Read-only commands always allowed within workspace */
const ALWAYS_ALLOW_COMMANDS = new Set([
  'ls', 'cat', 'head', 'tail', 'wc', 'grep', 'egrep', 'fgrep',
  'find', 'file', 'stat', 'du', 'df', 'diff', 'sort', 'uniq',
  'tr', 'cut', 'awk', 'sed', 'less', 'more', 'tree', 'which',
  'whoami', 'pwd', 'date', 'echo', 'printf', 'true', 'false',
  'test', 'basename', 'dirname', 'realpath', 'readlink',
  'env', 'printenv', 'uname', 'id', 'hostname',
]);

/** Git subcommands that are read-only */
const GIT_SAFE_SUBCOMMANDS = new Set([
  'status', 'log', 'diff', 'show', 'branch', 'tag', 'remote',
  'stash', 'describe', 'rev-parse', 'rev-list', 'shortlog',
  'blame', 'ls-files', 'ls-tree', 'cat-file', 'config',
  // Write ops that are workspace-local and safe:
  'add', 'commit', 'checkout', 'switch', 'merge', 'rebase',
  'pull', 'fetch', 'push', 'stash', 'cherry-pick', 'reset',
  'restore', 'init', 'clone',
]);

/** Package manager read-only subcommands */
const NPM_SAFE_SUBCOMMANDS = new Set([
  'list', 'ls', 'info', 'view', 'search', 'outdated', 'audit',
  'pack', 'explain', 'why', 'fund', 'config', 'prefix', 'root',
  'run', 'test', 'start', 'build', 'install', 'ci', 'prune',
  'exec', 'npx',
]);

/** Commands always blocked regardless of context */
const ALWAYS_BLOCK_COMMANDS = new Set([
  'dd', 'mkfs', 'fdisk', 'parted', 'mount', 'umount',
  'iptables', 'ip6tables', 'nft', 'modprobe', 'insmod', 'rmmod',
  'shutdown', 'reboot', 'halt', 'poweroff', 'init',
  'useradd', 'userdel', 'usermod', 'groupadd', 'groupdel',
  'passwd', 'chpasswd', 'visudo',
]);

/** Sensitive paths that should never be accessed */
const SENSITIVE_PATHS = [
  '/etc/shadow', '/etc/passwd', '/etc/sudoers',
  '/root', '/proc/kcore',
];

/** Commands that always require approval */
const APPROVAL_COMMANDS = new Set([
  'sudo', 'su', 'doas',
  'apt', 'apt-get', 'dpkg', 'yum', 'dnf', 'pacman', 'brew',
  'snap', 'flatpak',
  'systemctl', 'service', 'journalctl',
  'docker', 'podman',
  'ssh', 'scp', 'rsync',
  'crontab',
]);

// ── Guard Implementation ─────────────────────────────────────────

export class PermissionGuard implements IPermissionGuard, ICommandSafetyGuard {
  private readonly defaultContext: CommandContext;
  private readonly allowedMcpServers: Set<string>;

  constructor(
    private readonly logger: ILogger,
    private readonly llmEvaluator?: ILLMCommandEvaluator,
    defaultContext?: CommandContext,
    allowedMcpServers?: string[],
    private readonly llmPermissionEvaluator?: ILLMPermissionEvaluator,
  ) {
    this.defaultContext = defaultContext ?? {
      workingDirectory: process.cwd(),
      workspacePath: process.cwd(),
    };
    this.allowedMcpServers = new Set(allowedMcpServers ?? []);
  }

  async evaluate(
    command: string,
    args: string[],
    context: CommandContext,
    options?: CommandEvaluationOptions,
  ): Promise<SafetyDecision> {
    const rawCommand = options?.rawCommand;
    const allowShell = options?.allowShell ?? false;

    if (rawCommand) {
      if (!allowShell && containsShellMetacharacters(rawCommand)) {
        return {
          action: 'block',
          reason: 'Shell metacharacters are not allowed without shell mode',
        };
      }

      if (allowShell && containsCommandSubstitution(rawCommand)) {
        return {
          action: 'block',
          reason: 'Command substitution is not allowed in shell mode',
        };
      }

      if (allowShell) {
        const segments = splitShellSegments(rawCommand);
        if (segments.length > 1) {
          return this.evaluateSegments(segments, context);
        }

        const parsed = parseCommandLine(rawCommand);
        command = parsed.command || command;
        args = parsed.args.length > 0 ? parsed.args : args;
      }
    }

    return this.evaluateSingleCommand(command, args, context);
  }

  async evaluateCommand(
    command: string,
    args: string[],
    context: CommandContext,
    options?: CommandEvaluationOptions,
  ): Promise<SafetyDecision> {
    return this.evaluate(command, args, context, options);
  }

  async evaluateSDKRequest(request: SDKPermissionRequest): Promise<SafetyDecision> {
    let decision: SafetyDecision;
    switch (request.kind) {
      case 'shell':  decision = await this.evaluateShellPermission(request);  break;
      case 'read':   decision = await this.evaluateReadPermission(request);   break;
      case 'write':  decision = await this.evaluateWritePermission(request);  break;
      case 'url':    decision = await this.evaluateUrlPermission(request);    break;
      case 'mcp':    decision = await this.evaluateMcpPermission(request);    break;
      default:       decision = { action: 'approve', reason: `Unknown permission kind: ${request.kind}` };
    }

    // If pattern rules can only say "approve" (i.e. they couldn't make a
    // confident allow/block call), give the LLM evaluator a shot at the
    // full request before we escalate to the user.
    if (decision.action === 'approve' && this.llmPermissionEvaluator) {
      try {
        const llmDecision = await this.llmPermissionEvaluator.evaluateRequest(request);
        this.logger.debug('Safety guard: LLM permission decision', {
          kind: request.kind,
          action: llmDecision.action,
          reason: llmDecision.reason,
        });
        return llmDecision;
      } catch (err) {
        this.logger.warn('Safety guard: LLM permission evaluation failed, keeping approve', {
          error: (err as Error).message,
        });
      }
    }

    return decision;
  }

  private async evaluateShellPermission(request: SDKPermissionRequest): Promise<SafetyDecision> {
    const commandLine = typeof request.command === 'string' ? request.command : request.fullCommandText;
    if (!commandLine) {
      return { action: 'approve', reason: `Shell command missing — request: ${JSON.stringify(request)}` };
    }

    const parsed = parseCommandLine(commandLine);
    if (!parsed.command) {
      return { action: 'approve', reason: `Shell command unparseable — request: ${JSON.stringify(request)}` };
    }

    return this.evaluateCommand(parsed.command, parsed.args, this.defaultContext, {
      rawCommand: commandLine,
      allowShell: true,
    });
  }

  private async evaluateReadPermission(request: SDKPermissionRequest): Promise<SafetyDecision> {
    const pathValue = typeof request.path === 'string' ? request.path : '';
    if (!pathValue) {
      return { action: 'approve', reason: `Read path missing — request: ${JSON.stringify(request)}` };
    }

    if (this.isSensitivePath(pathValue)) {
      return { action: 'block', reason: `Access to sensitive path "${pathValue}" is blocked` };
    }

    if (this.isInsideWorkspace(pathValue, this.defaultContext) || this.isTmpPath(pathValue)) {
      return { action: 'allow', reason: 'Read within allowed path' };
    }

    return { action: 'approve', reason: `Read outside workspace: ${pathValue}` };
  }

  private async evaluateWritePermission(request: SDKPermissionRequest): Promise<SafetyDecision> {
    const pathValue = typeof request.path === 'string' ? request.path : '';
    if (!pathValue) {
      return { action: 'approve', reason: `Write path missing — request: ${JSON.stringify(request)}` };
    }

    if (this.isSystemPath(pathValue)) {
      return { action: 'block', reason: `Write to system path "${pathValue}" is blocked` };
    }

    if (this.isInsideWorkspace(pathValue, this.defaultContext)) {
      return { action: 'allow', reason: 'Write within workspace' };
    }

    return { action: 'approve', reason: `Write outside workspace: ${pathValue}` };
  }

  private async evaluateUrlPermission(request: SDKPermissionRequest): Promise<SafetyDecision> {
    const urlValue = typeof request.url === 'string' ? request.url : 'unknown url';
    return { action: 'approve', reason: `URL access requires approval: ${urlValue}` };
  }

  private async evaluateMcpPermission(request: SDKPermissionRequest): Promise<SafetyDecision> {
    const serverName = typeof request.serverName === 'string' ? request.serverName : 'unknown';
    if (this.allowedMcpServers.has(serverName)) {
      return { action: 'allow', reason: `MCP server allowed: ${serverName}` };
    }

    return { action: 'approve', reason: `MCP server requires approval: ${serverName}` };
  }

  private async evaluateSegments(
    segments: string[],
    context: CommandContext,
  ): Promise<SafetyDecision> {
    let needsApproval = false;

    for (const segment of segments) {
      const parsed = parseCommandLine(segment);
      if (!parsed.command) {
        continue;
      }
      const decision = await this.evaluateSingleCommand(parsed.command, parsed.args, context);
      if (decision.action === 'block') {
        return {
          action: 'block',
          reason: `Blocked shell segment: ${decision.reason}`,
          suggestedAlternative: decision.suggestedAlternative,
        };
      }
      if (decision.action === 'approve') {
        needsApproval = true;
      }
    }

    if (needsApproval) {
      return {
        action: 'approve',
        reason: 'Shell command includes segments that require approval',
      };
    }

    return {
      action: 'allow',
      reason: 'All shell segments are allowed',
    };
  }

  private async evaluateSingleCommand(
    command: string,
    args: string[],
    context: CommandContext,
  ): Promise<SafetyDecision> {
    // Extract basename for matching (handles /usr/bin/ls → ls)
    const basename = command.includes('/') ? command.split('/').pop()! : command;

    // 1. Always block dangerous commands
    const blockDecision = this.checkBlock(basename, args);
    if (blockDecision) {
      this.logger.debug('Safety guard: BLOCKED', { command: basename, reason: blockDecision.reason });
      return blockDecision;
    }

    // 2. Always allow safe read-only commands within workspace
    const allowDecision = this.checkAllow(basename, args, context);
    if (allowDecision) {
      this.logger.debug('Safety guard: ALLOWED', { command: basename, reason: allowDecision.reason });
      return allowDecision;
    }

    // 3. Require approval for known elevated commands
    const approvalDecision = this.checkApproval(basename, args);
    if (approvalDecision) {
      this.logger.debug('Safety guard: APPROVAL NEEDED', { command: basename, reason: approvalDecision.reason });
      return approvalDecision;
    }

    // 4. LLM fallback for ambiguous commands
    if (this.llmEvaluator) {
      try {
        const llmDecision = await this.llmEvaluator.evaluate(command, args, context);
        this.logger.debug('Safety guard: LLM decision', { command: basename, action: llmDecision.action, reason: llmDecision.reason });
        return llmDecision;
      } catch (err) {
        this.logger.warn('Safety guard: LLM evaluation failed, requiring approval', { error: (err as Error).message });
      }
    }

    // 5. Default: require approval for unknown commands
    return {
      action: 'approve',
      reason: `Unknown command "${basename}" — requires user approval`,
    };
  }

  private checkBlock(command: string, args: string[]): SafetyDecision | null {
    if (ALWAYS_BLOCK_COMMANDS.has(command)) {
      return {
        action: 'block',
        reason: `Command "${command}" is blocked for safety`,
      };
    }

    // Block access to sensitive paths
    for (const arg of args) {
      const resolved = resolve(arg);
      for (const sensitive of SENSITIVE_PATHS) {
        if (resolved === sensitive || resolved.startsWith(sensitive + '/')) {
          return {
            action: 'block',
            reason: `Access to sensitive path "${sensitive}" is blocked`,
          };
        }
      }
    }

    // Block rm -rf / or rm on system paths
    if (command === 'rm') {
      const hasForce = args.some((a) => a.includes('f') && a.startsWith('-'));
      const hasSystemPath = args.some((a) => !a.startsWith('-') && this.isSystemPath(a));
      if (hasForce && hasSystemPath) {
        return {
          action: 'block',
          reason: 'Destructive rm on system paths is blocked',
          suggestedAlternative: 'Use rm within workspace only, or use trash-cli',
        };
      }
    }

    return null;
  }

  private checkAllow(
    command: string,
    args: string[],
    context: CommandContext,
  ): SafetyDecision | null {
    // Safe read-only commands
    if (ALWAYS_ALLOW_COMMANDS.has(command)) {
      return { action: 'allow', reason: `Read-only command "${command}"` };
    }

    // Git with safe subcommand
    if (command === 'git') {
      const subcommand = args.find((a) => !a.startsWith('-'));
      if (subcommand && GIT_SAFE_SUBCOMMANDS.has(subcommand)) {
        return { action: 'allow', reason: `Safe git operation: ${subcommand}` };
      }
    }

    // npm/npx with safe subcommand
    if (command === 'npm') {
      const subcommand = args.find((a) => !a.startsWith('-'));
      if (subcommand && NPM_SAFE_SUBCOMMANDS.has(subcommand)) {
        return { action: 'allow', reason: `Safe npm operation: ${subcommand}` };
      }
      // npm with no subcommand — allow (shows help)
      if (!subcommand) {
        return { action: 'allow', reason: 'npm help' };
      }
    }

    // npx — always allow (runs local/remote packages, similar to npm exec)
    if (command === 'npx') {
      return { action: 'allow', reason: 'npx execution' };
    }

    // Node.js execution within workspace
    if (command === 'node' || command === 'tsx' || command === 'ts-node') {
      const scriptArg = args.find((a) => !a.startsWith('-'));
      if (scriptArg && this.isInsideWorkspace(scriptArg, context)) {
        return { action: 'allow', reason: `Node script within workspace` };
      }
    }

    // Write operations inside workspace are generally safe
    if ((command === 'mkdir' || command === 'touch' || command === 'cp' || command === 'mv' || command === 'rm') 
        && this.allPathsInsideWorkspace(args, context)) {
      return { action: 'allow', reason: `"${command}" within workspace boundary` };
    }

    return null;
  }

  private checkApproval(command: string, _args: string[]): SafetyDecision | null {
    if (APPROVAL_COMMANDS.has(command)) {
      return {
        action: 'approve',
        reason: `"${command}" requires user approval`,
      };
    }

    // curl/wget POST or upload
    if (command === 'curl' || command === 'wget') {
      return {
        action: 'approve',
        reason: `Network command "${command}" requires user approval`,
      };
    }

    return null;
  }

  private isSensitivePath(pathStr: string): boolean {
    const resolved = resolve(pathStr);
    return SENSITIVE_PATHS.some((sensitive) =>
      resolved === sensitive || resolved.startsWith(`${sensitive}/`)
    );
  }

  private isTmpPath(pathStr: string): boolean {
    const resolved = resolve(pathStr);
    return resolved === '/tmp' || resolved.startsWith('/tmp/');
  }

  private isSystemPath(pathStr: string): boolean {
    const resolved = resolve(pathStr);
    const systemPrefixes = ['/', '/usr', '/bin', '/sbin', '/etc', '/var', '/opt', '/lib', '/boot'];
    // If it's directly a system root path (not in home or tmp)
    return systemPrefixes.some((p) => resolved === p) 
      || (resolved.startsWith('/') && !resolved.startsWith('/home') && !resolved.startsWith('/tmp'));
  }

  private isInsideWorkspace(pathStr: string, context: CommandContext): boolean {
    const resolved = resolve(context.workingDirectory, pathStr);
    const rel = relative(context.workspacePath, resolved);
    return !rel.startsWith('..');
  }

  private allPathsInsideWorkspace(args: string[], context: CommandContext): boolean {
    const pathArgs = args.filter((a) => !a.startsWith('-'));
    if (pathArgs.length === 0) {
      return false; // No paths = can't verify, don't auto-allow
    }
    return pathArgs.every((a) => this.isInsideWorkspace(a, context));
  }
}

/**
 * Backward-compatible alias for PermissionGuard.
 * @deprecated Use PermissionGuard instead.
 */
export class CommandSafetyGuard extends PermissionGuard {}
