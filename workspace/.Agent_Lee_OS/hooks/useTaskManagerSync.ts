/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI
TAG: UI.HOOKS.USETASKMANAGERSYNC.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = Task Manager Sync Hook
WHY = Keep WorkstationContext in sync with TaskManager
WHO = LEEWAY Align Agent
WHERE = .Agent_Lee_OS\hooks\useTaskManagerSync.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { useEffect } from "react";
import { useWorkstation } from "../context/AgentLeeWorkstationContext";
import { globalTaskManager } from "../utils/TaskManager";

/**
 * useTaskManagerSync
 *
 * Subscribes to the global TaskManager and keeps the WorkstationContext
 * in sync with task execution state.
 *
 * This hook:
 * 1. Subscribes to TaskManager output and appends to terminal
 * 2. Polls TaskManager state and updates context
 * 3. Calculates real progress based on task completion
 * 4. Updates auto-show/collapse flags
 */
export const useTaskManagerSync = () => {
  const workstation = useWorkstation();

  // Subscribe to task output stream
  useEffect(() => {
    const unsubscribeOutput = globalTaskManager.onOutput((text: string) => {
      // Append task output to shared terminal stream
      workstation.appendTerminal(text);
    });

    return () => {
      unsubscribeOutput();
    };
  }, [workstation]);

  // Sync task manager state to context on interval
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const allTasks = globalTaskManager.getAllTasks();
      const stats = globalTaskManager.getStats();
      const runningTasks = globalTaskManager.getRunningTasks();

      // Calculate progress based on task completion
      // Show 8-12% baseline if tasks are running but none complete yet
      let progressPercent = 0;
      if (stats.totalTasks > 0) {
        if (stats.completedTasks > 0) {
          // Real progress: completed / total
          progressPercent = (stats.completedTasks / stats.totalTasks) * 100;
        } else if (stats.runningTasks > 0) {
          // Active baseline: show 8-12% to indicate active work
          progressPercent = 10;
        }
      }

      // Update build progress (which drives the progress rail)
      workstation.setBuildProgress(progressPercent);

      // Determine current task label (for display in card header or bubble)
      let currentTaskLabel: string | null = null;
      if (runningTasks.length > 0) {
        const firstRunning = runningTasks[0];
        currentTaskLabel = `${firstRunning.name} (${firstRunning.progress}%)`;
      } else if (allTasks.some((t) => t.status === "queued")) {
        const firstQueued = allTasks.find((t) => t.status === "queued");
        if (firstQueued) {
          currentTaskLabel = `Queued: ${firstQueued.name}`;
        }
      }

      // Store current task label in context (can add to WorkstationState if needed)
      // For now, we're mainly using it for progress and auto-show logic
    }, 500); // Sync every 500ms for responsiveness

    return () => {
      clearInterval(syncInterval);
    };
  }, [workstation]);
};
