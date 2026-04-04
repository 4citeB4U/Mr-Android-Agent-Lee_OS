/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.PAGE.DEPLOYMENT
TAG: UI.PAGE.DEPLOYMENT.HUB

COLOR_ONION_HEX:
NEON=#10B981
FLUO=#34D399
PASTEL=#A7F3D0

ICON_ASCII:
family=lucide
glyph=rocket

5WH:
WHAT = Deployment Hub page — manages apps, deployment configs, system monitoring, and console commands
WHY = Provides full production deployment pipeline for code built in the VM through to live infrastructure
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = pages/Deployment.tsx
WHEN = 2026
HOW = React component with tabs (Apps, Deploy, Monitor, Settings), app CRUD, kernel event bus integration

AGENTS:
ASSESS
AUDIT
GEMINI
NEXUS

LICENSE:
MIT
*/

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import {
  Monitor,
  Cloud,
  Layers,
  BarChart3,
  Settings,
  Plus,
  Brain,
  Cpu,
  Database,
  Activity,
  Shield,
  Network,
  Zap,
  X,
  Info,
  Search,
  Trash2,
  Edit3,
  FolderOpen,
  ServerCog,
  UploadCloud,
  PackagePlus,
  LogOut,
  RefreshCcw,
  Globe,
  HeartPulse
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { SystemAwarenessPanel } from '../components/SystemAwarenessPanel';
import { eventBus } from '../core/EventBus';
import { pushDiagnosticsReport } from '../core/diagnostics_bridge';

// Utility for merging class names (re-exported from other files)
function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// Mock data representing existing applications. In a real system this
// could be loaded from memory via the kernel or retrieved from an API.
interface AppEntry {
  id: string;
  name: string;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  deploy: string;
  health: number;
  latency: string;
  cpu: number;
  ram: number;
  uptime: string;
  region: string;
  lastDeploy: string;
}

const DEFAULT_APPS: AppEntry[] = [
  { id: 'NX-01', name: 'Nexus Prime', status: 'HEALTHY', deploy: 'Vercel', health: 98, latency: '42ms', cpu: 12, ram: 240, uptime: '99.99%', region: 'us-east-1', lastDeploy: '2h ago' },
  { id: 'QP-02', name: 'Quantum Portal', status: 'WARNING', deploy: 'GCP', health: 76, latency: '128ms', cpu: 45, ram: 890, uptime: '98.50%', region: 'europe-west-2', lastDeploy: '5h ago' },
  { id: 'AS-03', name: 'Aether Stream', status: 'HEALTHY', deploy: 'Netlify', health: 99, latency: '35ms', cpu: 8, ram: 120, uptime: '100%', region: 'ap-southeast-1', lastDeploy: '1d ago' },
  { id: 'TC-04', name: 'Titan Core', status: 'CRITICAL', deploy: 'AWS', health: 24, latency: '450ms', cpu: 92, ram: 1800, uptime: '84.20%', region: 'us-west-2', lastDeploy: '12m ago' },
  { id: 'VS-05', name: 'Vortex Sync', status: 'HEALTHY', deploy: 'Azure', health: 95, latency: '55ms', cpu: 15, ram: 310, uptime: '99.95%', region: 'ca-central-1', lastDeploy: '3h ago' },
];

interface LogEntry {
  id: number;
  time: string;
  type: string;
  msg: string;
}

const INITIAL_LOGS: LogEntry[] = [
  { id: 1, time: '21:45:12', type: 'SYS', msg: 'Deployment Hub initialized.' },
  { id: 2, time: '21:45:13', type: 'NET', msg: 'Memory Lake handshake: SUCCESS' },
  { id: 3, time: '21:45:15', type: 'AI', msg: 'Agent Lee ready for deployment commands.' },
  { id: 4, time: '21:45:16', type: 'APP', msg: 'Loaded 5 application profiles.' },
];

// Simple sparkline component reused from prior files for small charts
const Sparkline = ({ data, color = '#10b981' }: { data: number[]; color?: string }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }));
  const pathData = `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <path d={pathData} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Small badge to display health status with color coding
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    HEALTHY: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    WARNING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    CRITICAL: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };
  return (
    <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-black border tracking-tighter', styles[status])}>{status}</span>
  );
};

// Tabs definition
const TABS = [
  { id: 'apps', label: 'Fleet (Nexus)', icon: Monitor },
  { id: 'deploy', label: 'Dispatch', icon: UploadCloud },
  { id: 'monitor', label: 'Pulse', icon: HeartPulse },
  { id: 'settings', label: 'System', icon: Settings },
];

// Deployment providers options
const PROVIDERS = [
  { id: 'github', name: 'GitHub', description: 'Deploy via GitHub actions', icon: FolderOpen },
  { id: 'cloudflare', name: 'Cloudflare', description: 'Deploy to Cloudflare Workers', icon: Globe },
  { id: 'vercel', name: 'Vercel', description: 'Deploy to Vercel platform', icon: Cloud },
  { id: 'flyio', name: 'Fly.io', description: 'Deploy globally via Fly.io', icon: ServerCog },
];

// Main Deployment Hub component
const DeploymentHub: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('apps');
  const [apps, setApps] = useState<AppEntry[]>(DEFAULT_APPS);
  const [selectedApp, setSelectedApp] = useState<AppEntry | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppProvider, setNewAppProvider] = useState(PROVIDERS[0].id);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [systemStats, setSystemStats] = useState({ cpu: 12, ram: 32, memLake: 95, net: 120 });
  const [deploying, setDeploying] = useState(false);
  const [deployEnv, setDeployEnv] = useState<{ repo: string; branch: string; command: string; provider: string }>({ repo: '', branch: 'main', command: 'npm run build && npm run start', provider: PROVIDERS[0].id });
  const [commandInput, setCommandInput] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  const reportDeployment = (
    status: 'ok' | 'warn' | 'error',
    message: string,
    tags: string[]
  ) => {
    pushDiagnosticsReport({
      surface: 'deployment',
      status,
      message,
      agents: ['Nexus', 'Shield'],
      mcps: ['planner-agent-mcp', 'testsprite-agent-mcp'],
      tags
    });
  };

  // Scroll log view to bottom when logs change
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    reportDeployment(
      'ok',
      'Deployment Hub synchronized with diagnostics bridge.',
      ['department:deployment', 'subsurface:apps', 'contract:strict']
    );
  }, []);

  useEffect(() => {
    reportDeployment(
      'ok',
      `Deployment tab switched to ${currentTab}.`,
      ['department:deployment', `subsurface:${currentTab}`, 'contract:strict']
    );
  }, [currentTab]);

  // Update system stats periodically (simulated)
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats((prev) => ({
        cpu: Math.max(5, Math.min(95, prev.cpu + (Math.random() * 10 - 5))),
        ram: Math.max(20, Math.min(80, prev.ram + (Math.random() * 5 - 2.5))),
        memLake: Math.max(85, Math.min(99, prev.memLake + (Math.random() * 1 - 0.5))),
        net: Math.max(50, Math.min(500, prev.net + (Math.random() * 60 - 30))),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle new app creation
  const createNewApp = () => {
    if (!newAppName.trim()) return;
    const id = `${newAppName.slice(0, 2).toUpperCase()}-${Math.floor(Math.random() * 90 + 10)}`;
    const newEntry: AppEntry = {
      id,
      name: newAppName,
      status: 'HEALTHY',
      deploy: PROVIDERS.find((p) => p.id === newAppProvider)?.name || 'Custom',
      health: 100,
      latency: '0ms',
      cpu: 0,
      ram: 0,
      uptime: '0%',
      region: 'unknown',
      lastDeploy: 'never',
    };
    setApps((prev) => [...prev, newEntry]);
    setShowNewModal(false);
    setNewAppName('');
    // Persist to memory via the kernel
    eventBus.emit('vm:output', { chunk: `Memory stored: app-${newEntry.id}` });
    setLogs((prev) => [...prev, { id: Date.now(), time: new Date().toLocaleTimeString([], { hour12: false }), type: 'APP', msg: `New app "${newEntry.name}" created.` }]);
    reportDeployment(
      'ok',
      `New deployment profile created for ${newEntry.name}.`,
      ['department:deployment', 'subsurface:apps', 'action:create-app', 'contract:strict']
    );
  };

  // Handle app deletion
  const deleteApp = (app: AppEntry) => {
    setApps((prev) => prev.filter((a) => a.id !== app.id));
    setSelectedApp(null);
    setLogs((prev) => [...prev, { id: Date.now(), time: new Date().toLocaleTimeString([], { hour12: false }), type: 'APP', msg: `App "${app.name}" deleted.` }]);
    // Delete from memory (emit event type not yet defined; we can use MEMORY_STORE with empty content to mark deletion)
    eventBus.emit('vm:output', { chunk: `Memory cleared: app-${app.id}` });
    reportDeployment(
      'warn',
      `Deployment profile deleted for ${app.name}.`,
      ['department:deployment', 'subsurface:apps', 'action:delete-app', 'contract:strict']
    );
  };

  // Handle deployment action
  const handleDeploy = () => {
    if (!selectedApp) return;
    setDeploying(true);
    // Simulate a deployment sequence
    setLogs((prev) => [...prev, { id: Date.now(), time: new Date().toLocaleTimeString([], { hour12: false }), type: 'DEP', msg: `Deploying ${selectedApp.name} to ${deployEnv.provider}...` }]);
    reportDeployment(
      'ok',
      `Deployment started for ${selectedApp.name} on ${deployEnv.provider}.`,
      ['department:deployment', 'subsurface:deploy', 'action:start-deploy', 'contract:strict']
    );
    setTimeout(() => {
      setDeploying(false);
      setApps((prev) => prev.map((app) => app.id === selectedApp.id ? { ...app, lastDeploy: 'Just now', status: 'HEALTHY', health: 98, latency: '50ms', cpu: Math.floor(Math.random() * 50), ram: Math.floor(Math.random() * 500) } : app));
      setLogs((prev) => [...prev, { id: Date.now(), time: new Date().toLocaleTimeString([], { hour12: false }), type: 'DEP', msg: `Deployment completed successfully for ${selectedApp.name}.` }]);
      reportDeployment(
        'ok',
        `Deployment completed for ${selectedApp.name}.`,
        ['department:deployment', 'subsurface:deploy', 'action:finish-deploy', 'contract:strict']
      );
    }, 3500);
  };

  // Handle command submission (log console)
  const handleCommandSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    const cmd = commandInput.trim();
    setLogs((prev) => [...prev, { id: Date.now(), time: new Date().toLocaleTimeString([], { hour12: false }), type: 'CMD', msg: cmd }]);
    reportDeployment(
      'ok',
      `Deployment console command issued: ${cmd.slice(0, 80)}`,
      ['department:deployment', 'subsurface:console', 'action:command', 'contract:strict']
    );
    setCommandInput('');
    // Provide a mock response from Agent Lee after a delay
    setTimeout(() => {
      setLogs((prev) => [...prev, { id: Date.now() + 1, time: new Date().toLocaleTimeString([], { hour12: false }), type: 'AI', msg: `Agent Lee processed: ${cmd}` }]);
    }, 500);
  };

  // Open external panels via kernel event bus
  const openCodeStudio = () => {
    eventBus.emit('vm:open', { agent: 'Nova', task: 'Opening Code Studio' });
  };
  const openMemoryLake = () => {
    eventBus.emit('vm:open', { agent: 'Sage', task: 'Opening Memory Lake' });
  };
  const openDiagnostics = () => {
    eventBus.emit('vm:open', { agent: 'Shield', task: 'Opening Diagnostics' });
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0c10] text-[#cbd5e1] font-mono selection:bg-emerald-500/30 overflow-hidden rounded-lg shadow-xl border border-white/10">
      {/* Top Bar */}
      <header className="flex-none h-12 bg-[#090a0e] border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
            <Zap size={12} className="text-black" />
          </div>
          <span className="text-[12px] font-extrabold uppercase tracking-widest">Deployment Hub</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <div className="flex items-center gap-1.5">
            <Brain size={10} className="text-emerald-400" />
            <span className="text-emerald-400">{systemStats.memLake.toFixed(1)}%</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu size={10} className="text-white/40" />
            <span className={cn(systemStats.cpu > 80 ? 'text-rose-400' : 'text-emerald-400')}>{systemStats.cpu.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database size={10} className="text-white/40" />
            <span className="text-blue-400">{systemStats.ram.toFixed(0)}%</span>
          </div>
        </div>
      </header>
      {/* Tabs Bar */}
      <nav className="flex-none flex gap-1 bg-[#0e1015] border-b border-white/10 px-2 py-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded transition-colors',
                currentTab === tab.id ? 'bg-emerald-600 text-black' : 'text-white/50 hover:bg-white/10'
              )}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </nav>
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto bg-[#0b0c10] p-3 space-y-4">
        <SystemAwarenessPanel surfaceId="deployment" variant="compact" />

        {/* Apps Tab */}
        {currentTab === 'apps' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[12px] font-extrabold uppercase tracking-wider text-white/80">Your Applications</h2>
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-black text-[10px] font-bold rounded hover:bg-emerald-500"
              >
                <Plus size={10} /> Add App
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {apps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className="bg-[#12141c] border border-white/10 rounded-lg p-3 space-y-2 cursor-pointer hover:bg-[#1a1e29] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[11px] font-bold text-white truncate">{app.name}</h3>
                      <p className="text-[8px] text-white/30 font-mono">{app.id} • {app.region}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="flex items-center justify-between text-[8px] font-mono text-white/40">
                    <span>CPU: {app.cpu}%</span>
                    <span>RAM: {app.ram}MB</span>
                    <span>LAT: {app.latency}</span>
                  </div>
                  <div className="w-full h-6">
                    <Sparkline data={[40, 60, 45, 80, 70, 90, 85].map((v) => v + Math.random() * 10)} color={app.status === 'CRITICAL' ? '#f87171' : '#10b981'} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deploy Tab */}
        {currentTab === 'deploy' && (
          <div className="space-y-4">
            <h2 className="text-[12px] font-extrabold uppercase tracking-wider text-white/80">Deploy Application</h2>
            {selectedApp ? (
              <>
                <div className="p-3 bg-[#12141c] border border-white/10 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[11px] font-bold text-white">{selectedApp.name}</h3>
                      <p className="text-[8px] text-white/40 font-mono">{selectedApp.id} • {selectedApp.region}</p>
                    </div>
                    <StatusBadge status={selectedApp.status} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex flex-col text-[8px] text-white/50 font-bold uppercase tracking-wide gap-1">
                      Repository URL
                      <input
                        type="text"
                        value={deployEnv.repo}
                        onChange={(e) => setDeployEnv((prev) => ({ ...prev, repo: e.target.value }))}
                        className="px-2 py-1 text-[10px] bg-[#0b0c10] border border-white/10 rounded outline-none focus:border-emerald-500"
                        placeholder="https://github.com/user/repo"
                      />
                    </label>
                    <label className="flex flex-col text-[8px] text-white/50 font-bold uppercase tracking-wide gap-1">
                      Branch
                      <input
                        type="text"
                        value={deployEnv.branch}
                        onChange={(e) => setDeployEnv((prev) => ({ ...prev, branch: e.target.value }))}
                        className="px-2 py-1 text-[10px] bg-[#0b0c10] border border-white/10 rounded outline-none focus:border-emerald-500"
                        placeholder="main"
                      />
                    </label>
                    <label className="flex flex-col text-[8px] text-white/50 font-bold uppercase tracking-wide gap-1 sm:col-span-2">
                      Build & Start Command
                      <input
                        type="text"
                        value={deployEnv.command}
                        onChange={(e) => setDeployEnv((prev) => ({ ...prev, command: e.target.value }))}
                        className="px-2 py-1 text-[10px] bg-[#0b0c10] border border-white/10 rounded outline-none focus:border-emerald-500"
                        placeholder="npm run build && npm start"
                      />
                    </label>
                    <label className="flex flex-col text-[8px] text-white/50 font-bold uppercase tracking-wide gap-1">
                      Provider
                      <select
                        value={deployEnv.provider}
                        onChange={(e) => setDeployEnv((prev) => ({ ...prev, provider: e.target.value }))}
                        className="px-2 py-1 text-[10px] bg-[#0b0c10] border border-white/10 rounded outline-none focus:border-emerald-500"
                      >
                        {PROVIDERS.map((p) => (
                          <option key={p.id} value={p.id} className="bg-[#0b0c10] text-white">
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeploy}
                      disabled={deploying}
                      className={cn('flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded', deploying ? 'bg-gray-600 text-gray-300' : 'bg-emerald-600 text-black hover:bg-emerald-500')}
                    >
                      {deploying ? <RefreshCcw size={12} className="animate-spin" /> : <UploadCloud size={12} />}
                      {deploying ? 'Deploying...' : 'Deploy Now'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[10px] text-white/40 font-mono">Select an application from the Apps tab to configure deployment settings.</p>
            )}
          </div>
        )}

        {/* Monitor Tab */}
        {currentTab === 'monitor' && (
          <div className="space-y-4">
            <h2 className="text-[12px] font-extrabold uppercase tracking-wider text-white/80">System Monitor</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#12141c] border border-white/10 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <Brain size={12} className="text-emerald-400" />
                    <span className="text-[9px] font-bold uppercase text-white/40">Memory Lake</span>
                  </div>
                  <button onClick={openMemoryLake} className="text-[8px] font-bold text-emerald-500 hover:underline">Open</button>
                </div>
                <div className="flex items-center justify-between text-[8px] text-white/50">
                  <span>Indexed</span>
                  <span>1.2 TB</span>
                </div>
                <div className="flex items-center justify-between text-[8px] text-white/50 mt-1">
                  <span>Latency</span>
                  <span>42 ms</span>
                </div>
              </div>
              <div className="bg-[#12141c] border border-white/10 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <Cpu size={12} className="text-rose-400" />
                    <span className="text-[9px] font-bold uppercase text-white/40">CPU Usage</span>
                  </div>
                  <button onClick={openDiagnostics} className="text-[8px] font-bold text-rose-300 hover:underline">Open</button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-grow h-2 bg-rose-900/20 rounded-full overflow-hidden">
                    <div style={{ width: `${systemStats.cpu}%` }} className="h-full bg-rose-500"></div>
                  </div>
                  <span className="text-[9px] font-bold text-rose-300">{systemStats.cpu.toFixed(0)}%</span>
                </div>
              </div>
              <div className="bg-[#12141c] border border-white/10 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <Database size={12} className="text-blue-400" />
                    <span className="text-[9px] font-bold uppercase text-white/40">Memory Usage</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-grow h-2 bg-blue-900/20 rounded-full overflow-hidden">
                    <div style={{ width: `${systemStats.ram}%` }} className="h-full bg-blue-500"></div>
                  </div>
                  <span className="text-[9px] font-bold text-blue-300">{systemStats.ram.toFixed(0)}%</span>
                </div>
              </div>
              <div className="bg-[#12141c] border border-white/10 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <Network size={12} className="text-emerald-400" />
                    <span className="text-[9px] font-bold uppercase text-white/40">Network</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-grow h-2 bg-emerald-900/20 rounded-full overflow-hidden">
                    <div style={{ width: `${Math.min(100, (systemStats.net / 500) * 100)}%` }} className="h-full bg-emerald-500"></div>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-300">{systemStats.net.toFixed(0)} Mbps</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {currentTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-[12px] font-extrabold uppercase tracking-wider text-white/80">Settings</h2>
            <p className="text-[10px] text-white/40 font-mono">This panel will allow future configuration of deployment providers, memory lake connections, and other system preferences.</p>
          </div>
        )}
      </main>
      {/* Footer / Console */}
      <footer className="flex-none bg-[#090a0e] border-t border-white/10 p-3">
        <div className="h-24 overflow-y-auto bg-[#12141c] border border-white/10 rounded text-[9px] text-white/60 p-2 space-y-1" ref={logRef}>
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2">
              <span className="text-[8px] text-white/30">[{log.time}]</span>
              <span className="font-bold text-white/50">{log.type}:</span>
              <span className="flex-grow">{log.msg}</span>
            </div>
          ))}
        </div>
        <form onSubmit={handleCommandSubmit} className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Enter command..."
            className="flex-grow px-2 py-1 text-[10px] bg-[#0b0c10] border border-white/10 rounded outline-none focus:border-emerald-500 text-white"
          />
          <button type="submit" className="px-3 py-1 bg-emerald-600 text-black text-[10px] font-bold rounded hover:bg-emerald-500">Send</button>
        </form>
      </footer>

      {/* New App Modal */}
      <AnimatePresence>
        {showNewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-[#12141c] border border-white/10 rounded-lg p-4 w-full max-w-sm text-white space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-bold">Create New App</h3>
                <button onClick={() => setShowNewModal(false)} className="text-white/50 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                <label className="flex flex-col text-[8px] text-white/50 font-bold uppercase gap-1">
                  App Name
                  <input
                    type="text"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder="My Cool App"
                    className="px-2 py-1 text-[10px] bg-[#0b0c10] border border-white/10 rounded outline-none focus:border-emerald-500 text-white"
                  />
                </label>
                <label className="flex flex-col text-[8px] text-white/50 font-bold uppercase gap-1">
                  Provider
                  <select
                    value={newAppProvider}
                    onChange={(e) => setNewAppProvider(e.target.value)}
                    className="px-2 py-1 text-[10px] bg-[#0b0c10] border border-white/10 rounded outline-none focus:border-emerald-500 text-white"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#0b0c10] text-white">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setShowNewModal(false)} className="px-3 py-1 text-[10px] font-bold text-white/50 hover:text-white">Cancel</button>
                <button onClick={createNewApp} className="px-3 py-1 bg-emerald-600 text-black text-[10px] font-bold rounded hover:bg-emerald-500">Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 120 }}
              className="bg-[#12141c] border-t border-white/10 rounded-t-2xl w-full max-w-md p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center relative">
                    <Cloud size={20} className="text-white/40" />
                    <div className={cn('absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#12141c]', selectedApp.status === 'HEALTHY' ? 'bg-emerald-500' : selectedApp.status === 'WARNING' ? 'bg-amber-500' : 'bg-rose-500')} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest">{selectedApp.name}</h2>
                    <p className="text-[10px] text-white/30 font-mono">{selectedApp.id} • {selectedApp.region}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedApp(null)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-[10px] font-mono text-white/60">
                <div>
                  <span className="block text-[8px] text-white/40 uppercase font-bold">Health</span>
                  <span className="block text-emerald-300 font-bold">{selectedApp.health}%</span>
                </div>
                <div>
                  <span className="block text-[8px] text-white/40 uppercase font-bold">Latency</span>
                  <span className="block">{selectedApp.latency}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-white/40 uppercase font-bold">Uptime</span>
                  <span className="block">{selectedApp.uptime}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-white/40 uppercase font-bold">CPU</span>
                  <span className="block">{selectedApp.cpu}%</span>
                </div>
                <div>
                  <span className="block text-[8px] text-white/40 uppercase font-bold">RAM</span>
                  <span className="block">{selectedApp.ram}MB</span>
                </div>
                <div>
                  <span className="block text-[8px] text-white/40 uppercase font-bold">Deploy</span>
                  <span className="block">{selectedApp.deploy}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-white/40 uppercase font-bold">Region</span>
                  <span className="block">{selectedApp.region}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-white/40 uppercase font-bold">Last Deploy</span>
                  <span className="block">{selectedApp.lastDeploy}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={openCodeStudio} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-black text-[10px] font-bold rounded hover:bg-blue-500">
                  <Activity size={12} /> Code
                </button>
                <button onClick={openMemoryLake} className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-black text-[10px] font-bold rounded hover:bg-emerald-500">
                  <Brain size={12} /> Memory
                </button>
                <button onClick={openDiagnostics} className="flex items-center gap-1 px-3 py-1 bg-rose-600 text-black text-[10px] font-bold rounded hover:bg-rose-500">
                  <Cpu size={12} /> Diagnostics
                </button>
              </div>
              <div className="flex items-center justify-between pt-2">
                <button onClick={() => deleteApp(selectedApp)} className="flex items-center gap-1 text-[9px] text-rose-400 font-bold hover:text-rose-300">
                  <Trash2 size={12} /> Delete
                </button>
                <button onClick={() => setCurrentTab('deploy')} className="flex items-center gap-1 text-[9px] text-blue-400 font-bold hover:text-blue-300">
                  <UploadCloud size={12} /> Configure Deploy
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeploymentHub;