/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.APP.SURFACE
TAG: UI.APP.SURFACE.ROOT

COLOR_ONION_HEX:
NEON=#00FFFF
FLUO=#00E5FF
PASTEL=#B2EBF2

ICON_ASCII:
family=lucide
glyph=layout-dashboard

5WH:
WHAT = Root application component for Agent Lee Agentic Operating System
WHY = Central controller for navigation, state, agent routing, streaming responses, voice, and TTS
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = App.tsx (project root)
WHEN = 2026
HOW = React functional component wiring all pages, agents, conversation state, streaming, TTS, and watermark

AGENTS:
AZR
GEMINI
NOVA
ECHO

LICENSE:
MIT
*/

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.APP.SURFACE
TAG: UI.APP.SURFACE.ROOT

COLOR_ONION_HEX:
NEON=#00FFFF
FLUO=#00E5FF
PASTEL=#B2EBF2

ICON_ASCII:
family=lucide
glyph=layout-dashboard

5WH:
WHAT = Root application component for Agent Lee Agentic Operating System
WHY = Central controller for navigation, state, agent routing, streaming responses, voice, and TTS
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = App.tsx (project root)
WHEN = 2026
HOW = React functional component wiring all pages, agents, conversation state, streaming, TTS, and watermark

AGENTS:
AZR
GEMINI
NOVA
ECHO

LICENSE:
MIT
*/

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, PageId } from './components/Layout';
import { audioManager } from './utils/audioManager';
import { audioOrchestrator } from './utils/audioOrchestrator';
import { idleWatcher } from './utils/idleWatcher';
import { Home } from './pages/Home';
import Diagnostics from './pages/Diagnostics';
import { Settings } from './pages/Settings';
import AgentLeeLaunchPad from './pages/AgentLeeLaunchPad';
import Pallium from './components/MemoryLake';
import AgentLeeCodeStudio from './pages/AgentLeeCodeStudio';
import AgentLeeDBCenter from './pages/DatabaseHub';
import PermissionsLoading from './components/AgentLeePermissions-Loading';
import AgentLeeCreatorsStudio from './pages/AgentLeeCreatorsStudio';
import LeeWayUniverse from './components/LeeWayUniverse';
import AgentLeeWorkstation from './pages/AgentLeeWorkstation';
import { LeewayWatermark } from './components/LeewayWatermark';
import { ChatConsole, ChatMessage } from './components/ChatConsole';
import { logIdentityLoad } from './core/agent_lee_prompt_assembler';
import { BODY_SYSTEM_ATLAS } from './core/agent_lee_system_awareness';
import { createBodyAwarenessSnapshot } from './core/agent_lee_system_awareness';
import { pushDiagnosticsReport } from './core/diagnostics_bridge';
import { eventBus } from './core/EventBus';
import { MemoryDB } from './core/MemoryDB';
import { parseLeePrimeCommand, LEE_PRIME_COMMANDS, WORKFLOWS } from './core/GovernanceContract';
import { TaskGraph } from './core/TaskGraph';
import { CheckpointManager } from './core/CheckpointManager';
import { ClerkArchive } from './agents/ClerkArchive';
import { JanitorSentinel } from './agents/JanitorSentinel';
import { LibrarianAegis } from './agents/LibrarianAegis';
import { MarshalVerify } from './agents/MarshalVerify';
import { LeewayStandardsAgent } from './agents/LeewayStandardsAgent';

interface SavedVoxel {
  id: string;
  name: string;
  image: string;
  code: string;
  date: string;
}

// TTS utility using LeeWay-Edge-RTC bridge
import { sendTTS } from './core/ttsBridge';
function speak(text: string, enabled: boolean) {
  if (!enabled) return;
  sendTTS(text);
}

/** Parse TTL string like "5m", "30s", "1h" into milliseconds. */
function parseTTL(ttl: string): number {
  const match = ttl.trim().match(/^(\d+)\s*(s|m|h)?$/i);
  if (!match) return 300000; // default 5 min
  const n = parseInt(match[1], 10);
  const unit = (match[2] ?? 'm').toLowerCase();
  if (unit === 's') return n * 1000;
  if (unit === 'h') return n * 3600000;
  return n * 60000; // minutes (default)
}

