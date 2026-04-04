/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.PAGE.DATABASE
TAG: UI.PAGE.DATABASEHUB.MONITORING

COLOR_ONION_HEX:
NEON=#22D3EE
FLUO=#67E8F9
PASTEL=#A5F3FC

ICON_ASCII:
family=lucide
glyph=database

5WH:
WHAT = Database Hub page — visualizes neural database clusters, health, load charts, and recent operations
WHY = Provides centralized monitoring of all data stores powering the Agent Lee memory and persistence layer
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = pages/DatabaseHub.tsx
WHEN = 2026
HOW = React component using Recharts area/pie charts, mock DB metrics, and animated list with refresh

AGENTS:
ASSESS
AUDIT
GEMINI
MEMORY

LICENSE:
Apache-2.0
*/

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, 
  Activity, 
  Shield, 
  Zap, 
  Server, 
  HardDrive, 
  Cpu, 
  Network,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { pushDiagnosticsReport } from "../core/diagnostics_bridge";

// Mock Data
const DB_METRICS = [
  { name: 'Neural Core', status: 'online', health: 98, latency: '12ms', load: 45, type: 'Vector; roles: [role:monitor]; caps: [cap:memory.read]' },
  { name: 'Cold Store', status: 'online', health: 100, latency: '45ms', load: 12, type: 'Object; roles: [role:publisher]; caps: [cap:memory.write]' },
  { name: 'Agent Memory', status: 'online', health: 95, latency: '8ms', load: 78, type: 'Relational; roles: [role:monitor]; caps: [cap:memory.read]' },
  { name: 'Task Registry', status: 'online', health: 99, latency: '15ms', load: 30, type: 'Key-Value; roles: [role:monitor]; caps: [cap:memory.write]' },
];

const LOAD_DATA = [
  { time: '00:00', load: 40 },
  { time: '04:00', load: 35 },
  { time: '08:00', load: 65 },
  { time: '12:00', load: 85 },
  { time: '16:00', load: 70 },
  { time: '20:00', load: 50 },
  { time: '23:59', load: 45 },
];

const DISTRIBUTION_DATA = [
  { name: 'Code', value: 400, color: '#22d3ee' },
  { name: 'Media', value: 300, color: '#f472b6' },
  { name: 'Docs', value: 200, color: '#fbbf24' },
  { name: 'System', value: 100, color: '#4ade80' },
];

export const DatabaseHub: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    pushDiagnosticsReport({
      surface: 'databasehub',
      status: 'ok',
      message: 'Database Hub synchronized with diagnostics bridge.',
      agents: ['Sage', 'Shield'],
      mcps: ['memory-agent-mcp', 'insforge-agent-mcp'],
      tags: ['department:database', 'subsurface:overview', 'contract:strict']
    });
  }, []);

  useEffect(() => {
    if (!isRefreshing) return;
    pushDiagnosticsReport({
      surface: 'databasehub',
      status: 'ok',
      message: 'Database Hub refresh cycle started.',
      agents: ['Sage'],
      mcps: ['memory-agent-mcp'],
      tags: ['department:database', 'subsurface:refresh', 'contract:strict']
    });
  }, [isRefreshing]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 p-4 md:p-8 font-sans pb-32">
      {/* Header Section */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-500">
              <Database size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Neural Database Hub</h1>
          </div>
          <p className="text-slate-500 text-xs font-mono tracking-widest uppercase">Centralized Data Management & System Registry</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Syncing..." : "Refresh Status"}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <Zap size={14} />
            Optimize Core
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Capacity", value: "32.0 GB", sub: "85% Used", icon: HardDrive, color: "text-cyan-500" },
          { label: "Active Queries", value: "1,248", sub: "+12% / hr", icon: Activity, color: "text-amber-500" },
          { label: "Neural Nodes", value: "128", sub: "All Online", icon: Cpu, color: "text-emerald-500" },
          { label: "System Health", value: "99.9%", sub: "Stable", icon: Shield, color: "text-indigo-500" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</span>
              <stat.icon size={16} className={stat.color} />
            </div>
            <div className="text-2xl font-black tracking-tighter mb-1">{stat.value}</div>
            <div className="text-[10px] font-mono text-slate-500">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Database List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Server size={14} />
              Active Database Clusters
            </h2>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-slate-900 rounded-lg text-slate-500 hover:text-white transition-colors">
                <Search size={14} />
              </button>
              <button className="p-2 bg-slate-900 rounded-lg text-slate-500 hover:text-white transition-colors">
                <Filter size={14} />
              </button>
            </div>
          </div>

          {DB_METRICS.map((db, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-slate-900/40 border border-white/5 rounded-2xl p-5 hover:border-cyan-500/30 transition-all cursor-pointer"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-500 transition-colors">
                    <Database size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold tracking-tight">{db.name}</span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase rounded-full">Online</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{db.type} Architecture • {db.latency} Latency</div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Health</div>
                    <div className="text-sm font-mono font-bold text-emerald-400">{db.health}%</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Load</div>
                    <div className="text-sm font-mono font-bold text-cyan-400">{db.load}%</div>
                  </div>
                  <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: `${db.load}%` }} />
                  </div>
                  <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                    <ArrowRight size={16} className="text-slate-500 group-hover:text-cyan-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Analytics Sidebar */}
        <div className="space-y-6">
          {/* Load Chart */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Activity size={12} />
              Neural Load Analysis
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={LOAD_DATA}>
                  <defs>
                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="load" stroke="#22d3ee" fillOpacity={1} fill="url(#colorLoad)" strokeWidth={2} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                    itemStyle={{ color: '#22d3ee' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Activity size={12} />
              Data Distribution
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={DISTRIBUTION_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {DISTRIBUTION_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {DISTRIBUTION_DATA.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Logs */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Clock size={12} />
              Recent Operations
            </h3>
            <div className="space-y-3">
              {[
                { msg: "Neural indexing complete", time: "2m ago", status: "success" },
                { msg: "Cold store sync initiated", time: "15m ago", status: "pending" },
                { msg: "Vector cache optimized", time: "1h ago", status: "success" },
                { msg: "Unauthorized access blocked", time: "3h ago", status: "alert" },
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-1 w-1.5 h-1.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : log.status === 'alert' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-300">{log.msg}</div>
                    <div className="text-[8px] font-mono text-slate-600 uppercase">{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseHub;
