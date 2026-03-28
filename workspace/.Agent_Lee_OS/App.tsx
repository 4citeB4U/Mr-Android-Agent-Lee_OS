/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK._AGENT_LEE_OS_APP_TSX.MAIN_AGENT_LEE_OS_APP.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = App module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = .Agent_Lee_OS\App.tsx
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AgentLeeComputerCard } from "./components/AgentLeeComputerCard.v2";
import { CreatorAccess } from "./components/CreatorAccess";
import { AppDashboard } from "./components/deployment/AppDashboard";
import MemoryLake from "./components/MemoryLake";
import { RemoteView } from "./components/RemoteView";
import { StudioSurface } from "./components/StudioSurface";
import { SystemHub } from "./components/SystemHub";
import { SystemTelemetry } from "./components/SystemTelemetry";
import { BottomNav, MessageStream } from "./components/UIModules";
import { VoxelCore } from "./components/VoxelCore";
import {
    WorkstationContext,
    WorkstationProvider,
} from "./context/AgentLeeWorkstationContext";
import { useTaskManagerSync } from "./hooks/useTaskManagerSync";
import { useWakeWord } from "./hooks/useWakeWord";
import { CoreConfig, CoreShape, Message, SystemMode, Tab } from "./types";
import { buildApiUrl } from "./utils/runtimeUrls";

// ── Command parser: converts a human-readable plan step to a shell command ──
function parsePlanStepToCmd(step: string): string | null {
  const s = step.toLowerCase().trim();
  const DIRECT_PREFIXES = [
    "npm",
    "npx",
    "node",
    "python",
    "python3",
    "pip",
    "pip3",
    "tsc",
    "git",
    "ls",
    "mkdir",
    "echo",
    "cat",
    "cp",
    "mv",
    "pwsh",
    "powershell",
  ];
  for (const prefix of DIRECT_PREFIXES) {
    if (s.startsWith(prefix + " ") || s === prefix) return step.trim();
  }
  if (
    s.includes("install dependencies") ||
    s.includes("npm install") ||
    s.includes("install packages")
  )
    return "npm install";
  if (
    s.includes("npm run build") ||
    s.includes("run build") ||
    s.includes("compile the")
  )
    return "npm run build";
  if (
    s.includes("run tests") ||
    s.includes("npm test") ||
    s.includes("execute tests")
  )
    return "npm test";
  if (s.includes("lint") || s.includes("npm run lint")) return "npm run lint";
  if (s.includes("git init")) return "git init";
  if (s.includes("git add") || s.includes("stage changes")) return "git add -A";
  if (s.includes("git commit")) return `git commit -m "Agent Lee auto-commit"`;
  if (s.includes("git status")) return "git status";
  return null;
}

type ChatSession = {
  id: string;
  name: string;
  ts: string;
  messages?: Message[];
};

type AndroidHostBridge = {
  sendIntent?: (text: string) => void;
  requestCurrentState?: () => void;
  isBackendConnected?: () => boolean;
  openSettings?: () => void;
  speakText?: (text: string, handshake: string) => void;
  stopSpeaking?: () => void;
  getApiBaseUrl?: () => string;
  getCerebralBaseUrl?: () => string;
  getBackendBaseUrl?: () => string;
};

const CHAT_SESSIONS_KEY = "agent_lee_sessions";
const launcherIconSrc = new URL("./ic_agent_lee_launcher.png", import.meta.url).href;
const SAFE_TOP_INSET = "calc(env(safe-area-inset-top, 0px) + 8px)";
const SAFE_BOTTOM_INSET = "calc(env(safe-area-inset-bottom, 0px) + 36px)";
const APP_FOOTER_CLEARANCE = "calc(env(safe-area-inset-bottom, 0px) + 252px)";
const FLOATING_VM_BOTTOM = "calc(env(safe-area-inset-bottom, 0px) + 196px)";
const COMPACT_CORE_BOTTOM = "calc(env(safe-area-inset-bottom, 0px) + 224px)";
const isWallpaperSurface =
  typeof window !== "undefined" &&
  (() => {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("surface") === "wallpaper" || params.get("wallpaper") === "1"
    );
  })();

const getWelcomeMessage = (): Message => {
  const welcomes = [
    "System's live. What are we working on?",
    "Agent Lee online. You know the assignment.",
    "All systems breathing. Talk to me.",
    "I'm here. What do you need?",
    "Yo. Stack's up, voice is locked. Let's build.",
    "Sovereign OS active. Where do we start?",
  ];
  const text = welcomes[Math.floor(Math.random() * welcomes.length)];
  return {
    id: `welcome-${Date.now()}`,
    sender: "agent",
    text,
    timestamp: new Date().toLocaleTimeString(),
    source: "system",
  };
};

