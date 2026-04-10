// Shape keys for Agent Lee morphing
const SHAPE_KEYS = [
  'Eagle',
  'Cat',
  'Rabbit',
  'Twins',
  'Block Eagle',
  'Jetpack Cat',
  'Pagoda',
  'Cyberpunk City',
  'Sakura Island',
];
/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.PAGE.SETTINGS
TAG: UI.PAGE.SETTINGS.CONFIGURATION

COLOR_ONION_HEX:
NEON=#64748B
FLUO=#94A3B8
PASTEL=#CBD5E1

ICON_ASCII:
family=lucide
glyph=settings

5WH:
WHAT = Settings page — system configuration for Agent Lee Agentic Operating System
WHY = Provides user-facing controls for persona, security, network, and advanced OS parameters
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = pages/Settings.tsx
WHEN = 2026
HOW = React component rendering a grid of setting category cards and live interaction controls

AGENTS:
ASSESS
AUDIT

LICENSE:
MIT
*/

/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.PAGE.SETTINGS
TAG: UI.PAGE.SETTINGS.CONFIGURATION

COLOR_ONION_HEX:
NEON=#64748B
FLUO=#94A3B8
PASTEL=#CBD5E1

ICON_ASCII:
family=lucide
glyph=settings

5WH:
WHAT = Settings page — system configuration for Agent Lee Agentic Operating System
WHY = Provides user-facing controls for persona, security, network, and advanced OS parameters
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = pages/Settings.tsx
WHEN = 2026
HOW = React component rendering a grid of setting category cards and live interaction controls

AGENTS:
ASSESS
AUDIT

LICENSE:
MIT
*/

import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Globe, Palette, Sliders, Mic, Bot, Lock, Cpu, Eye, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SystemAwarenessPanel } from '../components/SystemAwarenessPanel';
import { cn } from '../lib/utils';
import { eventBus } from '../core/EventBus';
import { pushDiagnosticsReport } from '../core/diagnostics_bridge';


