/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.PAGE.DIAGNOSTICS
TAG: UI.PAGE.DIAGNOSTICS.BRAIN.TELEMETRY

COLOR_ONION_HEX:
NEON=#00F2FF
FLUO=#1BF7CD
PASTEL=#A5F3FC

ICON_ASCII:
family=lucide
glyph=brain

5WH:
WHAT = Diagnostics page — 3D brain visualization, memory lake telemetry, agent center, database dashboard
WHY = Provides system-wide health monitoring and interactive 3D view of Agent Lee's cognitive network
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = pages/Diagnostics.tsx
WHEN = 2026
HOW = Three.js brain renderer + OrbitControls, Recharts telemetry, p5.js particles, agent carousel and DB health panel

AGENTS:
ASSESS
AUDIT
GEMINI
SHIELD
MARSHAL
CLERK
JANITOR
LIBRARIAN
LEEWAY_STANDARDS

LICENSE:
MIT
*/
import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Environment, Sparkles, Html, Line as DreiLine } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Shield, Zap, X, ShieldCheck, Cpu, Database, Play, Square, 
  Settings2, Fingerprint, Volume2, ChevronDown, ChevronUp, Hammer, 
  Rocket, Edit3, Check, LucideIcon, Search, Eye, MessageSquare, 
  Mic2, Code2, Globe, Brain as BrainIcon, PenTool,
  Monitor, HardDrive, Wifi, Server, Thermometer, Clock, Info, PieChart as LucidePieChart,
  Network, Languages, Bug, Archive, Gavel, UserCheck, Trash2, BookOpen,
  Radio, GitBranch, ShieldAlert, Mic, Code, Share2, Layers, Users,
  BookMarked, Gauge, Braces, ChevronRight
} from 'lucide-react';
import * as THREE from 'three';
import { GoogleGenAI, Modality } from "@google/genai";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar
} from 'recharts';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Detects mobile/Android (Galaxy Fold inner + outer screens, iOS, small viewports)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent;
    return window.innerWidth < 768 || /Android|iPhone|iPod/i.test(ua);
  });
  useEffect(() => {
    const check = () => {
      const ua = navigator.userAgent;
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPod/i.test(ua));
    };
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// --- Types ---
interface AgentData {
  id: string;
  title: string;
  subtitle: string;
  responsibility: string;
  icon: LucideIcon;
  imageUrl: string;
  color: string;
  position: [number, number, number];
  description: string;
  tools: string[];
  workflow: string[];
  status: 'ACTIVE' | 'IDLE' | 'SLEEP';
  metrics: {
    cpu: number;
    memory: number;
    latency: number;
  };
  tasks: { id: string; label: string; progress: number; isRunning: boolean }[];
}

// --- Data ---
const AGENTS_RAW: Omit<AgentData, 'position'>[] = [
  // ── INNER RING (8) — Core Cognitive Team ───────────────────────────────────
  {
    id: 'lee-prime',
    title: 'LEE PRIME',
    subtitle: 'SOVEREIGN ORCHESTRATOR',
    responsibility: 'SYSTEM GOVERNANCE',
    icon: Cpu,
    imageUrl: 'https://robohash.org/lee-prime?set=set1&bgset=bg1',
    color: '#00f2ff',
    description: 'Master planner and sovereign orchestrator of the Agent Lee Agentic OS. Routes G1–G8 workflows across all 26 named agents with real-time telemetry.',
    tools: ['Task Router', 'Context Assembler', 'Event Bus', 'Gemini 2.5 Flash', 'World Registry'],
    workflow: ['Receive Intent', 'Decompose Goal', 'Delegate', 'Verify', 'Synthesize', 'Deliver'],
    status: 'ACTIVE',
    metrics: { cpu: 42, memory: 128, latency: 120 },
    tasks: [
      { id: 't1', label: 'Orchestrating System Boot', progress: 100, isRunning: false },
      { id: 't2', label: 'Monitoring Agent Sync', progress: 45, isRunning: true }
    ]
  },
  {
    id: 'nova',
    title: 'NOVA',
    subtitle: 'MASTER ENGINEER',
    responsibility: 'CODE SYNTHESIS',
    icon: Code2,
    imageUrl: 'https://robohash.org/nova?set=set1&bgset=bg1',
    color: '#F59E0B',
    description: 'Master software engineer. Writes, tests, debugs, and builds software in any language within the VM sandbox. Integrates with SyntaxForge for code quality.',
    tools: ['Code Execution', 'Debugger', 'Unit Tester', 'Refactor Engine', 'VM Sandbox'],
    workflow: ['Read Specs', 'Draft Code', 'Execute Tests', 'Debug', 'Refactor', 'Finalize'],
    status: 'ACTIVE',
    metrics: { cpu: 88, memory: 512, latency: 450 },
    tasks: [{ id: 't3', label: 'Refactoring Core Logic', progress: 65, isRunning: true }]
  },
  {
    id: 'atlas',
    title: 'ATLAS',
    subtitle: 'RESEARCH INTEL',
    responsibility: 'KNOWLEDGE RETRIEVAL',
    icon: Globe,
    imageUrl: 'https://robohash.org/atlas?set=set1&bgset=bg1',
    color: '#3B82F6',
    description: 'Research intelligence agent. Performs web searches, GitHub scanning, HuggingFace discovery, and cross-domain synthesis via AdamCortex knowledge graphs.',
    tools: ['Google Search', 'Repo Scanner', 'Paper Summarizer', 'Trend Analyzer', 'HuggingFace API'],
    workflow: ['Query Expansion', 'Source Validation', 'Graph Query', 'Synthesis', 'Citation'],
    status: 'IDLE',
    metrics: { cpu: 12, memory: 256, latency: 800 },
    tasks: []
  },
  {
    id: 'sage',
    title: 'SAGE',
    subtitle: 'MEMORY ARCHITECT',
    responsibility: 'TEMPORAL STORAGE',
    icon: Database,
    imageUrl: 'https://robohash.org/sage?set=set1&bgset=bg1',
    color: '#10B981',
    description: 'Master of memory and dream synthesis. Manages persistent logs, executes the 26-hour dream cycle, and coordinates with Clerk Archive for indexed retrieval.',
    tools: ['Firestore', 'Vector DB', 'Dream Engine', 'Recall API', 'Compression Engine'],
    workflow: ['Log Capture', 'Pattern Synthesis', 'Compress', 'Dream Cycle', 'Insight Extraction'],
    status: 'SLEEP',
    metrics: { cpu: 5, memory: 1024, latency: 15 },
    tasks: [{ id: 't4', label: 'Dream Cycle #42 Synthesis', progress: 88, isRunning: true }]
  },
  {
    id: 'pixel',
    title: 'PIXEL',
    subtitle: 'VISUAL INTELLIGENCE',
    responsibility: 'MANIFESTATION',
    icon: Eye,
    imageUrl: 'https://robohash.org/pixel?set=set1&bgset=bg1',
    color: '#A855F7',
    description: 'Visual manifestation and design engine. Generates images, voxelizes scenes, and designs modern UIs. Feeds outputs to Scribe and reports via Clerk Archive.',
    tools: ['Imagen 3', 'Voxelizer', 'UI Designer', 'Asset Scaler', 'Palette Engine'],
    workflow: ['Prompt Engineering', 'Draft Generation', 'Upscaling', 'Voxelization', 'Export'],
    status: 'IDLE',
    metrics: { cpu: 0, memory: 128, latency: 0 },
    tasks: []
  },
  {
    id: 'echo',
    title: 'ECHO',
    subtitle: 'VOICE & EMOTION',
    responsibility: 'HARMONIC INTERFACE',
    icon: Mic2,
    imageUrl: 'https://robohash.org/echo?set=set1&bgset=bg1',
    color: '#EC4899',
    description: 'Voice and emotion intelligence agent. Detects tone, language, and adapts communication style. Integrated with StreamingSTT and StreamingTTS for real-time voice.',
    tools: ['Edge TTS', 'VAD', 'Emotion Classifier', 'Translator', 'Live Conductor Bridge'],
    workflow: ['Audio Capture', 'Tone Analysis', 'Style Adaptation', 'Synthesis', 'Streaming'],
    status: 'ACTIVE',
    metrics: { cpu: 15, memory: 64, latency: 45 },
    tasks: [{ id: 't5', label: 'Analyzing User Sentiment', progress: 92, isRunning: true }]
  },
  {
    id: 'aegis',
    title: 'GUARD AEGIS',
    subtitle: 'REGISTRY KEEPER',
    responsibility: 'IDENTITY COMPLIANCE',
    icon: UserCheck,
    imageUrl: 'https://robohash.org/aegis?set=set1&bgset=bg1',
    color: '#EF4444',
    description: 'Keeper of the Registry. Monitors all registered agents for contract compliance, identity drift, and unauthorized scope changes. Reports to Gabriel Cortex.',
    tools: ['Policy Auditor', 'Identity Guard', 'Compliance Scanner', 'Registry API'],
    workflow: ['Audit Registry', 'Verify Identity', 'Check Scope', 'Enforce Policy', 'Alert'],
    status: 'ACTIVE',
    metrics: { cpu: 8, memory: 32, latency: 10 },
    tasks: [{ id: 't6', label: 'Registry Integrity Audit', progress: 100, isRunning: false }]
  },
  {
    id: 'scribe',
    title: 'SCRIBE',
    subtitle: 'CHRONICLER',
    responsibility: 'IMMUTABLE RECORD',
    icon: PenTool,
    imageUrl: 'https://robohash.org/scribe?set=set1&bgset=bg1',
    color: '#6366F1',
    description: 'Chronicler of Worlds. Records every significant system action and state as an immutable history ledger. Validates schema via ClerkArchive.',
    tools: ['NDJSON Writer', 'Narrative Engine', 'History Indexer', 'ClerkArchive Bridge'],
    workflow: ['Event Capture', 'Narrative Synthesis', 'Immutable Write', 'Indexing', 'Validate'],
    status: 'ACTIVE',
    metrics: { cpu: 4, memory: 48, latency: 5 },
    tasks: [{ id: 't7', label: 'Recording Session History', progress: 100, isRunning: false }]
  },

  // ── MIDDLE RING (9) — Extended Intelligence Layer ──────────────────────────
  {
    id: 'shield',
    title: 'SHIELD',
    subtitle: 'SECURITY & HEALING',
    responsibility: 'SELF-HEALING SECURITY',
    icon: Shield,
    imageUrl: 'https://robohash.org/shield?set=set1&bgset=bg1',
    color: '#EF4444',
    description: 'Security and self-healing agent. Monitors errors, diagnoses failures, writes healing patches, and coordinates with SafetyRedaction for PII protection.',
    tools: ['Error Monitor', 'Patch Writer', 'Security Scanner', 'Healer Engine'],
    workflow: ['Detect Anomaly', 'Diagnose', 'Draft Patch', 'Test Patch', 'Deploy Fix'],
    status: 'ACTIVE',
    metrics: { cpu: 22, memory: 96, latency: 30 },
    tasks: [{ id: 't8', label: 'Monitoring Error Flux', progress: 75, isRunning: true }]
  },
  {
    id: 'adam',
    title: 'ADAM CORTEX',
    subtitle: 'GRAPH ARCHITECT',
    responsibility: 'KNOWLEDGE MAPPING',
    icon: Network,
    imageUrl: 'https://robohash.org/adam?set=set1&bgset=bg1',
    color: '#6366F1',
    description: 'Graph Architect. Builds, queries, and optimises complex knowledge graphs across the system using Cypher-style structures backed by MemoryDB.',
    tools: ['Graph Engine', 'Cypher Query', 'MemoryDB', 'Semantic Linker', 'Node Traversal'],
    workflow: ['Receive Query', 'Expand Graph', 'Traverse Nodes', 'Synthesize', 'Return Insight'],
    status: 'IDLE',
    metrics: { cpu: 18, memory: 320, latency: 250 },
    tasks: []
  },
  {
    id: 'brain-sentinel',
    title: 'BRAIN SENTINEL',
    subtitle: 'NEURAL OVERSEER',
    responsibility: 'SYSTEM HEALTH MONITOR',
    icon: Activity,
    imageUrl: 'https://robohash.org/brain-sentinel?set=set1&bgset=bg1',
    color: '#10B981',
    description: 'Neural Overseer. Monitors system health, agent execution budgets, and runtime mode selection. Escalates to Shield and Gabriel when thresholds breach.',
    tools: ['Health Monitor', 'Budget Tracker', 'Runtime Selector', 'Alert Engine'],
    workflow: ['Sample Metrics', 'Evaluate Budget', 'Mode Selection', 'Alert on Breach', 'Log'],
    status: 'ACTIVE',
    metrics: { cpu: 6, memory: 24, latency: 8 },
    tasks: [{ id: 't9', label: 'Health Sampling Cycle', progress: 100, isRunning: false }]
  },
  {
    id: 'gabriel',
    title: 'GABRIEL',
    subtitle: 'LAW ENFORCER',
    responsibility: 'GOVERNANCE REASONING',
    icon: Gavel,
    imageUrl: 'https://robohash.org/gabriel?set=set1&bgset=bg1',
    color: '#7C3AED',
    description: 'Law Enforcer. Enforces strict contract compliance, policy auditing, and governance reasoning across all agents. Chairs the Governing Body.',
    tools: ['Policy Engine', 'Contract Auditor', 'Reasoning Chain', 'Governance Log'],
    workflow: ['Receive Report', 'Policy Review', 'Reason', 'Verdict', 'Record'],
    status: 'ACTIVE',
    metrics: { cpu: 14, memory: 64, latency: 25 },
    tasks: [{ id: 't10', label: 'Policy Audit Round', progress: 85, isRunning: true }]
  },
  {
    id: 'librarian',
    title: 'LIBRARIAN',
    subtitle: 'DOCS GOVERNANCE',
    responsibility: 'DOCUMENTATION INTEGRITY',
    icon: BookOpen,
    imageUrl: 'https://robohash.org/librarian?set=set1&bgset=bg1',
    color: '#8B5CF6',
    description: 'Documentation Governance Officer. Enforces docs/ taxonomy, detects drift, and ensures all documentation meets LeeWay Standards.',
    tools: ['Taxonomy Enforcer', 'Drift Detector', 'Doc Indexer', 'Standards Checker'],
    workflow: ['Scan Docs', 'Check Taxonomy', 'Detect Drift', 'Flag Issues', 'Report'],
    status: 'IDLE',
    metrics: { cpu: 3, memory: 16, latency: 12 },
    tasks: []
  },
  {
    id: 'lily',
    title: 'LILY CORTEX',
    subtitle: 'ANALYTICAL THINKER',
    responsibility: 'STRUCTURED REASONING',
    icon: BrainIcon,
    imageUrl: 'https://robohash.org/lily?set=set1&bgset=bg1',
    color: '#6366F1',
    description: 'Weaver of Thought. Processes complex multi-step logic, analytical synthesis, and structured reasoning chains for Lee Prime.',
    tools: ['Chain-of-Thought', 'Logical Solver', 'Synthesizer', 'Hypothesis Engine'],
    workflow: ['Receive Problem', 'Decompose', 'Chain Reason', 'Synthesize', 'Conclusion'],
    status: 'IDLE',
    metrics: { cpu: 25, memory: 256, latency: 180 },
    tasks: []
  },
  {
    id: 'marshal',
    title: 'MARSHAL VERIFY',
    subtitle: 'VERIFICATION CORPS',
    responsibility: 'READINESS TESTING',
    icon: ShieldCheck,
    imageUrl: 'https://robohash.org/marshal?set=set1&bgset=bg1',
    color: '#7C3AED',
    description: 'Verification Corps Governor. Runs governance-first readiness tests in-process, validates system state before critical operations.',
    tools: ['Test Runner', 'Readiness Gate', 'Governance Checker', 'State Validator'],
    workflow: ['Gate Check', 'Run Tests', 'Validate State', 'Issue Verdict', 'Allow/Block'],
    status: 'ACTIVE',
    metrics: { cpu: 7, memory: 32, latency: 15 },
    tasks: [{ id: 't11', label: 'Pre-Deploy Verification', progress: 94, isRunning: true }]
  },
  {
    id: 'nexus',
    title: 'NEXUS',
    subtitle: 'DEPLOYMENT ENGINE',
    responsibility: 'INFRASTRUCTURE ORCHESTRATION',
    icon: Server,
    imageUrl: 'https://robohash.org/nexus?set=set1&bgset=bg1',
    color: '#06B6D4',
    description: 'Deployment and infrastructure agent. Plans deployments, generates Dockerfiles, manages server configurations, and monitors service health.',
    tools: ['Docker Builder', 'Deploy Planner', 'Server Manager', 'Health Probe'],
    workflow: ['Plan Deployment', 'Build Image', 'Push Registry', 'Deploy', 'Monitor'],
    status: 'IDLE',
    metrics: { cpu: 10, memory: 128, latency: 200 },
    tasks: []
  },
  {
    id: 'syntax-forge',
    title: 'SYNTAX FORGE',
    subtitle: 'CODE ARCHITECT',
    responsibility: 'ARCHITECTURAL INTEGRITY',
    icon: Code,
    imageUrl: 'https://robohash.org/syntax-forge?set=set1&bgset=bg1',
    color: '#F97316',
    description: 'Architect of Code. Ensures architectural integrity, code structure quality, and design pattern consistency across all generated code from Nova.',
    tools: ['AST Analyzer', 'Pattern Enforcer', 'Refactor Suggester', 'Complexity Scorer'],
    workflow: ['Receive Code', 'AST Parse', 'Check Patterns', 'Score Complexity', 'Report'],
    status: 'IDLE',
    metrics: { cpu: 9, memory: 64, latency: 100 },
    tasks: []
  },

  // ── OUTER RING (9) — Specialized Services Layer ────────────────────────────
  {
    id: 'aria',
    title: 'ARIA',
    subtitle: 'MULTILINGUAL AGENT',
    responsibility: 'SOCIAL & TRANSLATION',
    icon: Languages,
    imageUrl: 'https://robohash.org/aria?set=set1&bgset=bg1',
    color: '#F97316',
    description: 'Social and multi-language agent. Manages multilingual sessions, speaker relaying, and group translation. Works with Echo for voice delivery.',
    tools: ['Translator', 'Speaker Relay', 'Group Chat Manager', 'Language Detector'],
    workflow: ['Detect Language', 'Translate', 'Relay Speaker', 'Synthesize', 'Deliver'],
    status: 'IDLE',
    metrics: { cpu: 5, memory: 48, latency: 60 },
    tasks: []
  },
  {
    id: 'bug-hunter',
    title: 'BUG HUNTER',
    subtitle: 'FAULT SEEKER',
    responsibility: 'ROOT CAUSE ANALYSIS',
    icon: Bug,
    imageUrl: 'https://robohash.org/bug-hunter?set=set1&bgset=bg1',
    color: '#F97316',
    description: 'Seeker of Faults. Locates root causes of instability, defects, and unexpected system behaviours. Coordinates with Nova and Shield for resolution.',
    tools: ['Stack Trace Analyzer', 'Regression Runner', 'Fault Localizer', 'Fix Suggester'],
    workflow: ['Receive Report', 'Trace Root', 'Isolate Fault', 'Suggest Fix', 'Verify'],
    status: 'IDLE',
    metrics: { cpu: 0, memory: 16, latency: 0 },
    tasks: []
  },
  {
    id: 'clerk',
    title: 'CLERK ARCHIVE',
    subtitle: 'REPORT KEEPER',
    responsibility: 'SCHEMA VALIDATION',
    icon: Archive,
    imageUrl: 'https://robohash.org/clerk?set=set1&bgset=bg1',
    color: '#F59E0B',
    description: 'Keeper of Reports. Validates schema, routes to correct family path, maintains global index. Primary archival interface for Scribe and Sage.',
    tools: ['Schema Validator', 'Path Router', 'Global Index', 'Family Classifier'],
    workflow: ['Receive Report', 'Validate Schema', 'Route to Family', 'Index', 'Acknowledge'],
    status: 'ACTIVE',
    metrics: { cpu: 3, memory: 24, latency: 8 },
    tasks: [{ id: 't12', label: 'Indexing Report Batch', progress: 97, isRunning: true }]
  },
  {
    id: 'janitor',
    title: 'JANITOR',
    subtitle: 'RETENTION WARDEN',
    responsibility: 'STORAGE HYGIENE',
    icon: Trash2,
    imageUrl: 'https://robohash.org/janitor?set=set1&bgset=bg1',
    color: '#EF4444',
    description: 'Retention & Load Warden. Keeps system_reports/ lean on mobile devices, enforces retention policies, purges expired data securely.',
    tools: ['Retention Engine', 'File Purger', 'Policy Enforcer', 'Storage Monitor'],
    workflow: ['Scan Reports', 'Evaluate Age', 'Apply Policy', 'Purge', 'Log Deletion'],
    status: 'SLEEP',
    metrics: { cpu: 1, memory: 8, latency: 20 },
    tasks: []
  },
  {
    id: 'leeway-standards',
    title: 'LEEWAY STD',
    subtitle: 'SDK BRIDGE',
    responsibility: 'STANDARDS GOVERNANCE',
    icon: ShieldAlert,
    imageUrl: 'https://robohash.org/leeway-standards?set=set1&bgset=bg1',
    color: '#39FF14',
    description: 'Bridges the LeeWay-Standards SDK agents into the Agent Lee governance system. Enforces the canonical LeeWay Standards across all output.',
    tools: ['Standards SDK', 'Compliance Bridge', 'Lint Engine', 'Style Enforcer'],
    workflow: ['Receive Output', 'Apply Standards', 'Lint', 'Flag Violations', 'Pass/Block'],
    status: 'ACTIVE',
    metrics: { cpu: 4, memory: 16, latency: 12 },
    tasks: [{ id: 't13', label: 'Standards Compliance Scan', progress: 100, isRunning: false }]
  },
  {
    id: 'safety',
    title: 'SAFETY',
    subtitle: 'REDACTION GUARD',
    responsibility: 'PII & INJECTION DEFENSE',
    icon: ShieldAlert,
    imageUrl: 'https://robohash.org/safety?set=set1&bgset=bg1',
    color: '#EF4444',
    description: 'Scans and redacts PII, profanity, and prompt-injection patterns from LLM output. Hard blocker in all response pipelines.',
    tools: ['PII Detector', 'Injection Scanner', 'Profanity Filter', 'Redaction Engine'],
    workflow: ['Receive Output', 'Scan PII', 'Scan Injections', 'Redact', 'Pass/Block'],
    status: 'ACTIVE',
    metrics: { cpu: 11, memory: 32, latency: 18 },
    tasks: [{ id: 't14', label: 'Output Redaction Pass', progress: 100, isRunning: false }]
  },
  {
    id: 'stt',
    title: 'STREAMING STT',
    subtitle: 'SPEECH-TO-TEXT',
    responsibility: 'REAL-TIME TRANSCRIPTION',
    icon: Mic,
    imageUrl: 'https://robohash.org/stt?set=set1&bgset=bg1',
    color: '#A78BFA',
    description: 'Provides STT status and direct partial-transcript subscriptions from the EventBus. Feeds Echo and LiveConductor with real-time transcription.',
    tools: ['WebSocket STT', 'EventBus Subscriber', 'Partial Transcript', 'VAD Bridge'],
    workflow: ['Audio Receive', 'VAD Gate', 'Transcribe', 'Emit Partial', 'Finalise'],
    status: 'ACTIVE',
    metrics: { cpu: 18, memory: 48, latency: 22 },
    tasks: [{ id: 't15', label: 'Live Transcription Session', progress: 60, isRunning: true }]
  },
  {
    id: 'tts',
    title: 'STREAMING TTS',
    subtitle: 'TEXT-TO-SPEECH',
    responsibility: 'VOICE SYNTHESIS',
    icon: Volume2,
    imageUrl: 'https://robohash.org/tts?set=set1&bgset=bg1',
    color: '#F472B6',
    description: 'Exposes TTS state and subscriptions over the EventBus for UI / other agents. Streams synthesised voice audio to Echo output layer.',
    tools: ['TTS Engine', 'EventBus Publisher', 'Audio Streamer', 'Voice Selector'],
    workflow: ['Receive Text', 'Select Voice', 'Synthesise', 'Stream Audio', 'Confirm Done'],
    status: 'ACTIVE',
    metrics: { cpu: 14, memory: 32, latency: 35 },
    tasks: [{ id: 't16', label: 'Voice Synthesis Stream', progress: 72, isRunning: true }]
  },
  {
    id: 'conductor',
    title: 'CONDUCTOR',
    subtitle: 'LIVE PIPELINE',
    responsibility: 'REALTIME ORCHESTRATION',
    icon: Radio,
    imageUrl: 'https://robohash.org/conductor?set=set1&bgset=bg1',
    color: '#06B6D4',
    description: 'Orchestrates the end-to-end realtime voice pipeline for each WebSocket session. Coordinates STT→Echo→TTS→Output in sub-100ms loops.',
    tools: ['Pipeline Manager', 'WebSocket Hub', 'Latency Monitor', 'Session Manager'],
    workflow: ['Open Session', 'Route STT', 'Invoke Echo', 'Route TTS', 'Close Session'],
    status: 'ACTIVE',
    metrics: { cpu: 20, memory: 64, latency: 40 },
    tasks: [{ id: 't17', label: 'Live Session #8 Active', progress: 50, isRunning: true }]
  },
  {
    id: 'router',
    title: 'ROUTER AGENT',
    subtitle: 'ROUTING INTELLIGENCE',
    responsibility: 'LLM LANE SELECTION',
    icon: GitBranch,
    imageUrl: 'https://robohash.org/router?set=set1&bgset=bg1',
    color: '#F59E0B',
    description: 'Classifies each user turn and decides local LLM vs Gemini routing. Applies model_lane_policy to balance latency, cost, and capability.',
    tools: ['Intent Classifier', 'Lane Policy', 'Model Selector', 'Cost Estimator'],
    workflow: ['Classify Intent', 'Apply Policy', 'Select Model', 'Route Request', 'Monitor Cost'],
    status: 'ACTIVE',
    metrics: { cpu: 8, memory: 24, latency: 12 },
    tasks: [{ id: 't18', label: 'Routing Turn #1,247', progress: 100, isRunning: false }]
  }
];

// Position agents in 3 concentric orbital rings
const AGENTS: AgentData[] = (() => {
  const inner = AGENTS_RAW.slice(0, 8);   // r = 6
  const middle = AGENTS_RAW.slice(8, 17);  // r = 9.5
  const outer = AGENTS_RAW.slice(17);      // r = 13

  const ring = (
    agents: typeof AGENTS_RAW,
    r: number,
    yScale: number,
    angleOffset: number
  ): AgentData[] =>
    agents.map((agent, i) => {
      const angle = (i / agents.length) * Math.PI * 2 + angleOffset;
      return {
        ...agent,
        position: [
          Math.cos(angle) * r,
          Math.sin(angle * 2) * yScale,
          Math.sin(angle) * r,
        ] as [number, number, number],
      };
    });

  return [
    ...ring(inner, 6, 0.6, 0),
    ...ring(middle, 9.5, 1.0, Math.PI / 9),
    ...ring(outer, 13, 1.4, Math.PI / 18),
  ];
})();

// --- Components ---

// 1. VoxelPart
interface VoxelPartProps {
  w: number;
  h: number;
  d: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  material: THREE.Material;
  edgeMaterial: THREE.LineBasicMaterial;
}

function VoxelPart({ w, h, d, position, rotation = [0, 0, 0], material, edgeMaterial }: VoxelPartProps) {
  const geometry = useMemo(() => new THREE.BoxGeometry(w, h, d, w, h, d), [w, h, d]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  return (
    <mesh position={position} rotation={rotation} geometry={geometry} material={material}>
      <lineSegments geometry={edges} material={edgeMaterial} />
    </mesh>
  );
}

// 2. Brain
function Brain({ onBaseClick, isMobile = false }: { onBaseClick?: () => void; isMobile?: boolean }) {
  const characterGroupRef = useRef<THREE.Group>(null);
  const ringsGroupRef = useRef<THREE.Group>(null);
  const baseGroupRef = useRef<THREE.Group>(null);
  const lightningRef = useRef<THREE.Group>(null);
  const flashLightRef = useRef<THREE.PointLight>(null);

  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x002288, emissive: 0x0044aa, emissiveIntensity: 0.2, roughness: 0.3, metalness: 0.4
  }), []);
  const coreMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0x00ffff, emissiveIntensity: 1.2
  }), []);
  const edgeMaterial = useMemo(() => new THREE.LineBasicMaterial({ 
    color: 0x00ffff, transparent: true, opacity: 0.2 
  }), []);
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0x00ffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide, wireframe: true, blending: THREE.AdditiveBlending
  }), []);

  const ringObjects = useMemo(() => {
    const all = [
      { radius: 15, rx: Math.PI/2, ry: 0, speed: 0.015 },
      { radius: 17, rx: 0, ry: Math.PI/2, speed: -0.015 },
      { radius: 19, rx: Math.PI/4, ry: Math.PI/4, speed: 0.02 },
      { radius: 21, rx: -Math.PI/4, ry: Math.PI/4, speed: -0.02 }
    ];
    return isMobile ? all.slice(0, 1) : all;
  }, [isMobile]);

  const ringRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (characterGroupRef.current) {
      characterGroupRef.current.position.y = Math.sin(t * 1.5) * 2 + 10;
    }

    ringRefs.current.forEach((ring, i) => {
      if (ring) ring.rotation.z += ringObjects[i].speed;
    });

    if (ringsGroupRef.current) {
      ringsGroupRef.current.rotation.y += 0.005;
      ringsGroupRef.current.rotation.x += 0.002;
    }

    if (baseGroupRef.current) {
      baseGroupRef.current.rotation.y += 0.01;
    }

    if (lightningRef.current && characterGroupRef.current && baseGroupRef.current) {
      const start = new THREE.Vector3();
      const end = new THREE.Vector3();
      
      characterGroupRef.current.getWorldPosition(start);
      baseGroupRef.current.getWorldPosition(end);
      
      const strike = Math.random() > 0.85;

      lightningRef.current.children.forEach((line: any) => {
        if (strike) {
          const pts = [];
          const segs = 16;
          for (let j = 0; j <= segs; j++) {
            const p = new THREE.Vector3().lerpVectors(start, end, j/segs);
            if(j > 0 && j < segs) {
              const jitter = 4;
              p.x += (Math.random() - 0.5) * jitter;
              p.y += (Math.random() - 0.5) * jitter;
              p.z += (Math.random() - 0.5) * jitter;
            }
            pts.push(p);
          }
          line.geometry.setFromPoints(pts);
          line.visible = true;
        } else {
          line.visible = false;
        }
      });
      if (flashLightRef.current) {
        flashLightRef.current.intensity = strike ? 100 : 2;
        flashLightRef.current.position.copy(start).lerp(end, 0.5);
      }
    }
  });

  return (
    <group scale={0.2} position={[0, -2, 0]}>
      <group ref={characterGroupRef}>
        <VoxelPart w={6} h={7} d={4} position={[0, 0, 0]} material={bodyMaterial} edgeMaterial={edgeMaterial} />
        <VoxelPart w={2} h={2} d={2} position={[0, 1, 1.5]} material={coreMaterial} edgeMaterial={edgeMaterial} />
        <VoxelPart w={2} h={1} d={2} position={[0, 4, 0]} material={bodyMaterial} edgeMaterial={edgeMaterial} />
        <VoxelPart w={5} h={5} d={5} position={[0, 7, 0]} material={bodyMaterial} edgeMaterial={edgeMaterial} />
        <VoxelPart w={1} h={1} d={1} position={[-1, 7.5, 2.5]} material={coreMaterial} edgeMaterial={edgeMaterial} />
        <VoxelPart w={1} h={1} d={1} position={[1, 7.5, 2.5]} material={coreMaterial} edgeMaterial={edgeMaterial} />

        <group position={[-4, 2, 0]}>
          <VoxelPart w={2} h={5} d={2} position={[0, -1.5, 0]} material={bodyMaterial} edgeMaterial={edgeMaterial} />
          <VoxelPart w={2} h={5} d={2} position={[-1, -5.5, 1.5]} rotation={[1.5, 0, -0.4]} material={bodyMaterial} edgeMaterial={edgeMaterial} />
        </group>
        <group position={[4, 2, 0]}>
          <VoxelPart w={2} h={5} d={2} position={[0, -1.5, 0]} material={bodyMaterial} edgeMaterial={edgeMaterial} />
          <VoxelPart w={2} h={5} d={2} position={[1, -5.5, 1.5]} rotation={[1.5, 0, 0.4]} material={bodyMaterial} edgeMaterial={edgeMaterial} />
        </group>

        <group position={[0, -4.5, 1]}>
          <VoxelPart w={8} h={2} d={4} position={[0, 0, 0]} material={bodyMaterial} edgeMaterial={edgeMaterial} />
          <VoxelPart w={4} h={2} d={4} position={[-4, -1, 2]} material={bodyMaterial} edgeMaterial={edgeMaterial} />
          <VoxelPart w={4} h={2} d={4} position={[4, -1, 2]} material={bodyMaterial} edgeMaterial={edgeMaterial} />
          <VoxelPart w={6} h={2} d={3} position={[-2, -2, 4]} material={bodyMaterial} edgeMaterial={edgeMaterial} />
          <VoxelPart w={6} h={2} d={3} position={[2, -2, 4]} material={bodyMaterial} edgeMaterial={edgeMaterial} />
          <VoxelPart w={4} h={2} d={4} position={[0, -3, 5]} material={bodyMaterial} edgeMaterial={edgeMaterial} />
        </group>

        <group ref={ringsGroupRef} position={[0, 1, 0]}>
          {ringObjects.map((config, i) => (
            <group key={i} rotation={[config.rx, config.ry, 0]}>
              <mesh ref={(el) => { if (el) ringRefs.current[i] = el; }}>
                <torusGeometry args={[config.radius, 0.06, 8, isMobile ? 48 : 120]} />
                <primitive object={ringMat} />
              </mesh>
            </group>
          ))}
        </group>

        <group 
          ref={baseGroupRef} 
          position={[0, -14, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onBaseClick?.();
          }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
        >
          <VoxelPart w={4} h={4} d={4} position={[0, 0, 0]} material={new THREE.MeshStandardMaterial({color: 0x001122, wireframe: true, emissive: 0x0088ff, emissiveIntensity: 0.1})} edgeMaterial={edgeMaterial} />
          <VoxelPart w={1.5} h={1.5} d={1.5} position={[0, 0, 0]} material={coreMaterial} edgeMaterial={edgeMaterial} />
        </group>
      </group>

      <group ref={lightningRef}>
        {[0, 1, 2].map((i) => (
          <line key={i}>
            <bufferGeometry />
            <lineBasicMaterial color={0x00ffff} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </line>
        ))}
      </group>
      <pointLight ref={flashLightRef} color={0x00ffff} intensity={1} distance={100} />
    </group>
  );
}

