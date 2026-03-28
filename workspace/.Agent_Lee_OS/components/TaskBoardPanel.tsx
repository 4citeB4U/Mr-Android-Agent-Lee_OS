/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI
TAG: UI.COMPONENT.TASKBOARDPANEL.MAIN

5WH:
WHAT = Phone-friendly task board for Code Studio
WHY = Lets the Creator queue, schedule, and track Agent Lee work inside Studio
WHO = Codex
WHERE = .Agent_Lee_OS/components/TaskBoardPanel.tsx
WHEN = 2026
HOW = Uses WorkstationContext for live tasks plus localStorage for queued tasks

LICENSE:
MIT
*/

import { CalendarClock, CheckCircle2, Clock3, PlayCircle, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useWorkstation } from "../context/AgentLeeWorkstationContext";

type QueuedTaskStatus = "queued" | "running" | "done";

type QueuedTask = {
  id: string;
  title: string;
  notes: string;
  scheduledFor: string;
  status: QueuedTaskStatus;
  createdAt: number;
};

interface TaskBoardPanelProps {
  onDispatchTask?: (taskText: string) => Promise<void> | void;
}

const STORAGE_KEY = "agent_lee_task_board_v1";

function loadQueuedTasks(): QueuedTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueuedTasks(tasks: QueuedTask[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDispatchText(task: QueuedTask): string {
  const sections = [
    `Task: ${task.title}`,
    task.notes.trim() ? `Notes: ${task.notes.trim()}` : "",
    task.scheduledFor ? `Scheduled for: ${task.scheduledFor}` : "",
  ].filter(Boolean);
  return sections.join("\n");
}

export const TaskBoardPanel: React.FC<TaskBoardPanelProps> = ({
  onDispatchTask,
}) => {
  const workstation = useWorkstation();
  const [queuedTasks, setQueuedTasks] = useState<QueuedTask[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  useEffect(() => {
    setQueuedTasks(loadQueuedTasks());
  }, []);

  useEffect(() => {
    saveQueuedTasks(queuedTasks);
  }, [queuedTasks]);

  const liveTasks = workstation.state.tasks;
  const queuedCount = queuedTasks.filter((task) => task.status !== "done").length;
  const readyTasks = useMemo(
    () =>
      queuedTasks.filter(
        (task) =>
          task.status === "queued" &&
          task.scheduledFor &&
          new Date(task.scheduledFor).getTime() <= Date.now(),
      ).length,
    [queuedTasks],
  );

  const resetDraft = () => {
    setTitle("");
    setNotes("");
    setScheduledFor("");
  };

  const addQueuedTask = async (dispatchNow: boolean) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const task: QueuedTask = {
      id: `task-${Date.now()}`,
      title: trimmedTitle,
      notes: notes.trim(),
      scheduledFor,
      status: dispatchNow ? "running" : "queued",
      createdAt: Date.now(),
    };

    setQueuedTasks((previous) => [task, ...previous]);
    resetDraft();

    if (!dispatchNow || !onDispatchTask) return;

    try {
      await onDispatchTask(formatDispatchText(task));
    } finally {
      setQueuedTasks((previous) =>
        previous.map((entry) =>
          entry.id === task.id ? { ...entry, status: "queued" } : entry,
        ),
      );
    }
  };

  const updateQueuedTask = (taskId: string, patch: Partial<QueuedTask>) => {
    setQueuedTasks((previous) =>
      previous.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    );
  };

  const removeQueuedTask = (taskId: string) => {
    setQueuedTasks((previous) => previous.filter((task) => task.id !== taskId));
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#070b12] text-zinc-100">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 px-4 pb-8 pt-4 sm:px-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/8 px-4 py-4 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300/80">
              Live Tasks
            </div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {liveTasks.length}
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Tasks Agent Lee is actively working right now
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
              Queue
            </div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {queuedCount}
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Noted tasks waiting in Studio
            </div>
          </div>
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300/80">
              Ready Now
            </div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {readyTasks}
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Scheduled items whose time has arrived
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[#0d121d]/95 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-cyan-300" />
            <div>
              <div className="text-sm font-semibold text-white">Task Board</div>
              <div className="text-xs text-zinc-400">
                Add, schedule, and queue work without losing the current flow.
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
            <div className="grid gap-3">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What do you want Agent Lee to handle?"
                className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-500/50 focus:outline-none"
              />
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add detail, acceptance criteria, or context for this task."
                className="min-h-[120px] rounded-3xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-500/50 focus:outline-none"
              />
            </div>

            <div className="grid gap-3 rounded-[28px] border border-white/8 bg-black/25 p-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                Schedule
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-[#080b12] px-4 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
              />
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-zinc-400">
                Scheduled tasks stay visible on the board so you can add, remove,
                or launch them whenever you want from the phone.
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => void addQueuedTask(false)}
                  className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08]"
                >
                  Save To Board
                </button>
                <button
                  onClick={() => void addQueuedTask(true)}
                  className="h-11 rounded-2xl border border-cyan-400/30 bg-cyan-500/15 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-500/25"
                >
                  Queue For Agent Lee
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[30px] border border-white/10 bg-[#0b1019] p-4">
            <div className="flex items-center gap-2">
              <PlayCircle size={16} className="text-emerald-300" />
              <div className="text-sm font-semibold text-white">Active Work</div>
            </div>
            <div className="mt-4 space-y-3">
              {liveTasks.length === 0 && (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-500">
                  No live tasks are streaming from Agent Lee right now.
                </div>
              )}
              {liveTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-3xl border border-emerald-500/10 bg-emerald-500/[0.05] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">
                      {task.name}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/80">
                      {task.status}
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-black/30">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                      style={{ width: `${Math.max(6, task.progress)}%` }}
                    />
                  </div>
                  {task.output && (
                    <div className="mt-3 rounded-2xl border border-white/6 bg-black/25 px-3 py-2 text-xs text-zinc-400">
                      {task.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#0b1019] p-4">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-cyan-300" />
              <div className="text-sm font-semibold text-white">Queued Board</div>
            </div>
            <div className="mt-4 space-y-3">
              {queuedTasks.length === 0 && (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-500">
                  Add tasks above and they will stay notated here for Agent Lee.
                </div>
              )}
              {queuedTasks.map((task) => {
                const due =
                  task.scheduledFor &&
                  new Date(task.scheduledFor).getTime() <= Date.now();
                return (
                  <div
                    key={task.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">
                          {task.title}
                        </div>
                        {task.notes && (
                          <div className="mt-1 whitespace-pre-wrap text-xs leading-5 text-zinc-400">
                            {task.notes}
                          </div>
                        )}
                      </div>
                      <div className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-300">
                        {task.status}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                      {task.scheduledFor ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-black/20 px-2.5 py-1">
                          <Clock3 size={12} />
                          {task.scheduledFor}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-black/20 px-2.5 py-1">
                          <Clock3 size={12} />
                          No scheduled time
                        </span>
                      )}
                      {due && task.status === "queued" && (
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
                          Ready now
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={async () => {
                          updateQueuedTask(task.id, { status: "running" });
                          try {
                            await onDispatchTask?.(formatDispatchText(task));
                          } finally {
                            updateQueuedTask(task.id, { status: "queued" });
                          }
                        }}
                        className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200 transition hover:bg-cyan-500/20"
                      >
                        Run Now
                      </button>
                      <button
                        onClick={() =>
                          updateQueuedTask(task.id, {
                            status: task.status === "done" ? "queued" : "done",
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200 transition hover:bg-emerald-500/20"
                      >
                        <CheckCircle2 size={12} />
                        {task.status === "done" ? "Mark Queued" : "Mark Done"}
                      </button>
                      <button
                        onClick={() => removeQueuedTask(task.id)}
                        className="inline-flex items-center gap-1 rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-200 transition hover:bg-red-500/20"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TaskBoardPanel;