export const Settings: React.FC = () => {
    // Shape selection state
    const [enabledShapes, setEnabledShapes] = useState<string[]>(() => {
      const stored = localStorage.getItem('enabledShapes');
      if (stored) {
        try {
          const arr = JSON.parse(stored);
          if (Array.isArray(arr) && arr.every(s => typeof s === 'string')) return arr;
        } catch {}
      }
      return [...SHAPE_KEYS];
    });

    useEffect(() => {
      localStorage.setItem('enabledShapes', JSON.stringify(enabledShapes));
      window.dispatchEvent(new Event('enabledShapesChanged'));
    }, [enabledShapes]);
  // State for settings
  const [offlineMode, setOfflineMode] = useState(false);
  const [voxelOpt, setVoxelOpt] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'neon'>('dark');
  const [voice, setVoice] = useState<'Christopher' | 'Samantha' | 'David'>('Christopher');
  const [model, setModel] = useState<'llama3.2-vision' | 'qwen2.5vl:3b' | 'qwen2.5-coder:1.5b'>('llama3.2-vision');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const reportSettings = (
    status: 'ok' | 'warn' | 'error',
    message: string,
    tags: string[]
  ) => {
    pushDiagnosticsReport({
      surface: 'settings',
      status,
      message,
      agents: ['Shield', 'Sage'],
      mcps: ['memory-agent-mcp', 'planner-agent-mcp'],
      tags
    });
  };

  // Load settings on mount
  useEffect(() => {
    setOfflineMode(localStorage.getItem('al_offline') === 'true');
    setVoxelOpt(localStorage.getItem('al_voxel_opt') === 'true');
    setTheme((localStorage.getItem('al_theme') as any) || 'dark');
    setVoice((localStorage.getItem('al_voice') as any) || 'Christopher');
    const modelLane = localStorage.getItem('al_model');
    if (modelLane === 'qwen2.5vl:3b' || modelLane === 'qwen2.5-coder:1.5b') {
      setModel(modelLane);
    } else {
      setModel('llama3.2-vision');
    }
    setApiKey(localStorage.getItem('al_api_key') || '');

    reportSettings(
      'ok',
      'Settings surface synchronized with diagnostics bridge.',
      ['department:settings', 'subsurface:bootstrap', 'contract:strict']
    );
  }, []);

  // Save settings helpers
  const toggleOffline = () => {
    const next = !offlineMode;
    setOfflineMode(next);
    localStorage.setItem('al_offline', String(next));
    eventBus.emit('vm:output', { chunk: `Settings updated: offline_mode=${next}` });
    reportSettings(
      'ok',
      `Offline mode updated to ${next ? 'enabled' : 'disabled'}.`,
      ['department:settings', 'subsurface:runtime', 'setting:offline_mode', 'contract:strict']
    );
  };

  const toggleVoxelOpt = () => {
    const next = !voxelOpt;
    setVoxelOpt(next);
    localStorage.setItem('al_voxel_opt', String(next));
    eventBus.emit('vm:output', { chunk: `Settings updated: voxel_optimization=${next}` });
    reportSettings(
      'ok',
      `Voxel optimization updated to ${next ? 'enabled' : 'disabled'}.`,
      ['department:settings', 'subsurface:runtime', 'setting:voxel_optimization', 'contract:strict']
    );
  };

  const updateTheme = (t: typeof theme) => {
    setTheme(t);
    localStorage.setItem('al_theme', t);
    reportSettings(
      'ok',
      `Theme profile switched to ${t}.`,
      ['department:settings', 'subsurface:appearance', 'setting:theme', 'contract:strict']
    );
  };

  const updateVoice = (v: typeof voice) => {
    setVoice(v);
    localStorage.setItem('al_voice', v);
    reportSettings(
      'ok',
      `Voice profile switched to ${v}.`,
      ['department:settings', 'subsurface:voice', 'setting:voice', 'contract:strict']
    );
  };

  const updateModel = (m: typeof model) => {
    setModel(m);
    localStorage.setItem('al_model', m);
    reportSettings(
      'ok',
      `Model switched to ${m}.`,
      ['department:settings', 'subsurface:model', 'setting:model', 'contract:strict']
    );
  };

  const updateKey = (k: string) => {
    setApiKey(k);
    localStorage.setItem('al_api_key', k);
    reportSettings(
      k ? 'warn' : 'ok',
      k ? 'API key override is configured.' : 'API key override cleared.',
      ['department:settings', 'subsurface:security', 'setting:api_key_override', 'contract:strict']
    );
  };

  return (
    <div className="p-4 md:p-12 max-w-6xl mx-auto space-y-8 md:space-y-12 pb-40 text-slate-100">
            {/* Agent Lee Shape Selection */}
            <div className="mt-8 p-4 bg-black rounded-2xl border border-cyan-700/30 shadow-lg">
              <div className="text-cyan-400 font-bold text-xs uppercase mb-2 tracking-widest">Agent Lee Shapes</div>
              <div className="grid grid-cols-2 gap-2">
                {SHAPE_KEYS.map(shape => (
                  <label key={shape} className="flex items-center gap-2 text-cyan-200 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={enabledShapes.includes(shape)}
                      onChange={e => {
                        if (e.target.checked) {
                          setEnabledShapes(prev => [...prev, shape]);
                        } else {
                          setEnabledShapes(prev => prev.filter(s => s !== shape));
                        }
                      }}
                      className="accent-cyan-400 w-4 h-4"
                    />
                    {shape}
                  </label>
                ))}
              </div>
              <div className="text-xs text-cyan-500 mt-2">Checked shapes will appear in Agent Lee's morph cycle.</div>
            </div>
      
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-cyan-400">
          Neural Config
        </h2>
        <p className="text-slate-400 text-sm font-medium">Configure Agent Lee's core operating parameters, voice personas, and AI models.</p>
      </div>

      <SystemAwarenessPanel surfaceId="settings" variant="compact" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: AI & Voice */}
        <div className="space-y-8">
          
          {/* Model Selection */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-slate-900 border border-white/10 rounded-3xl space-y-6"
          >
            <div className="flex items-center gap-3 text-cyan-400">
              <Bot size={24} />
              <h3 className="text-xl font-bold uppercase tracking-widest">Cognitive Engine</h3>
            </div>
            <div className="space-y-3">
              {(['llama3.2-vision', 'qwen2.5vl:3b', 'qwen2.5-coder:1.5b'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => updateModel(m)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                    model === m 
                      ? "bg-cyan-500/10 border-cyan-400 text-cyan-400" 
                      : "bg-slate-800 border-transparent text-slate-300 hover:bg-slate-700"
                  )}
                >
                  <span className="font-mono text-sm">{m}</span>
                  {model === m && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Voice Persona */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-6 bg-slate-900 border border-white/10 rounded-3xl space-y-6"
          >
            <div className="flex items-center gap-3 text-pink-400">
              <Mic size={24} />
              <h3 className="text-xl font-bold uppercase tracking-widest">Voice Persona</h3>
            </div>
            
            <div className="space-y-3">
              {(['Christopher', 'Samantha', 'David'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => updateVoice(v)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                    voice === v 
                      ? "bg-pink-500/10 border-pink-400 text-pink-400" 
                      : "bg-slate-800 border-transparent text-slate-300 hover:bg-slate-700"
                  )}
                >
                  <span className="font-bold">{v} Voice</span>
                  <Volume2 size={16} className="opacity-50" />
                </button>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Right Column: Key, Theme, Toggles */}
        <div className="space-y-8">
          
          {/* Security / API Key */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-6 bg-slate-900 border border-white/10 rounded-3xl space-y-6"
          >
            <div className="flex items-center gap-3 text-emerald-400">
              <Lock size={24} />
              <h3 className="text-xl font-bold uppercase tracking-widest">System Security</h3>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Master API Key Override</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => updateKey(e.target.value)}
                  placeholder="Leave blank to use .env / OAuth"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-400 outline-none pr-12 font-mono"
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <Eye size={16} />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Used as fallback if OAuth is unavailable.</p>
            </div>
          </motion.div>

          {/* Theme & Toggles */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="p-6 bg-black text-white rounded-3xl space-y-8 border border-white/10"
          >
             <div className="flex items-center justify-between group cursor-pointer" onClick={toggleOffline}>
                <div className="space-y-1">
                   <h3 className="text-lg font-bold flex items-center gap-2">
                     <Globe size={18} className="text-blue-400" /> Offline Mode
                   </h3>
                   <p className="text-xs text-slate-500">Enable local-first processing for Raspberry Pi.</p>
                </div>
                <div className={cn("w-14 h-7 rounded-full relative p-1 transition-colors", offlineMode ? "bg-blue-500" : "bg-slate-700")}>
                   <div className={cn("w-5 h-5 bg-white rounded-full absolute transition-all", offlineMode ? "left-8" : "left-1")} />
                </div>
             </div>
             
             <div className="h-px bg-white/10" />
             
             <div className="flex items-center justify-between group cursor-pointer" onClick={toggleVoxelOpt}>
                <div className="space-y-1">
                   <h3 className="text-lg font-bold flex items-center gap-2">
                     <Cpu size={18} className="text-amber-400" /> Voxel Optimization
                   </h3>
                   <p className="text-xs text-slate-500">Reduce polygon count for low-power hardware.</p>
                </div>
                <div className={cn("w-14 h-7 rounded-full relative p-1 transition-colors", voxelOpt ? "bg-amber-500" : "bg-slate-700")}>
                   <div className={cn("w-5 h-5 bg-white rounded-full absolute transition-all", voxelOpt ? "left-8" : "left-1")} />
                </div>
             </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
