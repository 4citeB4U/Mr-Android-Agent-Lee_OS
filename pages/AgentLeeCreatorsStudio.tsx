import React, { useState, useEffect, useContext, createContext, useMemo } from 'react';
import { 
  Palette, Activity, Rocket, Code, Database, Network, Settings, Home,
  ImageIcon, PenTool, Radio, Video, Megaphone, Layers, User,
  ChevronLeft, ChevronRight, Sparkles, Wand2, MousePointer2, TrendingUp,
  Cpu, Zap, ShieldCheck, FileText, Search, Plus, Volume2, 
  MoreHorizontal, Download, Copy, Share2, Play, GitBranch, 
  Bot, Eye, BarChart3, Clock, Calendar, Globe, Menu, X, Clipboard, Link as LinkIcon, Hash,
  ChevronDown, Monitor, Box, Layout as LayoutIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudioExecutionController, CREATIVE_PROFILE } from '../core/execution/StudioExecutionController';

// --- Types ---
export type GlobalPageId = 'home' | 'studio' | 'diagnostic' | 'deployment' | 'code' | 'memory' | 'database' | 'settings';
export type SubPageId = 'artist' | 'writer' | 'music' | 'video' | 'marketing' | 'thumbnail' | 'cta' | 'growth' | 'projects' | 'account';

export interface Task {
  id: string;
  title: string;
  type: 'STORY' | 'EMAIL' | 'THUMBNAIL' | 'DOC' | 'GENERAL' | 'SEO';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED';
  input: string;
  output?: string;
  agentId: string;
  timestamp: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId?: string;
  timestamp: number;
}

export interface NotepadEntry {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  icon: any;
  color: string;
}

// --- Constants ---
const AGENTS: Agent[] = [
  { id: 'LEE', name: 'Agent Lee', role: 'Master Orchestrator', icon: Zap, color: 'accent-blue' },
  { id: 'SCRIBBLE', name: 'Scribble', role: 'Creative Writer', icon: PenTool, color: 'accent-purple' },
  { id: 'ARTIE', name: 'Artie', role: 'Visual Designer', icon: Palette, color: 'accent-pink' },
  { id: 'MAILER', name: 'Mailer', role: 'Growth Marketer', icon: Megaphone, color: 'accent-green' },
];

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

// --- Context ---
interface StudioContextType {
  agents: Agent[];
  activeAgent: Agent;
  setActiveAgent: (a: Agent) => void;
  tasks: Task[];
  addTask: (t: Omit<Task, 'id' | 'timestamp'>) => string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  messages: Message[];
  addMessage: (m: Omit<Message, 'id' | 'timestamp'>) => void;
  isProcessing: boolean;
  setIsProcessing: (b: boolean) => void;
  activeGlobalPage: GlobalPageId;
  setActiveGlobalPage: (p: GlobalPageId) => void;
  activeSubPage: SubPageId;
  setActiveSubPage: (p: SubPageId) => void;
  notepad: NotepadEntry[];
  updateNotepad: (id: string, content: string) => void;
  addNotepadEntry: (title: string, content: string) => void;
  isToolPanelCollapsed: boolean;
  setIsToolPanelCollapsed: (b: boolean) => void;
  isLeftPanelCollapsed: boolean;
  setIsLeftPanelCollapsed: (b: boolean) => void;
  isNotepadOpen: boolean;
  setIsNotepadOpen: (b: boolean) => void;
  isAutonomous: boolean;
  setIsAutonomous: (b: boolean) => void;
  isAutoOptimized: boolean;
  setIsAutoOptimized: (b: boolean) => void;
  isHandsFree: boolean;
  setIsHandsFree: (b: boolean) => void;
  executePlan: () => Promise<void>;
  projects: any[];
  setProjects: (p: any[]) => void;
  studioContent: Record<string, string>;
  setStudioContent: (page: SubPageId, content: string) => void;
}

const StudioContext = createContext<StudioContextType | null>(null);

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) throw new Error('useStudio must be used within a StudioProvider');
  return context;
};

// --- Mock AI / Actions Shim ---
const performAIAction = async (prompt: string, config?: any) => {
  console.log('[AI Action]', prompt);
  await new Promise(r => setTimeout(r, 2000));
  return `Agent Lee has synthesized the creative output for: "${prompt.substring(0, 30)}..."\n\nGenerated patterns are stable and ready for deployment.`;
};

const generateImage = async (prompt: string) => {
  console.log('[Image Gen]', prompt);
  await new Promise(r => setTimeout(r, 3000));
  return 'https://picsum.photos/800/600';
};

const GlassCard = ({ children, className, neonColor }: { children: React.ReactNode, className?: string, neonColor?: string }) => (
  <div className={cn(
    "relative bg-white/[0.03] border border-white/[0.08] rounded-3xl backdrop-blur-xl overflow-hidden shadow-2xl transition-all hover:border-white/[0.15]",
    neonColor === 'blue' ? "hover:shadow-[0_0_30px_rgba(0,188,212,0.15)]" : 
    neonColor === 'purple' ? "hover:shadow-[0_0_30px_rgba(156,39,176,0.15)]" : 
    neonColor === 'pink' ? "hover:shadow-[0_0_30px_rgba(233,30,99,0.15)]" : 
    neonColor === 'green' ? "hover:shadow-[0_0_30px_rgba(76,175,80,0.15)]" : "",
    className
  )}>
    {children}
  </div>
);


