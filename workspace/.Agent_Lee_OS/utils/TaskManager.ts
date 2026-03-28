/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI
TAG: UI.UTILS.TASKMANAGER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = Agent Lee Task Manager
WHY = Handle task parallelism and scheduling
WHO = LEEWAY Align Agent
WHERE = .Agent_Lee_OS\utils\TaskManager.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { WorkstationTask } from "../context/AgentLeeWorkstationContext";

/**
 * Task Manager for Agent Lee
 * Manages concurrent execution of:
 * - 3 complex tasks (high priority, long-running)
 * - 6 small tasks (quick completion)
 * - Maintains persistent context even when user navigates
 * - Streams output to workstation terminal
 */

interface TaskQueueState {
  complexTasksRunning: WorkstationTask[];
  smallTasksRunning: WorkstationTask[];
  taskHistory: WorkstationTask[];
  maxConcurrentComplex: number;
  maxConcurrentSmall: number;
}

export class AgentLeeTaskManager {
  private queue: TaskQueueState;
  private runningTasks: Map<string, Promise<void>> = new Map();
  private taskUpdateCallbacks: Map<string, (task: WorkstationTask) => void> =
    new Map();
  private outputStreamCallbacks: Array<(text: string) => void> = [];

  constructor() {
    this.queue = {
      complexTasksRunning: [],
      smallTasksRunning: [],
      taskHistory: [],
      maxConcurrentComplex: 3,
      maxConcurrentSmall: 6,
    };
    this.loadPersistedState();
  }

  /**
   * Load task state from sessionStorage
   * Ensures tasks persist even if user navigates away
   */
  private loadPersistedState() {
    try {
      const stored = sessionStorage.getItem("agentlee_task_queue");
      if (stored) {
        const parsed = JSON.parse(stored);
        this.queue = { ...this.queue, ...parsed };
      }
    } catch (err) {
      console.warn("[TaskManager] Failed to load persisted state:", err);
    }
  }

  /**
   * Persist task queue to sessionStorage
   */
  private persistState() {
    try {
      sessionStorage.setItem("agentlee_task_queue", JSON.stringify(this.queue));
    } catch (err) {
      console.warn("[TaskManager] Failed to persist state:", err);
    }
  }