// 3. AgentNode
interface AgentNodeProps {
  agent: AgentData;
  onClick: (agent: AgentData) => void;
  isSelected: boolean;
  isMerged: boolean;
  hideLabel?: boolean;
}

function AgentNode({ agent, onClick, isSelected, isMerged, hideLabel }: AgentNodeProps) {
  const { position, title, subtitle, icon: Icon, color, id } = agent;
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetPos = isMerged ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(...position);
      groupRef.current.position.lerp(targetPos, 0.1);
      
      const targetScale = isMerged ? 0 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      
      if (meshRef.current) {
        meshRef.current.rotation.x += delta * 0.5;
        meshRef.current.rotation.y += delta * 0.3;
      }
    }
  });

  const renderGeometry = () => {
    switch (id) {
      case 'lee-prime':     return <sphereGeometry args={[0.38, 32, 32]} />;
      case 'nova':          return <boxGeometry args={[0.46, 0.46, 0.46]} />;
      case 'atlas':         return <icosahedronGeometry args={[0.4, 0]} />;
      case 'sage':          return <torusGeometry args={[0.28, 0.1, 16, 32]} />;
      case 'pixel':         return <octahedronGeometry args={[0.4, 0]} />;
      case 'echo':          return <dodecahedronGeometry args={[0.34, 0]} />;
      case 'aegis':         return <tetrahedronGeometry args={[0.44, 0]} />;
      case 'scribe':        return <cylinderGeometry args={[0.22, 0.22, 0.5, 32]} />;
      case 'shield':        return <boxGeometry args={[0.36, 0.44, 0.12]} />;
      case 'adam':          return <icosahedronGeometry args={[0.36, 1]} />;
      case 'brain-sentinel':return <sphereGeometry args={[0.34, 16, 16]} />;
      case 'gabriel':       return <tetrahedronGeometry args={[0.4, 0]} />;
      case 'librarian':     return <boxGeometry args={[0.44, 0.32, 0.12]} />;
      case 'lily':          return <dodecahedronGeometry args={[0.32, 0]} />;
      case 'marshal':       return <octahedronGeometry args={[0.38, 0]} />;
      case 'nexus':         return <cylinderGeometry args={[0.18, 0.28, 0.5, 6]} />;
      case 'syntax-forge':  return <boxGeometry args={[0.38, 0.38, 0.38]} />;
      case 'aria':          return <torusGeometry args={[0.24, 0.1, 8, 24]} />;
      case 'bug-hunter':    return <icosahedronGeometry args={[0.3, 0]} />;
      case 'clerk':         return <cylinderGeometry args={[0.2, 0.2, 0.4, 32]} />;
      case 'janitor':       return <boxGeometry args={[0.3, 0.42, 0.3]} />;
      case 'leeway-standards':return <tetrahedronGeometry args={[0.36, 0]} />;
      case 'safety':        return <octahedronGeometry args={[0.34, 0]} />;
      case 'stt':           return <sphereGeometry args={[0.3, 12, 12]} />;
      case 'tts':           return <torusGeometry args={[0.22, 0.1, 8, 20]} />;
      case 'conductor':     return <cylinderGeometry args={[0.22, 0.22, 0.44, 6]} />;
      case 'router':        return <icosahedronGeometry args={[0.34, 0]} />;
      default:              return <sphereGeometry args={[0.28, 32, 32]} />;
    }
  };
  
  return (
    <group ref={groupRef} position={position}>
      <mesh 
        ref={meshRef}
        onClick={() => !isMerged && onClick(agent)}
        onPointerOver={() => !isMerged && (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {renderGeometry()}
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={isSelected ? 4 : 2} 
          transparent
          opacity={isMerged ? 0 : 1}
          wireframe={id === 'nova' || id === 'atlas'}
        />
      </mesh>
      
      {!isMerged && !hideLabel && (
        <Html distanceFactor={14} center>
          <div 
            onClick={() => onClick(agent)}
            className="flex flex-col items-center cursor-pointer pointer-events-auto select-none"
          >
            <div 
              className={cn(
                "px-3 py-2 rounded-xl border backdrop-blur-md flex flex-col items-center min-w-[90px] max-w-[120px] transition-all duration-300",
                isSelected ? "scale-110" : "hover:scale-105"
              )}
              style={{ 
                backgroundColor: 'rgba(2,4,8,0.85)',
                borderColor: isSelected ? '#fff' : color, 
                boxShadow: isSelected 
                  ? `0 0 24px ${color}` 
                  : `0 0 10px ${color}55`,
              }}
            >
              <div className="p-1.5 rounded-full mb-1" style={{ backgroundColor: `${color}20` }}>
                <Icon size={14} style={{ color }} />
              </div>
              <h3 
                className="font-black text-[9px] tracking-widest uppercase text-center leading-tight whitespace-nowrap"
                style={{ color: '#ffffff' }}
              >
                {title}
              </h3>
              <p 
                className="text-[7px] font-bold text-center leading-tight mt-0.5 whitespace-nowrap"
                style={{ color: `${color}cc` }}
              >
                {subtitle}
              </p>
              <div className="mt-1 flex items-center gap-1">
                <div 
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    agent.status === 'ACTIVE' ? "animate-pulse" : ""
                  )}
                  style={{ 
                    backgroundColor: agent.status === 'ACTIVE' 
                      ? '#4ade80' 
                      : agent.status === 'SLEEP' 
                        ? '#60a5fa' 
                        : '#6b7280' 
                  }}
                />
                <span className="text-[6px] font-mono uppercase tracking-tighter" style={{ color: '#ffffff80' }}>
                  {agent.status}
                </span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// 4. Connection & ParticleStream
interface ConnectionProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  isMerged: boolean;
}

function Connection({ start, end, color, isMerged }: ConnectionProps) {
  const lineRef = useRef<any>(null);

  useFrame((state) => {
    if (lineRef.current) {
      const baseOpacity = isMerged ? 0 : 0.4;
      lineRef.current.material.opacity = THREE.MathUtils.lerp(
        lineRef.current.material.opacity,
        baseOpacity + (isMerged ? 0 : Math.sin(state.clock.elapsedTime * 3) * 0.2),
        0.1
      );
    }
  });

  return (
    <DreiLine
      ref={lineRef}
      points={[start, end]}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.5}
    />
  );
}

function ParticleStream({ start, end, color, isMerged }: ConnectionProps) {
  const particlesCount = 20;
  const positions = new Float32Array(particlesCount * 3);
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      const posAttr = pointsRef.current.geometry.attributes.position;
      const material = pointsRef.current.material as THREE.PointsMaterial;
      
      material.opacity = THREE.MathUtils.lerp(material.opacity, isMerged ? 0 : 0.8, 0.1);
      
      for (let i = 0; i < particlesCount; i++) {
        const t = (time * 0.5 + i / particlesCount) % 1;
        const currentPos = new THREE.Vector3().lerpVectors(startVec, endVec, t);
        posAttr.setXYZ(i, currentPos.x, currentPos.y, currentPos.z);
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={color}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// 5. AgentLeeDiagnostics
interface AgentLeeDiagnosticsProps {
  agent: AgentData | null;
  onClose: () => void;
}

function AgentLeeDiagnostics({ agent: initialAgent, onClose }: AgentLeeDiagnosticsProps) {
  const [agent, setAgent] = useState<AgentData | null>(initialAgent);
  const [isReporting, setIsReporting] = useState(false);
  const [showDiag, setShowDiag] = useState(true);
  const [showOps, setShowOps] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const toggleDiag = () => {
    setShowDiag(!showDiag);
    if (!showDiag) setShowOps(false);
  };

  const toggleOps = () => {
    setShowOps(!showOps);
    if (!showOps) setShowDiag(false);
  };

  const [chartData, setChartData] = useState<{ time: string; cpu: number; mem: number; lat: number }[]>([]);

  useEffect(() => {
    setAgent(initialAgent);
    if (initialAgent) {
      const initialData = Array.from({ length: 20 }, (_, i) => ({
        time: `${i}s`,
        cpu: initialAgent.metrics.cpu + (Math.random() * 10 - 5),
        mem: initialAgent.metrics.memory + (Math.random() * 50 - 25),
        lat: initialAgent.metrics.latency + (Math.random() * 20 - 10),
      }));
      setChartData(initialData);
    }
  }, [initialAgent]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (agent && agent.status === 'ACTIVE') {
        setChartData(prev => {
          if (prev.length === 0) return [];
          const lastTime = parseInt(prev[prev.length - 1].time);
          const newData = [...prev.slice(1), {
            time: `${lastTime + 1}s`,
            cpu: Math.max(0, Math.min(100, prev[prev.length - 1].cpu + (Math.random() * 10 - 5))),
            mem: Math.max(0, prev[prev.length - 1].mem + (Math.random() * 20 - 10)),
            lat: Math.max(0, prev[prev.length - 1].lat + (Math.random() * 10 - 5)),
          }];
          return newData;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [agent]);

  useEffect(() => {
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext]);

  if (!agent) return null;

  const handleReport = async () => {
    if (isReporting) return;
    setIsReporting(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const currentTask = agent.tasks.find(t => t.isRunning) || agent.tasks[0];
      const reportText = currentTask 
        ? `Agent ${agent.title} status is ${agent.status}. Current task: ${currentTask.label}, progress ${currentTask.progress} percent.`
        : `Agent ${agent.title} status is ${agent.status}. No active tasks at this time.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say in a professional, slightly robotic voice: ${reportText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) setAudioContext(ctx);

        const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsReporting(false);
        source.start(0);
      } else {
        setIsReporting(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsReporting(false);
    }
  };

  const toggleTask = (taskId: string) => {
    setAgent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, isRunning: !t.isRunning } : t)
      };
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[800] bg-[#020408]/95 backdrop-blur-xl overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-full flex items-start md:items-center justify-center p-3 md:p-4 py-6 md:py-8">
        <motion.div
          initial={{ scale: 0.9, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 40 }}
          className="relative w-full max-w-7xl bg-[#0a0b0e] border-2 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.9)] flex flex-col"
          style={{ borderColor: agent.color }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 md:top-8 md:right-8 p-3 md:p-4 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black transition-all border border-white/10 z-50 shadow-2xl"
          >
            <X size={22} />
          </button>

          <div className="flex flex-col md:flex-row md:h-[90vh] md:max-h-[1000px] md:overflow-hidden">
            <div className="w-full md:w-[400px] md:shrink-0 border-b md:border-b-0 md:border-r border-white/5 bg-black/40 p-8 md:p-10 flex flex-col items-center gap-8 md:gap-10 md:overflow-y-auto scrollbar-hide">
              <div className="relative w-full max-w-[210px] md:max-w-none aspect-square mx-auto">
                <div 
                  className="w-full h-full rounded-[3rem] md:rounded-[4rem] border-4 flex items-center justify-center bg-black overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] relative"
                  style={{ borderColor: agent.color }}
                >
                  <img 
                    src={agent.imageUrl} 
                    alt={agent.title} 
                    className="w-full h-full object-contain p-6 md:p-8"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>
                <div className="absolute -bottom-3 -right-3 md:-bottom-4 md:-right-4 bg-black border-2 border-white/20 p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-2xl">
                  <agent.icon size={24} style={{ color: agent.color }} />
                </div>
              </div>

              <div className="text-center w-full">
                <h2 className="text-white font-black text-3xl md:text-5xl tracking-tighter uppercase leading-none mb-3 break-words">{agent.title}</h2>
                <p className="text-sm font-mono tracking-[0.6em] font-bold opacity-50 uppercase" style={{ color: agent.color }}>
                  {agent.subtitle}
                </p>
              </div>

              <div className="flex gap-10 w-full justify-center">
                <div className="flex flex-col items-center gap-3">
                  <button 
                    onClick={toggleDiag}
                    className={cn(
                      "w-16 h-8 rounded-full relative transition-colors duration-300 border border-white/10",
                      showDiag ? "bg-cyan-500" : "bg-gray-800"
                    )}
                  >
                    <motion.div 
                      animate={{ x: showDiag ? 34 : 2 }}
                      className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-md"
                    />
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Diagnostics</span>
                </div>
                
                <div className="flex flex-col items-center gap-3">
                  <button 
                    onClick={toggleOps}
                    className={cn(
                      "w-16 h-8 rounded-full relative transition-colors duration-300 border border-white/10",
                      showOps ? "bg-amber-500" : "bg-gray-800"
                    )}
                  >
                    <motion.div 
                      animate={{ x: showOps ? 34 : 2 }}
                      className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-md"
                    />
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Operations</span>
                </div>
              </div>

              <button
                onClick={handleReport}
                disabled={isReporting}
                className={cn(
                  "w-full py-6 rounded-[2.5rem] border-2 flex items-center justify-center gap-4 transition-all active:scale-95 group relative overflow-hidden",
                  isReporting ? "bg-white/5 border-white/10 opacity-50 cursor-wait" : "bg-black border-white/10 hover:border-white/30"
                )}
              >
                <Volume2 size={24} className={cn(isReporting ? "text-cyan-400 animate-pulse" : "text-white/40 group-hover:text-white")} />
                <span className="text-xs font-black tracking-[0.3em] uppercase text-white/40 group-hover:text-white">Report Status</span>
              </button>

              <div className="p-8 rounded-[3rem] bg-black/40 border border-white/10 w-full relative overflow-hidden text-left">
                <div className="flex items-center gap-3 mb-3">
                  <Fingerprint size={18} style={{ color: agent.color }} />
                  <span className="text-[10px] font-mono text-white/30 uppercase font-black tracking-widest">Responsibility</span>
                </div>
                <p className="text-lg font-black text-white tracking-tight leading-tight mb-4">
                  {agent.responsibility}
                </p>
                <p className="text-sm text-white/50 leading-relaxed font-medium italic">
                  "{agent.description}"
                </p>
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: agent.color }} />
              </div>
            </div>

            <div className="flex-1 md:min-h-0 md:overflow-y-auto p-8 md:p-12 scrollbar-hide">
              <AnimatePresence mode="wait">
                {showDiag && (
                  <motion.div
                    key="diag"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Activity size={32} style={{ color: agent.color }} />
                        <h3 className="text-4xl font-black text-white tracking-tight uppercase">Neural Diagnostics</h3>
                      </div>
                      <div className="flex items-center gap-3 px-8 py-3 rounded-full bg-green-500/10 border border-green-500/30">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-mono text-green-400 font-black uppercase tracking-widest">Core Stable</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 p-12 rounded-[4rem] bg-black border border-white/10 flex flex-col justify-center relative overflow-hidden group">
                        <span className="text-xs font-mono text-white/30 uppercase font-black tracking-[0.2em] mb-4">System Integrity</span>
                        <div className="flex items-end gap-8">
                          <span className="text-7xl font-black text-white leading-none">98.4%</span>
                          <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden mb-3 border border-white/10">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '98.4%' }}
                              className="h-full bg-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.6)]"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="p-12 rounded-[4rem] bg-black border border-white/10 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-white leading-none">{chartData[chartData.length - 1]?.cpu.toFixed(1)}%</span>
                        <span className="text-xs font-mono text-white/30 uppercase font-black tracking-widest mt-3">CPU Load</span>
                      </div>
                    </div>

                    <div className="h-[400px] p-12 rounded-[4rem] bg-black border border-white/10 relative overflow-hidden">
                      <div className="absolute top-12 left-12 z-10">
                        <span className="text-xs font-mono text-white/30 uppercase font-black tracking-[0.2em]">Live Flux Analysis</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="diagGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={agent.color} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={agent.color} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="time" hide />
                          <YAxis hide domain={[0, 100]} />
                          <Area 
                            type="monotone" 
                            dataKey="cpu" 
                            stroke={agent.color} 
                            fillOpacity={1} 
                            fill="url(#diagGradient)" 
                            strokeWidth={6}
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}

                {showOps && (
                  <motion.div
                    key="ops"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-10"
                  >
                    <div className="flex items-center gap-4">
                      <Settings2 size={32} style={{ color: agent.color }} />
                      <h3 className="text-4xl font-black text-white tracking-tight uppercase">Active Operations</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {agent.tasks.slice(0, 4).map(task => (
                        <div key={task.id} className="p-8 rounded-[3rem] bg-black border border-white/10 flex items-center gap-8 group hover:border-white/20 transition-all">
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-xl text-white font-black truncate pr-4">{task.label}</span>
                              <span className="text-sm font-mono text-white/40 font-black">{task.progress}%</span>
                            </div>
                            <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${task.progress}%` }}
                                className="h-full"
                                style={{ backgroundColor: agent.color }}
                              />
                            </div>
                          </div>
                          <button onClick={() => toggleTask(task.id)} className={cn("p-5 rounded-3xl transition-all active:scale-90", task.isRunning ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400")}>
                            {task.isRunning ? <Square size={24} /> : <Play size={24} />}
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="p-12 rounded-[4rem] bg-black border border-white/10">
                        <div className="flex items-center gap-4 mb-6">
                          <Hammer size={24} className="text-white/40" />
                          <span className="text-xs font-mono text-white/30 uppercase font-black tracking-widest">Toolbox</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {agent.tools.map(t => (
                            <span key={t} className="px-6 py-3 rounded-2xl bg-white/5 text-xs text-white/80 border border-white/5 font-black uppercase tracking-widest">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-12 rounded-[4rem] bg-black border border-white/10">
                        <div className="flex items-center gap-4 mb-6">
                          <Rocket size={24} className="text-white/40" />
                          <span className="text-xs font-mono text-white/30 uppercase font-black tracking-widest">Protocol</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                          {agent.workflow.map((w, i) => (
                            <div key={w} className="flex items-center gap-4">
                              <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-white/40">{i + 1}</div>
                              <span className="text-sm text-white/60 font-black uppercase tracking-tight truncate">{w}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showDiag && !showOps && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-24">
                  <Cpu size={80} className="animate-pulse" />
                  <span className="text-sm font-mono uppercase tracking-[1.5em] mt-10">Neural Standby</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// 6. SystemDiagnostics
function SystemDiagnostics({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [metrics, setMetrics] = useState({
    cpu: 0,
    mem: 0,
    net: 0,
    temp: 0,
    uptime: 0
  });

  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setMetrics({
        cpu: 20 + Math.random() * 40,
        mem: 40 + Math.random() * 20,
        net: 100 + Math.random() * 900,
        temp: 35 + Math.random() * 15,
        uptime: Date.now()
      });

      setHistory(prev => {
        const newData = [...prev.slice(-19), {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: 20 + Math.random() * 40,
          mem: 40 + Math.random() * 20,
          net: Math.random() * 100
        }];
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const pieData = [
    { name: 'System Core', value: 30, color: '#00f2ff' },
    { name: 'App Logic', value: 45, color: '#A855F7' },
    { name: 'Voxel Cache', value: 15, color: '#10B981' },
    { name: 'Free Space', value: 10, color: '#374151' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#020408]/98 backdrop-blur-2xl p-4 md:p-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-7xl bg-[#05070a] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,242,255,0.1)] flex flex-col h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-[#00f2ff]/10 border border-[#00f2ff]/20">
                <Monitor size={24} className="text-[#00f2ff]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">System Core Diagnostics</h2>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Full Spectrum Application & Hardware Analysis</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-hide">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <MetricCard icon={Cpu} label="CPU Usage" value={`${metrics.cpu.toFixed(1)}%`} color="#00f2ff" sub="4-core load avg" />
              <MetricCard icon={Database} label="Memory Used" value={`${metrics.mem.toFixed(1)}%`} color="#A855F7" sub={`${(metrics.mem * 32 / 100).toFixed(1)} GB / 32 GB`} />
              <MetricCard icon={Wifi} label="Network Throughput" value={`${(metrics.net/10).toFixed(1)} Mb/s`} color="#10B981" sub="inbound + outbound" />
              <MetricCard icon={Thermometer} label="Core Temperature" value={`${metrics.temp.toFixed(1)}°C`} color="#EF4444" sub="safe threshold: 90°C" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Resource Allocation Pie */}
              <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5">
                <h4 className="text-xs font-black text-white/30 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <LucidePieChart size={14} /> Resource Allocation
                </h4>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {pieData.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-mono text-white/60 uppercase">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Load History Line Chart */}
              <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5">
                <h4 className="text-xs font-black text-white/30 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Activity size={14} /> Load Flux History
                </h4>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="cpu" stroke="#00f2ff" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="mem" stroke="#A855F7" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Progress Bars Section */}
            <div className="p-8 rounded-[2.5rem] border border-white/10 mb-8" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                <Gauge size={14} className="text-[#00f2ff]" /> Sub-System Threading
              </h4>
              <div className="space-y-6">
                <SystemProgress label="Neural Engine" progress={85} color="#00f2ff" />
                <SystemProgress label="Voxel Manifestation" progress={62} color="#A855F7" />
                <SystemProgress label="I/O Buffer" progress={44} color="#10B981" />
                <SystemProgress label="Security Protocol" progress={98} color="#EF4444" />
                <SystemProgress label="Memory Lake Sync" progress={71} color="#F59E0B" />
                <SystemProgress label="Voice Pipeline" progress={88} color="#EC4899" />
              </div>
            </div>

            {/* Agent Fleet Status */}
            <div className="p-8 rounded-[2.5rem] border border-white/10" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Activity size={14} className="text-[#00f2ff]" /> Agent Fleet Status
                <span className="ml-auto text-[10px] font-mono text-white/40">{AGENTS.length} AGENTS REGISTERED</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {AGENTS.map(agent => (
                  <div 
                    key={agent.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors"
                    style={{ 
                      backgroundColor: `${agent.color}08`,
                      borderColor: `${agent.color}25`,
                    }}
                  >
                    <div 
                      className={cn("w-1.5 h-1.5 rounded-full shrink-0", agent.status === 'ACTIVE' ? 'animate-pulse' : '')}
                      style={{ 
                        backgroundColor: agent.status === 'ACTIVE' ? '#4ade80' : agent.status === 'SLEEP' ? '#60a5fa' : '#6b7280' 
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-white uppercase tracking-wide truncate">{agent.title}</p>
                      <p className="text-[7px] font-mono truncate" style={{ color: `${agent.color}bb` }}>{agent.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MetricCard({ icon: Icon, label, value, color, sub }: { icon: LucideIcon; label: string; value: string; color: string; sub?: string }) {
  return (
    <div 
      className="p-5 rounded-2xl flex flex-col gap-3 border"
      style={{ 
        backgroundColor: `${color}08`,
        borderColor: `${color}30`,
        boxShadow: `inset 0 0 30px ${color}08`
      }}
    >
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
      </div>
      <div>
        <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-2xl font-black text-white leading-none">{value}</p>
        {sub && <p className="text-[9px] font-mono mt-1" style={{ color: `${color}aa` }}>{sub}</p>}
      </div>
    </div>
  );
}

function SystemProgress({ label, progress, color }: { label: string; progress: number; color: string }) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-mono font-black" style={{ color }}>{progress}%</span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: `${color}15` }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}66` }}
        />
      </div>
    </div>
  );
}

// Agent Lee always-visible status anchor — floats above the 3D canvas
function AgentLeeAnchor() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-28 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 select-none pointer-events-none"
    >
      <div
        className="w-12 h-12 rounded-full border-2 overflow-hidden"
        style={{
          borderColor: '#00f2ff',
          background: 'rgba(2,4,8,0.9)',
          boxShadow: '0 0 20px rgba(0,242,255,0.55), 0 0 40px rgba(0,242,255,0.2)',
        }}
      >
        <img
          src="https://robohash.org/lee-prime?set=set1&bgset=bg1"
          alt="Agent Lee"
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{
          background: 'rgba(2,4,8,0.88)',
          border: '1px solid rgba(0,242,255,0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[8px] font-black text-white uppercase tracking-widest">Agent Lee · Active</span>
      </div>
    </motion.div>
  );
}

// 7. AgentCountHUD — top right status badge
function AgentCountHUD() {
  const activeCount = AGENTS.filter(a => a.status === 'ACTIVE').length;
  const idleCount = AGENTS.filter(a => a.status === 'IDLE').length;
  const sleepCount = AGENTS.filter(a => a.status === 'SLEEP').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-2xl pointer-events-none"
      style={{ 
        background: 'rgba(2,4,8,0.85)',
        border: '1px solid rgba(0,242,255,0.2)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[9px] font-black text-white uppercase tracking-widest">{activeCount} Active</span>
      </div>
      <div className="w-px h-3 bg-white/10" />
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">{idleCount} Idle</span>
      </div>
      <div className="w-px h-3 bg-white/10" />
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">{sleepCount} Sleep</span>
      </div>
      <div className="w-px h-3 bg-white/10" />
      <span className="text-[9px] font-mono text-[#00f2ff]/70">{AGENTS.length} TOTAL</span>
    </motion.div>
  );
}

// --- Main App ---
export default function App() {
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [isMerged, setIsMerged] = useState(false);
  const [isSystemReportOpen, setIsSystemReportOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="w-full h-screen bg-[#020408] overflow-hidden relative font-sans">
      <AnimatePresence>
        {!selectedAgent && (
          <>
            {/* Top banner */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 w-full p-5 z-20 pointer-events-none flex justify-between items-start"
            >
              {/* Left: agent count */}
              <div className="pointer-events-auto">
                <AgentCountHUD />
              </div>

              {/* Center: title */}
              <div className="flex flex-col items-center flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <Activity size={11} className="text-[#00f2ff] animate-pulse" />
                  <p className="text-[#00f2ff] text-[9px] tracking-[0.45em] font-black uppercase">Diagnostic Center · {AGENTS.length} Agents Online</p>
                </div>
                <div className="h-[1px] w-40 bg-gradient-to-r from-transparent via-[#00f2ff]/30 to-transparent" />
              </div>
              
              {/* Right: merge toggle */}
              <div className="pointer-events-auto">
                <button
                  onClick={() => setIsMerged(!isMerged)}
                  className="px-4 py-2 rounded-full text-[9px] font-mono uppercase tracking-widest transition-all active:scale-95"
                  style={{
                    border: '1px solid rgba(0,242,255,0.3)',
                    background: isMerged ? 'rgba(0,242,255,0.15)' : 'rgba(0,242,255,0.05)',
                    color: '#00f2ff',
                    boxShadow: isMerged ? '0 0 20px rgba(0,242,255,0.2)' : 'none',
                  }}
                >
                  {isMerged ? '⬡ Expand Grid' : '⬡ Come to Core'}
                </button>
              </div>
            </motion.div>

          </>
        )}
      </AnimatePresence>

      {/* Agent Lee always-visible status anchor */}
      {!selectedAgent && !isSystemReportOpen && <AgentLeeAnchor />}

      <Canvas
        shadows={!isMobile}
        dpr={isMobile ? [0.5, 1] : [1, 2]}
        gl={{ powerPreference: 'high-performance', antialias: !isMobile }}
      >
        <PerspectiveCamera makeDefault position={[0, 3, 22]} fov={isMobile ? 65 : 55} />
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={12} 
          maxDistance={38}
          autoRotate={!selectedAgent && !isMerged}
          autoRotateSpeed={isMobile ? 0.1 : 0.25}
          target={[0, 0, 0]}
        />
        
        <ambientLight intensity={isMobile ? 0.5 : 0.15} />
        <spotLight position={[10, 15, 10]} angle={0.2} penumbra={1} intensity={1.2} castShadow={!isMobile} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#7C3AED" />
        <pointLight position={[10, 10, -10]} intensity={0.2} color="#00f2ff" />
        
        <Stars radius={100} depth={50} count={isMobile ? 400 : 6000} factor={4} saturation={0} fade speed={isMobile ? 0 : 1} />
        {!isMobile && <Environment preset="night" />}

        <group scale={isMobile ? 0.55 : 1} visible={!selectedAgent && !isSystemReportOpen}>
          <Brain onBaseClick={() => setIsSystemReportOpen(true)} isMobile={isMobile} />
          
          {AGENTS.map((agent) => (
            <group key={agent.id}>
              <AgentNode 
                agent={agent}
                onClick={setSelectedAgent}
                isSelected={selectedAgent?.id === agent.id}
                isMerged={isMerged}
                hideLabel={!!selectedAgent || isMobile}
              />
              <Connection 
                start={[0, 0, 0]} 
                end={agent.position} 
                color={agent.color} 
                isMerged={isMerged}
              />
              {!isMobile && (
                <ParticleStream 
                  start={[0, 0, 0]} 
                  end={agent.position} 
                  color={agent.color} 
                  isMerged={isMerged}
                />
              )}
            </group>
          ))}
        </group>

        {/* Skybox */}
        <mesh scale={200}>
          <sphereGeometry args={[1, isMobile ? 16 : 64, isMobile ? 16 : 64]} />
          <meshBasicMaterial 
            color="#050810" 
            side={THREE.BackSide}
            transparent 
            opacity={0.95} 
          />
        </mesh>
        
        <Stars radius={200} depth={120} count={isMobile ? 600 : 3000} factor={12} saturation={1} fade speed={isMobile ? 0.5 : 1.5} />
        <Sparkles count={isMobile ? 300 : 2500} scale={25} size={isMobile ? 3 : 2} speed={isMobile ? 0.2 : 0.5} opacity={isMobile ? 0.5 : 0.4} color="#00ffff" />
        {!isMobile && <Sparkles count={1200} scale={35} size={4} speed={0.2} opacity={0.25} color="#9333ea" />}

        <EffectComposer>
          <Bloom luminanceThreshold={isMobile ? 0.6 : 0.35} mipmapBlur intensity={isMobile ? 0.6 : 1.2} radius={0.25} />
        </EffectComposer>
      </Canvas>

      <AgentLeeDiagnostics 
        agent={selectedAgent} 
        onClose={() => setSelectedAgent(null)} 
      />

      <SystemDiagnostics 
        isOpen={isSystemReportOpen} 
        onClose={() => setIsSystemReportOpen(false)} 
      />
    </div>
  );
}