const TaskBoard = () => {
  const { tasks } = useStudio();

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Active Task Queue</h3>
        <span className="text-[8px] font-mono text-accent-blue">{tasks.length} JOBS</span>
      </div>
      {tasks.length === 0 ? (
        <div className="text-center py-10 opacity-20">
          <Clipboard size={32} className="mx-auto mb-2" />
          <span className="text-[10px] font-black uppercase tracking-widest">Queue Empty</span>
        </div>
      ) : (
        tasks.map((task) => (
          <div key={task.id} className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center justify-between group hover:bg-white/[0.05] transition-all">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border",
                task.status === 'PROCESSING' ? "animate-pulse border-accent-blue/40 bg-accent-blue/10" : "border-white/[0.1] bg-white/[0.06]"
              )}>
                {task.type === 'STORY' && <BookOpen size={16} />}
                {task.type === 'EMAIL' && <Mail size={16} />}
                {task.type === 'THUMBNAIL' && <ImageIcon size={16} />}
                {task.type === 'DOC' && <FileText size={16} />}
                {task.type === 'GENERAL' && <Zap size={16} />}
              </div>
              <div>
                <div className="text-[11px] font-bold text-white/80 uppercase tracking-tight">{task.title}</div>
                <div className="text-[8px] font-mono text-white/20 uppercase">{task.agentId} NODE // {task.status}</div>
              </div>
            </div>
            <div className={cn(
              "text-[9px] font-black uppercase tracking-widest",
              task.status === 'COMPLETED' ? "text-accent-green" : 
              task.status === 'PROCESSING' ? "text-accent-blue" : "text-white/20"
            )}>
              {task.status}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const ToolPanel = ({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean, setIsCollapsed: (b: boolean) => void }) => {
  const { activeSubPage, setActiveSubPage } = useStudio();

  const navItems = [
    { id: 'artist', label: 'Artist', icon: ImageIcon },
    { id: 'writer', label: 'Writer', icon: PenTool },
    { id: 'music', label: 'Music', icon: Radio },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'marketing', label: 'Marketing', icon: Megaphone },
    { id: 'thumbnail', label: 'Thumbnail', icon: Wand2 },
    { id: 'cta', label: 'CTA Engine', icon: MousePointer2 },
    { id: 'growth', label: 'Growth', icon: TrendingUp },
    { id: 'projects', label: 'Projects', icon: Layers },
    { id: 'account', label: 'Account', icon: User },
  ];

  const toolsByPage: Record<SubPageId, { name: string, icon: any, action: () => void, subItems?: string[] }[]> = {
    artist: [
      { name: 'Prompt Lab', icon: Sparkles, action: () => console.log('Prompt Lab Active'), subItems: ['Style Selection', 'Lighting Setup', 'Camera Angles', 'Artist Reference'] },
      { name: 'Image Forge', icon: Rocket, action: () => console.log('Image Forge Ready'), subItems: ['Neural Upscale', 'Variation Gen', 'Inpainting', 'Outpainting'] },
      { name: 'Canvas Tools', icon: LayoutIcon, action: () => console.log('Canvas Tools Loaded'), subItems: ['Layer Stack', 'Masking Engine', 'Neural Filters'] },
    ],
    writer: [
      { name: 'Story Architecture', icon: BookOpen, action: () => console.log('Architecture Analysis'), subItems: ['Plot Points', 'Act Structure', 'Theme Mapping'] },
      { name: 'Character Forge', icon: User, action: () => console.log('Character Forge Active'), subItems: ['Trait Generator', 'Backstory Weaver', 'Relationship Map'] },
      { name: 'World Weaver', icon: Globe, action: () => console.log('World Weaver Online'), subItems: ['Lore Database', 'Geography Map', 'Timeline'] },
    ],
    music: [
      { name: 'Composition', icon: Music, action: () => console.log('Composition Mode'), subItems: ['Melody Gen', 'Harmony Engine', 'Rhythm Pattern'] },
      { name: 'Sound Design', icon: Radio, action: () => console.log('Sound Design Active'), subItems: ['Patch Editor', 'Modulation Matrix', 'Neural Synth'] },
      { name: 'Mixing Desk', icon: Activity, action: () => console.log('Mixing Desk Active'), subItems: ['Neural EQ', 'Dynamics Processor', 'Spatial Audio'] },
    ],
    video: [
      { name: 'Sequence Editor', icon: Clock, action: () => console.log('Sequence Editor Ready'), subItems: ['Smart Cuts', 'Speed Ramping', 'Color Grading'] },
      { name: 'Visual FX', icon: Sparkles, action: () => console.log('VFX Engine Active'), subItems: ['Particle Gen', 'Motion Tracking', 'Neural Keying'] },
      { name: 'Audio Post', icon: Mic, action: () => console.log('Audio Post Active'), subItems: ['Foley Library', 'Voiceover Gen', 'Score Sync'] },
    ],
    marketing: [
      { name: 'Campaign Strategy', icon: TrendingUp, action: () => console.log('Strategy Mode'), subItems: ['Goal Setting', 'Target Audience', 'Budgeting'] },
      { name: 'Content Plan', icon: Calendar, action: () => console.log('Content Plan Ready'), subItems: ['Editorial Calendar', 'Copywriting', 'Visual Assets'] },
      { name: 'Distribution', icon: Globe, action: () => console.log('Distribution Active'), subItems: ['Social Scheduler', 'Email Automation', 'Ad Manager'] },
    ],
    thumbnail: [
      { name: 'Prompt Lab', icon: Wand2, action: () => console.log('Prompt Lab'), subItems: ['Split Before/After', 'Face + Result', 'Tutorial Style', 'Growth Chart'] },
      { name: 'Brand Identity', icon: Palette, action: () => console.log('Brand'), subItems: ['Color Palette', 'Font Pack', 'Logo Overlay', 'Template Library'] },
      { name: 'Batch Generator', icon: Layers, action: () => console.log('Batch'), subItems: ['YouTube 16:9', 'TikTok 9:16', 'Shorts Square', 'Export PNG/WebP'] },
    ],
    cta: [
      { name: 'Overlay Builder', icon: Film, action: () => console.log('Overlays'), subItems: ['Lower Third', 'Corner Button', 'Mid-Screen', 'End Screen'] },
      { name: 'Caption Engine', icon: Hash, action: () => console.log('Caption'), subItems: ['YT Title + Tags', 'TikTok Caption', 'Hashtag Pack', 'Pin Comment'] },
      { name: 'FFmpeg Injector', icon: Rocket, action: () => console.log('FFmpeg'), subItems: ['Watermark', 'Arrow Overlay', 'Subscribe Hint', 'Batch Render'] },
    ],
    growth: [
      { name: 'Analytics Hub', icon: BarChart3, action: () => console.log('Analytics'), subItems: ['CTR Tracker', 'Watch Time', 'Retention %', 'Session Time'] },
      { name: 'Publish Pipeline', icon: Rss, action: () => console.log('Publish'), subItems: ['YT Data API', 'TikTok Upload', 'Schedule Queue', 'A/B Variants'] },
      { name: 'Monetize Stack', icon: DollarSign, action: () => console.log('Monetize'), subItems: ['Patreon Link', 'Ko-fi', 'Discord', 'Beacons Bio'] },
    ],
    projects: [
      { name: 'Project Health', icon: Activity, action: () => console.log('Health Check'), subItems: ['Timeline Status', 'Resource Usage', 'Risk Analysis'] },
      { name: 'Asset Export', icon: Download, action: () => console.log('Exporting...'), subItems: ['Final Render', 'Source Files', 'Documentation'] },
    ],
    account: [
      { name: 'Subscription', icon: Database, action: () => console.log('Billing'), subItems: ['Current Plan', 'Invoices', 'Usage Limits'] },
    ]
  };

  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const currentTools = toolsByPage[activeSubPage] || [];

  return (
    <div className={cn("flex flex-col h-full transition-all duration-500 overflow-hidden", isCollapsed ? "w-0" : "w-80")}>
      {/* Header / Collapse Toggle */}
      <div className="p-6 flex items-center justify-between border-b border-white/[0.06]">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <LayoutIcon size={14} className="text-accent-blue" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Studio Controls</h3>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="p-2 hover:bg-white/[0.06] rounded-xl transition-colors mx-auto"
        >
          {isCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
        {/* Navigation Section */}
        <div className="space-y-3">
          {!isCollapsed && <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-2 px-2">Navigation</div>}
          <div className="grid grid-cols-1 gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSubPage(item.id as SubPageId)}
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-2xl transition-all group",
                  activeSubPage === item.id 
                    ? "bg-accent-blue/10 text-accent-blue" 
                    : "text-white/30 hover:bg-white/[0.06] hover:text-white/60"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                  activeSubPage === item.id ? "bg-accent-blue text-white" : "bg-white/[0.06]"
                )}>
                  <item.icon size={14} />
                </div>
                {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Section */}
        <div className="space-y-3">
          {!isCollapsed && <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-2 px-2">Studio Tools</div>}
          <div className="grid grid-cols-1 gap-2">
            {currentTools.map((tool) => (
              <div key={tool.name} className="space-y-1">
                <button
                  onClick={() => {
                    tool.action();
                    setExpandedTool(expandedTool === tool.name ? null : tool.name);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-2xl transition-all group",
                    expandedTool === tool.name ? "bg-white/[0.06] text-white" : "text-white/30 hover:bg-white/[0.03] hover:text-white/60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                      expandedTool === tool.name ? "bg-accent-blue text-white" : "bg-white/[0.06]"
                    )}>
                      <tool.icon size={14} />
                    </div>
                    {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">{tool.name}</span>}
                  </div>
                  {!isCollapsed && tool.subItems && (
                    <ChevronDown size={14} className={cn("transition-transform duration-300", expandedTool === tool.name ? "rotate-180" : "")} />
                  )}
                </button>

                <AnimatePresence>
                  {expandedTool === tool.name && !isCollapsed && tool.subItems && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-12 space-y-1"
                    >
                      {tool.subItems.map(subItem => (
                        <button
                          key={subItem}
                          onClick={() => console.log(`Tool Action: ${subItem}`)}
                          className="w-full text-left py-2 px-3 text-[10px] font-bold text-white/40 hover:text-accent-blue transition-colors uppercase tracking-widest"
                        >
                          {subItem}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Task Queue Section */}
        {!isCollapsed && (
          <div className="pt-4 border-t border-white/[0.06]">
            <TaskBoard />
          </div>
        )}
      </div>
    </div>
  );
};

const AgentBadge = ({ agent }: { agent: Agent }) => (
  <div className={cn(
    "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest",
    `bg-accent-${agent.color.split('-')[1]}/10 border-accent-${agent.color.split('-')[1]}/30 text-accent-${agent.color.split('-')[1]}`
  )}>
    <agent.icon size={12} />
    {agent.name}
  </div>
);

const AgentNotepad = () => {
  const { notepad, isProcessing } = useStudio();
  const entry = notepad[0];

  return (
    <GlassCard neonColor="blue" className="p-8 backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="px-2 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="text-[7px] font-bold text-blue-300">SQLite WASM</div>
            <div className="text-[6px] text-blue-400">1M-word rhyme corpus</div>
          </div>
        </div>
      </div>

      {/* ── Bottom Action Bar ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-white/[0.06] bg-[#16162a]">
        {['Annotations', 'RPT', 'UpNext'].map(a => (
          <button key={a} className={cn('px-3 py-1 rounded-md text-[9px] font-bold border transition-all',
            a === 'UpNext' ? 'bg-blue-500 text-white border-blue-500' : 'border-white/[0.1] text-slate-400 hover:bg-white/[0.06]')}>{a}</button>
        ))}
        <div className="ml-auto flex gap-2 text-slate-500">
          <AlignLeft size={12} /><Save size={12} /><Share2 size={12} />
        </div>
      </div>
    </GlassCard>
  );
};

// Missing AlignLeft import shim
const AlignLeft = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" />
  </svg>
);

const MusicStudio = ({ content }: { content?: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(-12);

  const CLIPS = [
    ['#22d3ee','#06b6d4','#0891b2','#0e7490','#155e75'],
    ['#4ade80','#22c55e','#16a34a','#15803d','#166534'],
    ['#818cf8','#6366f1','#4f46e5','#4338ca','#3730a3'],
    ['#fb923c','#f97316','#ea580c','#dc2626',''],
  ];
  const agentTools = [
    { name: 'RhymeAgent', tool: 'RHDITool', Icon: Radio, color: '#5B8FF9' },
    { name: 'GenTool', tool: 'Morris AURIS', Icon: Music, color: '#C06EF5' },
  ];

  const togglePlayback = () => {
    // Tone.js loaded dynamically — toggle transport state
    setIsPlaying(prev => !prev);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d14] rounded-2xl overflow-hidden text-white border border-white/8 shadow-2xl">
      {/* ── Header Controls ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/6 bg-[#13131e]">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/60" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
          <div className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
        <button onClick={togglePlayback} className="ml-2 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[9px] font-bold transition-colors">
          {isPlaying ? '⏸' : '▶'} {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>
        <div className="flex gap-2 ml-1">
          <button className="p-1 bg-white/5 hover:bg-white/10 rounded text-[8px]">⏹</button>
          <button className="p-1 bg-white/5 hover:bg-white/10 rounded text-[8px]">⏺</button>
        </div>
        <div className="ml-auto text-[8px] font-mono text-white/40">{volume}dB  //  128 BPM  //  C Minor</div>
        <div className="flex gap-2 text-white/30">
          <Volume2 size={12} /><Plus size={12} /><Settings size={12} />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Clip Launcher Grid (main area) ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
          {CLIPS.map((row, ri) => (
            <div key={ri} className="flex gap-1 h-10">
              {/* Track label */}
              <div className="w-14 shrink-0 flex items-center px-2 bg-white/5 rounded-lg border border-white/6">
                <span className="text-[8px] text-white/50 font-bold truncate">
                  {['Lead', 'Bass', 'Pad', 'Perc'][ri]}
                </span>
              </div>
              {/* Clips */}
              {row.filter(Boolean).map((color, ci) => (
                <div key={ci} className="h-full rounded-md cursor-pointer hover:brightness-110 transition-all relative overflow-hidden"
                  style={{ flex: [1.8, 1.4, 1.6, 1.1, 0.9][ci] ?? 1, background: color + 'cc' }}>
                  {ci === 0 && isPlaying && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          ))}
          {/* Mixer strip row */}
          <div className="flex gap-1 h-28 mt-2 pt-2 border-t border-white/6">
            {['Kick','Snare','Hat','Bass','Lead','Pad'].map((t, i) => (
              <div key={t} className="flex-1 bg-white/5 rounded-lg flex flex-col items-center py-2 gap-1">
                <div className="flex-1 w-2 bg-white/8 rounded-full relative overflow-hidden">
                  <motion.div className="absolute bottom-0 inset-x-0 rounded-full"
                    style={{ background: ['#22d3ee','#4ade80','#818cf8','#fb923c','#a78bfa','#34d399'][i] }}
                    animate={{ height: isPlaying ? `${40 + (i * 13 % 40)}%` : '20%' }}
                    transition={{ duration: 0.4, repeat: Infinity, repeatType: 'reverse' }} />
                </div>
                <span className="text-[7px] text-white/30">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Agent Tools ── */}
        <div className="w-44 border-l border-white/6 p-3 flex flex-col gap-3 bg-[#11111c]/60 shrink-0">
          <AgentToolsPanel tools={agentTools} />
          <div className="mt-2 space-y-2 text-[7px] text-white/30">
            <div className="px-2 py-1.5 bg-white/4 rounded-lg border border-white/6">
              <div className="font-bold text-white/50 mb-0.5">JUCE WASM</div>
              <div>VST3 plugins • 256 tracks</div>
            </div>
            <div className="px-2 py-1.5 bg-white/4 rounded-lg border border-white/6">
              <div className="font-bold text-white/50 mb-0.5">Magenta.js</div>
              <div>MIDI generation • WASM synth</div>
            </div>
            <div className="px-2 py-1.5 bg-white/4 rounded-lg border border-white/6">
              <div className="font-bold text-white/50 mb-0.5">Tone.js</div>
              <div>60fps Web Audio playback</div>
            </div>
          </div>
          <div className="mt-auto">
            <button className="w-full py-2 bg-emerald-700/60 hover:bg-emerald-700 rounded-lg text-[8px] font-bold text-emerald-200 transition-colors flex items-center justify-center gap-1">
              <Plus size={10} /> Add Track
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom timeline ruler ── */}
      <div className="h-6 border-t border-white/6 bg-[#0a0a12] flex items-center px-3 gap-2">
        {Array.from({ length: 32 }).map((_, i) => (
          <div key={i} className="text-[6px] text-white/20 shrink-0" style={{ width: 20 }}>{i + 1}</div>
        ))}
      </div>
    </div>
  );
};

const VideoStudio = ({ content }: { content?: string }) => {
  const [activeView, setActiveView] = useState<'production' | 'timeline'>('production');
  const agentTools = [
    { name: 'ProhisAgent', tool: 'SenserTool', Icon: Eye, color: '#5B8FF9' },
    { name: 'ImageTool', tool: 'MetricsTool', Icon: BarChart3, color: '#C06EF5' },
  ];
  const TECH = [
    { label: 'Git', icon: GitBranch },
    { label: 'AutoGen', icon: Bot },
    { label: 'Ollama', icon: Cpu },
    { label: 'PostgreSQL', icon: Database },
  ];
  const TIMELINE_COLORS = ['#22d3ee','#4ade80','#f59e0b','#a78bfa','#f87171','#34d399'];

  return (
    <div className="flex flex-col h-full bg-[#0d0d18] rounded-2xl overflow-hidden text-white border border-white/8 shadow-2xl">
      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-1 px-4 py-2 bg-[#13131e] border-b border-white/6">
        {(['production','timeline'] as const).map(v => (
          <button key={v} onClick={() => setActiveView(v)}
            className={cn('px-3 py-1 rounded text-[9px] font-bold capitalize transition-all',
              activeView === v ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white/70')}>
            {v}
          </button>
        ))}
        <div className="ml-auto flex gap-3 text-white/30 text-[8px]">
          {activeView === 'production' && TECH.map(t => (
            <div key={t.label} className="flex items-center gap-1">
              <t.icon size={9} />
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'production' ? (
          <motion.div key="production" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left: Profile + video preview */}
            <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto no-scrollbar">
              {/* Artist profile card */}
              <div className="flex items-center gap-3 p-3 bg-[#1a1a2e] rounded-xl border border-white/6">
                <div className="w-12 h-12 rounded-lg bg-[#252545] flex items-center justify-center shrink-0">
                  <User size={20} className="text-white/20" />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-bold text-white/85">Solar Harmonics</div>
                  <div className="text-[8px] text-white/35">Posted April 22, 2026</div>
                  <div className="text-[8px] text-white/35">April 22, 2026</div>
                </div>
              </div>
              {/* Video thumbnail */}
              <div className="flex-1 bg-[#1a1a2e] rounded-xl border border-white/6 relative overflow-hidden min-h-[120px]">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                    <Play size={18} className="text-white ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 text-[7px] text-white/50 font-mono">4K // 24fps</div>
              </div>
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2">
                {[{l:'Ondoxx Site',v:'Pods'},{l:'Tracks',v:'Tml. Cols'},{ l:'Colours',v:'Details'}].map(m => (
                  <div key={m.l} className="bg-[#1a1a2e] rounded-lg p-2 border border-white/5">
                    <div className="text-[7px] text-white/30">{m.l}</div>
                    <div className="text-[8px] font-bold text-white/60">{m.v}</div>
                  </div>
                ))}
              </div>
              {/* Waveform */}
              <div className="h-10 bg-[#1a1a2e] rounded-lg border border-white/5 flex items-center px-3 gap-0.5">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div key={i} className="flex-1 rounded-full bg-pink-400/70"
                    style={{ height: `${20 + Math.sin(i * 0.4) * 14 + Math.abs(Math.sin(i * 0.9)) * 16}%` }} />
                ))}
              </div>
            </div>
            {/* Right: Agent Tools */}
            <div className="w-44 border-l border-white/6 p-3 flex flex-col gap-3 bg-[#11111c]/60 shrink-0">
              <AgentToolsPanel tools={agentTools} />
              <div className="mt-2 space-y-1.5 text-[7px] text-white/30">
                <div className="px-2 py-1.5 bg-white/4 rounded-lg">
                  <div className="font-bold text-white/50 mb-0.5">FFmpeg.wasm</div>
                  <div>WebAssembly video encode</div>
                </div>
                <div className="px-2 py-1.5 bg-white/4 rounded-lg">
                  <div className="font-bold text-white/50 mb-0.5">WebCodecs API</div>
                  <div>Frame decode – native speed</div>
                </div>
              </div>
              <div className="mt-auto flex gap-1">
                {['V. CnR','S. Str'].map(b => (
                  <button key={b} className="flex-1 py-1.5 bg-emerald-700/60 hover:bg-emerald-700 rounded text-[7px] font-bold text-emerald-200 transition-colors">{b}</button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Cinematic video frame */}
            <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-[#1a2a1a] via-[#0d1a2a] to-[#0a0a12]">
              {/* Simulated sunset landscape */}
              <div className="absolute inset-0 flex flex-col">
                <div className="flex-1 bg-gradient-to-b from-[#ff6b35]/20 via-[#1a3a5c]/40 to-[#0a1a2a]/80" />
                <div className="h-1/3 bg-[#0a1525]" />
              </div>
              <div className="absolute inset-x-0 bottom-1/3 h-px bg-[#1a3a5c]/50" />
              {/* Play head overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Play size={24} className="text-white ml-1" />
                </div>
              </div>
              <div className="absolute top-2 right-2 text-[7px] text-white/40 font-mono bg-black/40 px-1.5 py-0.5 rounded">
                STMV •• 00:02:34:12
              </div>
            </div>
            {/* Multi-track timeline */}
            <div className="flex-shrink-0 bg-[#0a0a12] border-t border-white/6 p-2 space-y-1">
              {TIMELINE_COLORS.map((color, ti) => (
                <div key={ti} className="flex gap-1 h-5">
                  <div className="w-10 shrink-0 flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full mr-1" style={{ background: color }} />
                    <span className="text-[6px] text-white/30">t{ti + 1}</span>
                  </div>
                  <div className="flex-1 relative">
                    <div className="absolute rounded-sm"
                      style={{ background: color + '88', left: `${(ti * 7) % 20}%`, width: `${25 + (ti * 11) % 35}%`, top: 1, bottom: 1 }} />
                    {ti < 3 && (
                      <div className="absolute rounded-sm"
                        style={{ background: color + '66', left: `${30 + (ti * 13) % 25}%`, width: `${15 + (ti * 9) % 20}%`, top: 1, bottom: 1 }} />
                    )}
                  </div>
                </div>
              ))}
              {/* Waveform row */}
              <div className="flex gap-1 h-6 mt-1 pt-1 border-t border-white/6">
                <div className="w-10 shrink-0"><span className="text-[6px] text-white/20">WAV</span></div>
                <div className="flex-1 flex items-center gap-px">
                  {Array.from({ length: 80 }).map((_, i) => (
                    <div key={i} className="flex-1 rounded-full bg-pink-500/50"
                      style={{ height: `${30 + Math.abs(Math.sin(i * 0.35)) * 60}%` }} />
                  ))}
                </div>
              </div>
            </div>
            {/* Tech footer */}
            <div className="flex items-center gap-4 px-3 py-1.5 border-t border-white/6 bg-[#080810]">
              {[{ l: 'STMV', i: Monitor }, { l: 'Simile', i: Layers }, { l: 'LMMS IDE', i: Music }, { l: 'JUCE WASM', i: Cpu }].map(t => (
                <div key={t.l} className="flex items-center gap-1 text-[7px] text-white/35">
                  <t.i size={8} />{t.l}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MarketingStudio = ({ content }: { content?: string }) => {
  const KANBAN = [
    { id: 'todo', label: 'To Do', dot: '#f59e0b', cards: ['Social Media Blast', 'Email Newsletter', 'Press Kit Upload'] },
    { id: 'inprogress', label: 'In Progress', dot: '#3b82f6', cards: ['Ad Creative A/B Test', 'Influencer Outreach'] },
    { id: 'done', label: 'Completed', dot: '#22c55e', cards: ['Campaign Kickoff', 'Asset Finalization', 'Approval Round 1'] },
  ];
  const FUNNEL = [
    { label: 'Views', pct: 100, color: '#f97316', width: '100%' },
    { label: 'Clicks', pct: 68, color: '#eab308', width: '68%' },
    { label: 'Streams', pct: 32, color: '#22c55e', width: '32%' },
  ];
  const agentTools = [
    { name: 'PostAgent', tool: 'SocialTool', Icon: Megaphone, color: '#ef4444' },
    { name: 'AnalyticsAgent', tool: 'MetricsTool', Icon: BarChart3, color: '#f59e0b' },
  ];
  const TECH = ['MongoDB', 'Next.js', 'API + cron', 'MongoDB'];

  return (
    <div className="flex flex-col h-full bg-[#0d0d14] rounded-2xl overflow-hidden text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#13131f] border-b border-white/5">
        <div className="flex items-center gap-2 text-[10px] text-white/40">
          <span className="text-white/60 font-semibold">Campaigns</span>
          <ChevronRight size={10} />
          <span>PastForms</span>
        </div>
        <div className="flex gap-2">
          <MoreHorizontal size={12} className="text-white/30" />
          <Plus size={12} className="text-white/30" />
        </div>
      </div>

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Kanban columns */}
        <div className="flex-1 flex gap-3 p-3 overflow-x-auto">
          {KANBAN.map(col => (
            <div key={col.id} className="flex flex-col gap-2 min-w-[130px] flex-1">
              {/* Column header */}
              <div className="flex items-center gap-1.5 px-1">
                <div className="w-2 h-2 rounded-full" style={{ background: col.dot }} />
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-wide">{col.label}</span>
                <span className="ml-auto text-[8px] text-white/30">{col.cards.length}</span>
              </div>
              {/* Cards */}
              {col.cards.map(card => (
                <div key={card} className="bg-[#1a1a2e] rounded-lg p-2.5 border border-white/5 cursor-pointer hover:border-white/15 transition-colors">
                  <div className="text-[8px] font-semibold text-white/70 leading-tight">{card}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-white/10" />
                    <div className="w-3.5 h-3.5 rounded-full bg-white/10 -ml-1" />
                    <span className="ml-auto text-[7px] text-white/20">2d</span>
                  </div>
                </div>
              ))}
              <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-dashed border-white/10 text-white/20 hover:border-white/20 transition-colors">
                <Plus size={8} />
                <span className="text-[7px]">Add task</span>
              </button>
            </div>
          ))}
        </div>

        {/* Right: Agent Tools */}
        <div className="w-36 border-l border-white/5 p-3 flex flex-col gap-3 bg-[#13131f]/60 shrink-0">
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-wide">Agent Tools:</span>
          {agentTools.map(t => (
            <div key={t.name} className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${t.color}22`, border: `1px solid ${t.color}44` }}>
                <t.Icon size={12} style={{ color: t.color }} />
              </div>
              <div>
                <div className="text-[8px] font-bold text-white/80">{t.name}</div>
                <div className="text-[7px] text-white/40">{t.tool}</div>
              </div>
            </div>
          ))}

          {/* Funnel */}
          <div className="mt-2 flex flex-col gap-1">
            <span className="text-[8px] text-white/30 mb-1">Conversion Funnel</span>
            {FUNNEL.map(f => (
              <div key={f.label} className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[7px] text-white/30">
                  <span>{f.label}</span>
                  <span>{f.pct}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: f.width, background: f.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer tech stack */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-white/5 bg-[#13131f]">
        <span className="text-[7px] text-white/20 font-mono uppercase">Backend</span>
        <div className="w-px h-3 bg-white/10" />
        <span className="text-[7px] text-white/20 font-mono uppercase">ML</span>
        <div className="w-px h-3 bg-white/10" />
        {TECH.map((t, i) => (
          <span key={i} className="text-[7px] text-white/20 font-mono px-1.5 py-0.5 rounded bg-white/5">{t}</span>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────
// THUMBNAIL FORGE STUDIO
// AI-driven batch thumbnail generator: YT 16:9 · TK 9:16
// Tech: Canvas API · Sharp.wasm · Stable Diffusion · Batch CLI
// Agents: ThumbnailAgent/DesignBot · BrandAgent/StyleTool
// ─────────────────────────────────────────────────
const ThumbnailStudio = ({ content }: { content?: string }) => {
  const [platform, setPlatform] = useState<'youtube' | 'tiktok'>('youtube');
  const [prompt, setPrompt] = useState('');
  const [brandColor, setBrandColor] = useState('#f59e0b');
  const [titleText, setTitleText] = useState('FIXED IN 5 MINUTES');
  const [isGenerating, setIsGenerating] = useState(false);
  const agentTools = [
    { name: 'ThumbnailAgent', tool: 'DesignBot', Icon: Wand2, color: '#f59e0b' },
    { name: 'BrandAgent', tool: 'StyleTool', Icon: Palette, color: '#8b5cf6' },
  ];
  const TEMPLATES = [
    { label: 'Split Before/After', desc: 'Dark left + bright right + bold text' },
    { label: 'Face + Result', desc: 'Shocked expression + outcome visual' },
    { label: 'Tutorial Style', desc: 'Step number + tool screenshot' },
    { label: 'Growth Chart', desc: 'Up-trending graph + big number' },
  ];
  const TECH = ['Canvas API', 'Sharp.wasm', 'Stable Diffusion', 'Batch CLI'];
  const BRAND_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#22c55e', '#8b5cf6', '#ffffff'];

  return (
    <div className="flex flex-col h-full bg-[#0f0f1e] rounded-2xl overflow-hidden text-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#13131f] border-b border-white/6">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/60" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
          <div className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest ml-2">Thumbnail Forge</span>
        <div className="ml-auto flex gap-1 bg-white/5 rounded-lg p-0.5">
          {(['youtube', 'tiktok'] as const).map(p => (
            <button key={p} onClick={() => setPlatform(p)}
              className={cn('px-3 py-1 rounded text-[8px] font-bold uppercase transition-all',
                platform === p ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60')}>
              {p === 'youtube' ? 'YT 16:9' : 'TK 9:16'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: controls */}
        <div className="w-48 border-r border-white/5 p-3 flex flex-col gap-3 bg-[#13131f]/50 shrink-0 overflow-y-auto">
          <div>
            <span className="text-[8px] text-white/30 uppercase tracking-wide block mb-1.5">Scene Prompt</span>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="Describe thumbnail scene..."
              className="w-full h-16 bg-white/5 border border-white/8 rounded-lg p-2 text-[8px] text-white/70 resize-none focus:outline-none focus:border-white/20 placeholder-white/20" />
          </div>
          <div>
            <span className="text-[8px] text-white/30 uppercase tracking-wide block mb-1.5">Overlay Text (1–3 words)</span>
            <input value={titleText} onChange={e => setTitleText(e.target.value)}
              className="w-full bg-white/5 border border-white/8 rounded-lg px-2 py-1.5 text-[8px] text-white/70 focus:outline-none focus:border-white/20" />
          </div>
          <div>
            <span className="text-[8px] text-white/30 uppercase tracking-wide block mb-1.5">Brand Color</span>
            <div className="flex gap-1.5 flex-wrap">
              {BRAND_COLORS.map(c => (
                <button key={c} onClick={() => setBrandColor(c)}
                  className={cn('w-5 h-5 rounded-full border-2 transition-all', brandColor === c ? 'border-white scale-110' : 'border-transparent')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <span className="text-[8px] text-white/30 uppercase tracking-wide block mb-1.5">Templates</span>
            {TEMPLATES.map(t => (
              <button key={t.label} className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors mb-1 border border-transparent hover:border-white/8">
                <div className="text-[8px] font-semibold text-white/70">{t.label}</div>
                <div className="text-[7px] text-white/30">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Center: live preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
          <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800"
            style={{
              aspectRatio: platform === 'youtube' ? '16/9' : '9/16',
              maxHeight: '220px',
              width: platform === 'youtube' ? '100%' : '123px'
            }}>
            {/* Split design */}
            <div className="absolute inset-0 flex">
              <div className="flex-1 bg-black/50 flex items-center justify-center">
                <span className="text-[9px] text-white/25 font-bold">BEFORE</span>
              </div>
              <div className="flex-1 bg-gradient-to-br from-amber-500/25 to-orange-500/25 flex items-center justify-center">
                <span className="text-[9px] text-white/60 font-bold">AFTER ✓</span>
              </div>
            </div>
            {/* Bold overlay text */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center px-2">
              <div className="px-3 py-1 rounded font-black text-[11px] shadow-lg text-center max-w-full truncate"
                style={{ background: brandColor, color: '#000' }}>
                {titleText}
              </div>
            </div>
            <div className="absolute top-2 right-2 text-[6px] text-white/25 bg-black/50 px-1.5 py-0.5 rounded font-mono">
              {platform === 'youtube' ? '1280×720' : '1080×1920'}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setIsGenerating(v => !v)}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 rounded-xl font-bold text-[9px] text-black uppercase tracking-widest transition-all shadow-lg">
              <Wand2 size={12} />
              {isGenerating ? 'Generating...' : 'AI Generate'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-[9px] text-white/60 uppercase tracking-widest transition-all border border-white/8">
              <Layers size={12} />Batch ×10
            </button>
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            {TECH.map(t => <span key={t} className="text-[7px] text-white/20 bg-white/5 px-2 py-0.5 rounded font-mono">{t}</span>)}
          </div>
        </div>

        {/* Right: agent tools */}
        <div className="w-36 border-l border-white/5 p-3 flex flex-col gap-3 bg-[#13131f]/60 shrink-0">
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-wide">Agent Tools:</span>
          {agentTools.map(t => (
            <div key={t.name} className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${t.color}22`, border: `1px solid ${t.color}44` }}>
                <t.Icon size={12} style={{ color: t.color }} />
              </div>
              <div>
                <div className="text-[8px] font-bold text-white/80">{t.name}</div>
                <div className="text-[7px] text-white/40">{t.tool}</div>
              </div>
            </div>
          ))}
          <div className="mt-auto flex flex-col gap-1.5">
            {[{ l: 'Export PNG', i: Download }, { l: 'Copy Prompt', i: Copy }, { l: 'Share', i: Share2 }].map(a => (
              <button key={a.l} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[7px] text-white/40 transition-colors">
                <a.i size={9} />{a.l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────
// CTA + CAPTION ENGINE STUDIO
// Timeline-based overlay injector + caption/hashtag generator
// Tech: FFmpeg.wasm · MoviePy · Python Batch CLI · BatchInject
// Agents: CTAAgent/OverlayTool · CaptionAgent/HashtagTool
// ─────────────────────────────────────────────────
const CTAStudio = ({ content }: { content?: string }) => {
  const [platform, setPlatform] = useState<'youtube' | 'tiktok'>('youtube');
  const [topic, setTopic] = useState('');
  const [generatedCaption, setGeneratedCaption] = useState('');

  const SEGMENTS = [
    { time: '0–3s', label: 'Hook', color: '#ef4444', desc: 'Shocking result or "before" visual that grabs attention immediately' },
    { time: '3–10s', label: 'Problem', color: '#f59e0b', desc: '"If you\'re like me, you keep struggling with X" statement' },
    { time: '10–25s', label: 'Value Beats', color: '#3b82f6', desc: '3–5 actionable steps or reveals — the core payload' },
    { time: '25–30s', label: 'CTA', color: '#22c55e', desc: '"Follow", "Patreon in bio", "Watch Part 2" + subscribe hint' },
  ];

  const OVERLAYS = [
    { id: 'lowerthird', label: 'Lower Third Card', sample: '"Click subscribe if you\'re new here"', color: '#3b82f6' },
    { id: 'corner', label: 'Corner Button', sample: '"Watch Part 2 →"', color: '#8b5cf6' },
    { id: 'midscreen', label: 'Mid-Screen Call-Out', sample: '"Watch to the end for the trick"', color: '#f59e0b' },
    { id: 'endscreen', label: 'End Screen Pack', sample: 'Subscribe + Next Video + Patreon card', color: '#22c55e' },
  ];

  const ytHashtags = ['#tutorial', '#howto', '#learnprogramming', '#devlife', '#aicode', '#100daysofcode'];
  const ttHashtags = ['#learnontiktok', '#tiktoktech', '#patreon', '#aicode', '#fyp', '#programming'];

  const agentTools = [
    { name: 'CTAAgent', tool: 'OverlayTool', Icon: MousePointer2, color: '#3b82f6' },
    { name: 'CaptionAgent', tool: 'HashtagTool', Icon: Hash, color: '#22c55e' },
  ];

  const TECH = ['FFmpeg.wasm', 'MoviePy', 'Python CLI', 'BatchInject'];

  const handleGenerate = () => {
    const t = topic.trim() || 'Your video';
    const tags = platform === 'tiktok' ? ttHashtags : ytHashtags;
    const cta = platform === 'tiktok'
      ? `✅ ${t} — results inside!\nFollow → More tutorials like this.\nPatreon in bio for full source code.\n\n${tags.join(' ')}`
      : `${t} — complete breakdown!\n\n🔔 Subscribe for weekly tutorials.\n📌 Patreon link in description for source code.\n\n${tags.join(' ')}`;
    setGeneratedCaption(cta);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d18] rounded-2xl overflow-hidden text-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#13131e] border-b border-white/6">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/60" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
          <div className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest ml-2">CTA + Caption Engine</span>
        <div className="ml-auto flex gap-1 bg-white/5 rounded-lg p-0.5">
          {(['youtube', 'tiktok'] as const).map(p => (
            <button key={p} onClick={() => { setPlatform(p); setGeneratedCaption(''); }}
              className={cn('px-3 py-1 rounded text-[8px] font-bold uppercase transition-all',
                platform === p ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60')}>
              {p === 'youtube' ? 'YouTube' : 'TikTok'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Center body */}
        <div className="flex-1 flex flex-col gap-3 p-3 overflow-y-auto">
          {/* Timeline segments */}
          <div>
            <div className="text-[8px] text-white/30 uppercase tracking-wide mb-2">Video Timeline Structure</div>
            <div className="flex gap-2">
              {SEGMENTS.map(s => (
                <div key={s.label} className="flex-1 rounded-lg p-2 border"
                  style={{ borderColor: `${s.color}44`, background: `${s.color}0d` }}>
                  <div className="text-[7px] font-mono font-bold" style={{ color: s.color }}>{s.time}</div>
                  <div className="text-[9px] font-bold text-white/80 mt-0.5">{s.label}</div>
                  <div className="text-[7px] text-white/30 mt-1 leading-tight">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Overlay picker */}
          <div>
            <div className="text-[8px] text-white/30 uppercase tracking-wide mb-2">Overlay / Annotation Types</div>
            <div className="grid grid-cols-2 gap-2">
              {OVERLAYS.map(o => (
                <div key={o.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/4 border border-white/6 hover:border-white/15 cursor-pointer transition-colors">
                  <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: o.color }} />
                  <div>
                    <div className="text-[8px] font-semibold text-white/70">{o.label}</div>
                    <div className="text-[7px] text-white/30 italic mt-0.5">{o.sample}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Caption generator */}
          <div>
            <div className="text-[8px] text-white/30 uppercase tracking-wide mb-2">Auto Caption + Hashtag Generator</div>
            <div className="flex gap-2">
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder={platform === 'youtube' ? 'Video title / topic...' : 'TikTok hook topic...'}
                className="flex-1 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 text-[8px] text-white/70 focus:outline-none focus:border-white/20 placeholder-white/20" />
              <button onClick={handleGenerate}
                className="px-3 py-1.5 bg-green-500/80 hover:bg-green-500 rounded-lg text-[8px] font-bold text-white transition-all">
                Generate
              </button>
            </div>
            {generatedCaption && (
              <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/8">
                <div className="text-[8px] text-white/70 whitespace-pre-line leading-relaxed">{generatedCaption}</div>
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {(platform === 'tiktok' ? ttHashtags : ytHashtags).map(h => (
                    <span key={h} className="text-[7px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">{h}</span>
                  ))}
                </div>
                <button onClick={() => navigator.clipboard?.writeText(generatedCaption)}
                  className="flex items-center gap-1 mt-2 text-[7px] text-white/30 hover:text-white/60 transition-colors">
                  <Copy size={9} />Copy to clipboard
                </button>
              </div>
            )}
          </div>

          {/* Auto-inject info */}
          <div className="p-2.5 rounded-lg bg-[#1a1a2e] border border-white/5 text-[7px] text-white/30 leading-relaxed">
            <span className="text-white/50 font-semibold">FFmpeg batch-injector:</span> Scans your script → auto-inserts overlay annotations at timestamps 0s, 3s, 10s, 25s. Renders as template layer over every video in queue.
          </div>

          {/* Tech footer */}
          <div className="flex gap-2 flex-wrap mt-auto pt-2 border-t border-white/5">
            {TECH.map(t => <span key={t} className="text-[7px] text-white/20 bg-white/5 px-2 py-0.5 rounded font-mono">{t}</span>)}
          </div>
        </div>

        {/* Right: agents */}
        <div className="w-36 border-l border-white/5 p-3 flex flex-col gap-3 bg-[#13131e]/60 shrink-0">
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-wide">Agent Tools:</span>
          {agentTools.map(t => (
            <div key={t.name} className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${t.color}22`, border: `1px solid ${t.color}44` }}>
                <t.Icon size={12} style={{ color: t.color }} />
              </div>
              <div>
                <div className="text-[8px] font-bold text-white/80">{t.name}</div>
                <div className="text-[7px] text-white/40">{t.tool}</div>
              </div>
            </div>
          ))}
          <div className="mt-2 flex flex-col gap-1">
            <div className="text-[7px] text-white/20 uppercase tracking-wide mb-1">Auto-inject at:</div>
            {SEGMENTS.map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                <span className="text-[7px] text-white/30">{s.time} — {s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────
// GROWTH COMMAND CENTER STUDIO
// Multi-platform analytics, publishing pipeline, monetization
// Tech: YouTube Data API · TikTok API · Beacons.ai · Linktree · Stripe
// Agents: GrowthAgent/AnalyticsTool · PublishAgent/UploadBot
// ─────────────────────────────────────────────────
const GrowthStudio = ({ content }: { content?: string }) => {
  const YT_METRICS = [
    { label: 'CTR', value: 6.8, unit: '%', max: 15, color: '#ef4444' },
    { label: 'Watch Time', value: 4.2, unit: 'min', max: 10, color: '#f59e0b' },
    { label: 'Retention', value: 68, unit: '%', max: 100, color: '#3b82f6' },
    { label: 'Session Time', value: 22, unit: 'min', max: 60, color: '#8b5cf6' },
  ];
  const TT_METRICS = [
    { label: 'Views', value: 12400, unit: '', max: 50000, color: '#f97316' },
    { label: 'Shares', value: 840, unit: '', max: 5000, color: '#ec4899' },
    { label: 'Comments', value: 216, unit: '', max: 1000, color: '#22c55e' },
    { label: 'FYP Reach', value: 78, unit: '%', max: 100, color: '#06b6d4' },
  ];
  const PIPELINE = ['Data', 'Script', 'Render', 'Thumbnail', 'CTA Inject', 'Upload', 'Analytics'];
  const TACTICS = [
    { tactic: 'Post 1×/Day same niche cluster', platform: 'TikTok', Icon: Flame, color: '#f97316' },
    { tactic: 'Trending audio + original visuals', platform: 'TikTok', Icon: Music, color: '#ec4899' },
    { tactic: 'Duet/Stitch top creators in niche', platform: 'TikTok', Icon: Users, color: '#8b5cf6' },
    { tactic: 'Playlist binge series (7-day challenge)', platform: 'YouTube', Icon: List, color: '#ef4444' },
    { tactic: 'Companion Shorts per long video', platform: 'YouTube', Icon: Smartphone, color: '#f59e0b' },
    { tactic: 'Pin comment with Patreon link', platform: 'YouTube', Icon: MessageCircle, color: '#3b82f6' },
  ];
  const agentTools = [
    { name: 'GrowthAgent', tool: 'AnalyticsTool', Icon: TrendingUp, color: '#22c55e' },
    { name: 'PublishAgent', tool: 'UploadBot', Icon: Send, color: '#3b82f6' },
  ];
  const MONETIZE = ['Patreon', 'Ko-fi', 'Stripe', 'Discord'];
  const TECH = ['YT Data API', 'TikTok API', 'Beacons.ai', 'Linktree', 'Stripe'];

  return (
    <div className="flex flex-col h-full bg-[#0d1020] rounded-2xl overflow-hidden text-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#131520] border-b border-white/6">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/60" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
          <div className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest ml-2">Growth Command Center</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[7px] text-white/30 font-mono">Live · Last updated 2m ago</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col gap-3 p-3 overflow-y-auto">
          {/* Platform metrics side by side */}
          <div className="grid grid-cols-2 gap-3">
            {/* YouTube panel */}
            <div className="bg-[#1a1a2e] rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-4 h-3 bg-red-600 rounded-sm flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] border-white ml-0.5" />
                </div>
                <span className="text-[8px] font-bold text-white/60 uppercase tracking-wide">YouTube</span>
                <span className="ml-auto text-[6px] text-white/20 font-mono">Last 28 days</span>
              </div>
              {YT_METRICS.map(m => (
                <div key={m.label} className="mb-1.5">
                  <div className="flex justify-between text-[7px] mb-0.5">
                    <span className="text-white/40">{m.label}</span>
                    <span className="font-bold" style={{ color: m.color }}>{m.value.toLocaleString()}{m.unit}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(m.value / m.max) * 100}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* TikTok panel */}
            <div className="bg-[#1a1a2e] rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-3 h-3 bg-gradient-to-br from-cyan-400 to-pink-500 rounded-sm" />
                <span className="text-[8px] font-bold text-white/60 uppercase tracking-wide">TikTok</span>
                <span className="ml-auto text-[6px] text-white/20 font-mono">Last 7 days</span>
              </div>
              {TT_METRICS.map(m => (
                <div key={m.label} className="mb-1.5">
                  <div className="flex justify-between text-[7px] mb-0.5">
                    <span className="text-white/40">{m.label}</span>
                    <span className="font-bold" style={{ color: m.color }}>{m.value.toLocaleString()}{m.unit}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(m.value / m.max) * 100}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Publishing pipeline */}
          <div className="bg-[#1a1a2e] rounded-xl p-3 border border-white/5">
            <div className="text-[8px] text-white/30 uppercase tracking-wide mb-2">Publishing Pipeline Status</div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {PIPELINE.map((step, i) => (
                <React.Fragment key={step}>
                  <div className={cn('flex flex-col items-center gap-1 shrink-0', i >= 4 ? 'opacity-40' : '')}>
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[7px] font-bold border',
                      i < 4 ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-white/5 border-white/10 text-white/30')}>
                      {i < 4 ? '✓' : i + 1}
                    </div>
                    <div className="text-[6px] text-white/30 text-center whitespace-nowrap">{step}</div>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <div className={cn('h-px w-4 shrink-0', i < 3 ? 'bg-green-500/40' : 'bg-white/10')} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Growth tactics */}
          <div className="bg-[#1a1a2e] rounded-xl p-3 border border-white/5">
            <div className="text-[8px] text-white/30 uppercase tracking-wide mb-2">Repeatable Growth Loop Tactics</div>
            <div className="grid grid-cols-2 gap-2">
              {TACTICS.map(t => (
                <div key={t.tactic} className="flex items-start gap-2 p-2 rounded-lg bg-white/3 border border-white/5">
                  <t.Icon size={10} style={{ color: t.color }} className="shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[7px] text-white/60 leading-tight">{t.tactic}</div>
                    <div className="text-[6px] mt-0.5 font-mono font-bold" style={{ color: t.color }}>{t.platform}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tech footer */}
          <div className="flex gap-2 flex-wrap pt-1 border-t border-white/5 mt-auto">
            {TECH.map(t => <span key={t} className="text-[7px] text-white/20 bg-white/5 px-2 py-0.5 rounded font-mono">{t}</span>)}
          </div>
        </div>

        {/* Right: agents + monetize */}
        <div className="w-36 border-l border-white/5 p-3 flex flex-col gap-3 bg-[#131520]/60 shrink-0">
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-wide">Agent Tools:</span>
          {agentTools.map(t => (
            <div key={t.name} className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${t.color}22`, border: `1px solid ${t.color}44` }}>
                <t.Icon size={12} style={{ color: t.color }} />
              </div>
              <div>
                <div className="text-[8px] font-bold text-white/80">{t.name}</div>
                <div className="text-[7px] text-white/40">{t.tool}</div>
              </div>
            </div>
          ))}
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="text-[7px] text-white/20 uppercase tracking-wide">Monetize Stack</div>
            {MONETIZE.map(m => (
              <div key={m} className="flex items-center gap-1.5 text-[7px] text-white/40 hover:text-white/70 cursor-pointer transition-colors">
                <LinkIcon size={7} className="text-green-400" />{m}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const WorkspaceRouter = () => {
  const { activeSubPage, studioContent } = useStudio();

  const renderContent = (content?: string) => {
    if (!content) return (
      <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
        <Sparkles size={48} className="mb-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Awaiting Creative Signal</span>
      </div>
    );
    if (content.startsWith('[IMAGE_GENERATED]')) {
      const url = content.split('[IMAGE_GENERATED] ')[1];
      return <img src={url} alt="Generated Art" className="w-full h-full object-cover rounded-3xl soft-shadow" referrerPolicy="no-referrer" />;
    }
    return <div className="whitespace-pre-wrap font-serif text-xl leading-relaxed text-white/70">{content}</div>;
  };

  switch (activeSubPage) {
    case 'writer':
      return <WriterStudio content={studioContent.writer} />;
    case 'artist':
      return <ArtistStudio content={studioContent.artist} />;
    case 'music':
      return <MusicStudio content={studioContent.music} />;
    case 'video':
      return <VideoStudio content={studioContent.video} />;
    case 'marketing':
      return <MarketingStudio content={studioContent.marketing} />;
    case 'thumbnail':
      return <ThumbnailStudio content={studioContent.thumbnail} />;
    case 'cta':
      return <CTAStudio content={studioContent.cta} />;
    case 'growth':
      return <GrowthStudio content={studioContent.growth} />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full text-white/20 space-y-4">
          <Box size={64} strokeWidth={1} />
          <p className="text-[10px] font-black uppercase tracking-[0.5em]">Select a Studio to Begin</p>
        </div>
      );
  }
};

const LeftPanel = ({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean, setIsCollapsed: (b: boolean) => void }) => {
  const { activeSubPage, projects } = useStudio();
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const assetToolsByPage: Record<SubPageId, { name: string, icon: any, subItems: string[] }[]> = {
    artist: [
      { name: 'Style Presets', icon: Palette, subItems: ['Photorealistic', 'Cyberpunk', 'Oil Painting', 'Anime', 'Minimalist'] },
      { name: 'Neural Models', icon: Cpu, subItems: ['Stable Diffusion XL', 'Midjourney v6', 'DALL-E 3', 'Custom LoRA'] },
      { name: 'Asset Library', icon: ImageIcon, subItems: ['Textures', 'Overlays', 'Brushes', 'Reference Images'] },
    ],
    writer: [
      { name: 'Character DB', icon: User, subItems: ['Protagonist: Elara', 'Antagonist: Kael', 'Supporting: Silas', 'New Character...'] },
      { name: 'World Building', icon: Globe, subItems: ['Neo-Tokyo', 'The Void', 'Floating Isles', 'New Location...'] },
      { name: 'Research Notes', icon: Search, subItems: ['Cybernetics', 'Quantum Physics', 'Ancient Myths'] },
    ],
    music: [
      { name: 'Instrument Rack', icon: Radio, subItems: ['Neural Synth', 'Waveform Bass', 'Granular Pad', 'Drum Machine'] },
      { name: 'Sample Library', icon: Music, subItems: ['Drum Loops', 'Vocal Chops', 'Ambient Textures', 'FX Rises'] },
      { name: 'Effect Chain', icon: Activity, subItems: ['Neural Reverb', 'Glitch Delay', 'Bitcrusher', 'Compressor'] },
    ],
    video: [
      { name: 'Media Bin', icon: Video, subItems: ['Intro_Clip.mp4', 'B-Roll_City.mov', 'Interview_01.wav'] },
      { name: 'Transition FX', icon: RefreshCw, subItems: ['Neural Fade', 'Digital Glitch', 'Cross Dissolve', 'Zoom Blur'] },
      { name: 'Overlay Library', icon: Layers, subItems: ['Lower Thirds', 'Vignette', 'Film Grain', 'Subtitles'] },
    ],
    marketing: [
      { name: 'Campaign Assets', icon: Megaphone, subItems: ['Logo_Final.png', 'Banner_Ad_01.jpg', 'Social_Post_v2.png'] },
      { name: 'Channel Presets', icon: Globe, subItems: ['Instagram Feed', 'Twitter Thread', 'Email Newsletter', 'LinkedIn Post'] },
      { name: 'Audience Segments', icon: User, subItems: ['Tech Enthusiasts', 'Creative Professionals', 'Early Adopters'] },
    ],
    thumbnail: [
      { name: 'Brand Templates', icon: ImageIcon, subItems: ['Split Before/After', 'Face + Outcome', 'Tutorial #', 'Growth Chart'] },
      { name: 'Color Palettes', icon: Palette, subItems: ['Electric Yellow', 'Neon Red', 'Ocean Blue', 'Dark Mode'] },
      { name: 'Font Pack', icon: Type, subItems: ['Impact Bold', 'Oswald Black', 'Montserrat Heavy', 'Custom Upload'] },
    ],
    cta: [
      { name: 'Overlay Presets', icon: Film, subItems: ['Lower Third v1', 'Arrow Hint', 'Subscribe Card', 'End Screen'] },
      { name: 'Caption Library', icon: Hash, subItems: ['YT Hooks Pack', 'TikTok Captions', 'Hashtag Sets', 'CTA Phrases'] },
      { name: 'Timing Templates', icon: Clock, subItems: ['0-3s Hook', '3-10s Problem', '10-25s Value', '25s+ CTA'] },
    ],
    growth: [
      { name: 'Analytics Reports', icon: BarChart3, subItems: ['Last 7 Days', 'Last 30 Days', 'Channel Report', 'TikTok Report'] },
      { name: 'Monetize Links', icon: DollarSign, subItems: ['Patreon Setup', 'Beacons Bio', 'Linktree', 'Stripe Checkout'] },
      { name: 'Content Calendar', icon: Calendar, subItems: ['Week 1 Plan', 'Week 2 Plan', 'Duet Targets', 'Playlist Series'] },
    ],
    projects: [
      { name: 'Active Files', icon: FileText, subItems: ['Draft_01.doc', 'Scene_05.mp4', 'Master_Track.wav'] },
      { name: 'Collaborators', icon: User, subItems: ['Sarah (Editor)', 'Mike (Designer)', 'Alex (Producer)'] },
      { name: 'Milestones', icon: CheckCircle2, subItems: ['Concept Phase', 'Production', 'Final Review'] },
    ],
    account: [
      { name: 'Usage Stats', icon: BarChart3, subItems: ['Neural Credits', 'Storage Used', 'API Calls'] },
      { name: 'Connected Apps', icon: Network, subItems: ['GitHub', 'Discord', 'Stripe'] },
      { name: 'Security Logs', icon: ShieldCheck, subItems: ['Login History', 'Key Rotations', 'Access Audit'] },
    ]
  };

  const currentAssetTools = assetToolsByPage[activeSubPage] || [];

  return (
    <div className={cn("flex flex-col h-full transition-all duration-500 overflow-hidden", isCollapsed ? "w-0" : "w-80")}>
      {/* Header / Collapse Toggle */}
      <div className="p-6 flex items-center justify-between border-b border-white/[0.06]">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="p-2 hover:bg-white/[0.06] rounded-xl transition-colors mx-auto"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Asset Library</h3>
            <Database size={14} className="text-accent-purple" />
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
        {/* Active Projects Section */}
        {!isCollapsed && (
          <div className="space-y-3">
            <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-2 px-2">Active Projects</div>
            <div className="grid grid-cols-1 gap-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => console.log(`Switching to Project: ${project.name}`)}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] hover:border-accent-purple/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center border border-white/[0.08] group-hover:text-accent-purple transition-colors shrink-0">
                    <Database size={14} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white/80 transition-colors">
                      {project.name}
                    </div>
                    <div className="text-[7px] font-mono text-white/20 uppercase tracking-widest">
                      {project.status}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Asset Tools Section */}
        <div className="space-y-3">
          {!isCollapsed && <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-2 px-2">Components</div>}
          <div className="grid grid-cols-1 gap-2">
            {currentAssetTools.map((tool) => (
              <div key={tool.name} className="space-y-1">
                <button
                  onClick={() => setExpandedTool(expandedTool === tool.name ? null : tool.name)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-2xl transition-all group",
                    expandedTool === tool.name ? "bg-white/[0.06] text-white" : "text-white/30 hover:bg-white/[0.03] hover:text-white/60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                      expandedTool === tool.name ? "bg-accent-purple text-white" : "bg-white/[0.06]"
                    )}>
                      <tool.icon size={14} />
                    </div>
                    {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">{tool.name}</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown size={14} className={cn("transition-transform duration-300", expandedTool === tool.name ? "rotate-180" : "")} />
                  )}
                </button>
                
                <AnimatePresence>
                  {expandedTool === tool.name && !isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-12 space-y-1"
                    >
                      {tool.subItems.map(subItem => (
                        <button
                          key={subItem}
                          onClick={() => console.log(`Selected: ${subItem}`)}
                          className="w-full text-left py-2 px-3 text-[10px] font-bold text-white/40 hover:text-accent-purple transition-colors uppercase tracking-widest"
                        >
                          {subItem}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const GlobalPageRouter = () => {
  const { 
    activeGlobalPage, activeSubPage, 
    isToolPanelCollapsed, setIsToolPanelCollapsed, 
    isLeftPanelCollapsed, setIsLeftPanelCollapsed, 
    isAutonomous, setIsAutonomous,
    isAutoOptimized, setIsAutoOptimized,
    isHandsFree, setIsHandsFree,
    tasks, agents 
  } = useStudio();

  if (activeGlobalPage === 'studio') {
    return (
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Assets & Components */}
        <aside className={cn(
          "bg-[#08101e] border-r border-white/[0.06] flex flex-col shrink-0 transition-all duration-500 z-40 relative",
          isLeftPanelCollapsed ? "w-0" : "w-80"
        )}>
          <LeftPanel isCollapsed={isLeftPanelCollapsed} setIsCollapsed={setIsLeftPanelCollapsed} />
          
          {/* Floating Toggle for Collapsed State */}
          {isLeftPanelCollapsed && (
            <button 
              onClick={() => setIsLeftPanelCollapsed(false)}
              className="absolute left-full top-1/2 -translate-y-1/2 ml-4 p-3 bg-[#08101e] border border-white/[0.08] rounded-2xl text-accent-purple hover:scale-110 transition-all z-50"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </aside>

        {/* Main Content Area: Workspace */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative bg-transparent">
          <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter text-white/80">{activeSubPage} Workspace</h2>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mt-2">Agent Lee // Creative Node Active</p>
              </div>
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-white/[0.05] border border-white/[0.08] rounded-2xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">System Stable</span>
                </div>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeSubPage}
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
              >
                <WorkspaceRouter />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Right Panel: Navigation & Tools */}
        <aside className={cn(
          "bg-[#08101e] border-l border-white/[0.06] flex flex-col shrink-0 transition-all duration-500 z-40 relative",
          isToolPanelCollapsed ? "w-0" : "w-80"
        )}>
          <ToolPanel isCollapsed={isToolPanelCollapsed} setIsCollapsed={setIsToolPanelCollapsed} />
          
          {/* Floating Toggle for Collapsed State */}
          {isToolPanelCollapsed && (
            <button 
              onClick={() => setIsToolPanelCollapsed(false)}
              className="absolute right-full top-1/2 -translate-y-1/2 mr-4 p-3 bg-[#08101e] border border-white/[0.08] rounded-2xl text-accent-blue hover:scale-110 transition-all z-50"
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </aside>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto no-scrollbar p-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeGlobalPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-5xl mx-auto space-y-12"
        >
          {activeGlobalPage === 'home' && (
            <div className="space-y-12">
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-accent-blue">
                    <Activity size={16} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">System Online // Node 01</span>
                  </div>
                  <h2 className="text-6xl font-black uppercase tracking-tighter leading-none text-white/80">Mission Control</h2>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black tracking-tighter text-white/80">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</div>
                  <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">UTC // {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <GlassCard neonColor="blue" className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-accent-blue/10 rounded-2xl text-accent-blue">
                      <Cpu size={32} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/20">Neural Load</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black mb-2 text-white/80">84%</div>
                    <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '84%' }}
                        className="h-full bg-accent-blue"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                    Agent Lee is currently processing creative signals across 4 active nodes. Optimization required in 12m.
                  </p>
                </GlassCard>

                <GlassCard neonColor="purple" className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-accent-purple/10 rounded-2xl text-accent-purple">
                      <Zap size={32} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/20">Active Tasks</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black mb-2 text-white/80">{tasks.length}</div>
                    <div className="flex gap-1">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${i < tasks.length ? 'bg-accent-purple' : 'bg-white/[0.08]'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Queue Status</span>
                    <span className="text-[10px] text-accent-purple font-black uppercase tracking-widest">Stable</span>
                  </div>
                </GlassCard>

                <GlassCard neonColor="green" className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-accent-green/10 rounded-2xl text-accent-green">
                      <ShieldCheck size={32} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/20">System Governance</div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/40 uppercase tracking-widest">Autonomous Mode</span>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", isAutonomous ? "text-accent-green" : "text-white/20")}>
                        {isAutonomous ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/40 uppercase tracking-widest">Hands-Free</span>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", isHandsFree ? "text-accent-green" : "text-white/20")}>
                        {isHandsFree ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/40 uppercase tracking-widest">Auto-Optimize</span>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", isAutoOptimized ? "text-accent-green" : "text-white/20")}>
                        {isAutoOptimized ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                    System is currently operating in 100% hands-free mode. Agent Lee is managing all creative sub-nodes.
                  </p>
                </GlassCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard className="p-8">
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3 text-white/80">
                    <TrendingUp size={20} className="text-accent-purple" />
                    Creative Velocity
                  </h3>
                  <div className="h-40 flex items-end gap-2">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.random() * 100}%` }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', delay: i * 0.1 }}
                        className="flex-1 bg-gradient-to-t from-accent-purple/20 to-accent-purple rounded-t-sm"
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-[8px] text-white/20 uppercase tracking-[0.3em]">
                    <span>00:00</span>
                    <span>12:00</span>
                    <span>24:00</span>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {activeGlobalPage === 'diagnostic' && (
            <div className="space-y-8">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white/80">System Diagnostic</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GlassCard neonColor="green" className="p-8">
                  <div className="text-[10px] font-black uppercase tracking-widest mb-6 text-white/20">Neural Latency (ms)</div>
                  <div className="h-48 flex items-end gap-1">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.random() * 100}%` }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.05 }}
                        className="flex-1 bg-accent-green/40 rounded-t-sm"
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-[8px] font-mono text-white/40 uppercase tracking-widest">
                    <span>Avg: 124ms</span>
                    <span>Peak: 452ms</span>
                  </div>
                </GlassCard>
                <div className="space-y-4">
                  {[
                    { name: 'Memory Buffer', status: 'OPTIMAL', value: '1.2GB / 16GB' },
                    { name: 'Signal Integrity', status: 'STABLE', value: '99.9%' },
                    { name: 'Auth Tunnel', status: 'SECURE', value: 'AES-256' },
                    { name: 'Task Queue', status: tasks.length > 5 ? 'BUSY' : 'OPTIMAL', value: `${tasks.length} Active` },
                    { name: 'Agent Sync', status: 'SYNCED', value: `${AGENTS.length} Nodes` },
                  ].map(sys => (
                    <div key={sys.name} className="p-4 bg-white border border-white/[0.08] rounded-2xl flex items-center justify-between soft-shadow">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/60">{sys.name}</span>
                        <span className="text-[8px] font-mono text-white/20">{sys.value}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        sys.status === 'OPTIMAL' || sys.status === 'STABLE' || sys.status === 'SECURE' || sys.status === 'SYNCED' ? "text-accent-green" : "text-accent-blue"
                      )}>{sys.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeGlobalPage === 'deployment' && (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
              <Rocket size={64} className="text-accent-pink animate-bounce" />
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white/80">Ready for Deployment</h2>
              <p className="text-white/40 max-w-md uppercase text-[10px] tracking-widest leading-relaxed">Your creative assets are staged and ready for edge distribution. Select a target node to begin.</p>
              <button className="px-8 py-4 bg-accent-pink text-white font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-transform soft-shadow">Initialize Push</button>
            </div>
          )}

          {activeGlobalPage === 'code' && (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-white/80">Code Studio</h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Neural Scripting Environment</p>
                </div>
                <div className="flex gap-4">
                  <button className="px-4 py-2 bg-white border border-white/[0.08] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.06] transition-all soft-shadow">Export</button>
                  <button className="px-4 py-2 bg-accent-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest soft-shadow">Commit</button>
                </div>
              </div>
              <GlassCard neonColor="blue" className="p-1 min-h-[500px] flex">
                <div className="w-12 bg-white/[0.03] border-r border-white/[0.08] flex flex-col items-center py-4 gap-4">
                  <FileText size={18} className="text-accent-blue" />
                  <Search size={18} className="text-white/20" />
                  <Network size={18} className="text-white/20" />
                </div>
                <div className="flex-1 p-6 font-mono text-xs text-white/60 leading-relaxed overflow-y-auto no-scrollbar">
                  <div className="flex gap-4">
                    <div className="text-black/10 text-right select-none">
                      {Array.from({ length: 30 }).map((_, i) => <div key={i}>{i + 1}</div>)}
                    </div>
                    <div className="flex-1">
                      <span className="text-accent-purple">import</span> {'{'} <span className="text-accent-blue">NeuralCore</span> {'}'} <span className="text-accent-purple">from</span> <span className="text-accent-green">'@agentlee/core'</span>;
                      <br /><br />
                      <span className="text-accent-purple">async function</span> <span className="text-accent-blue">initializeNode</span>() {'{'}
                      <br />
                      &nbsp;&nbsp;<span className="text-accent-purple">const</span> node = <span className="text-accent-purple">await</span> NeuralCore.<span className="text-accent-blue">connect</span>();
                      <br />
                      &nbsp;&nbsp;<span className="text-white/40">// Initialize creative signal</span>
                      <br />
                      &nbsp;&nbsp;<span className="text-accent-purple">return</span> node.<span className="text-accent-blue">sync</span>();
                      <br />
                      {'}'}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {activeGlobalPage === 'memory' && (
            <div className="space-y-8">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white/80">Memory Lake</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <GlassCard key={i} neonColor="purple" className="p-6 aspect-square flex flex-col justify-between group cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-accent-purple/10 rounded-lg text-accent-purple">
                        <Database size={16} />
                      </div>
                      <div className="text-[8px] font-mono text-white/20">FRAGMENT_{i}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest mb-1 text-white/80">Neural Pattern {i + 1}</div>
                      <div className="text-[8px] text-white/40 uppercase tracking-widest">Stored 2h ago</div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {activeGlobalPage === 'database' && (
            <div className="space-y-8">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white/80">Databases</h2>
              <div className="space-y-4">
                {[
                  { name: 'User_Index', size: '1.2 GB', load: '12%', color: 'blue' },
                  { name: 'Creative_Assets', size: '42.8 GB', load: '68%', color: 'pink' },
                  { name: 'Signal_Logs', size: '4.5 GB', load: '5%', color: 'green' }
                ].map(db => (
                  <GlassCard key={db.name} neonColor={db.color} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className={`p-4 bg-accent-${db.color}/10 rounded-2xl text-accent-${db.color}`}>
                        <Database size={24} />
                      </div>
                      <div>
                        <div className="text-sm font-black uppercase tracking-widest text-white/80">{db.name}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{db.size} // Enterprise Node</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Load Factor</div>
                        <div className="text-lg font-black text-white/80">{db.load}</div>
                      </div>
                      <button className="p-3 bg-white/[0.06] border border-white/[0.08] rounded-xl hover:bg-white/[0.1] transition-all">
                        <Settings size={18} className="text-white/40" />
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {activeGlobalPage === 'settings' && (
            <div className="space-y-12">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-white/80">System Settings</h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Neural Governance & Agent Monitoring</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Agent Monitor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {agents.map(agent => (
                      <GlassCard key={agent.id} className="p-6">
                        <div className="flex justify-between items-start mb-6">
                          <div className={cn("p-3 rounded-2xl bg-white soft-shadow", `text-${agent.color}`)}>
                            <agent.icon size={20} />
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-accent-green uppercase tracking-widest">Online</span>
                            <span className="text-[10px] font-mono text-white/20">Uptime: 142h</span>
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="text-[10px] font-black text-white/80 uppercase tracking-widest">{agent.name}</div>
                          <div className="text-[8px] text-white/40 uppercase font-bold tracking-tighter">{agent.role} // {agent.id}</div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-[7px] font-black uppercase tracking-widest text-white/20 mb-1">
                              <span>Neural Load</span>
                              <span>{Math.floor(Math.random() * 40 + 10)}%</span>
                            </div>
                            <div className="h-1 w-full bg-white/[0.08] rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.floor(Math.random() * 40 + 10)}%` }}
                                className={cn("h-full", `bg-${agent.color}`)}
                              />
                            </div>
                          </div>
                          <div className="p-2 bg-white/[0.03] rounded-lg border border-white/[0.08]">
                            <div className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">Current Task</div>
                            <div className="text-[9px] font-bold text-white/60 uppercase truncate">Optimizing Neural Bridge...</div>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">System Governance</h3>
                  <GlassCard className="p-8 space-y-8">
                    {[
                      { id: 'autonomous', label: 'Autonomous Mode', desc: 'Allow Agent Lee to initiate tasks independently', state: isAutonomous, setter: setIsAutonomous },
                      { id: 'optimized', label: 'Auto-Optimization', desc: 'Continuous neural path refinement', state: isAutoOptimized, setter: setIsAutoOptimized },
                      { id: 'handsfree', label: 'Hands-Free Execution', desc: 'Zero-click creative orchestration', state: isHandsFree, setter: setIsHandsFree },
                    ].map(setting => (
                      <div key={setting.id} className="flex items-center justify-between gap-6">
                        <div className="flex-1">
                          <div className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-1">{setting.label}</div>
                          <div className="text-[8px] text-white/40 uppercase font-bold tracking-tighter leading-tight">{setting.desc}</div>
                        </div>
                        <button 
                          onClick={() => setting.setter(!setting.state)}
                          className={cn(
                            "w-12 h-6 rounded-full relative transition-all duration-300",
                            setting.state ? "bg-accent-blue" : "bg-black/10"
                          )}
                        >
                          <motion.div 
                            animate={{ x: setting.state ? 24 : 4 }}
                            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full soft-shadow"
                          />
                        </button>
                      </div>
                    ))}

                    <div className="pt-8 border-t border-white/[0.08]">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/80 mb-4">
                        <span>Neural Bridge Strength</span>
                        <span className="text-accent-blue">98.4%</span>
                      </div>
                      <div className="h-2 w-full bg-white/[0.08] rounded-full relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 w-[98.4%] bg-accent-blue rounded-full" />
                      </div>
                      <p className="text-[8px] text-white/20 uppercase tracking-widest mt-4 leading-relaxed">
                        Master Agent LEE is currently operating at peak efficiency. All sub-agents are synchronized.
                      </p>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for other pages */}
          {!['home', 'studio', 'diagnostic', 'deployment', 'code', 'memory', 'database', 'settings'].includes(activeGlobalPage) && (
            <div className="flex flex-col items-center justify-center py-32 opacity-20">
              <Cpu size={64} className="mb-6 animate-spin-slow" />
              <h2 className="text-2xl font-black uppercase tracking-widest">Node Initializing...</h2>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
};

const CommandCenter = () => null;

const AgentGrid = () => {
  const { agents, activeAgent, setActiveAgent } = useStudio();

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {agents.map((agent) => (
        <button
          key={agent.id}
          onClick={() => setActiveAgent(agent)}
          className={cn(
            "p-4 rounded-2xl border transition-all text-left group relative overflow-hidden",
            activeAgent.id === agent.id 
              ? `bg-accent-${agent.color.split('-')[1]}/10 border-accent-${agent.color.split('-')[1]}/40 shadow-lg` 
              : "bg-white/[0.03] border-white/[0.08] text-white/30 hover:bg-white/[0.06]"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border mb-3 transition-all",
            activeAgent.id === agent.id ? `border-accent-${agent.color.split('-')[1]}/40 bg-accent-${agent.color.split('-')[1]}/20` : "border-white/[0.08] bg-white/[0.06]"
          )}>
            <agent.icon size={18} className={activeAgent.id === agent.id ? `text-accent-${agent.color.split('-')[1]}` : ""} />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-black uppercase tracking-widest">{agent.name}</div>
            <div className="text-[8px] opacity-40 uppercase font-bold tracking-tighter line-clamp-1">{agent.role}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

const StudioWorkspace = () => {
  const { tasks, activeAgent } = useStudio();
  const latestTask = [...tasks].reverse().find(t => t.status === 'COMPLETED');

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Studio Output</h2>
          <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Neural Output Forge</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 bg-black/5 border border-white/[0.08] rounded-xl text-white/40 hover:text-white transition-colors"><Save size={16} /></button>
          <button className="p-2.5 bg-black/5 border border-white/[0.08] rounded-xl text-white/40 hover:text-white transition-colors"><Share2 size={16} /></button>
        </div>
      </div>

      {latestTask ? (
        <GlassCard neonColor={AGENTS.find(a => a.id === latestTask.agentId)?.color.split('-')[1] || 'blue'} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center border border-white/[0.08]">
                <Sparkles size={14} className="text-accent-blue" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-white">{latestTask.type} OUTPUT</div>
                <div className="text-[8px] font-mono text-white/30 uppercase">Generated by {latestTask.agentId}</div>
              </div>
            </div>
            <button className="text-[9px] font-black text-accent-blue uppercase tracking-widest hover:underline">Export Asset</button>
          </div>

          <div className="space-y-4">
            {latestTask.output?.startsWith('[IMAGE_GENERATED]') ? (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/[0.08] group relative">
                <img src={latestTask.output.split(' ')[1]} alt="Generated" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Neural Render v4.2</span>
                </div>
              </div>
            ) : (
              <div className="bg-black/[0.03] border border-white/[0.08] rounded-2xl p-5 text-[11px] font-mono leading-relaxed text-white/80 whitespace-pre-wrap max-h-96 overflow-y-auto no-scrollbar">
                {latestTask.output}
              </div>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="aspect-video bg-white/[0.04] rounded-[40px] flex flex-col items-center justify-center gap-4 opacity-20 border-dashed border-2 border-white/[0.1]">
          <MousePointer2 size={48} className="animate-bounce" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black">Awaiting Neural Input</span>
        </div>
      )}
    </div>
  );
};


export const AgentLeeCreatorsStudio: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState<Agent>(AGENTS[0]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeGlobalPage, setActiveGlobalPage] = useState<GlobalPageId>('studio');
  const [activeSubPage, setActiveSubPage] = useState<SubPageId>('artist');
  const [notepad, setNotepad] = useState<NotepadEntry[]>([
    { id: '1', title: 'Creative Roadmap', content: 'Define the core vision for the next-gen agentic interface.', timestamp: Date.now() }
  ]);
  const [isToolPanelCollapsed, setIsToolPanelCollapsed] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [isAutonomous, setIsAutonomous] = useState(true);
  const [isAutoOptimized, setIsAutoOptimized] = useState(true);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [studioContent, setStudioContentState] = useState<Record<string, string>>({
    artist: '',
    writer: '',
    music: '',
    video: '',
    marketing: '',
    thumbnail: '',
    cta: '',
    growth: ''
  });

  const controller = useMemo(() => {
    const c = new StudioExecutionController();
    c.init(CREATIVE_PROFILE);
    return c;
  }, []);


  const setStudioContent = (page: SubPageId, content: string) => {
    setStudioContentState(prev => ({ ...prev, [page]: content }));
  };

  const addTask = (t: Omit<Task, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newTask: Task = {
      ...t,
      id,
      timestamp: Date.now()
    };
    setTasks(prev => [...prev, newTask]);
    return id;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addMessage = (m: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = {
      ...m,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const updateNotepad = (id: string, content: string) => {
    setNotepad(prev => prev.map(n => n.id === id ? { ...n, content } : n));
  };

  const addNotepadEntry = (title: string, content: string) => {
    const newEntry: NotepadEntry = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      content,
      timestamp: Date.now()
    };
    setNotepad(prev => [...prev, newEntry]);
  };

  const executePlan = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const plan = notepad[0]?.content || "";
    if (!plan.trim()) {
      setIsProcessing(false);
      return;
    }

    addMessage({ role: 'system', content: `Agent Lee is analyzing the plan: "${plan.substring(0, 50)}..."` });

    try {
      const orchestrationPrompt = `
        You are Agent Lee, the Master Orchestrator. 
        Analyze the following creative plan and break it down into specific tasks for your specialized agents.
        
        Specialized Agents:
        - SCRIBBLE (Writer): Stories, scripts, copy, text.
        - ARTIE (Designer): Images, thumbnails, art, visuals.
        - MAILER (Marketer): Emails, SEO, ads, marketing.
        
        Plan: "${plan}"
        
        Return a JSON array of tasks. Each task should have:
        - title: Short descriptive title.
        - type: One of 'STORY', 'EMAIL', 'THUMBNAIL', 'DOC', 'SEO', 'GENERAL'.
        - agentId: The ID of the agent to handle it (SCRIBBLE, ARTIE, or MAILER).
        - input: The specific instruction for that agent.
        
        Example:
        [
          {"title": "Write Robot Story", "type": "STORY", "agentId": "SCRIBBLE", "input": "A story about a robot finding its soul"},
          {"title": "Generate Thumbnail", "type": "THUMBNAIL", "agentId": "ARTIE", "input": "A robot with a glowing heart"}
        ]
      `;

      const response = await performAIAction(orchestrationPrompt, "You are Agent Lee, the Master Orchestrator. Return ONLY a JSON array.");
      const jsonStr = response.replace(/```json|```/g, '').trim();
      const tasksToCreate = JSON.parse(jsonStr);

      if (Array.isArray(tasksToCreate)) {
        tasksToCreate.forEach(t => {
          const taskId = addTask({
            title: t.title,
            type: t.type as any,
            status: 'QUEUED',
            input: t.input,
            agentId: t.agentId
          });

          // Trigger execution for each task
          setTimeout(async () => {
            updateTask(taskId, { status: 'PROCESSING' });
            const agent = AGENTS.find(a => a.id === t.agentId)!;
            const subInstruction = `You are ${agent.name}, the ${agent.role}. Task: ${t.type}. Input: ${t.input}.`;
            
            let output = "";
            let targetPage: SubPageId = 'writer';
            if (t.type === 'THUMBNAIL') {
              const imageUrl = await generateImage(t.input);
              output = imageUrl ? `[IMAGE_GENERATED] ${imageUrl}` : "Visual forge failed.";
              targetPage = 'artist';
            } else if (t.type === 'STORY' || (t.type as string) === 'DOC') {
              output = await performAIAction(t.input, subInstruction);
              targetPage = 'writer';
            } else if (t.type === 'EMAIL' || (t.type as string) === 'SEO') {
              output = await performAIAction(t.input, subInstruction);
              targetPage = 'marketing';
            } else {
              output = await performAIAction(t.input, subInstruction);
            }

            updateTask(taskId, { status: 'COMPLETED', output });
            setStudioContent(targetPage, output);
            setActiveGlobalPage('studio');
            setActiveSubPage(targetPage);
          }, 2000);
        });
        addMessage({ role: 'assistant', content: `Plan orchestrated. I have delegated ${tasksToCreate.length} tasks to the specialized agents.`, agentId: 'LEE' });
      }
    } catch (error) {
      console.error("Orchestration failed:", error);
      addMessage({ role: 'system', content: "Orchestration failed. Neural paths are unstable." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Autonomous Loop
  useEffect(() => {
    if (!isAutonomous || isProcessing) return;

    const interval = setInterval(() => {
      // If hands-free is on, and we have a notepad entry, and no pending tasks, execute plan
      if (isHandsFree && notepad.length > 0 && tasks.filter(t => t.status === 'QUEUED' || t.status === 'PROCESSING').length === 0) {
        executePlan();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isAutonomous, isHandsFree, isProcessing, notepad, tasks, executePlan]);

  const globalNavItems: { id: GlobalPageId, label: string, icon: any }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'studio', label: 'Creator Studio', icon: Palette },
    { id: 'diagnostic', label: 'Diagnostic', icon: Activity },
    { id: 'deployment', label: 'Deployment', icon: Rocket },
    { id: 'code', label: 'Code Studio', icon: Code },
    { id: 'memory', label: 'Memory Lake', icon: Database },
    { id: 'database', label: 'Databases', icon: Network },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const subNavItems: { id: SubPageId, label: string, icon: any }[] = [
    { id: 'artist', label: 'Artist', icon: ImageIcon },
    { id: 'writer', label: 'Writer', icon: PenTool },
    { id: 'music', label: 'Music', icon: Radio },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'marketing', label: 'Marketing/SEO', icon: Megaphone },
    { id: 'projects', label: 'Projects', icon: Layers },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <StudioContext.Provider value={{ 
      agents: AGENTS, activeAgent, setActiveAgent, 
      tasks, addTask, updateTask, 
      messages, addMessage, 
      isProcessing, setIsProcessing,
      activeGlobalPage, setActiveGlobalPage,
      activeSubPage, setActiveSubPage,
      notepad, updateNotepad, addNotepadEntry,
      isToolPanelCollapsed, setIsToolPanelCollapsed,
      isLeftPanelCollapsed, setIsLeftPanelCollapsed,
      isNotepadOpen, setIsNotepadOpen,
      isAutonomous, setIsAutonomous,
      isAutoOptimized, setIsAutoOptimized,
      isHandsFree, setIsHandsFree,
      executePlan,
      projects, setProjects,
      studioContent, setStudioContent
    }}>
      <div className="flex flex-col h-screen bg-[#020408] text-white overflow-hidden font-sans">
        <div className="scanline pointer-events-none" />
        
        {/* Header: System Status & Logo */}
        <header className="h-16 bg-[#020408]/95 border-b border-white/[0.06] z-50 backdrop-blur-xl shrink-0">
          <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-white/40 hover:text-accent-blue transition-all active:scale-90 bg-white/[0.06] rounded-lg border border-white/[0.08]"
              >
                <Menu size={18} />
              </button>
              <div>
                <h1 className="text-sm font-black uppercase tracking-[0.3em] text-white">Agent Lee</h1>
                <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Creators Studio // v4.2.0</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.06] rounded-full border border-white/[0.08]">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_8px_#28cd41]" />
                <span className="text-[7px] font-black uppercase tracking-widest text-white/60">Governor Online</span>
              </div>
              <button 
                onClick={() => setIsNotepadOpen(true)}
                className="p-2 text-white/40 hover:text-accent-blue transition-all active:scale-90 bg-white/[0.06] rounded-lg border border-white/[0.08] flex items-center gap-2"
              >
                <Clipboard size={18} />
                <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline">Notepad</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Layout Container */}
        <div className="flex flex-1 overflow-hidden relative">
          <GlobalPageRouter />
        </div>

        {/* Global Agent Notepad Modal */}
        <AnimatePresence>
          {isNotepadOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                onClick={() => setIsNotepadOpen(false)} 
                className="fixed inset-0 bg-black/40 z-[80] backdrop-blur-md" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-[90] p-6"
              >
                <div className="relative">
                  <button 
                    onClick={() => setIsNotepadOpen(false)}
                    className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                  <AgentNotepad />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </StudioContext.Provider>
  );
};

export default AgentLeeCreatorsStudio;
