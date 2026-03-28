/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI
TAG: UI.COMPONENT.STUDIOSURFACE.MAIN

5WH:
WHAT = Full-screen Studio surface for mobile and desktop
WHY = Restores Code Studio as a first-class tab while keeping the task board alongside it
WHO = Codex
WHERE = .Agent_Lee_OS/components/StudioSurface.tsx
WHEN = 2026
HOW = Wraps CodeStudio with a phone-friendly mode switcher and task board panel

LICENSE:
MIT
*/

import { ClipboardList, Code2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { CodeStudio } from "./CodeStudio";
import { TaskBoardPanel } from "./TaskBoardPanel";

interface StudioSurfaceProps {
  simulationRequest?: { id: string; filename: string };
  buildPlan?: { steps: string[]; taskName: string } | null;
  onBuildComplete?: () => void;
  onDispatchTask?: (taskText: string) => Promise<void> | void;
}

type StudioMode = "studio" | "tasks";

const STORAGE_KEY = "agent_lee_studio_surface_mode";

export const StudioSurface: React.FC<StudioSurfaceProps> = ({
  simulationRequest,
  buildPlan,
  onBuildComplete,
  onDispatchTask,
}) => {
  const [mode, setMode] = useState<StudioMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "tasks" ? "tasks" : "studio";
    } catch {
      return "studio";
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[30px] border border-white/8 bg-[#05070d]/95 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between border-b border-white/8 bg-[#0a0f18] px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/75">
            Code Studio
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            Full workspace on the phone, with task tracking built back in.
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 p-1">
          <button
            onClick={() => setMode("studio")}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
              mode === "studio"
                ? "bg-cyan-500/20 text-cyan-100"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Code2 size={14} />
            Studio
          </button>
          <button
            onClick={() => setMode("tasks")}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
              mode === "tasks"
                ? "bg-cyan-500/20 text-cyan-100"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ClipboardList size={14} />
            Task Board
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {mode === "studio" ? (
          <CodeStudio
            simulationRequest={simulationRequest}
            buildPlan={buildPlan}
            onBuildComplete={onBuildComplete}
          />
        ) : (
          <TaskBoardPanel onDispatchTask={onDispatchTask} />
        )}
      </div>
    </div>
  );
};

export default StudioSurface;
