/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.PROCESSMANAGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ProcessManager module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\core\infrastructure\ProcessManager.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { spawn, ChildProcess } from 'child_process';
import { IProcessManager, SpawnOptions } from '../interfaces/IProcessManager.js';
import { IPlatform } from '../interfaces/IPlatform.js';
import { ILogger } from '../interfaces/ILogger.js';
import { ITracer } from '../interfaces/ITracer.js';

/**
 * Cross-platform process manager implementation
 * 
 * Handles process spawning, lifecycle management, and graceful shutdown
 * with platform-specific behavior for Windows and Unix systems.
 * 
 * @example
 * ```typescript
 * const platform = new Platform();
 * const logger = new ConsoleLogger();
 * const tracer = new Tracer();
 * const processManager = new ProcessManager(platform, logger, tracer);
 * 
 * // Spawn a process
 * const child = processManager.spawn('node', ['--version']);
 * 
 * // Kill gracefully
 * await processManager.killGracefully(child.pid!, 5000);
 * ```
 */
export class ProcessManager implements IProcessManager {
  /**
   * Create a new ProcessManager instance
   * 
   * @param platform - Platform detection instance
   * @param logger - Logger instance
   * @param tracer - Tracer instance
   */
  constructor(
    private readonly platform: IPlatform,
    private readonly logger: ILogger,
    private readonly tracer: ITracer
  ) {}

  /**
   * Spawn a child process with platform-appropriate options
   * 
   * Automatically sets platform-specific defaults:
   * - Windows: shell=true, windowsHide=true
   * - Unix: shell=false (unless explicitly set)
   * 
   * @param command - Command to execute
   * @param args - Command arguments
   * @param options - Spawn options
   * @returns Promise resolving to ChildProcess instance
   * @throws Error if spawn fails
   */
  async spawn(command: string, args: string[] = [], options: SpawnOptions = {}): Promise<ChildProcess> {
    return await this.tracer.span('ProcessManager.spawn', async (span) => {
      span.setAttribute('process.command', command);
      span.setAttribute('process.args', JSON.stringify(args));
      span.setAttribute('process.platform', process.platform);

      this.logger.debug('Spawning process', {
        command,
        args,
        platform: process.platform
      });
      
      // Add event for process spawning
      span.addEvent('process.spawning', {
        'process.command': command,
        'process.args': JSON.stringify(args)
      });

      try {
        // Platform-specific defaults
        const spawnOptions: SpawnOptions = {
          stdio: 'pipe',
          windowsHide: true,
          ...options,
        };

        // On Windows, use shell by default for .bat, .cmd, etc.
        if (this.platform.isWindows() && options.shell === undefined) {
          spawnOptions.shell = true;
        }

        const child = spawn(command, args, spawnOptions);

        span.setAttribute('process.pid', child.pid || 0);
        
        // Add event for successful spawn
        span.addEvent('process.spawned', {
          'process.pid': child.pid || 0
        });
        
        span.setStatus('ok');

        this.logger.info('Process spawned successfully', {
          command,
          pid: child.pid,
          args
        });

        return child;
      } catch (error) {
        const err = error as Error;
        span.setAttribute('process.spawn.error', err.message);
        span.setStatus('error', err.message);

        this.logger.error('Process spawn failed', err, { command, args });

        throw new Error(`Process spawn failed: ${err.message}`);
      }
    });
  }

  /**
   * Kill a process by PID (force kill)
   * 
   * On Windows: Uses taskkill /F /T (force + kill tree)
   * On Unix: Sends SIGKILL
   * 
   * @param pid - Process ID
   * @returns Promise that resolves when kill command completes
   * @throws Error if kill fails
   */
  async kill(pid: number): Promise<void> {
    return await this.tracer.span('ProcessManager.kill', async (span) => {
      span.setAttribute('process.pid', pid);
      span.setAttribute('process.signal', 'SIGKILL');
      span.setAttribute('process.platform', process.platform);

      if (!this.isValidPid(pid)) {
        const error = new Error(`Invalid PID: ${pid}`);
        span.setAttribute('process.kill.error', error.message);
        span.setStatus('error', error.message);
        this.logger.error('Invalid PID for kill operation', error, { pid });
        throw error;
      }

      this.logger.debug('Killing process (force)', { pid, platform: process.platform });

      try {
        if (this.platform.isWindows()) {
          // Windows: Use taskkill to force kill process tree
          await this.execTaskKill(pid, true);
        } else {
          // Unix: Send SIGKILL
          process.kill(pid, 'SIGKILL');
        }

        span.setStatus('ok');
        this.logger.info('Process killed successfully', { pid });
      } catch (error) {
        // If process doesn't exist (ESRCH), that's okay - already dead
        if (error instanceof Error && error.message.includes('ESRCH')) {
          span.addEvent('process.already_dead', { pid });
          this.logger.debug('Process already dead', { pid });
          span.setStatus('ok');
          return;
        }

        const err = error as Error;
        span.setAttribute('process.kill.error', err.message);
        span.setStatus('error', err.message);

        this.logger.error('Failed to kill process', err, { pid });

        throw new Error(`Failed to kill process ${pid}: ${err.message}`);
      }
    });
  }