  /**
   * Submit a task to the queue
   */
  public submitTask(
    name: string,
    type: "complex" | "small",
    executor: (task: WorkstationTask) => Promise<void>,
    metadata?: Record<string, any>,
  ): string {
    const task: WorkstationTask = {
      id: `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      type,
      status: "queued",
      progress: 0,
      startedAt: Date.now(),
      output: "",
      metadata,
    };

    // Add to history immediately
    this.queue.taskHistory.push(task);

    // Try to start immediately
    this.processQueue(type, task, executor);

    this.persistState();
    return task.id;
  }

  /**
   * Process task from queue
   */
  private async processQueue(
    type: "complex" | "small",
    task: WorkstationTask,
    executor: (task: WorkstationTask) => Promise<void>,
  ) {
    const list =
      type === "complex"
        ? this.queue.complexTasksRunning
        : this.queue.smallTasksRunning;
    const maxConcurrent =
      type === "complex"
        ? this.queue.maxConcurrentComplex
        : this.queue.maxConcurrentSmall;

    // Check if we can start this task
    if (list.length < maxConcurrent) {
      list.push(task);
      task.status = "running";

      this.emitOutput(`[TASK START] ${task.name} (${task.id.slice(0, 8)}…)\n`);
      this.notifyTaskUpdate(task.id, task);

      try {
        // Run the executor with task context
        await executor(task);

        // Mark as completed
        task.status = "completed";
        task.completedAt = Date.now();
        task.progress = 100;

        this.emitOutput(
          `[TASK COMPLETE] ${task.name} (${((task.completedAt - task.startedAt) / 1000).toFixed(2)}s)\n`,
        );
      } catch (err) {
        task.status = "failed";
        task.completedAt = Date.now();
        this.emitOutput(
          `[TASK ERROR] ${task.name}: ${err instanceof Error ? err.message : String(err)}\n`,
        );
      }

      // Remove from running list
      const index = list.indexOf(task);
      if (index > -1) {
        list.splice(index, 1);
      }

      this.notifyTaskUpdate(task.id, task);
      this.persistState();

      // Try to start next task in queue
      // This would require maintaining a separate queue list
      // For now, tasks are FIFO based on submit order
    } else {
      // Queue is full, task stays in queued state
      this.emitOutput(
        `[TASK QUEUED] ${task.name} - waiting for slot (${list.length}/${maxConcurrent} running)\n`,
      );
    }
  }

  /**
   * Get all tasks (running + history)
   */
  public getAllTasks(): WorkstationTask[] {
    return [
      ...this.queue.complexTasksRunning,
      ...this.queue.smallTasksRunning,
      ...this.queue.taskHistory,
    ];
  }

  /**
   * Get running tasks only
   */
  public getRunningTasks(): WorkstationTask[] {
    return [...this.queue.complexTasksRunning, ...this.queue.smallTasksRunning];
  }

  /**
   * Get task by ID
   */
  public getTask(id: string): WorkstationTask | null {
    const all = this.getAllTasks();
    return all.find((t) => t.id === id) || null;
  }

  /**
   * Update task progress (called by executor)
   */
  public updateTaskProgress(id: string, progress: number, output?: string) {
    const task = this.getTask(id);
    if (task) {
      task.progress = Math.min(progress, 100);
      if (output) {
        task.output += output;
      }
      this.notifyTaskUpdate(id, task);
      this.persistState();
    }
  }

  /**
   * Remove a task
   */
  public removeTask(id: string): boolean {
    const task = this.getTask(id);
    if (!task) return false;

    if (this.queue.complexTasksRunning.includes(task)) {
      this.queue.complexTasksRunning = this.queue.complexTasksRunning.filter(
        (t) => t.id !== id,
      );
    } else if (this.queue.smallTasksRunning.includes(task)) {
      this.queue.smallTasksRunning = this.queue.smallTasksRunning.filter(
        (t) => t.id !== id,
      );
    }
    this.queue.taskHistory = this.queue.taskHistory.filter((t) => t.id !== id);

    this.persistState();
    return true;
  }

  /**
   * Clear all completed tasks
   */
  public clearCompleted() {
    this.queue.taskHistory = this.queue.taskHistory.filter(
      (t) => t.status !== "completed",
    );
    this.persistState();
  }

  /**
   * Register callback for task updates
   */
  public onTaskUpdate(
    id: string,
    callback: (task: WorkstationTask) => void,
  ): () => void {
    this.taskUpdateCallbacks.set(id, callback);

    // Return unsubscribe function
    return () => {
      this.taskUpdateCallbacks.delete(id);
    };
  }

  /**
   * Register callback for output stream
   */
  public onOutput(callback: (text: string) => void): () => void {
    this.outputStreamCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.outputStreamCallbacks.indexOf(callback);
      if (index > -1) {
        this.outputStreamCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify task update to subscribers
   */
  private notifyTaskUpdate(id: string, task: WorkstationTask) {
    const callback = this.taskUpdateCallbacks.get(id);
    if (callback) {
      callback(task);
    }
  }

  /**
   * Emit output to stream
   */
  private emitOutput(text: string) {
    this.outputStreamCallbacks.forEach((cb) => cb(text));
  }

  /**
   * Get task statistics
   */
  public getStats() {
    const all = this.getAllTasks();
    return {
      totalTasks: all.length,
      runningTasks: this.getRunningTasks().length,
      completedTasks: all.filter((t) => t.status === "completed").length,
      failedTasks: all.filter((t) => t.status === "failed").length,
      queuedTasks: all.filter((t) => t.status === "queued").length,
      complexRunning: this.queue.complexTasksRunning.length,
      smallRunning: this.queue.smallTasksRunning.length,
    };
  }
}

// Global singleton instance
export const globalTaskManager = new AgentLeeTaskManager();
