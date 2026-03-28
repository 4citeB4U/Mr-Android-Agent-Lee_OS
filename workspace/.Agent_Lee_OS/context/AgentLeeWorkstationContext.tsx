/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI
TAG: UI.CONTEXT.AGENTLEEWORKSTATIONCONTEXT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = Agent Lee Workstation Context
WHY = Unified state management for VM + Code Studio
WHO = LEEWAY Align Agent
WHERE = .Agent_Lee_OS\context\AgentLeeWorkstationContext.tsx
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useReducer,
} from "react";

// ── Type Definitions ──

export type ContentType = "desktop" | "code" | "terminal" | "files" | "browser";

export interface WorkstationTask {
  id: string;
  name: string;
  type: "complex" | "small";
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  startedAt: number;
  completedAt?: number;
  output: string;
  metadata?: Record<string, any>;
}

export interface WorkstationFile {
  path: string;
  name: string;
  type: "file" | "directory";
  content?: string;
  lastModified?: number;
  size?: number;
}

export interface WorkstationState {
  // UI State
  activeContent: ContentType;
  isExpanded: boolean;
  isVisible: boolean;

  // Desktop Feed
  desktopFeed: HTMLCanvasElement | null;
  screenshotUrl?: string;

  // Terminal State
  terminalOutput: string;
  terminalInput: string;
  isTerminalActive: boolean;

  // Code Editor State
  activeFile?: WorkstationFile;
  editorContent: string;
  unsavedChanges: boolean;

  // File System
  currentPath: string;
  fileTree: WorkstationFile[];

  // Task Management
  tasks: WorkstationTask[];
  activeTaskId?: string;

  // Build/Progress
  buildProgress: number;
  isBuildingprocessing: boolean;
  lastBuildResult?: {
    status: "success" | "error";
    output: string;
    timestamp: number;
  };

  // System Status
  isOnline: boolean;
  lastHeartbeat: number;
}

export interface WorkstationAction {
  type:
    | "SET_CONTENT"
    | "TOGGLE_EXPAND"
    | "SET_VISIBLE"
    | "SET_DESKTOP_FEED"
    | "SET_SCREENSHOT_URL"
    | "APPEND_TERMINAL_OUTPUT"
    | "SET_TERMINAL_INPUT"
    | "SET_ACTIVE_FILE"
    | "SET_EDITOR_CONTENT"
    | "MARK_UNSAVED"
    | "SET_CURRENT_PATH"
    | "SET_FILE_TREE"
    | "ADD_TASK"
    | "UPDATE_TASK"
    | "REMOVE_TASK"
    | "SET_BUILD_PROGRESS"
    | "SET_BUILDING"
    | "SET_BUILD_RESULT"
    | "SET_ONLINE"
    | "RESET";
  payload?: any;
}

// ── Initial State ──
const initialState: WorkstationState = {
  activeContent: "desktop",
  isExpanded: true,
  isVisible: false,
  desktopFeed: null,
  terminalOutput: "Agent Lee workstation terminal initialized\n$ ",
  terminalInput: "",
  isTerminalActive: false,
  editorContent: "",
  unsavedChanges: false,
  currentPath: "/home/agent_lee",
  fileTree: [],
  tasks: [],
  buildProgress: 0,
  isBuildingprocessing: false,
  isOnline: true,
  lastHeartbeat: Date.now(),
};

// ── Reducer ──
function workstationReducer(
  state: WorkstationState,
  action: WorkstationAction,
): WorkstationState {
  switch (action.type) {
    case "SET_CONTENT":
      return { ...state, activeContent: action.payload };

    case "TOGGLE_EXPAND":
      return { ...state, isExpanded: !state.isExpanded };

    case "SET_VISIBLE":
      return { ...state, isVisible: action.payload };

    case "SET_DESKTOP_FEED":
      return { ...state, desktopFeed: action.payload };

    case "SET_SCREENSHOT_URL":
      return { ...state, screenshotUrl: action.payload };

    case "APPEND_TERMINAL_OUTPUT":
      return {
        ...state,
        terminalOutput: state.terminalOutput + action.payload,
      };

    case "SET_TERMINAL_INPUT":
      return { ...state, terminalInput: action.payload };

    case "SET_ACTIVE_FILE":
      return { ...state, activeFile: action.payload };

    case "SET_EDITOR_CONTENT":
      return {
        ...state,
        editorContent: action.payload,
        unsavedChanges: true,
      };

    case "MARK_UNSAVED":
      return { ...state, unsavedChanges: action.payload };

    case "SET_CURRENT_PATH":
      return { ...state, currentPath: action.payload };

    case "SET_FILE_TREE":
      return { ...state, fileTree: action.payload };

    case "ADD_TASK": {
      const newTask: WorkstationTask = {
        ...action.payload,
        startedAt: Date.now(),
        progress: 0,
        output: "",
      };
      return {
        ...state,
        tasks: [...state.tasks, newTask],
        activeTaskId: newTask.id,
      };
    }

    case "UPDATE_TASK": {
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t,
        ),
      };
    }

    case "REMOVE_TASK": {
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
        activeTaskId:
          state.activeTaskId === action.payload
            ? state.tasks.find((t) => t.id !== action.payload)?.id
            : state.activeTaskId,
      };
    }

    case "SET_BUILD_PROGRESS":
      return { ...state, buildProgress: action.payload };

    case "SET_BUILDING":
      return { ...state, isBuildingprocessing: action.payload };

    case "SET_BUILD_RESULT":
      return { ...state, lastBuildResult: action.payload };

    case "SET_ONLINE":
      return {
        ...state,
        isOnline: action.payload,
        lastHeartbeat: Date.now(),
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ── Context ──
export const WorkstationContext = createContext<{
  state: WorkstationState;
  dispatch: React.Dispatch<WorkstationAction>;
} | null>(null);

// ── Provider ──
export const WorkstationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(workstationReducer, initialState);

  return (
    <WorkstationContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkstationContext.Provider>
  );
};