  /**
   * Kill a process gracefully with fallback to force kill
   * 
   * Strategy:
   * 1. Try SIGTERM (or taskkill without /F on Windows)
   * 2. Wait for process to exit or timeout
   * 3. If timeout, use SIGKILL (or taskkill /F)
   * 
   * @param pid - Process ID
   * @param timeoutMs - Timeout before force kill (default: 5000ms)
   * @returns Promise that resolves when process exits
   * @throws Error if process doesn't exist or kill fails
   */
  async killGracefully(pid: number, timeoutMs: number = 5000): Promise<void> {
    return await this.tracer.span('ProcessManager.killGracefully', async (span) => {
      span.setAttribute('process.pid', pid);
      span.setAttribute('process.timeout_ms', timeoutMs);
      span.setAttribute('process.platform', process.platform);

      if (!this.isValidPid(pid)) {
        const error = new Error(`Invalid PID: ${pid}`);
        span.setAttribute('process.kill.error', error.message);
        span.setStatus('error', error.message);
        this.logger.error('Invalid PID for graceful kill', error, { pid });
        throw error;
      }

      this.logger.debug('Killing process gracefully', { pid, timeoutMs, platform: process.platform });

      try {
        // Step 1: Try graceful shutdown
        if (this.platform.isWindows()) {
          // Windows: taskkill without /F (sends WM_CLOSE)
          try {
            await this.execTaskKill(pid, false);
            span.addEvent('process.signal.sent', { 
              'process.signal': 'WM_CLOSE',
              'process.timeout': timeoutMs
            });
            span.addEvent('process.graceful_signal_sent', { signal: 'WM_CLOSE' });
          } catch (error) {
            // Process might not exist, that's okay
            if (!this.processExists(pid)) {
              span.addEvent('process.already_dead', { pid });
              this.logger.debug('Process already dead before graceful kill', { pid });
              span.setStatus('ok');
              return;
            }
          }
        } else {
          // Unix: Send SIGTERM
          try {
            process.kill(pid, 'SIGTERM');
            span.addEvent('process.signal.sent', {
              'process.signal': 'SIGTERM',
              'process.timeout': timeoutMs
            });
            span.addEvent('process.graceful_signal_sent', { signal: 'SIGTERM' });
            this.logger.debug('Sent SIGTERM to process', { pid });
          } catch (error) {
            // Process might not exist, that's okay
            if (!this.processExists(pid)) {
              span.addEvent('process.already_dead', { pid });
              this.logger.debug('Process already dead before SIGTERM', { pid });
              span.setStatus('ok');
              return;
            }
            throw error;
          }
        }

        // Step 2: Wait for process to exit
        const exited = await this.waitForExit(pid, timeoutMs);

        if (exited) {
          span.setAttribute('process.kill.graceful', true);
          span.setStatus('ok');
          this.logger.info('Process exited gracefully', { pid, timeoutMs });
          return;
        }

        // Step 3: Force kill if still running
        if (this.processExists(pid)) {
          span.addEvent('process.graceful_timeout', { timeoutMs });
          span.addEvent('process.force.kill', {
            'process.reason': 'graceful-timeout'
          });
          this.logger.warn('Process did not exit gracefully, forcing kill', { pid, timeoutMs });
          span.setAttribute('process.kill.graceful', false);
          await this.kill(pid);
        } else {
          span.setAttribute('process.kill.graceful', true);
          span.setStatus('ok');
        }

        this.logger.info('Process killed', { pid, graceful: exited });
      } catch (error) {
        const err = error as Error;
        span.setAttribute('process.kill.error', err.message);
        span.setStatus('error', err.message);

        this.logger.error('Failed to kill process gracefully', err, { pid, timeoutMs });

        throw new Error(`Failed to kill process ${pid} gracefully: ${err.message}`);
      }
    });
  }

  /**
   * Get the platform-specific shell executable
   * 
   * @returns Shell path/name
   */
  getShell(): string {
    return this.platform.getShell();
  }

  /**
   * Execute taskkill command on Windows
   * 
   * @param pid - Process ID
   * @param force - Whether to use /F flag (force)
   * @returns Promise that resolves when taskkill completes
   */
  private async execTaskKill(pid: number, force: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = ['/PID', pid.toString(), '/T']; // /T kills process tree
      if (force) {
        args.push('/F'); // /F forces termination
      }

      const child = spawn('taskkill', args, {
        stdio: 'ignore',
        windowsHide: true,
      });

      child.on('exit', (code) => {
        if (code === 0 || code === 128) {
          // 128 = process not found (already exited)
          resolve();
        } else {
          reject(new Error(`taskkill exited with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Wait for a process to exit
   * 
   * @param pid - Process ID
   * @param timeoutMs - Maximum time to wait
   * @returns Promise that resolves to true if process exited, false if timeout
   */
  private async waitForExit(pid: number, timeoutMs: number): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (!this.processExists(pid)) {
        return true;
      }

      // Poll every 100ms
      await this.sleep(100);
    }

    return false;
  }

  /**
   * Check if a process exists
   * 
   * @param pid - Process ID
   * @returns true if process exists, false otherwise
   */
  private processExists(pid: number): boolean {
    try {
      // Sending signal 0 checks if process exists without actually sending a signal
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if PID is valid
   * 
   * @param pid - Process ID
   * @returns true if valid, false otherwise
   */
  private isValidPid(pid: number): boolean {
    return Number.isInteger(pid) && pid > 0;
  }

  /**
   * Sleep for a specified duration
   * 
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after timeout
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
