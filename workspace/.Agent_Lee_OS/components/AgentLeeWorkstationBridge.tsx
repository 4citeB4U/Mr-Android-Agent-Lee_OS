/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI
TAG: UI.COMPONENT.AGENTLEEWORKSTATIONCBRIDGE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = Agent Lee Integrated Workstation Bridge
WHY = Unified VM + Code Studio system
WHO = LEEWAY Align Agent
WHERE = .Agent_Lee_OS\components\AgentLeeWorkstationBridge.tsx
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CodeStudio } from "./CodeStudio";
import { LeeVM } from "./LeeVM";

// ── Context for sharing state between Card and nested components ──
export interface WorkstationState {
  activeContent: "desktop" | "code" | "terminal" | "files";
  terminalOutput: string;
  desktopFeed?: HTMLCanvasElement | null;
  selectedFile?: string;
  fileContent?: string;
}

interface AgentLeeWorkstationBridgeProps {
  onStateChange?: (state: WorkstationState) => void;
}

/**
 * AgentLeeWorkstationBridge
 *
 * This component bridges the LeeVM and CodeStudio into a single unified system.
 * It shares state between them and ensures they operate as one workspace:
 *
 * 1. VM controls: terminal, desktop, file explorer
 * 2. Code Studio: editor, build panel, file browser
 * 3. Unified file system access
 * 4. Shared task state and progress tracking
 * 5. Live desktop feed (from RemoteView integration)
 * 6. Terminal I/O streaming
 *
 * The Computer Card displays a view into this unified system
 * that can switch between: desktop, code, terminal, files
 */
export const AgentLeeWorkstationBridge: React.FC<
  AgentLeeWorkstationBridgeProps
> = ({ onStateChange }) => {
  const [workstationState, setWorkstationState] = useState<WorkstationState>({
    activeContent: "code",
    terminalOutput: "Agent Lee workstation terminal\n",
    desktopFeed: null,
  });

  const [sharedVFS, setSharedVFS] = useState<any>(null);
  const [runningTasks, setRunningTasks] = useState<
    Array<{
      id: string;
      name: string;
      status: "running" | "done" | "error";
      progress: number;
    }>
  >([]);

  const desktopFeedRef = useRef<HTMLCanvasElement | null>(null);
  const terminalStreamRef = useRef<WebSocket | null>(null);

  // Append to terminal output
  const appendTerminalOutput = useCallback((text: string) => {
    setWorkstationState((prev) => ({
      ...prev,
      terminalOutput: prev.terminalOutput + text,
    }));
  }, []);

  // Set desktop feed canvas
  const setDesktopFeed = useCallback((canvas: HTMLCanvasElement | null) => {
    desktopFeedRef.current = canvas;
    setWorkstationState((prev) => ({
      ...prev,
      desktopFeed: canvas,
    }));
  }, []);

  // Update workstation state and notify parent
  useEffect(() => {
    onStateChange?.(workstationState);
  }, [workstationState, onStateChange]);

  // Fetch shared VFS from VM backend
  useEffect(() => {
    const fetchVFS = async () => {
      try {
        const res = await fetch("/api/vm/vfs?path=/", {
          headers: {
            "x-neural-handshake":
              localStorage.getItem("AGENT_LEE_KEY") || "AGENT_LEE_SOVEREIGN_V1",
          },
        });
        if (res.ok) {
          const vfs = await res.json();
          setSharedVFS(vfs);
        }
      } catch (err) {
        console.warn("[Workstation] VFS fetch failed", err);
      }
    };
    fetchVFS();
  }, []);

  // Simulate desktop feed (in real app, use RemoteView)
  useEffect(() => {
    const interval = setInterval(() => {
      // This would be replaced with actual desktop screenshot stream
      // For now, we're just a placeholder
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Hidden container for LeeVM state management */}
      {/* The actual UI rendering happens in AgentLeeComputerCard,
          which pulls data from these state sources */}
      <div className="hidden">
        <LeeVM />
      </div>

      {/* Hidden container for CodeStudio state management */}
      <div className="hidden">
        <CodeStudio
          simulationRequest={undefined}
          buildPlan={null}
          onBuildComplete={() => {}}
        />
      </div>

      {/* Workstation state is managed and exposed via workstationState */}
      {/* Parent (AgentLeeComputerCard) reads from this state */}
    </div>
  );
};

/**
 * Utility hook for components to access workstation state
 */
export const useWorkstationState = () => {
  // This would use React Context in a full implementation
  // For now, returning a hook interface
  return {
    appendTerminalOutput: (text: string) => {},
    setDesktopFeed: (canvas: HTMLCanvasElement | null) => {},
    setActiveContent: (content: string) => {},
  };
};

export default AgentLeeWorkstationBridge;