// ── Hook ──
export const useWorkstation = () => {
  const context = useContext(WorkstationContext);
  if (!context) {
    throw new Error("useWorkstation must be used within WorkstationProvider");
  }

  const { state, dispatch } = context;

  // Helper functions for common operations
  const setContent = useCallback(
    (content: ContentType) =>
      dispatch({ type: "SET_CONTENT", payload: content }),
    [],
  );

  const toggleExpand = useCallback(
    () => dispatch({ type: "TOGGLE_EXPAND" }),
    [],
  );

  const setVisible = useCallback(
    (visible: boolean) => dispatch({ type: "SET_VISIBLE", payload: visible }),
    [],
  );

  const setDesktopFeed = useCallback(
    (canvas: HTMLCanvasElement | null) =>
      dispatch({ type: "SET_DESKTOP_FEED", payload: canvas }),
    [],
  );

  const setScreenshotUrl = useCallback(
    (url: string | null) =>
      dispatch({ type: "SET_SCREENSHOT_URL", payload: url }),
    [],
  );

  const appendTerminal = useCallback(
    (text: string) =>
      dispatch({ type: "APPEND_TERMINAL_OUTPUT", payload: text }),
    [],
  );

  const setTerminalInput = useCallback(
    (input: string) => dispatch({ type: "SET_TERMINAL_INPUT", payload: input }),
    [],
  );

  const setActiveFile = useCallback(
    (file: WorkstationFile | undefined) =>
      dispatch({ type: "SET_ACTIVE_FILE", payload: file }),
    [],
  );

  const setEditorContent = useCallback(
    (content: string) =>
      dispatch({ type: "SET_EDITOR_CONTENT", payload: content }),
    [],
  );

  const markUnsaved = useCallback(
    (unsaved: boolean) => dispatch({ type: "MARK_UNSAVED", payload: unsaved }),
    [],
  );

  const setCurrentPath = useCallback(
    (path: string) => dispatch({ type: "SET_CURRENT_PATH", payload: path }),
    [],
  );

  const setFileTree = useCallback(
    (files: WorkstationFile[]) =>
      dispatch({ type: "SET_FILE_TREE", payload: files }),
    [],
  );

  const addTask = useCallback(
    (task: Omit<WorkstationTask, "startedAt" | "progress" | "output">) =>
      dispatch({ type: "ADD_TASK", payload: task }),
    [],
  );

  const updateTask = useCallback(
    (taskId: string, updates: Partial<WorkstationTask>) =>
      dispatch({ type: "UPDATE_TASK", payload: { id: taskId, ...updates } }),
    [],
  );

  const removeTask = useCallback(
    (taskId: string) => dispatch({ type: "REMOVE_TASK", payload: taskId }),
    [],
  );

  const setBuildProgress = useCallback(
    (progress: number) =>
      dispatch({ type: "SET_BUILD_PROGRESS", payload: progress }),
    [],
  );

  const setBuilding = useCallback(
    (building: boolean) =>
      dispatch({ type: "SET_BUILDING", payload: building }),
    [],
  );

  const setBuildResult = useCallback(
    (result: WorkstationState["lastBuildResult"]) =>
      dispatch({ type: "SET_BUILD_RESULT", payload: result }),
    [],
  );

  const setOnline = useCallback(
    (online: boolean) => dispatch({ type: "SET_ONLINE", payload: online }),
    [],
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    state,
    // Actions
    setContent,
    toggleExpand,
    setVisible,
    setDesktopFeed,
    setScreenshotUrl,
    appendTerminal,
    setTerminalInput,
    setActiveFile,
    setEditorContent,
    markUnsaved,
    setCurrentPath,
    setFileTree,
    addTask,
    updateTask,
    removeTask,
    setBuildProgress,
    setBuilding,
    setBuildResult,
    setOnline,
    reset,
  };
};