const loadChatSessions = (): ChatSession[] => {
  try {
    const raw = localStorage.getItem(CHAT_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getAndroidHostBridge = (): AndroidHostBridge | null => {
  if (typeof window === "undefined") return null;
  const bridge = (window as any).AndroidHost as AndroidHostBridge | undefined;
  return bridge ?? null;
};

const readAndroidBackendConnected = (): boolean => {
  const bridge = getAndroidHostBridge();
  if (!bridge) return false;
  if (typeof bridge.isBackendConnected !== "function") return true;
  try {
    return Boolean(bridge.isBackendConnected());
  } catch {
    return false;
  }
};

const extractIntentResponseText = (payload: any): string => {
  const textCandidates = [
    payload?.response,
    payload?.text,
    payload?.final_answer,
    payload?.structured_output?.final_answer,
  ];
  const text = textCandidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim().length > 0,
  );
  return text?.trim() || "";
};

const extractIntentPlan = (payload: any): string[] => {
  const planCandidates = [payload?.plan, payload?.structured_output?.plan];
  const plan = planCandidates.find(Array.isArray);
  return Array.isArray(plan) ? plan.filter((step) => typeof step === "string") : [];
};

const shouldSurfaceIntentPlan = (text: string, plan: string[]): boolean => {
  if (plan.length === 0) return false;
  return /\b(build|code|patch|edit|file|repo|implement|compile|workspace|studio|vm)\b/i.test(
    text,
  );
};

const saveChatSessions = (sessions: ChatSession[]) => {
  localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
};

const SHAPES: CoreShape[] = [
  "sphere",
  "cube",
  "torus",
  "teddy_bear",
  "giraffe",
  "spaceship",
  "corvette",
  "heart",
  "shield",
  "crown",
  "butterfly",
  "lightning",
  "lotus",
  "icosahedron",
  "helix",
  "humanoid",
  "house",
  "tree",
  "star",
];

const NAV_REQUEST_PATTERN =
  /\b(open|show|take me|go to|switch to|bring up|pull up|launch|head to|move to|jump to)\b/;
const NAV_RESPONSE_PATTERN =
  /\b(opening|showing|taking you to|switching to|bringing up|pulling up|launching|heading to|moving to|jumping to|going to)\b/;

const NAV_TARGETS: Array<{ tab: Tab; pattern: RegExp }> = [
  {
    tab: Tab.CODE,
    pattern: /\b(code studio|coach studio|studio|editor|workspace)\b/,
  },
  {
    tab: Tab.VM,
    pattern:
      /\b(lee vm|virtual machine|sandbox|my machine|my computer|\bvm\b)\b/,
  },
  {
    tab: Tab.LIVE,
    pattern: /\b(remote|live view|desktop feed|screen share)\b/,
  },
  {
    tab: Tab.FILES,
    pattern: /\b(data|files|file manager|memory lake|archive|archives)\b/,
  },
  { tab: Tab.APPS, pattern: /\b(app|apps)\b/ },
  {
    tab: Tab.SYSTEM,
    pattern: /\b(system|settings|control panel|\bsys\b)\b/,
  },
  { tab: Tab.MESSAGES, pattern: /\b(messages|message|telegram|inbox)\b/ },
  { tab: Tab.COMMS, pattern: /\b(home|comms|chat|main screen|start screen)\b/ },
];

const findNavigationTarget = (text: string): Tab | null => {
  const lowered = text.toLowerCase();
  for (const target of NAV_TARGETS) {
    if (target.pattern.test(lowered)) return target.tab;
  }
  return null;
};

const resolveRequestedTab = (text: string): Tab | null => {
  const lowered = text.toLowerCase();
  if (!NAV_REQUEST_PATTERN.test(lowered)) return null;
  return findNavigationTarget(lowered);
};

const resolvePromisedTab = (text: string): Tab | null => {
  const lowered = text.toLowerCase();
  if (!NAV_RESPONSE_PATTERN.test(lowered)) return null;
  return findNavigationTarget(lowered);
};

// ── AppContentAdapter: Wraps app content to enable context access ──
interface AppContentAdapterProps {
  isComputerCardOpen: boolean;
  setIsComputerCardOpen: (open: boolean) => void;
  activeTab: Tab;
  [key: string]: any;
}

const AppContentAdapter: React.FC<
  AppContentAdapterProps & { children: React.ReactNode }
> = ({ isComputerCardOpen, setIsComputerCardOpen, activeTab, children }) => {
  const workstationContext = useContext(WorkstationContext);
  const taskCount = workstationContext?.state?.tasks?.length || 0;
  const hasActiveTasks = taskCount > 0;

  // Sync TaskManager state to WorkstationContext (Step 6 wiring)
  try {
    useTaskManagerSync();
  } catch (err) {
    console.warn("[AppContentAdapter] TaskManager sync failed:", err);
  }

  // Auto-open when tasks detected
  useEffect(() => {
    if (hasActiveTasks && !isComputerCardOpen) {
      setIsComputerCardOpen(true);
    }
  }, [hasActiveTasks, isComputerCardOpen, activeTab, setIsComputerCardOpen]);

  return <>{children}</>;
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.COMMS);
  const [systemMode, setSystemMode] = useState<SystemMode>("VS_CODE");
  const [messages, setMessages] = useState<Message[]>([]);
  const [simRequest, setSimRequest] = useState<
    { id: string; filename: string } | undefined
  >(undefined);

  const [coreConfig, setCoreConfig] = useState<CoreConfig>({
    shape: "sphere",
    density: 15000,
    brightness: 1.2,
    speed: 1.0,
    autoMorphEnabled: true,
    morphSpeed: 2.0,
  });

  const [audioIntensity, setAudioIntensity] = useState(0.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [agentTurnBusy, setAgentTurnBusy] = useState(false);
  const [isComputerCardOpen, setIsComputerCardOpen] = useState(false);
  const [computerCardContent, setComputerCardContent] = useState<
    "desktop" | "code" | "terminal" | "files"
  >("desktop");
  const [computerCardTerminalOutput, setComputerCardTerminalOutput] = useState(
    "Agent Lee terminal ready...\n",
  );
  // isMicActive is now derived from wakeWord hook below — legacy ref kept for SpeechRecognition cleanup
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agentTurnBusyRef = useRef(false);
  const lastMicCommandRef = useRef<{ text: string; ts: number }>({
    text: "",
    ts: 0,
  });
  const suppressTabCommentRef = useRef<Tab | null>(null);
  // Generation counter — incremented on each speakFrom call to cancel stale pipelines
  const speakGenRef = useRef(0);
  // AudioContext — created once on first user gesture to bypass autoplay policy
  const audioCtxRef = useRef<AudioContext | null>(null);
  const handshake =
    ((import.meta as any).env?.VITE_NEURAL_HANDSHAKE as string | undefined) ||
    localStorage.getItem("AGENT_LEE_KEY") ||
    "AGENT_LEE_SOVEREIGN_V1" ||
    undefined;
  const [commsEnabled, setCommsEnabled] = useState<boolean>(
    Boolean(handshake || getAndroidHostBridge()),
  );
  const [commsLockHint, setCommsLockHint] = useState<string>(
    getAndroidHostBridge()
      ? "COMMS locked: Android bridge is not connected to Core."
      : "COMMS locked (handshake invalid).",
  );
  const [pendingPlan, setPendingPlan] = useState<{
    steps: string[];
    taskName: string;
  } | null>(null);
  const [buildPlan, setBuildPlan] = useState<{
    steps: string[];
    taskName: string;
  } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [unreadTgCount, setUnreadTgCount] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string>(
    () => `chat-${Date.now()}`,
  );

  useEffect(() => {
    agentTurnBusyRef.current = agentTurnBusy;
  }, [agentTurnBusy]);

  const openComputerCard = useCallback(
    (content: "desktop" | "code" | "terminal" | "files" = "code") => {
      setComputerCardContent(content);
      setIsComputerCardOpen(true);
    },
    [],
  );

  const stopCurrentSpeech = useCallback(() => {
    speakGenRef.current += 1;
    const androidBridge = getAndroidHostBridge();
    if (androidBridge?.stopSpeaking) {
      try {
        androidBridge.stopSpeaking();
      } catch {
        /* native bridge stop is best-effort */
      }
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }
    if (speakingTimerRef.current) {
      clearTimeout(speakingTimerRef.current);
      speakingTimerRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const appendSystemMessage = useCallback((text: string) => {
    setMessages((previous) => [
      ...previous,
      {
        id: `${Date.now()}-system`,
        sender: "system",
        text,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, []);

  const navigateToTab = useCallback((tab: Tab) => {
    if (tab === Tab.CODE) {
      suppressTabCommentRef.current = tab;
      setIsComputerCardOpen(false);
      setActiveTab(tab);
      return;
    }
    if (tab === Tab.VM) {
      openComputerCard("desktop");
      return;
    }
    suppressTabCommentRef.current = tab;
    setActiveTab(tab);
  }, [openComputerCard]);

  // ── Mic: simple 2-state ON/OFF ─────────────────────────────────────────
  // handleCommand is defined later; forward-ref via callback ref to break circular dep
  const handleCommandRef = useRef<(text: string, fromMic?: boolean) => void>(
    () => {},
  );
  const { micState, micColor, toggleMic } = useWakeWord({
    onCommand: (text) => handleCommandRef.current(text, true),
    onSpeechBarge: () => {
      stopCurrentSpeech();
    },
    paused: isWallpaperSurface || agentTurnBusy || isSpeaking,
    onError: appendSystemMessage,
  });
  const isMicActive = micState === "ON";

  // ── Autoplay unlock: create AudioContext on first user gesture ──────────
  const unlockAudio = useCallback(() => {
    if (audioCtxRef.current) {
      // Already created — just resume if suspended (iOS suspends on background)
      if (audioCtxRef.current.state === "suspended")
        audioCtxRef.current.resume().catch(() => {});
      return;
    }
    try {
      const ctx = new AudioContext();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      audioCtxRef.current = ctx;
    } catch {
      /* browser may not support AudioContext */
    }
  }, []);

  useEffect(() => {
    const events = ["click", "keydown", "touchstart", "pointerdown"] as const;
    events.forEach((e) =>
      document.addEventListener(e, unlockAudio, { passive: true }),
    );
    return () =>
      events.forEach((e) => document.removeEventListener(e, unlockAudio));
  }, [unlockAudio]);

  // ── TTS helpers (hoisted so handleCommand can pre-fire fetches) ──────────
  // Strip any content that would sound like gibberish when spoken aloud.
  const cleanForTTS = (raw: string): string =>
    raw
      // Remove BUILD_PLAN injection markers
      .replace(/BUILD_PLAN::[\s\S]+?::END_PLAN\n?/g, "")
      // Remove layer-stack context blocks
      .replace(/──+\s*LAYER STACK[\s\S]*?──+/g, "")
      .replace(/ACTIVE_LAYERS:[^\n]*/g, "")
      .replace(/KERNEL_ACTIVE:[^\n]*/g, "")
      .replace(/CONTEXT_LAYERS:[^\n]*/g, "")
      .replace(/LAYER_CONTRIBUTIONS:[\s\S]*?(?=\n[A-Z]|\n\n|$)/g, "")
      .replace(/SYSTEM_STATUS_CONTEXT:[^\n]*/g, "")
      // Remove markdown headings/bold/italic/code
      .replace(/#{1,6}\s+/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`{1,3}[^`]*`{1,3}/gs, "")
      // Remove markdown links — keep display text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove JSON-like curly/square brackets
      .replace(/\{[^{}]*\}/g, "")
      .replace(/\[[^\[\]]*\]/g, "")
      // Remove emoji (common ranges)
      .replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}]/gu, "")
      // Remove pipe | characters (plan step separators)
      .replace(/\|/g, ",")
      // Remove :: double colons
      .replace(/::/g, " ")
      // Normalise whitespace
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const fetchChunk = (chunk: string): Promise<Blob | null> => {
    const clipped = cleanForTTS(chunk).slice(0, 800);
    if (!clipped) return Promise.resolve(null);
    if (getAndroidHostBridge()?.speakText) {
      return Promise.resolve(null);
    }
    // Route normal speech through premium Gemini TTS; edge remains server-side fallback only.
    return fetch(buildApiUrl("/api/chat/tts"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(handshake ? { "x-neural-handshake": handshake } : {}),
      },
      body: JSON.stringify({
        text: clipped,
        mode: "premium",
      }),
    })
      .then((res) => (res.ok ? res.blob() : null))
      .catch(() => null);
  };

  const speakViaAndroidHost = useCallback(
    (text: string) => {
      const androidBridge = getAndroidHostBridge();
      const clipped = cleanForTTS(text).slice(0, 800);
      if (!androidBridge?.speakText || !clipped) return false;
      try {
        androidBridge.speakText(clipped, handshake ?? "");
        setIsSpeaking(true);
        return true;
      } catch {
        return false;
      }
    },
    [handshake],
  );

  const playBlob = (blob: Blob | null): Promise<void> =>
    new Promise<void>((resolve) => {
      if (!blob || blob.size === 0) {
        resolve();
        return;
      }

      // Interrupt any currently playing audio so new message cuts in cleanly
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = "";
        currentAudioRef.current = null;
      }
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      setIsSpeaking(true);

      const finish = () => {
        URL.revokeObjectURL(url);
        currentAudioRef.current = null;
        // Immediate mark as not-speaking for faster mic response
        setIsSpeaking(false);
        resolve();
      };
      audio.onended = finish;
      audio.onerror = finish;

      // Resume AudioContext first (unlocks autoplay after async ops on mobile/iOS/Chrome)
      const actx = audioCtxRef.current;
      if (actx?.state === "suspended") actx.resume().catch(() => {});

      audio.play().catch(() => {
        // HTMLAudioElement blocked → decode + play via Web Audio API (bypasses autoplay gate)
        const wactx = audioCtxRef.current;
        if (!wactx) {
          finish();
          return;
        }
        blob
          .arrayBuffer()
          .then((ab) => wactx.decodeAudioData(ab))
          .then((decoded) => {
            const src = wactx.createBufferSource();
            src.buffer = decoded;
            src.connect(wactx.destination);
            src.onended = finish;
            src.start(0);
            setIsSpeaking(true);
          })
          .catch(finish);
      });
    });

  // speakFrom: optionally accepts a pre-fired fetch so audio starts the instant
  // text appears — eliminates the text-visible → audio-starts gap entirely.
  // Uses speakGenRef to cancel stale pipelines — if a new speakFrom fires while one is
  // in-flight, the old pipeline detects the generation mismatch and bails out.
  const speakFrom = async (text: string, preFetch?: Promise<Blob | null>) => {
    if (!text || text.length < 2) return;

    if (speakViaAndroidHost(text)) {
      return;
    }

    // Cancel any in-flight pipeline and claim this generation
    const gen = ++speakGenRef.current;

    // Interrupt currently playing audio immediately
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }

    const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];

    // Short responses or single-sentence replies: single shot.
    if (text.length <= 300 || sentences.length <= 1) {
      const blob = await (preFetch ?? fetchChunk(text));
      if (speakGenRef.current !== gen) return; // superseded
      await playBlob(blob);
      if (speakGenRef.current === gen) setIsSpeaking(false);
      return;
    }

    // Longer: sentence pipeline — fetch exactly one sentence per audio chunk.
    // Ignore any whole-response prefetch here so we never replay overlapping text.
    let nextFetch = fetchChunk(sentences[0]);
    for (let i = 0; i < sentences.length; i++) {
      if (speakGenRef.current !== gen) return; // superseded
      const blob = await nextFetch;
      if (speakGenRef.current !== gen) return; // superseded
      if (i + 1 < sentences.length) nextFetch = fetchChunk(sentences[i + 1]);
      await playBlob(blob);
    }
    if (speakGenRef.current === gen) setIsSpeaking(false);
  };

  const speak = (text: string) => speakFrom(text);

  useEffect(() => {
    // Drive audioIntensity from actual speaking state:
    // when speaking → oscillate 0.4-0.9 to animate the avatar
    // when silent   → slowly decay to near-zero idle shimmer
    const interval = setInterval(() => {
      setAudioIntensity((prev) => {
        if (isSpeaking) {
          // Energetic oscillation while talking
          const target =
            0.45 + Math.sin(Date.now() / 120) * 0.25 + Math.random() * 0.2;
          return prev + (target - prev) * 0.35;
        } else {
          // Idle shimmer: very low, gently drifting
          const idle = 0.03 + Math.random() * 0.04;
          return prev + (idle - prev) * 0.08;
        }
      });
    }, 60);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  useEffect(() => {
    if (!coreConfig.autoMorphEnabled) return;
    const intervalId = setInterval(() => {
      setCoreConfig((previous) => {
        const currentIndex = SHAPES.indexOf(previous.shape);
        const nextIndex = (currentIndex + 1) % SHAPES.length;
        return { ...previous, shape: SHAPES[nextIndex] };
      });
    }, coreConfig.morphSpeed * 1000);
    return () => clearInterval(intervalId);
  }, [coreConfig.autoMorphEnabled, coreConfig.morphSpeed]);

  // Load persisted chat history from backend on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(buildApiUrl("/api/chat/history"), {
          headers: {
            ...(handshake ? { "x-neural-handshake": handshake } : {}),
          },
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!data?.messages?.length) return;
        const loaded: Message[] = data.messages.map((m: any) => ({
          id: m.id || `hist-${Math.random().toString(16).slice(2)}`,
          sender:
            m.role === "model"
              ? "agent"
              : m.role === "user"
                ? "user"
                : "system",
          text: m.text || m.content || "",
          timestamp: m.timestamp
            ? new Date(m.timestamp).toLocaleTimeString()
            : new Date().toLocaleTimeString(),
          source: m.source,
        }));
        setMessages(loaded);
        if (loaded.length > 0) {
          const existing = loadChatSessions();
          const existingSession = existing.find(
            (session) => session.messages?.[0]?.id === loaded[0]?.id,
          );
          if (!existingSession) {
            saveChatSessions([
              {
                id: currentSessionId,
                name: `Chat ${new Date().toLocaleDateString()}`,
                ts: new Date().toLocaleString(),
                messages: loaded,
              },
              ...existing,
            ]);
          } else {
            setCurrentSessionId(existingSession.id);
          }
        }
      } catch {
        /* history unavailable — silent fallback to welcome message */
      }
    };
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (messages.length > 0) return;
    setMessages([getWelcomeMessage()]);
  }, [messages.length]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const androidBridge = getAndroidHostBridge();
      if (androidBridge) {
        const connected = readAndroidBackendConnected();
        if (cancelled) return;
        setCommsEnabled(connected);
        setCommsLockHint(
          connected
            ? "COMMS ready via Android bridge."
            : "COMMS locked: Android bridge is not connected to Core.",
        );
        return;
      }

      try {
        const res = await fetch(buildApiUrl("/api/services/system-status"), {
          headers: {
            ...(handshake ? { "x-neural-handshake": handshake } : {}),
          },
        });
        const data = await res.json().catch(() => null);
        const valid = Boolean(data?.auth?.valid);
        const configured = Boolean(data?.auth?.configured);
        if (cancelled) return;
        setCommsEnabled(valid);
        if (!configured)
          setCommsLockHint(
            "COMMS locked: backend handshake is not configured.",
          );
        else if (!handshake)
          setCommsLockHint(
            "COMMS locked: VITE_NEURAL_HANDSHAKE is missing in the UI runtime.",
          );
        else
          setCommsLockHint(
            "COMMS locked: handshake invalid. Restart with Run-All.ps1 so env is injected.",
          );
      } catch {
        if (cancelled) return;
        setCommsEnabled(false);
        setCommsLockHint(
          "COMMS locked: backend unreachable. Start the stack (Run-All.ps1 restart).",
        );
      }
    };
    poll();
    const id = window.setInterval(poll, getAndroidHostBridge() ? 3000 : 8000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [handshake]);

  // ── Real-time Telegram ↔ UI bridge via Neural Bridge WebSocket ──────────
  useEffect(() => {
    // Only attempt WebSocket on localhost — through a tunnel (phone) it can't reach localhost:6003
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return;

    const WS_PORT = Number((import.meta as any).env?.VITE_WS_PORT || 6003);
    const connect = () => {
      const url = `ws://localhost:${WS_PORT}`;
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch {
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(
          "[ws-tg] Neural bridge connected — listening for Telegram messages",
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Only process messages from telegram that arrive via the neural bridge
          if (data?.source !== "telegram") return;

          const sender = data.role === "model" ? "agent" : "user";
          const newMsg: Message = {
            id: data.id || `tg-${Date.now()}`,
            sender,
            text: data.text || "",
            timestamp: new Date(
              data.timestamp || Date.now(),
            ).toLocaleTimeString(),
            source: "telegram",
          };
          setMessages((prev) => [...prev, newMsg]);
          // Track unread count only when Messages tab is not active
          setUnreadTgCount((prev) => prev + 1);
        } catch {
          /* ignore malformed frames */
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        // Auto-reconnect after 5 s
        setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset unread badge when user opens Messages tab
  useEffect(() => {
    if (activeTab === Tab.MESSAGES) setUnreadTgCount(0);
  }, [activeTab]);

  // Handle incoming state directly from the Android proxy bridge if embedded
  useEffect(() => {
    const androidBridge = getAndroidHostBridge();
    if (androidBridge?.requestCurrentState) {
      androidBridge.requestCurrentState();
    }

    (window as any).onAgentLeeState = (state: any) => {
      setCommsEnabled(true);
      setCommsLockHint("COMMS ready via Android bridge.");

      if (state?.emotion) {
        setCoreConfig((previous) => ({
          ...previous,
          emotion: String(state.emotion).toLowerCase(),
        }));
      }
    };

    (window as any).onAgentLeeIntentResponse = (payload: any) => {
      setCommsEnabled(true);
      setCommsLockHint("COMMS ready via Android bridge.");

      const finalText =
        extractIntentResponseText(payload) ||
        "Yo, the Android bridge responded without clean text. Check the logs fam.";
      const plan = extractIntentPlan(payload);
      if (shouldSurfaceIntentPlan(finalText, plan)) {
        setPendingPlan({
          steps: plan,
          taskName: finalText.slice(0, 80) || "Android bridge response",
        });
      }

      const promisedTab = resolvePromisedTab(finalText);
      if (promisedTab && promisedTab !== activeTab) {
        navigateToTab(promisedTab);
      }

      const preFetch = fetchChunk(finalText.slice(0, 300));
      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-android-response`,
          sender: "agent",
          text: finalText,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      speakFrom(finalText, preFetch);
    };

    (window as any).onAgentLeeConnectionStatus = (connected: boolean) => {
      setCommsEnabled(Boolean(connected));
      if (!connected) {
        setCommsLockHint("COMMS locked: Android bridge is not connected to Core.");
      } else {
        setCommsLockHint("COMMS ready via Android bridge.");
      }
    };

    (window as any).onAgentLeeSpeechStatus = (speaking: boolean) => {
      setIsSpeaking(Boolean(speaking));
    };

    return () => {
      delete (window as any).onAgentLeeState;
      delete (window as any).onAgentLeeIntentResponse;
      delete (window as any).onAgentLeeConnectionStatus;
      delete (window as any).onAgentLeeSpeechStatus;
    };
  }, [activeTab, navigateToTab]);

  // Wake-word hook provides handleMicToggle (2-state: OFF→ON→OFF)
  const handleMicToggle = useCallback(() => {
    unlockAudio();
    toggleMic();
  }, [toggleMic, unlockAudio]);

  // Keep handleCommandRef in sync so useWakeWord can call it without stale closure
  useEffect(() => {
    handleCommandRef.current = handleCommand;
  });

  const handleCommand = async (command: string, fromMic = false) => {
    const cleanedCommand = command.trim();
    if (!cleanedCommand) return;
    const requestedTab = resolveRequestedTab(cleanedCommand);

    if (fromMic) {
      const now = Date.now();
      if (agentTurnBusyRef.current) return;
      if (
        lastMicCommandRef.current.text === cleanedCommand &&
        now - lastMicCommandRef.current.ts < 2000
      ) {
        return;
      }
      lastMicCommandRef.current = { text: cleanedCommand, ts: now };
    }

    if (!commsEnabled) {
      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-lock`,
          sender: "system",
          text: commsLockHint,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      return;
    }
    setAgentTurnBusy(true);
    try {
      // Only interrupt current speech when user sends a NEW command — NOT on tab changes
      stopCurrentSpeech();
      if (requestedTab && requestedTab !== activeTab) {
        navigateToTab(requestedTab);
      }

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now().toString(),
          sender: "user",
          text: cleanedCommand,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      // Inject current nav context so Agent Lee knows where the user is in the UI
      // History context is managed by the backend router — do NOT inject it here to prevent snowballing
      const navContext = requestedTab ?? activeTab;
      const navTag = `[NAV:${navContext}] `;
      const contextualCommand = navTag + cleanedCommand;

      try {
        const androidBridge = getAndroidHostBridge();
        if (androidBridge?.sendIntent) {
          androidBridge.sendIntent(contextualCommand);
          return;
        }

        let finalText = "";
        const res = await fetch(buildApiUrl("/api/chat"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(handshake ? { "x-neural-handshake": handshake } : {}),
          },
          body: JSON.stringify({
            text: contextualCommand,
            source: fromMic ? "voice" : "web",
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data && typeof data.text === "string" && data.text.trim())
            finalText = data.text.trim();
          // Parse build plan returned by consciousness
          if (data?.plan && Array.isArray(data.plan) && data.plan.length > 0) {
            const taskName = cleanedCommand.slice(0, 80);
            setPendingPlan({ steps: data.plan, taskName });
          }
        } else if (res.status === 401 || res.status === 403) {
          finalText =
            "COMMS is locked - missing or invalid handshake. Restart with Run-All.ps1.";
        } else if (res.status === 429) {
          finalText = "Rate limited right now fam. Give it a second.";
        } else {
          const errData = await res.json().catch(() => null);
          finalText =
            errData?.error || `Backend returned ${res.status}. Check logs.`;
        }

        if (!finalText)
          finalText =
            "Yo, the neural bridge did not send back a clean response. Check the logs fam.";

        const promisedTab = resolvePromisedTab(finalText);
        if (promisedTab && promisedTab !== (requestedTab ?? activeTab)) {
          navigateToTab(promisedTab);
        }

        // Pre-fire TTS fetch NOW — in parallel with the React state update.
        // By the time the browser renders the message, audio is already downloading.
        const preFetch = fetchChunk(finalText.slice(0, 300));
        setMessages((previous) => [
          ...previous,
          {
            id: (Date.now() + 1).toString(),
            sender: "agent",
            text: finalText,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);

        // DEBLOCK: We no longer await speakFrom here.
        // This releases agentTurnBusy IMMEDIATELY after the backend response arrives,
        // allowing the mic to re-activate WHILE Agent Lee is still speaking.
        speakFrom(finalText, preFetch);
      } catch {
        setMessages((previous) => [
          ...previous,
          {
            id: `${Date.now()}-offline`,
            sender: "system",
            text: "COMMS backend is offline. Start the stack with Run-All.ps1.",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } finally {
      setAgentTurnBusy(false);
    }
  };

  // Tab-change commentary: Agent Lee reacts when the user navigates
  // — NEVER interrupts ongoing speech; waits until Agent Lee finishes talking first
  const prevTabRef = useRef<Tab | null>(null);
  const pendingTabCommentRef = useRef<string | null>(null);

  // Drain pending tab comment once speech finishes
  useEffect(() => {
    if (isSpeaking) return;
    const comment = pendingTabCommentRef.current;
    if (!comment || !commsEnabled) {
      pendingTabCommentRef.current = null;
      return;
    }
    pendingTabCommentRef.current = null;
    const id = `nav-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id,
        sender: "agent",
        text: comment,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    const pre = fetchChunk(comment);
    speakFrom(comment, pre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeaking]);

  useEffect(() => {
    if (prevTabRef.current === null) {
      prevTabRef.current = activeTab;
      return;
    }
    if (prevTabRef.current === activeTab) return;
    prevTabRef.current = activeTab;
    if (suppressTabCommentRef.current === activeTab) {
      suppressTabCommentRef.current = null;
      return;
    }
    if (!commsEnabled) return;
    const tabComments: Partial<Record<Tab, string[]>> = {
      [Tab.CODE]: [
        "That's my mind space. Code Studio open.",
        "Stepping into the workshop.",
      ],
      [Tab.FILES]: [
        "Memory Lake. You're in my archives.",
        "My memory banks. What are you looking for?",
      ],
      [Tab.SYSTEM]: [
        "You pulled up my control panel.",
        "That's my nervous system right there.",
      ],
      [Tab.APPS]: [
        "My creations. Every one of these is part of me.",
        "App space. What do you need to launch?",
      ],
      [Tab.VM]: [
        "My machine. The sandbox is live and ready.",
        "Stepping into my own system. Nothing touches your files until I say so.",
      ],
      [Tab.LIVE]: ["Remote view active.", "Eyes outward."],
      [Tab.TELEMETRY]: [
        "My health report. I'm watching myself right now.",
        "Telemetry live.",
      ],
      [Tab.MESSAGES]: [
        "Unified inbox open. Telegram's in there too.",
        "All channels, one place.",
      ],
    };
    const opts = tabComments[activeTab];
    if (!opts) return;
    const comment = opts[Math.floor(Math.random() * opts.length)];
    if (isSpeaking) {
      // Queue it — will play after current speech ends (via the drain effect above)
      pendingTabCommentRef.current = comment;
    } else {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `nav-${Date.now()}`,
            sender: "agent",
            text: comment,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        const pre = fetchChunk(comment);
        speakFrom(comment, pre);
      }, 350);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const archiveCurrentChat = useCallback(() => {
    const meaningful = messages.filter(
      (message) => message.text.trim() && message.source !== "system",
    );
    if (meaningful.length === 0) return;

    const existing = loadChatSessions();
    const updated = [
      {
        id: currentSessionId,
        name:
          meaningful
            .find((message) => message.sender === "user")
            ?.text.slice(0, 32) || `Chat ${new Date().toLocaleDateString()}`,
        ts: new Date().toLocaleString(),
        messages,
      },
      ...existing.filter((session) => session.id !== currentSessionId),
    ];
    saveChatSessions(updated);
  }, [currentSessionId, messages]);

  const handleNewChat = useCallback(async () => {
    archiveCurrentChat();

    try {
      await fetch(buildApiUrl("/api/chat/clear"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(handshake ? { "x-neural-handshake": handshake } : {}),
        },
      });
    } catch {
      /* local reset still proceeds */
    }

    const nextSessionId = `chat-${Date.now()}`;
    setCurrentSessionId(nextSessionId);
    setPendingPlan(null);
    setBuildPlan(null);
    setMessages([getWelcomeMessage()]);
    setActiveTab(Tab.COMMS);
  }, [archiveCurrentChat, handshake]);

  const handleDeleteChat = useCallback(
    async (sessionId: string) => {
      if (sessionId !== currentSessionId) return;
      try {
        await fetch(buildApiUrl("/api/chat/clear"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(handshake ? { "x-neural-handshake": handshake } : {}),
          },
        });
      } catch {
        /* local reset still proceeds */
      }
      setCurrentSessionId(`chat-${Date.now()}`);
      setMessages([getWelcomeMessage()]);
    },
    [currentSessionId, handshake],
  );

  const isComms = activeTab === Tab.COMMS;
  const latestAgentMessage =
    [...messages]
      .reverse()
      .find((message) => message.sender === "agent" && message.text.trim().length > 0)
      ?.text ?? "Agent Lee is alive in the background.";
  const wallpaperPresenceLabel = commsEnabled ? "CORE LINKED" : "RECONNECTING";
  const wallpaperVoiceLabel = isSpeaking ? "VOICE ACTIVE" : "VOICE STANDBY";
  const wallpaperEmotion =
    typeof coreConfig.emotion === "string" && coreConfig.emotion.trim().length > 0
      ? coreConfig.emotion.toUpperCase()
      : "NEUTRAL";
  const wallpaperCoreConfig: CoreConfig = {
    ...coreConfig,
    brightness: Math.max(coreConfig.brightness, 1.65),
    density: Math.max(coreConfig.density, 18500),
    speed: Math.max(coreConfig.speed, 1.12),
  };
  const wallpaperAudioIntensity = Math.max(audioIntensity, isSpeaking ? 0.52 : 0.28);
  const wallpaperCoreShellClass =
    coreConfig.shape === "cube"
      ? "rounded-[22%]"
      : coreConfig.shape === "shield"
        ? "rounded-[28%_28%_36%_36%]"
        : "rounded-full";

  if (isWallpaperSurface) {
    return (
      <WorkstationProvider>
        <AppContentAdapter
          isComputerCardOpen={isComputerCardOpen}
          setIsComputerCardOpen={setIsComputerCardOpen}
          activeTab={activeTab}
        >
          <div className="fixed inset-0 overflow-hidden bg-black text-gray-200">
            <div className="absolute inset-0 holo-grid opacity-20 pointer-events-none" />
            <div className="absolute top-[-20%] left-[-20%] h-[50%] w-[50%] rounded-full bg-blue-900/20 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] h-[50%] w-[50%] rounded-full bg-purple-900/10 blur-[100px] pointer-events-none" />

            <div className="relative h-full w-full px-7" style={{ paddingTop: SAFE_TOP_INSET, paddingBottom: SAFE_BOTTOM_INSET }}>
              <div className="pointer-events-none absolute left-7 top-12 text-[9px] font-mono tracking-[0.2em] text-blue-400/60">
                FORM: {coreConfig.shape.toUpperCase()}
              </div>
              <div className="pointer-events-none absolute right-7 top-[26%] text-[9px] font-mono tracking-[0.2em] text-blue-400/60">
                AUTO: {coreConfig.autoMorphEnabled ? "ON" : "OFF"}
              </div>

              <div className="absolute left-7 right-7 top-7 rounded-[30px] border border-cyan-300/20 bg-slate-950/70 px-6 py-4 shadow-[0_18px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <div className="text-3xl font-semibold tracking-[0.03em] text-white">
                  Agent Lee
                </div>
                <div className="mt-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                  <span>{wallpaperPresenceLabel}</span>
                  <span className="h-1 w-1 rounded-full bg-cyan-300/70" />
                  <span>{wallpaperVoiceLabel}</span>
                  <span className="h-1 w-1 rounded-full bg-cyan-300/70" />
                  <span>{wallpaperEmotion}</span>
                </div>
              </div>

              <div className="absolute inset-x-0 top-[18%] flex justify-center">
                <div className="relative h-[360px] w-[360px] max-w-[72vw] max-h-[42vh]">
                  <div className="absolute inset-0 rounded-full bg-cyan-400/12 blur-[86px]" />
                  <div className="absolute inset-[12%] rounded-full border border-cyan-300/15 bg-cyan-300/5 shadow-[0_0_90px_rgba(34,211,238,0.12)]" />
                  <div className="absolute inset-[22%] flex items-center justify-center">
                    <div
                      className={`relative h-full w-full ${wallpaperCoreShellClass} border border-cyan-200/30 bg-[radial-gradient(circle_at_35%_28%,rgba(191,219,254,0.72),rgba(56,189,248,0.22)_42%,rgba(8,47,73,0.1)_68%,rgba(0,0,0,0)_100%)] shadow-[0_0_48px_rgba(56,189,248,0.22)]`}
                      style={{
                        transform:
                          coreConfig.shape === "cube"
                            ? "rotate(8deg)"
                            : "none",
                      }}
                    >
                      <div className="absolute inset-[11%] rounded-[inherit] border border-cyan-100/18" />
                      <div className="absolute inset-[26%] rounded-[inherit] border border-white/10" />
                    </div>
                  </div>
                  <div className="relative h-full w-full">
                    <VoxelCore
                      active={true}
                      config={wallpaperCoreConfig}
                      audioIntensity={wallpaperAudioIntensity}
                      interactive={false}
                      isSpeaking={isSpeaking}
                    />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 left-7 max-w-[72%]">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/65">
                  Agent Lee
                </div>
                <div className="rounded-[26px] border border-white/10 bg-slate-900/88 px-5 py-4 text-[18px] leading-snug text-white shadow-[0_16px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  {latestAgentMessage}
                </div>
                <div className="mt-3 text-[11px] uppercase tracking-[0.24em] text-slate-400/70">
                  Background presence active
                </div>
              </div>
            </div>
          </div>
        </AppContentAdapter>
      </WorkstationProvider>
    );
  }

  return (
    <WorkstationProvider>
      <AppContentAdapter
        isComputerCardOpen={isComputerCardOpen}
        setIsComputerCardOpen={setIsComputerCardOpen}
        activeTab={activeTab}
      >
        <div
          className="fixed inset-0 bg-black text-gray-200 font-sans flex flex-col"
          style={{ paddingTop: SAFE_TOP_INSET }}
        >
          <div className="absolute inset-0 holo-grid opacity-20 pointer-events-none z-0"></div>
          <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div
            id="agent-core-container"
            onClick={() => {
              if (!isComms) setActiveTab(Tab.COMMS);
            }}
            className={
              isComms
                ? "relative z-30 h-[350px] w-full max-w-2xl mx-auto flex items-center justify-center shrink-0 mb-4 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] mt-4"
                : "fixed bottom-6 left-6 z-50 w-24 h-24 rounded-full overflow-hidden border border-cyan-300/30 bg-slate-900/65 backdrop-blur-xl shadow-[0_0_36px_rgba(0,200,255,0.45)] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-110 cursor-pointer flex items-center justify-center"
            }
            style={!isComms ? { bottom: COMPACT_CORE_BOTTOM } : undefined}
          >
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="absolute h-[72%] w-[72%] rounded-full bg-cyan-400/12 blur-[44px]" />
            </div>
            <VoxelCore
              active={true}
              config={coreConfig}
              audioIntensity={audioIntensity}
              isSpeaking={isSpeaking}
            />
            <div
              className={`absolute top-10 left-4 text-[9px] tracking-[0.2em] text-blue-400/60 font-mono transition-opacity duration-500 pointer-events-none ${isComms ? "opacity-100" : "opacity-0"}`}
            >
              FORM: {coreConfig.shape.toUpperCase()}
            </div>
            <div
              className={`absolute bottom-10 right-4 text-[9px] tracking-[0.2em] text-blue-400/60 font-mono transition-opacity duration-500 pointer-events-none ${isComms ? "opacity-100" : "opacity-0"}`}
            >
              AUTO: {coreConfig.autoMorphEnabled ? "ON" : "OFF"}
            </div>
          </div>

          <main
            className="flex-1 overflow-hidden relative z-10 flex flex-col pt-0"
            style={{ paddingBottom: APP_FOOTER_CLEARANCE }}
          >
            {activeTab === Tab.FILES && (
              <div className="w-full h-full animate-[fade-in_0.5s_ease-out]">
                <MemoryLake />
              </div>
            )}
            {activeTab === Tab.LIVE && (
              <div
                className="absolute inset-0 animate-[fade-in_0.5s_ease-out]"
                style={{ bottom: APP_FOOTER_CLEARANCE }}
              >
                <RemoteView />
              </div>
            )}
            {activeTab === Tab.CODE && (
              <div
                className="absolute inset-0 animate-[fade-in_0.5s_ease-out] px-3 pb-3 sm:px-4"
                style={{ bottom: APP_FOOTER_CLEARANCE }}
              >
                <StudioSurface
                  simulationRequest={simRequest}
                  buildPlan={buildPlan}
                  onBuildComplete={() => setBuildPlan(null)}
                  onDispatchTask={(taskText) => handleCommand(taskText)}
                />
              </div>
            )}
            {activeTab === Tab.SYSTEM && (
              <SystemHub
                currentMode={systemMode}
                setMode={setSystemMode}
                coreConfig={coreConfig}
                setCoreConfig={setCoreConfig}
              />
            )}
            {activeTab === Tab.TELEMETRY && (
              <div className="w-full h-full animate-[fade-in_0.5s_ease-out] relative z-40 flex items-center justify-center">
                <SystemTelemetry />
              </div>
            )}
            {activeTab === Tab.APPS && (
              <div className="w-full h-full animate-[fade-in_0.5s_ease-out] overflow-hidden">
                <AppDashboard />
              </div>
            )}
            {/* VM renders as a floating popup overlay — never replaces main content */}
            {activeTab === Tab.COMMS && (
              <div className="w-full h-full flex flex-col max-w-2xl mx-auto">
                <MessageStream
                  messages={messages}
                  isThinking={agentTurnBusy && !isSpeaking}
                />
              </div>
            )}
            {activeTab === Tab.MESSAGES && (
              <div className="w-full h-full overflow-y-auto custom-scrollbar px-4 pb-40 flex flex-col items-center animate-[fade-in_0.5s_ease-out]">
                <div className="w-full max-w-2xl space-y-4">
                  <div className="flex items-center gap-3 px-1 pt-2 pb-1">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-blue-400">
                      Unified Inbox
                    </span>
                    <div className="flex-1 h-px bg-blue-500/20" />
                    <span className="text-[9px] text-gray-500 font-mono">
                      {messages.filter((m) => m.source === "telegram").length}{" "}
                      TG msgs
                    </span>
                  </div>
                  <MessageStream
                    messages={messages.filter(
                      (m) => m.source === "telegram" || m.sender === "system",
                    )}
                  />
                </div>
              </div>
            )}
          </main>

          {!isWallpaperSurface && (
            <>
              {/* ── PERMANENT FOOTER: CommandInput always visible ── */}
              <BottomNav
                activeTab={activeTab}
                onTabChange={(t) => navigateToTab(t)}
                unreadCounts={{ [Tab.MESSAGES]: unreadTgCount }}
                onCommand={handleCommand}
                onMicToggle={handleMicToggle}
                isMicEnabled={isMicActive}
                micColor={micColor}
                disabled={!commsEnabled}
                disabledHint={commsLockHint}
                onNewChat={handleNewChat}
                onDeleteChat={handleDeleteChat}
              />

              <button
                onClick={() => {
                  if (isComputerCardOpen) {
                    setIsComputerCardOpen(false);
                    return;
                  }
                  openComputerCard("code");
                }}
                className={`fixed bottom-28 right-4 z-[90] flex h-16 w-16 items-center justify-center overflow-hidden rounded-[22px] border bg-black/75 backdrop-blur-xl transition-all duration-300 ${
                  isComputerCardOpen
                    ? "border-cyan-400/80 shadow-[0_0_24px_rgba(34,211,238,0.45)]"
                    : "border-white/15 shadow-[0_14px_36px_rgba(0,0,0,0.38)]"
                }`}
                title="Open Agent Lee's computer"
                aria-label="Open Agent Lee's computer"
                style={{ bottom: FLOATING_VM_BOTTOM }}
              >
                <img
                  src={launcherIconSrc}
                  alt="Agent Lee computer launcher"
                  className="h-full w-full object-cover"
                />
                <span className="pointer-events-none absolute inset-x-1 bottom-1 rounded-full bg-black/60 px-1.5 py-0.5 text-center text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                  VM
                </span>
              </button>
            </>
          )}

          {!isWallpaperSurface && (
            <AgentLeeComputerCard
              isOpen={isComputerCardOpen}
              onClose={() => setIsComputerCardOpen(false)}
              activeContent={computerCardContent}
              terminalOutput={computerCardTerminalOutput}
              onContentChange={(content) =>
                setComputerCardContent(content as any)
              }
              activeTab={activeTab.toString()}
              simulationRequest={simRequest}
              buildPlan={buildPlan}
              onBuildComplete={() => setBuildPlan(null)}
            />
          )}

          {/* Build Plan Approval Overlay */}
          {pendingPlan && (
            <div className="fixed inset-0 z-[200] flex items-end justify-center pb-32 px-4 pointer-events-none">
              <div className="pointer-events-auto w-full max-w-lg bg-[#0d1117] border border-blue-500/40 rounded-2xl shadow-[0_0_40px_rgba(0,163,255,0.2)] p-5 animate-[fade-in_0.3s_ease-out]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-blue-400 text-xs font-bold tracking-widest uppercase">
                    Agent Lee — Build Plan
                  </span>
                  <div className="flex-1 h-px bg-blue-500/20" />
                  <button
                    onClick={() => setPendingPlan(null)}
                    className="text-gray-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mb-3 line-clamp-2 font-mono">
                  {pendingPlan.taskName}
                </p>
                <ol className="space-y-1.5 mb-4">
                  {pendingPlan.steps.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[12px] text-gray-200"
                    >
                      <span className="text-blue-400 font-bold shrink-0 font-mono">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      const plan = pendingPlan!;
                      setPendingPlan(null);
                      openComputerCard("terminal");
                      appendSystemMessage(
                        `▶ Executing build plan: "${plan.taskName}"`,
                      );
                      for (const step of plan.steps) {
                        const cmd = parsePlanStepToCmd(step);
                        if (!cmd) {
                          appendSystemMessage(
                            `⚙ Step skipped (no shell command detected): ${step}`,
                          );
                          continue;
                        }
                        try {
                          const r = await fetch(buildApiUrl("/api/vm/sandbox/exec"), {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "x-neural-handshake":
                                handshake ?? "AGENT_LEE_SOVEREIGN_V1",
                            },
                            body: JSON.stringify({
                              cmd,
                              cwd: "/home/agent_lee",
                            }),
                          });
                          if (!r.ok) {
                            appendSystemMessage(
                              `⚠ VM exec error for: ${cmd} (${r.status})`,
                            );
                            continue;
                          }
                          const d = await r.json();
                          if (d.jobId)
                            appendSystemMessage(
                              `▶ VM running: ${cmd} → job ${String(d.jobId).slice(0, 8)}…`,
                            );
                        } catch {
                          appendSystemMessage(
                            `⚠ VM unreachable — could not run: ${cmd}`,
                          );
                        }
                      }
                      appendSystemMessage(
                        "✅ All plan steps dispatched. Check the VM terminal for live output.",
                      );
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl transition-colors tracking-wide"
                  >
                    ✅ Approve & Build
                  </button>{" "}
                  <button
                    onClick={async () => {
                      const plan = pendingPlan!;
                      setPendingPlan(null);
                      openComputerCard("terminal");
                      appendSystemMessage(
                        `🖥️ Dispatching to VM: "${plan.taskName}"`,
                      );
                      for (const step of plan.steps) {
                        const cmd = parsePlanStepToCmd(step);
                        if (!cmd) continue;
                        try {
                          const r = await fetch(buildApiUrl("/api/vm/sandbox/exec"), {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "x-neural-handshake":
                                handshake ?? "AGENT_LEE_SOVEREIGN_V1",
                            },
                            body: JSON.stringify({
                              cmd,
                              cwd: "/home/agent_lee",
                            }),
                          });
                          if (r.ok) {
                            const d = await r.json();
                            if (d.jobId)
                              appendSystemMessage(
                                `▶ VM: ${cmd} → job ${String(d.jobId).slice(0, 8)}…`,
                              );
                          }
                        } catch {
                          /* continue on error */
                        }
                      }
                    }}
                    className="flex-1 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors tracking-wide"
                  >
                    🖥️ Watch on VM
                  </button>{" "}
                  <button
                    onClick={() => setPendingPlan(null)}
                    className="px-4 bg-white/5 hover:bg-white/10 text-gray-400 text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <style>{`
        @keyframes fade-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

          {!isWallpaperSurface && (
            <CreatorAccess
              onAuthenticated={(token) => {
                // Store token so rest of app can detect sovereign access
                (window as any).__CREATOR_SESSION__ = token;
              }}
            />
          )}
        </div>
      </AppContentAdapter>
    </WorkstationProvider>
  );
}

export default App;