const App: React.FC = () => {
  // ── Navigation ──────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const handlePageChange = (page: PageId) => {
    if (page === currentPage) return;
    setCurrentPage(page);
    idleWatcher.reset();
    // Route page-specific audio events
    if (page === 'universe') audioOrchestrator.handleEvent('universe:active');
    else if (page === 'settings') audioOrchestrator.handleEvent('settings:open');
    else if (page === 'diagnostics') audioOrchestrator.handleEvent('diagnostics:open');
    else {
      // leaving universe — stop ambient layers
      if (currentPage === 'universe') audioOrchestrator.handleEvent('universe:exit');
      else if (currentPage === 'diagnostics') audioOrchestrator.handleEvent('diagnostics:close');
    }
  };
  const [isSystemInitialized, setIsSystemInitialized] = useState(false);

  // ── Voxel rendering state ────────────────────────────────────
  const [voxelCode, setVoxelCode] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [backgroundMode] = useState<'voxel' | 'background'>('voxel');

  // ── App status ───────────────────────────────────────────────
  const [status, setStatus] = useState<'idle' | 'generating' | 'error'>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isChangingForm, setIsChangingForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Conversation state ───────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const streamingIdRef = useRef<string | null>(null);

  // ── Voice input ──────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // ── Memory Lake ──────────────────────────────────────────────
  const [savedVoxels, setSavedVoxels] = useState<SavedVoxel[]>([]);
  const [logs, setLogs] = useState<{ id: string; type: string; message: string; timestamp: string }[]>([]);
  const [showUploadConfirm, setShowUploadConfirm] = useState<{ file: File; callback: (save: boolean) => void } | null>(null);

  // ── Helpers ──────────────────────────────────────────────────
  const logAction = useCallback((type: string, message: string) => {
    const newLog = { id: Date.now().toString(), type, message, timestamp: new Date().toISOString() };
    setLogs(prev => [newLog, ...prev]);
    MemoryDB.get<any[]>('agent_lee_logs').then(existingLogs => {
      MemoryDB.set('agent_lee_logs', [newLog, ...(existingLogs || [])].slice(0, 500));
    });
  }, []);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const full: ChatMessage = { ...msg, id: Date.now().toString() + Math.random(), timestamp: new Date() };
    setMessages(prev => [...prev, full]);
    return full.id;
  }, []);

  const updateStreamingMessage = useCallback((id: string, content: string, done = false) => {
    setMessages(prev => prev.map(m =>
      m.id === id ? { ...m, content, streaming: !done } : m
    ));
  }, []);

  // ── Audio system boot ────────────────────────────────────────
  useEffect(() => {
    audioManager.preload();
    audioOrchestrator.handleEvent('app:loading');

    // Idle detection: play idle sound after 3 min inactivity
    const stopIdle = idleWatcher.start(
      () => audioOrchestrator.handleEvent('idle:start'),
      () => audioOrchestrator.handleEvent('idle:end')
    );

    return () => stopIdle();
  }, []);

  // ── Boot sequence ─────────────────────────────────────────────
  useEffect(() => {
    logIdentityLoad();
    logAction('system', '[BOOT] Agent Lee Agentic Operating System initialized — Powered by Leeway Innovations');

    // Initialize governance agents
    ClerkArchive.initialize();
    void ClerkArchive.boot();
    JanitorSentinel.initialize();
    void JanitorSentinel.boot();
    LibrarianAegis.initialize();
    void MarshalVerify.boot();
    LeewayStandardsAgent.initialize();
    void LeewayStandardsAgent.boot();

    // Removed initial Agent Lee greeting message per user request

    // Signal app fully loaded → play intro jingle
    audioOrchestrator.handleEvent('app:loaded');

    MemoryDB.get<SavedVoxel[]>('agent_lee_memory_lake').then(saved => {
      if (saved) setSavedVoxels(saved);
    }).catch(e => console.error('Failed to parse Memory Lake', e));

    // Subscribe to EventBus for agent status updates
    const unsubActive = eventBus.on('agent:active', ({ agent, task }) => {
      logAction('agent', `[${agent}] ${task}`);
    });
    const unsubDone = eventBus.on('agent:done', ({ agent, result }) => {
      logAction('agent', `[${agent}] Done`);
    });

    // Navigate to Launch Pad when any page emits launchpad:open
    const unsubLaunchpadOpen = eventBus.on('launchpad:open', () => {
      setCurrentPage('deployment');
    });

    // Cross-page navigation via EventBus
    const unsubNavigatePage = eventBus.on('navigate:page', ({ page }) => {
      setCurrentPage(page as any);
    });
    const unsubError = eventBus.on('agent:error', ({ agent, error }) => {
      logAction('error', `[${agent}] ${error}`);
    });

    const unsubVmOpen = eventBus.on('vm:open', ({ agent, task }) => {
      logAction('vm', `[${agent}] open -> ${task}`);
    });
    const unsubVmOutput = eventBus.on('vm:output', ({ chunk }) => {
      logAction('vm', `[output] ${chunk}`);
    });
    const unsubVmResult = eventBus.on('vm:result', ({ language, tested }) => {
      logAction('vm', `[result] language=${language || 'unknown'} tested=${tested}`);
    });
    const unsubMemorySaved = eventBus.on('memory:saved', ({ key }) => {
      logAction('memory', `[saved] ${key}`);
    });
    const unsubDreamStart = eventBus.on('dream:start', () => {
      logAction('dream', 'Dream sequence started');
    });
    const unsubDreamEnd = eventBus.on('dream:end', ({ insights }) => {
      logAction('dream', `Dream sequence ended with ${insights.length} insights`);
    });
    const unsubEmotion = eventBus.on('emotion:detected', ({ emotion, confidence }) => {
      logAction('emotion', `Detected ${emotion} (${Math.round(confidence * 100)}%)`);
    });
    const unsubHealStart = eventBus.on('heal:start', ({ module }) => {
      logAction('heal', `Healing started for ${module}`);
    });
    const unsubHealComplete = eventBus.on('heal:complete', ({ module, success }) => {
      logAction('heal', `Healing ${success ? 'completed' : 'failed'} for ${module}`);
    });

    return () => {
      unsubActive();
      unsubDone();
      unsubLaunchpadOpen();
      unsubNavigatePage();
      unsubError();
      unsubVmOpen();
      unsubVmOutput();
      unsubVmResult();
      unsubMemorySaved();
      unsubDreamStart();
      unsubDreamEnd();
      unsubEmotion();
      unsubHealStart();
      unsubHealComplete();
    };
  }, []);

  useEffect(() => {
    MemoryDB.set('agent_lee_memory_lake', savedVoxels);
  }, [savedVoxels]);

  useEffect(() => {
    const snapshot = createBodyAwarenessSnapshot(currentPage);
    MemoryDB.set('agent_lee_body_awareness', snapshot);
    localStorage.setItem('agent_lee_body_awareness', JSON.stringify(snapshot));
    pushDiagnosticsReport({
      surface: `app:${currentPage}`,
      status: 'ok',
      message: `Surface active: ${snapshot.label}`,
      agents: ['AgentLee'],
      mcps: ['memory-agent-mcp', 'health-agent-mcp'],
      tags: ['surface-active', currentPage]
    });
  }, [currentPage]);

  useEffect(() => {
    const memoryIndex = {
      totalSavedVoxels: savedVoxels.length,
      totalLogs: logs.length,
      latestLog: logs[0]?.message || null,
      latestLogType: logs[0]?.type || null,
      status,
      isStreaming,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('agent_lee_memory_lake_index', JSON.stringify(memoryIndex));
  }, [savedVoxels, logs, status, isStreaming]);

  useEffect(() => {
    const heartbeat = () => {
      const selectedModel = localStorage.getItem('al_model') || 'gemini-2.0-flash';
      const wiringRaw = localStorage.getItem('agent_lee_component_wiring');
      let wiringReady = false;
      try {
        wiringReady = Boolean(wiringRaw && JSON.parse(wiringRaw)?.layoutMounted);
      } catch (error) {
        wiringReady = false;
      }

      pushDiagnosticsReport({
        surface: 'app:performance-heartbeat',
        status: wiringReady ? 'ok' : 'warn',
        message: `Model ${selectedModel}; logs=${logs.length}; voxels=${savedVoxels.length}; streaming=${isStreaming}`,
        agents: ['AgentLee', 'Shield', 'Sage'],
        mcps: ['health-agent-mcp', 'memory-agent-mcp', 'agent-registry-mcp'],
        tags: ['department:app', 'subsurface:heartbeat', 'contract:strict', `model:${selectedModel}`]
      });
    };

    heartbeat();
    const timer = window.setInterval(heartbeat, 30000);
    return () => window.clearInterval(timer);
  }, [logs.length, savedVoxels.length, isStreaming]);

  useEffect(() => {
    const wiringSnapshot = {
      vmSandboxMounted: true,
      layoutMounted: true,
      diagnosticsSurface: true,
      memoryGovernance: true,
      workstationSurface: true,
      universeMounted: true,
      atlasCount: BODY_SYSTEM_ATLAS.length,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('agent_lee_component_wiring', JSON.stringify(wiringSnapshot));
  }, []);

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const customEvent = event as CustomEvent<{ page?: string }>;
      const page = customEvent.detail?.page;
      const validPages: PageId[] = ['home', 'diagnostics', 'settings', 'deployment', 'memory', 'code', 'database', 'creators', 'universe', 'vm'];
      if (page && validPages.includes(page as PageId)) {
        setCurrentPage(page as PageId);
      }
    };

    window.addEventListener('agentlee:navigate', handleNavigate as EventListener);
    return () => window.removeEventListener('agentlee:navigate', handleNavigate as EventListener);
  }, []);

  // ── Main message handler ──────────────────────────────────────
  const handleSendMessage = useCallback(async (message: string) => {
    if (isStreaming) return;

    setCurrentPrompt(message);
    logAction('conversation', `User: ${message}`);

    // Add user message to thread
    addMessage({ role: 'user', content: message });

    // ── Injection detection (Shield security gate) ────────────
    const { Shield } = await import('./agents/Shield');
    if (Shield.scanForInjection(message)) {
      addMessage({
        role: 'agent',
        agent: 'Shield',
        content: 'SECURITY: Prompt injection attempt detected and blocked. The message was not processed.',
        streaming: false,
      });
      return;
    }

    // ── /lee.* governance command interception ────────────────
    const govCmd = parseLeePrimeCommand(message);
    if (govCmd) {
      let govResponse = '';
      const { command, args } = govCmd;

      if (command === '/lee.status') {
        const s = TaskGraph.status();
        const cpSummary = await CheckpointManager.summary(5);
        govResponse = [
          `MODE: ${s.mode} | BUDGET: max ${s.budget.maxActiveAgents} agents | Write policy: ${s.budget.writePolicy}`,
          `Tasks → PLANNED:${s.counts.PLANNED} QUEUED:${s.counts.QUEUED} RUNNING:${s.counts.RUNNING} WAITING:${s.counts.WAITING} DONE:${s.counts.DONE} FAILED:${s.counts.FAILED}`,
          `Recent checkpoints: ${cpSummary.map(c => `${c.id} (${c.phase}, ${new Date(c.created_at).toLocaleTimeString()})`).join(' | ') || 'none'}`,
          `Recent tasks: ${s.recentTasks.map(t => `[${t.state}] ${t.workflow} > ${t.lead}: ${t.objective.slice(0, 40)}`).join('\n  ') || 'none'}`,
        ].join('\n');

      } else if (command === '/lee.boundaries') {
        govResponse = [
          'GOVERNANCE BOUNDARIES:',
          `Max active agents (BALANCED): ${TaskGraph.getBudget().maxActiveAgents}`,
          'Always-allowed caps: Z0_READ, Z0_RUN_WORKFLOWS, Z2_READ_MEMORY, Z2_WRITE_MEMORY_APPEND',
          'Approval-required caps: Z1_WRITE_FILES, Z1_RUN_COMMANDS, Z2_WRITE_MEMORY_MUTATE, Z2_WRITE_MEMORY_DELETE, Z2_DB_WRITE',
          'Zones: Z0_AGENTVM (sandbox) | Z1_HOST_FILES (device, always gated) | Z2_MEMORY_DB (memory lake, always gated)',
          'Break-glass: time-limited, scoped, fully audited — does NOT remove approval gates for critical ops.',
        ].join('\n');

      } else if (command === '/lee.sitrep') {
        const s = TaskGraph.status();
        const cpSummary = await CheckpointManager.summary(10);
        govResponse = [
          `SITREP — ${new Date().toISOString()}`,
          `Mode: ${s.mode} | Active: ${s.counts.RUNNING}/${s.budget.maxActiveAgents}`,
          `In-flight: ${s.counts.PLANNED + s.counts.QUEUED + s.counts.RUNNING + s.counts.WAITING} | Done today: ${s.counts.DONE}`,
          `Checkpoints (last 10): ${cpSummary.length > 0 ? cpSummary.map(c => `${c.id}/${c.phase}`).join(', ') : 'none'}`,
        ].join('\n');

      } else if (command === '/lee.plan' || command === '/lee.route') {
        const { AgentRouter } = await import('./core/AgentRouter');
        const wf = await AgentRouter.classifyWorkflow(args || message);
        const wfDef = WORKFLOWS[wf.workflowId];
        govResponse = [
          `ROUTING: workflow=${wf.workflowId} (${wfDef.name}) | lead=${wf.lead} | helpers=[${wf.helpers.join(', ')}]`,
          `Description: ${wf.description}`,
          command === '/lee.plan'
            ? `PLAN:\n  1. [READ] Classify objective and gather context (Lee)\n  2. [READ] Lead agent (${wf.lead}) researches/executes\n  3. [WRITE? TBD] Write outputs after user approval\n  4. [LOG] Scribe archives; Sage compresses; agents sleep`
            : '',
        ].filter(Boolean).join('\n');

      } else if (command === '/lee.execute') {
        const { AgentRouter } = await import('./core/AgentRouter');
        const wf = await AgentRouter.classifyWorkflow(args || message);
        govResponse = [
          `EXECUTING: ${wf.workflowId} | lead=${wf.lead} | helpers=[${wf.helpers.join(', ')}]`,
          '(Running baton protocol...)',
        ].join('\n');
        addMessage({ role: 'agent', agent: 'AgentLee', content: govResponse, streaming: false });
        const batonResult = await AgentRouter.runWithBaton(args || message, wf.workflowId, wf.lead, wf.helpers);
        addMessage({ role: 'agent', agent: wf.lead as any, content: batonResult, streaming: false });
        if (ttsEnabled && batonResult) {
          const { VoiceService } = await import('./core/VoiceService');
          VoiceService.speak({ text: batonResult.slice(0, 500) });
        }
        return;

      } else if (command === '/lee.safe_mode') {
        const on = args.toLowerCase().includes('on');
        TaskGraph.setMode(on ? 'SAFE' : 'BALANCED');
        eventBus.emit('brain:budget_changed', {
          mode: on ? 'SAFE' : 'BALANCED',
          maxActiveAgents: TaskGraph.getBudget().maxActiveAgents,
          writePolicy: TaskGraph.getBudget().writePolicy,
        });
        govResponse = `Safe mode ${on ? 'ACTIVATED — writes frozen, max 2 agents.' : 'DEACTIVATED — resumed BALANCED mode.'}`;

      } else if (command === '/permit.status') {
        const { Shield } = await import('./agents/Shield');
        const grants = Shield.getGrantStatus();
        govResponse = grants.length > 0
          ? `ACTIVE GRANTS:\n${grants.map(g => `  [${g.cap}] zone=${g.zone} remaining=${Math.round(g.remainingMs / 1000)}s scope=${g.scope}`).join('\n')}`
          : 'No active capability grants.';

      } else if (command === '/breakglass.on') {
        const { Shield } = await import('./agents/Shield');
        const capsMatch = args.match(/--caps\s+"([^"]+)"/);
        const ttlMatch = args.match(/--ttl\s+"([^"]+)"/);
        const scopeMatch = args.match(/--scope\s+"([^"]+)"/);
        const reasonMatch = args.match(/--reason\s+"([^"]+)"/);
        const capsRaw = capsMatch ? capsMatch[1].split(',').map(s => s.trim()) : [];
        const ttlMs = ttlMatch ? parseTTL(ttlMatch[1]) : 300000;
        const scope = scopeMatch ? scopeMatch[1] : 'unspecified';
        const reason = reasonMatch ? reasonMatch[1] : 'Emergency access';
        Shield.activateBreakGlass(capsRaw as any, ttlMs, scope, reason);
        govResponse = `BREAK-GLASS ACTIVATED: caps=[${capsRaw.join(',')}] ttl=${ttlMs / 1000}s scope=${scope}\nAll access is audited. End with /breakglass.off`;

      } else if (command === '/breakglass.off') {
        const { Shield } = await import('./agents/Shield');
        Shield.endBreakGlass();
        govResponse = 'BREAK-GLASS ENDED — all emergency grants revoked.';

      } else if (command === '/lee.council') {
        govResponse = `COUNCIL MODE requires explicit justification. You said: "${args}"\nTo proceed, use /lee.execute with your objective and the system will route appropriately.`;

      } else {
        // Unknown /lee.* command — show help
        govResponse = `LEEWAY GOVERNANCE COMMANDS:\n${LEE_PRIME_COMMANDS.map(c => `  ${c.syntax}\n   → ${c.description}`).join('\n')}`;
      }

      addMessage({ role: 'agent', agent: 'AgentLee', content: govResponse, streaming: false });
      logAction('governance', `[/lee command] ${command} → ${govResponse.slice(0, 100)}`);
      return;
    }

    // Placeholder streaming message
    const streamId = Date.now().toString() + '-stream';
    streamingIdRef.current = streamId;
    setMessages(prev => [...prev, {
      id: streamId,
      role: 'agent',
      agent: 'AgentLee',
      content: '',
      streaming: true,
      timestamp: new Date()
    }]);
    setIsStreaming(true);
    setIsSpeaking(true);
    audioOrchestrator.setAgentSpeaking(true);

    let agentUsed = 'AgentLee';
    let fullResponse = '';

    try {
      // 1. Classify intent
      const { AgentRouter } = await import('./core/AgentRouter');
      const intent = await AgentRouter.classify(message);
      agentUsed = intent.agent;

      // Update streaming bubble to show which agent is responding
      setMessages(prev => prev.map(m =>
        m.id === streamId ? { ...m, agent: intent.agent } : m
      ));

      // 2. Route to agent
      if (intent.agent === 'Nova' || intent.requiresCode) {
        const { Nova } = await import('./agents/Nova');
        const result = await Nova.writeCode(message);
        fullResponse = `**Code ready:**\n\`\`\`\n${result.code.slice(0, 800)}\n\`\`\`\n\n${result.explanation}`;
        setVoxelCode(null); // reset voxel if switching to code mode
        setCurrentPage('code');

      } else if (intent.agent === 'Pixel' || intent.requiresImage) {
        setIsChangingForm(true);
        const { Pixel } = await import('./agents/Pixel');
        fullResponse = 'Generating your 3D visual using Agent Orion [role:structuralist], Agent Chroma [role:colorist], and Agent Pulse [role:animator]... watch the canvas transform! ✨';
        updateStreamingMessage(streamId, fullResponse);
        const img = await Pixel.generateImage(message);
        setCurrentImage(img);
        
        // Let the specialized Agents within AgentLeeForm handle the voxel build
        eventBus.emit('voxel:generate', { prompt: message, image: img });
        
        setTimeout(() => setIsChangingForm(false), 2500);
        fullResponse = `Visual manifestation complete! Your requested voxel object is now in the simulation. 🎨`;

      } else if (intent.agent === 'Atlas' || intent.requiresSearch) {
        const { Atlas } = await import('./agents/Atlas');
        const result = await Atlas.search(message);
        fullResponse = result;

      } else if (intent.agent === 'Sage') {
        const { Sage } = await import('./agents/Sage');
        const result = await Sage.summarize(message);
        fullResponse = result;

      } else if (intent.agent === 'Shield') {
        const { Shield } = await import('./agents/Shield');
        const result = Shield.getIncidents();
        fullResponse = `System incidents report:\n${JSON.stringify(result, null, 2)}`;

      } else if (intent.agent === 'Nexus') {
        const { Nexus } = await import('./agents/Nexus');
        const plan = await Nexus.planDeployment(message);
        fullResponse = plan;
        setStatus('generating');
        setTimeout(() => setCurrentPage('deployment'), 2000);

      } else if (intent.agent === 'Aria') {
        const { Aria } = await import('./agents/Aria');
        const result = await Aria.facilitateGroupConversation([{ speakerId: 'user1', text: message }]);
        fullResponse = result;

      } else {
        // Default: stream AgentLee response token by token
        const { AgentLee } = await import('./agents/AgentLee');
        fullResponse = await AgentLee.respond(message, intent, (chunk: string) => {
          fullResponse += chunk;
          updateStreamingMessage(streamId, fullResponse);
        });
        // Handle case where stream callback already accumulated text
        if (!fullResponse) fullResponse = 'I processed your request.';
      }

    } catch (err: any) {
      fullResponse = `⚠️ ${err.message || 'Processing failed. Please try again.'}`;
      setErrorMsg(err.message || 'Processing failed');
      setStatus('error');
      agentUsed = 'AgentLee';
      setTimeout(() => setStatus('idle'), 5000);
    } finally {
      // Finalize the streaming message
      updateStreamingMessage(streamId, fullResponse || '...', true);
      streamingIdRef.current = null;
      setIsStreaming(false);
      setIsSpeaking(false);
      audioOrchestrator.setAgentSpeaking(false);
      setStatus('idle');

      // TTS playback
      if (ttsEnabled && fullResponse) {
        const plainText = fullResponse.replace(/```[\s\S]*?```/g, 'code block').replace(/\*\*/g, '');
        speak(plainText, ttsEnabled);
      }
    }
  }, [isStreaming, ttsEnabled, addMessage, updateStreamingMessage, logAction]);

  // ── Voice input ───────────────────────────────────────────────
  const startVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addMessage({ role: 'agent', agent: 'Echo', content: 'Voice input is not supported in this browser. Try Chrome or Edge.' });
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setIsListening(false);
      handleSendMessage(transcript);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
    audioOrchestrator.setAgentListening(true);
    idleWatcher.reset();
  }, [handleSendMessage, addMessage]);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    audioOrchestrator.setAgentListening(false);
  }, []);

  // ── File upload ────────────────────────────────────────────────
  const handleFileUpload = (file: File) => {
    setShowUploadConfirm({
      file,
      callback: async (save) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const result = e.target?.result as string;
          setCurrentImage(result);
          logAction('upload', `Uploaded file: ${file.name}`);
          if (save) logAction('task', `Saving ${file.name} to Memory Lake...`);

          addMessage({ role: 'user', content: `[Uploaded: ${file.name}]` });
          addMessage({ role: 'agent', agent: 'Pixel', content: 'Voxelizing your image... 🎨 Watch the canvas rebuild!' });

          const { Pixel } = await import('./agents/Pixel');
          const voxelCodeResult = await Pixel.voxelize(result);
          triggerDismantle();
          setTimeout(() => setVoxelCode(voxelCodeResult), 2500);
        };
        reader.readAsDataURL(file);
        setShowUploadConfirm(null);
      }
    });
  };

  const handleGenerate = async () => {
    if (!currentPrompt) return;
    await handleSendMessage(currentPrompt);
  };

  const triggerDismantle = () => {
    document.querySelectorAll('iframe').forEach(iframe => {
      iframe.contentWindow?.postMessage({ type: 'DISMANTLE' }, '*');
    });
  };

  const handleSaveToLake = () => {
    if (!voxelCode || !currentImage) return;
    const newVoxel: SavedVoxel = {
      id: Date.now().toString(),
      name: currentPrompt || 'Untitled Manifestation',
      image: currentImage,
      code: voxelCode,
      date: new Date().toLocaleDateString()
    };
    setSavedVoxels(prev => [newVoxel, ...prev]);
    addMessage({ role: 'agent', agent: 'Sage', content: `Manifestation "${newVoxel.name}" has been saved to your Memory Lake. 🧊` });
  };

  const handleDeleteFromLake = (id: string) => {
    setSavedVoxels(prev => prev.filter(v => v.id !== id));
  };

  const handleSelectFromLake = (voxel: SavedVoxel) => {
    triggerDismantle();
    setTimeout(() => {
      setVoxelCode(voxel.code);
      setCurrentImage(voxel.image);
      setCurrentPrompt(voxel.name);
      setCurrentPage('home');
    }, 2500);
  };

  const handleSendToStudio = () => {
    if (!voxelCode) return;
    logAction('task', 'Sending manifestation to Code Studio');
    setCurrentPage('code');
  };

  // ── Page renderer ─────────────────────────────────────────────
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Home
            voxelCode={voxelCode}
            savedVoxels={savedVoxels}
            isSpeaking={isSpeaking}
            isChangingForm={isChangingForm}
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            onGenerate={handleGenerate}
            isGenerating={status === 'generating'}
            backgroundImage={backgroundMode === 'background' ? currentImage : null}
          />
        );
      case 'diagnostics': return <Diagnostics />;
      case 'settings':    return <Settings />;
      case 'deployment':  return <AgentLeeLaunchPad />;
      case 'memory':
        return <Pallium />;
      case 'database': return <AgentLeeDBCenter />;
      case 'code':     return <AgentLeeCodeStudio />;
      case 'creators': return <AgentLeeCreatorsStudio />;
      case 'universe': return <LeeWayUniverse />;
      case 'vm':       return <AgentLeeWorkstation />;
      default:
        return (
          <Home
            voxelCode={voxelCode}
            savedVoxels={savedVoxels}
            isSpeaking={isSpeaking}
            isChangingForm={isChangingForm}
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            onGenerate={handleGenerate}
            isGenerating={status === 'generating'}
          />
        );
    }
  };

  if (!isSystemInitialized) {
    return <PermissionsLoading onComplete={() => setIsSystemInitialized(true)} />;
  }

  return (
    <>
      <Layout
        currentPage={currentPage}
        onPageChange={handlePageChange}
        voxelCode={voxelCode}
        isSpeaking={isSpeaking}
        isListening={isListening}
        onStartVoice={startVoice}
        onStopVoice={stopVoice}
        isChangingForm={isChangingForm}
        onSendMessage={handleSendMessage}
        onFileUpload={handleFileUpload}
        onGenerate={handleGenerate}
        isGenerating={status === 'generating'}
        savedVoxels={savedVoxels}
        onSaveToLake={handleSaveToLake}
        onSelectFromLake={handleSelectFromLake}
        onSendToStudio={handleSendToStudio}
        backgroundImage={backgroundMode === 'background' ? currentImage : null}
        messages={messages}
      >
        {renderPage()}

        {/* Upload Confirmation Dialog */}
        <AnimatePresence>
          {showUploadConfirm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
              >
                <h3 className="text-xl font-black uppercase tracking-tighter italic mb-4 text-cyan-400">Memory Lake Integration</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  Do you want to permanently store{' '}
                  <span className="text-white font-bold">"{showUploadConfirm.file.name}"</span>{' '}
                  in the Memory Lake neural drives?
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => showUploadConfirm.callback(true)}
                    className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                  >
                    Always Save to Lake
                  </button>
                  <button
                    onClick={() => showUploadConfirm.callback(false)}
                    className="w-full py-4 bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-700 transition-all"
                  >
                    Just this upload
                  </button>
                  <button
                    onClick={() => setShowUploadConfirm(null)}
                    className="w-full py-4 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


      </Layout>

      {/* Floating Chat Console removed per user request so there is only one global footer console */}

      <LeewayWatermark />
    </>
  );
};

export default App;
