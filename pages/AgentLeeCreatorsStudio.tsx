import React, { useState, useEffect, useRef, createContext, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, User, Terminal, Send, Zap, Upload, Mic, ArrowRight, 
  Home, Activity, Rocket, Code, Database, Settings, Menu, X, 
  TrendingUp, Palette, Megaphone, BookOpen, Search, Video, 
  Globe, RefreshCw, Save, Share2, Layout as LayoutIcon, PenTool, 
  Image as ImageIcon, Layers, Cpu, ShieldCheck, 
  ChevronRight, ChevronLeft, ChevronDown, Trash2, Plus, Download, Filter,
  AlertTriangle, CheckCircle2, Radio, Sparkles, Clipboard, 
  Mail, FileText, MousePointer2, Clock, BarChart3, Network,
  Maximize2, Play, Pause, Square, SkipBack, SkipForward, MoreVertical, Music, MoreHorizontal,
  Calendar, Users, Target, DollarSign, Heart, MessageCircle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- AI SERVICE ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// --- AGENT ARCHITECTURE TYPES ---

type AgentRole = 'MASTER' | 'WRITER' | 'DESIGNER' | 'MARKETER' | 'ANALYST' | 'SECURITY' | 'MUSICIAN' | 'EDITOR';

type SubPageId = 'artist' | 'writer' | 'music' | 'video' | 'marketing' | 'projects' | 'account';
type GlobalPageId = 'home' | 'studio' | 'diagnostic' | 'deployment' | 'code' | 'memory' | 'database' | 'settings';

interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  icon: any;
  color: string;
  capabilities: string[];
}

interface NotepadEntry {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

interface Task {
  id: string;
  title: string;
  type: 'STORY' | 'EMAIL' | 'THUMBNAIL' | 'DOC' | 'SEO' | 'GENERAL';
  status: 'IDLE' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  input: string;
  output?: string;
  agentId: string;
  timestamp: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId?: string;
  timestamp: number;
}

// --- CONSTANTS ---

const AGENTS: Agent[] = [
  {
    id: 'LEE',
    name: 'Lee',
    role: 'MASTER',
    description: 'Master Controller & Orchestrator',
    icon: Cpu,
    color: 'accent-blue',
    capabilities: ['Task Delegation', 'System Governance', 'Context Management', 'Autonomous Optimization']
  },
  {
    id: 'SCRIBBLE',
    name: 'Scribble',
    role: 'WRITER',
    description: 'Creative Writing & Scripting Specialist',
    icon: PenTool,
    color: 'accent-purple',
    capabilities: ['Storytelling', 'Scriptwriting', 'Copywriting', 'Narrative Architecture']
  },
  {
    id: 'ARTIE',
    name: 'Artie',
    role: 'DESIGNER',
    description: 'Visual Arts & Thumbnail Designer',
    icon: Palette,
    color: 'accent-pink',
    capabilities: ['Image Generation', 'Layout Design', 'Visual Branding', 'Neural Rendering']
  },
  {
    id: 'MELODY',
    name: 'Melody',
    role: 'MUSICIAN',
    description: 'Audio Composition & Sound Design',
    icon: Music,
    color: 'accent-blue',
    capabilities: ['Melody Generation', 'Harmony Engine', 'Sound Synthesis', 'Mastering']
  },
  {
    id: 'DIRECTOR',
    name: 'Director',
    role: 'EDITOR',
    description: 'Video Production & Motion Graphics',
    icon: Video,
    color: 'accent-red',
    capabilities: ['Video Editing', 'Motion Tracking', 'Color Grading', 'Scene Assembly']
  },
  {
    id: 'MAILER',
    name: 'Mailer',
    role: 'MARKETER',
    description: 'Email Campaign & SEO Strategist',
    icon: Mail,
    color: 'accent-green',
    capabilities: ['Email Automation', 'SEO Optimization', 'Ad Copy', 'Campaign Analytics']
  },
  {
    id: 'SARAH',
    name: 'Sarah',
    role: 'SECURITY',
    description: 'Security & Authentication Guard',
    icon: ShieldCheck,
    color: 'accent-orange',
    capabilities: ['Auth Verification', 'Data Integrity', 'Signal Encryption', 'Threat Detection']
  },
  {
    id: 'INSIGHT',
    name: 'Insight',
    role: 'ANALYST',
    description: 'Data Intelligence & Market Insights',
    icon: BarChart3,
    color: 'accent-purple',
    capabilities: ['Market Research', 'Trend Analysis', 'Data Visualization', 'Predictive Modeling']
  }
];

// --- CONTEXT ---

interface Project {
  id: string;
  name: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  lastModified: string;
  icon: any;
}

interface StudioContextType {
  agents: Agent[];
  activeAgent: Agent;
  setActiveAgent: (a: Agent) => void;
  tasks: Task[];
  addTask: (t: Omit<Task, 'id' | 'timestamp'>) => void;
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
  executePlan: () => void;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  studioContent: Record<SubPageId, string>;
  setStudioContent: (page: SubPageId, content: string) => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) throw new Error('useStudio must be used within StudioProvider');
  return context;
};

// --- AI LOGIC ---

const performAIAction = async (prompt: string, systemInstruction: string, model: string = "gemini-3-flash-preview") => {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: { systemInstruction },
    });
    return response.text || "";
  } catch (error) {
    console.error("AI Action failed:", error);
    throw error;
  }
};

const generateImage = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ parts: [{ text: prompt }] }],
    });
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return imagePart?.inlineData?.data ? `data:image/png;base64,${imagePart.inlineData.data}` : null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
};

// --- COMPONENTS ---

const GlassCard = ({ children, className, neonColor = 'blue', ...props }: { children: React.ReactNode, className?: string, neonColor?: string, [key: string]: any }) => (
  <div {...props} className={cn(
    "bg-white/80 backdrop-blur-xl border border-black/5 rounded-[32px] relative overflow-hidden group transition-all duration-500 soft-shadow",
    className
  )}>
    <div className={cn(
      "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 pointer-events-none",
      `from-accent-${neonColor}`
    )} />
    {children}
  </div>
);

const TaskBoard = () => {
  const { tasks } = useStudio();

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Active Task Queue</h3>
        <span className="text-[8px] font-mono text-accent-blue">{tasks.length} JOBS</span>
      </div>
      {tasks.length === 0 ? (
        <div className="text-center py-10 opacity-20">
          <Clipboard size={32} className="mx-auto mb-2" />
          <span className="text-[10px] font-black uppercase tracking-widest">Queue Empty</span>
        </div>
      ) : (
        tasks.map((task) => (
          <div key={task.id} className="p-4 bg-black/[0.02] border border-black/5 rounded-2xl flex items-center justify-between group hover:bg-black/[0.04] transition-all">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border",
                task.status === 'PROCESSING' ? "animate-pulse border-accent-blue/40 bg-accent-blue/10" : "border-black/10 bg-black/5"
              )}>
                {task.type === 'STORY' && <BookOpen size={16} />}
                {task.type === 'EMAIL' && <Mail size={16} />}
                {task.type === 'THUMBNAIL' && <ImageIcon size={16} />}
                {task.type === 'DOC' && <FileText size={16} />}
                {task.type === 'GENERAL' && <Zap size={16} />}
              </div>
              <div>
                <div className="text-[11px] font-bold text-black/80 uppercase tracking-tight">{task.title}</div>
                <div className="text-[8px] font-mono text-black/20 uppercase">{task.agentId} NODE // {task.status}</div>
              </div>
            </div>
            <div className={cn(
              "text-[9px] font-black uppercase tracking-widest",
              task.status === 'COMPLETED' ? "text-accent-green" : 
              task.status === 'PROCESSING' ? "text-accent-blue" : "text-black/20"
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
      <div className="p-6 flex items-center justify-between border-b border-black/5">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <LayoutIcon size={14} className="text-accent-blue" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">Studio Controls</h3>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="p-2 hover:bg-black/5 rounded-xl transition-colors mx-auto"
        >
          {isCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
        {/* Navigation Section */}
        <div className="space-y-3">
          {!isCollapsed && <div className="text-[8px] font-black text-black/20 uppercase tracking-[0.2em] mb-2 px-2">Navigation</div>}
          <div className="grid grid-cols-1 gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSubPage(item.id as SubPageId)}
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-2xl transition-all group",
                  activeSubPage === item.id 
                    ? "bg-accent-blue/10 text-accent-blue" 
                    : "text-black/30 hover:bg-black/5 hover:text-black/60"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                  activeSubPage === item.id ? "bg-accent-blue text-white soft-shadow" : "bg-black/5"
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
          {!isCollapsed && <div className="text-[8px] font-black text-black/20 uppercase tracking-[0.2em] mb-2 px-2">Studio Tools</div>}
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
                    expandedTool === tool.name ? "bg-black/5 text-black" : "text-black/30 hover:bg-black/[0.02] hover:text-black/60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                      expandedTool === tool.name ? "bg-accent-blue text-white soft-shadow" : "bg-black/5"
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
                          className="w-full text-left py-2 px-3 text-[10px] font-bold text-black/40 hover:text-accent-blue transition-colors uppercase tracking-widest"
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
          <div className="pt-4 border-t border-black/5">
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
    <GlassCard neonColor="blue" className="p-8 soft-shadow bg-white/40 backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
            <Clipboard size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-black/80">Agent Notepad</h3>
            <p className="text-[9px] font-mono text-black/30 uppercase tracking-widest">Master Orchestration Plan</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isProcessing && (
            <div className="flex items-center gap-2 px-4 py-2 bg-accent-blue/10 text-accent-blue rounded-xl text-[10px] font-black uppercase tracking-widest">
              <RefreshCw size={12} className="animate-spin" />
              Neural Sync Active
            </div>
          )}
        </div>
      </div>
      
      <div className="relative">
        <div className="w-full min-h-[200px] bg-black/[0.02] border border-black/5 rounded-3xl p-8 text-lg font-serif leading-relaxed text-black/70 whitespace-pre-wrap italic">
          {entry?.content || "Awaiting creative directives..."}
        </div>
        <div className="absolute bottom-4 right-8 flex items-center gap-2 text-[8px] font-mono text-black/20 uppercase tracking-widest">
          <Clock size={10} />
          Neural State: {isProcessing ? 'PROCESSING' : 'IDLE'}
        </div>
      </div>
    </GlassCard>
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
    return <div className="whitespace-pre-wrap font-serif text-xl leading-relaxed text-black/70">{content}</div>;
  };

  switch (activeSubPage) {
    case 'writer':
      return (
        <div className="space-y-8">
          {/* Writer Studio: Word Clone Feel */}
          <div className="flex items-center gap-4 mb-6 overflow-x-auto no-scrollbar pb-2">
            {['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Table'].map(item => (
              <button key={item} className="text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-accent-blue transition-colors whitespace-nowrap">{item}</button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-[40px] soft-shadow border border-black/5 p-12 min-h-[800px] relative group">
                <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] font-mono text-black/20 uppercase tracking-widest">Page 1 // 452 Words</span>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  {renderContent(studioContent.writer)}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <GlassCard className="p-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-4">Story Architecture</h4>
                <div className="space-y-4">
                  {['Inciting Incident', 'First Plot Point', 'Midpoint', 'Climax'].map((point, i) => (
                    <div key={point} className="flex items-center gap-3 p-3 bg-black/[0.02] rounded-xl border border-black/5">
                      <div className="w-6 h-6 rounded-lg bg-accent-blue/10 flex items-center justify-center text-[10px] font-black text-accent-blue">{i + 1}</div>
                      <span className="text-[10px] font-bold text-black/60 uppercase">{point}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      );
    case 'artist':
      return (
        <div className="space-y-8">
          {/* Artist Studio: Midjourney Clone Feel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
              <div className="bg-black/90 rounded-[40px] aspect-video flex items-center justify-center relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/20 to-transparent opacity-50" />
                <div className="z-10 flex flex-col items-center gap-6 w-full h-full p-8">
                  {studioContent.artist ? (
                    renderContent(studioContent.artist)
                  ) : (
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center animate-pulse">
                        <Sparkles size={32} className="text-white/40" />
                      </div>
                      <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">Neural Render Engine v6.0</p>
                    </div>
                  )}
                </div>
                {/* Simulated Grid */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-5 pointer-events-none">
                  {Array.from({ length: 16 }).map((_, i) => <div key={i} className="border border-white" />)}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <GlassCard className="p-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-4">Parameters</h4>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-black/40 mb-2">
                      <span>Aspect Ratio</span>
                      <span className="text-accent-purple">16:9</span>
                    </div>
                    <div className="flex gap-2">
                      {['1:1', '4:5', '16:9', '9:16'].map(ratio => (
                        <button key={ratio} className={cn("flex-1 py-2 rounded-lg text-[9px] font-black border transition-all", ratio === '16:9' ? "bg-accent-purple/10 border-accent-purple/20 text-accent-purple" : "bg-black/5 border-black/5 text-black/20")}>{ratio}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-black/40 mb-2">
                      <span>Stylize</span>
                      <span className="text-accent-purple">750</span>
                    </div>
                    <div className="h-1 w-full bg-black/5 rounded-full relative">
                      <div className="absolute inset-y-0 left-0 w-3/4 bg-accent-purple rounded-full" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      );
    case 'music':
      return (
        <div className="space-y-8">
          {/* Music Studio: Lyria Synthesis */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
              <div className="bg-black/90 rounded-[40px] aspect-video flex items-center justify-center relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/20 to-transparent opacity-50" />
                <div className="z-10 flex flex-col items-center gap-6 w-full h-full p-8 overflow-y-auto no-scrollbar">
                  {studioContent.music ? (
                    <div className="text-white/80 text-center max-w-lg">
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-accent-purple/20 flex items-center justify-center animate-pulse">
                          <Music size={24} className="text-accent-purple" />
                        </div>
                        <div className="text-left">
                          <div className="text-[8px] font-black uppercase tracking-widest text-white/40">Now Playing</div>
                          <div className="text-sm font-black uppercase tracking-tight">Neural Composition v1.0</div>
                        </div>
                      </div>
                      {renderContent(studioContent.music.replace('[MUSIC_GENERATED] ', ''))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center animate-pulse">
                        <Music size={32} className="text-white/40" />
                      </div>
                      <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">Lyria Audio Synthesis</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <GlassCard className="p-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-4">Neural Synthesis</h4>
                <div className="space-y-4">
                  {['Tempo Sync', 'Harmonic Balance', 'Neural Depth', 'Spectral Clarity'].map(p => (
                    <div key={p} className="flex justify-between items-center">
                      <span className="text-[10px] text-black/40 uppercase tracking-widest">{p}</span>
                      <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest">Optimal</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      );
    case 'video':
      return (
        <div className="space-y-8">
          {/* Video Studio: Premiere Feel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-black rounded-[40px] aspect-video relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center p-8 overflow-y-auto no-scrollbar">
                  {studioContent.video ? (
                    <div className="text-white/80 text-center max-w-lg">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Storyboard Preview</div>
                      {renderContent(studioContent.video.replace('[VIDEO_GENERATED] ', ''))}
                    </div>
                  ) : (
                    <Video size={48} className="text-white/10" />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                  <div className="flex items-center gap-4 text-white/60 text-[10px] font-mono">
                    <span>00:04:12:15</span>
                    <div className="w-px h-3 bg-white/20" />
                    <span>24 FPS</span>
                  </div>
                  <div className="flex gap-4 text-white/60">
                    <Maximize2 size={16} />
                    <Settings size={16} />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <GlassCard className="p-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-4">Export Settings</h4>
                <div className="space-y-4">
                  <div className="p-3 bg-black/[0.02] rounded-xl border border-black/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-black/60 uppercase">Format</span>
                    <span className="text-[10px] font-black text-accent-blue">H.264 / MP4</span>
                  </div>
                  <div className="p-3 bg-black/[0.02] rounded-xl border border-black/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-black/60 uppercase">Resolution</span>
                    <span className="text-[10px] font-black text-accent-blue">4K (3840x2160)</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      );
    case 'marketing':
      return (
        <div className="space-y-8">
          {/* Marketing Hub: Campaign Center */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[40px] p-10 soft-shadow border border-black/5">
                <h3 className="text-2xl font-black uppercase tracking-tight text-black/80 mb-8">Campaign Orchestrator</h3>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: 'Total Reach', value: '1.2M', trend: '+12%', icon: Users },
                    { label: 'Conversion', value: '4.8%', trend: '+0.5%', icon: Target },
                    { label: 'Ad Spend', value: '$12.4k', trend: '-2%', icon: DollarSign },
                    { label: 'ROI', value: '3.2x', trend: '+15%', icon: TrendingUp },
                  ].map(stat => (
                    <div key={stat.label} className="p-6 bg-black/[0.02] rounded-3xl border border-black/5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white rounded-2xl soft-shadow text-accent-blue"><stat.icon size={20} /></div>
                        <span className="text-[10px] font-black text-accent-green">{stat.trend}</span>
                      </div>
                      <div className="text-[10px] font-black text-black/20 uppercase tracking-widest mb-1">{stat.label}</div>
                      <div className="text-3xl font-black text-black/80">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-[40px] p-10 soft-shadow border border-black/5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-6">Cross-Platform Preview</h4>
                <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar pb-2">
                  {['Instagram', 'Twitter', 'LinkedIn', 'Email'].map(platform => (
                    <button key={platform} className={cn("px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap", platform === 'Instagram' ? "bg-accent-blue/10 border-accent-blue/20 text-accent-blue" : "bg-black/5 border-black/5 text-black/20")}>{platform}</button>
                  ))}
                </div>
                <div className="aspect-square max-w-md mx-auto bg-black/[0.02] border border-black/5 rounded-[40px] p-8 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue font-black text-[10px]">AL</div>
                    <div className="flex flex-col">
                      <div className="h-3 w-32 bg-black/5 rounded-full mb-1" />
                      <div className="text-[8px] font-mono text-black/20 uppercase tracking-widest">Sponsored // Neural Optimized</div>
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-3xl soft-shadow border border-black/5 p-6 overflow-y-auto no-scrollbar">
                    {renderContent(studioContent.marketing)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-4 text-black/20 mb-2">
                      <Heart size={16} />
                      <MessageCircle size={16} />
                      <Share2 size={16} />
                    </div>
                    <div className="h-2 w-full bg-black/5 rounded-full" />
                    <div className="h-2 w-2/3 bg-black/5 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <GlassCard className="p-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-4">Deployment Queue</h4>
                <div className="space-y-3">
                  {['Social Post #1', 'Newsletter Draft', 'Ad Creative A/B'].map(item => (
                    <div key={item} className="p-4 bg-black/[0.02] rounded-2xl border border-black/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-black/60 uppercase">{item}</span>
                      <button className="text-accent-blue"><Rocket size={16} /></button>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className="flex flex-col items-center justify-center py-40 opacity-20">
          <Rocket size={64} className="mb-6" />
          <h3 className="text-xl font-black uppercase tracking-tighter">Workspace Initializing</h3>
          <p className="text-[10px] font-mono uppercase tracking-widest mt-2">Agent Lee is preparing the {activeSubPage} environment</p>
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
      <div className="p-6 flex items-center justify-between border-b border-black/5">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="p-2 hover:bg-black/5 rounded-xl transition-colors mx-auto"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">Asset Library</h3>
            <Database size={14} className="text-accent-purple" />
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
        {/* Active Projects Section */}
        {!isCollapsed && (
          <div className="space-y-3">
            <div className="text-[8px] font-black text-black/20 uppercase tracking-[0.2em] mb-2 px-2">Active Projects</div>
            <div className="grid grid-cols-1 gap-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => console.log(`Switching to Project: ${project.name}`)}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl bg-black/[0.02] border border-black/5 hover:bg-black/[0.05] hover:border-accent-purple/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-black/5 group-hover:text-accent-purple transition-colors shrink-0">
                    <Database size={14} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-black uppercase tracking-widest text-black/60 group-hover:text-black/80 transition-colors">
                      {project.name}
                    </div>
                    <div className="text-[7px] font-mono text-black/20 uppercase tracking-widest">
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
          {!isCollapsed && <div className="text-[8px] font-black text-black/20 uppercase tracking-[0.2em] mb-2 px-2">Components</div>}
          <div className="grid grid-cols-1 gap-2">
            {currentAssetTools.map((tool) => (
              <div key={tool.name} className="space-y-1">
                <button
                  onClick={() => setExpandedTool(expandedTool === tool.name ? null : tool.name)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-2xl transition-all group",
                    expandedTool === tool.name ? "bg-black/5 text-black" : "text-black/30 hover:bg-black/[0.02] hover:text-black/60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                      expandedTool === tool.name ? "bg-accent-purple text-white soft-shadow" : "bg-black/5"
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
                          className="w-full text-left py-2 px-3 text-[10px] font-bold text-black/40 hover:text-accent-purple transition-colors uppercase tracking-widest"
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
    activeGlobalPage, activeSubPage, setActiveSubPage,
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
          "bg-white border-r border-black/5 flex flex-col shrink-0 transition-all duration-500 soft-shadow z-40 relative",
          isLeftPanelCollapsed ? "w-0" : "w-80"
        )}>
          <LeftPanel isCollapsed={isLeftPanelCollapsed} setIsCollapsed={setIsLeftPanelCollapsed} />
          
          {/* Floating Toggle for Collapsed State */}
          {isLeftPanelCollapsed && (
            <button 
              onClick={() => setIsLeftPanelCollapsed(false)}
              className="absolute left-full top-1/2 -translate-y-1/2 ml-4 p-3 bg-white border border-black/5 rounded-2xl soft-shadow text-accent-purple hover:scale-110 transition-all z-50"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </aside>

        {/* Main Content Area: Workspace */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative bg-white/50">
          {/* Sub-page tab bar — always visible */}
          <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-black/5 px-8 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            {[
              { id: 'artist', label: 'Artist', icon: ImageIcon },
              { id: 'writer', label: 'Writer', icon: PenTool },
              { id: 'music', label: 'Music', icon: Radio },
              { id: 'video', label: 'Video', icon: Video },
              { id: 'marketing', label: 'Marketing', icon: Megaphone },
              { id: 'projects', label: 'Projects', icon: Layers },
              { id: 'account', label: 'Account', icon: User },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubPage(tab.id as SubPageId)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap shrink-0",
                  activeSubPage === tab.id
                    ? "border-accent-pink text-accent-pink"
                    : "border-transparent text-black/30 hover:text-black/60"
                )}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter text-black/80">{activeSubPage} Workspace</h2>
                <p className="text-[10px] font-mono text-black/30 uppercase tracking-[0.3em] mt-2">Agent Lee // Creative Node Active</p>
              </div>
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-white border border-black/5 rounded-2xl soft-shadow flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/60">System Stable</span>
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
          "bg-white border-l border-black/5 flex flex-col shrink-0 transition-all duration-500 soft-shadow z-40 relative",
          isToolPanelCollapsed ? "w-0" : "w-80"
        )}>
          <ToolPanel isCollapsed={isToolPanelCollapsed} setIsCollapsed={setIsToolPanelCollapsed} />
          
          {/* Floating Toggle for Collapsed State */}
          {isToolPanelCollapsed && (
            <button 
              onClick={() => setIsToolPanelCollapsed(false)}
              className="absolute right-full top-1/2 -translate-y-1/2 mr-4 p-3 bg-white border border-black/5 rounded-2xl soft-shadow text-accent-blue hover:scale-110 transition-all z-50"
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
                  <h2 className="text-6xl font-black uppercase tracking-tighter leading-none text-black/80">Mission Control</h2>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black tracking-tighter text-black/80">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</div>
                  <div className="text-[10px] text-black/30 uppercase tracking-widest mt-1">UTC // {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <GlassCard neonColor="blue" className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-accent-blue/10 rounded-2xl text-accent-blue">
                      <Cpu size={32} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Neural Load</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black mb-2 text-black/80">84%</div>
                    <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '84%' }}
                        className="h-full bg-accent-blue"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-black/40 uppercase tracking-widest leading-relaxed">
                    Agent Lee is currently processing creative signals across 4 active nodes. Optimization required in 12m.
                  </p>
                </GlassCard>

                <GlassCard neonColor="purple" className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-accent-purple/10 rounded-2xl text-accent-purple">
                      <Zap size={32} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Active Tasks</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black mb-2 text-black/80">{tasks.length}</div>
                    <div className="flex gap-1">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${i < tasks.length ? 'bg-accent-purple' : 'bg-black/5'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-black/40 uppercase tracking-widest">Queue Status</span>
                    <span className="text-[10px] text-accent-purple font-black uppercase tracking-widest">Stable</span>
                  </div>
                </GlassCard>

                <GlassCard neonColor="green" className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-accent-green/10 rounded-2xl text-accent-green">
                      <ShieldCheck size={32} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-black/20">System Governance</div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-black/40 uppercase tracking-widest">Autonomous Mode</span>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", isAutonomous ? "text-accent-green" : "text-black/20")}>
                        {isAutonomous ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-black/40 uppercase tracking-widest">Hands-Free</span>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", isHandsFree ? "text-accent-green" : "text-black/20")}>
                        {isHandsFree ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-black/40 uppercase tracking-widest">Auto-Optimize</span>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", isAutoOptimized ? "text-accent-green" : "text-black/20")}>
                        {isAutoOptimized ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-black/40 uppercase tracking-widest leading-relaxed">
                    System is currently operating in 100% hands-free mode. Agent Lee is managing all creative sub-nodes.
                  </p>
                </GlassCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard className="p-8">
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3 text-black/80">
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
                  <div className="flex justify-between mt-4 text-[8px] text-black/20 uppercase tracking-[0.3em]">
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
              <h2 className="text-4xl font-black uppercase tracking-tighter text-black/80">System Diagnostic</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GlassCard neonColor="green" className="p-8">
                  <div className="text-[10px] font-black uppercase tracking-widest mb-6 text-black/20">Neural Latency (ms)</div>
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
                  <div className="flex justify-between mt-4 text-[8px] font-mono text-black/40 uppercase tracking-widest">
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
                    <div key={sys.name} className="p-4 bg-white border border-black/5 rounded-2xl flex items-center justify-between soft-shadow">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase tracking-widest text-black/60">{sys.name}</span>
                        <span className="text-[8px] font-mono text-black/20">{sys.value}</span>
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
              <h2 className="text-4xl font-black uppercase tracking-tighter text-black/80">Ready for Deployment</h2>
              <p className="text-black/40 max-w-md uppercase text-[10px] tracking-widest leading-relaxed">Your creative assets are staged and ready for edge distribution. Select a target node to begin.</p>
              <button className="px-8 py-4 bg-accent-pink text-white font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-transform soft-shadow">Initialize Push</button>
            </div>
          )}

          {activeGlobalPage === 'code' && (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-black/80">Code Studio</h2>
                  <p className="text-[10px] text-black/30 uppercase tracking-widest mt-1">Neural Scripting Environment</p>
                </div>
                <div className="flex gap-4">
                  <button className="px-4 py-2 bg-white border border-black/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black/5 transition-all soft-shadow">Export</button>
                  <button className="px-4 py-2 bg-accent-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest soft-shadow">Commit</button>
                </div>
              </div>
              <GlassCard neonColor="blue" className="p-1 min-h-[500px] flex">
                <div className="w-12 bg-black/[0.02] border-r border-black/5 flex flex-col items-center py-4 gap-4">
                  <FileText size={18} className="text-accent-blue" />
                  <Search size={18} className="text-black/20" />
                  <Network size={18} className="text-black/20" />
                </div>
                <div className="flex-1 p-6 font-mono text-xs text-black/60 leading-relaxed overflow-y-auto no-scrollbar">
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
                      &nbsp;&nbsp;<span className="text-black/40">// Initialize creative signal</span>
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
              <h2 className="text-4xl font-black uppercase tracking-tighter text-black/80">Memory Lake</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <GlassCard key={i} neonColor="purple" className="p-6 aspect-square flex flex-col justify-between group cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-accent-purple/10 rounded-lg text-accent-purple">
                        <Database size={16} />
                      </div>
                      <div className="text-[8px] font-mono text-black/20">FRAGMENT_{i}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest mb-1 text-black/80">Neural Pattern {i + 1}</div>
                      <div className="text-[8px] text-black/40 uppercase tracking-widest">Stored 2h ago</div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {activeGlobalPage === 'database' && (
            <div className="space-y-8">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-black/80">Databases</h2>
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
                        <div className="text-sm font-black uppercase tracking-widest text-black/80">{db.name}</div>
                        <div className="text-[10px] text-black/40 uppercase tracking-widest mt-1">{db.size} // Enterprise Node</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-1">Load Factor</div>
                        <div className="text-lg font-black text-black/80">{db.load}</div>
                      </div>
                      <button className="p-3 bg-black/5 border border-black/5 rounded-xl hover:bg-black/10 transition-all">
                        <Settings size={18} className="text-black/40" />
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
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-black/80">System Settings</h2>
                  <p className="text-[10px] text-black/30 uppercase tracking-widest mt-1">Neural Governance & Agent Monitoring</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black/40">Agent Monitor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {agents.map(agent => (
                      <GlassCard key={agent.id} className="p-6">
                        <div className="flex justify-between items-start mb-6">
                          <div className={cn("p-3 rounded-2xl bg-white soft-shadow", `text-${agent.color}`)}>
                            <agent.icon size={20} />
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-accent-green uppercase tracking-widest">Online</span>
                            <span className="text-[10px] font-mono text-black/20">Uptime: 142h</span>
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="text-[10px] font-black text-black/80 uppercase tracking-widest">{agent.name}</div>
                          <div className="text-[8px] text-black/40 uppercase font-bold tracking-tighter">{agent.role} // {agent.id}</div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-[7px] font-black uppercase tracking-widest text-black/20 mb-1">
                              <span>Neural Load</span>
                              <span>{Math.floor(Math.random() * 40 + 10)}%</span>
                            </div>
                            <div className="h-1 w-full bg-black/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.floor(Math.random() * 40 + 10)}%` }}
                                className={cn("h-full", `bg-${agent.color}`)}
                              />
                            </div>
                          </div>
                          <div className="p-2 bg-black/[0.02] rounded-lg border border-black/5">
                            <div className="text-[7px] font-black text-black/20 uppercase tracking-widest mb-1">Current Task</div>
                            <div className="text-[9px] font-bold text-black/60 uppercase truncate">Optimizing Neural Bridge...</div>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black/40">System Governance</h3>
                  <GlassCard className="p-8 space-y-8">
                    {[
                      { id: 'autonomous', label: 'Autonomous Mode', desc: 'Allow Agent Lee to initiate tasks independently', state: isAutonomous, setter: setIsAutonomous },
                      { id: 'optimized', label: 'Auto-Optimization', desc: 'Continuous neural path refinement', state: isAutoOptimized, setter: setIsAutoOptimized },
                      { id: 'handsfree', label: 'Hands-Free Execution', desc: 'Zero-click creative orchestration', state: isHandsFree, setter: setIsHandsFree },
                    ].map(setting => (
                      <div key={setting.id} className="flex items-center justify-between gap-6">
                        <div className="flex-1">
                          <div className="text-[10px] font-black text-black/80 uppercase tracking-widest mb-1">{setting.label}</div>
                          <div className="text-[8px] text-black/40 uppercase font-bold tracking-tighter leading-tight">{setting.desc}</div>
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

                    <div className="pt-8 border-t border-black/5">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-black/80 mb-4">
                        <span>Neural Bridge Strength</span>
                        <span className="text-accent-blue">98.4%</span>
                      </div>
                      <div className="h-2 w-full bg-black/5 rounded-full relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 w-[98.4%] bg-accent-blue rounded-full" />
                      </div>
                      <p className="text-[8px] text-black/20 uppercase tracking-widest mt-4 leading-relaxed">
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
              : "bg-black/[0.02] border-black/5 text-black/30 hover:bg-black/[0.05]"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border mb-3 transition-all",
            activeAgent.id === agent.id ? `border-accent-${agent.color.split('-')[1]}/40 bg-accent-${agent.color.split('-')[1]}/20` : "border-black/5 bg-black/5"
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
          <h2 className="text-2xl font-black uppercase tracking-tighter text-[#1d1d1f]">Studio Output</h2>
          <p className="text-[9px] font-mono text-black/30 uppercase tracking-widest">Neural Output Forge</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 bg-black/5 border border-black/5 rounded-xl text-black/40 hover:text-black transition-colors"><Save size={16} /></button>
          <button className="p-2.5 bg-black/5 border border-black/5 rounded-xl text-black/40 hover:text-black transition-colors"><Share2 size={16} /></button>
        </div>
      </div>

      {latestTask ? (
        <GlassCard neonColor={AGENTS.find(a => a.id === latestTask.agentId)?.color.split('-')[1] || 'blue'} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center border border-black/5">
                <Sparkles size={14} className="text-accent-blue" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#1d1d1f]">{latestTask.type} OUTPUT</div>
                <div className="text-[8px] font-mono text-black/30 uppercase">Generated by {latestTask.agentId}</div>
              </div>
            </div>
            <button className="text-[9px] font-black text-accent-blue uppercase tracking-widest hover:underline">Export Asset</button>
          </div>

          <div className="space-y-4">
            {latestTask.output?.startsWith('[IMAGE_GENERATED]') ? (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-black/5 group relative">
                <img src={latestTask.output.split(' ')[1]} alt="Generated" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Neural Render v4.2</span>
                </div>
              </div>
            ) : (
              <div className="bg-black/[0.03] border border-black/5 rounded-2xl p-5 text-[11px] font-mono leading-relaxed text-black/80 whitespace-pre-wrap max-h-96 overflow-y-auto no-scrollbar">
                {latestTask.output}
              </div>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="aspect-video bg-black/5 rounded-[40px] flex flex-col items-center justify-center gap-4 opacity-20 border-dashed border-2 border-black/10">
          <MousePointer2 size={48} className="animate-bounce" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black">Awaiting Neural Input</span>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---

export default function AgentLeeCreatorsStudio() {
  const [activeAgent, setActiveAgent] = useState<Agent>(AGENTS[0]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'EDGE NODE INITIALIZED. Master Agent LEE online. Awaiting creative directives.', agentId: 'LEE', timestamp: Date.now() }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeGlobalPage, setActiveGlobalPage] = useState<GlobalPageId>('studio');
  const [activeSubPage, setActiveSubPage] = useState<SubPageId>('writer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [isToolPanelCollapsed, setIsToolPanelCollapsed] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isAutonomous, setIsAutonomous] = useState(true);
  const [isAutoOptimized, setIsAutoOptimized] = useState(true);
  const [isHandsFree, setIsHandsFree] = useState(true);
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Cyberpunk Novel', status: 'ACTIVE', lastModified: '2026-04-01', icon: BookOpen },
    { id: '2', name: 'Neural Marketing', status: 'ACTIVE', lastModified: '2026-03-30', icon: Megaphone },
    { id: '3', name: 'AI Art Series', status: 'COMPLETED', lastModified: '2026-03-25', icon: ImageIcon },
    { id: '4', name: 'Synthwave Album', status: 'ACTIVE', lastModified: '2026-03-28', icon: Radio },
  ]);
  const [notepad, setNotepad] = useState<NotepadEntry[]>([
    { id: '1', title: 'Daily Plan', content: '1. Write a short story about a robot.\n2. Generate a thumbnail for it.\n3. Draft a marketing email.', timestamp: Date.now() }
  ]);
  const [studioContent, setStudioContentState] = useState<Record<SubPageId, string>>({
    artist: '',
    writer: '',
    music: '',
    video: '',
    marketing: '',
    projects: '',
    account: ''
  });

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
      <div className="flex flex-col h-full bg-[#FDFDFD] text-[#1d1d1f] overflow-hidden font-sans">
        
        {/* Header: System Status & Logo */}
        <header className="h-16 bg-white/80 border-b border-black/5 z-50 backdrop-blur-xl shrink-0">
          <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-black/40 hover:text-accent-blue transition-all active:scale-90 bg-black/5 rounded-lg border border-black/5"
              >
                <Menu size={18} />
              </button>
              <div>
                <h1 className="text-sm font-black uppercase tracking-[0.3em] text-[#1d1d1f]">Agent Lee</h1>
                <p className="text-[8px] font-mono text-black/40 uppercase tracking-widest">Creators Studio // v4.2.0</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-black/5 rounded-full border border-black/5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_8px_#28cd41]" />
                <span className="text-[7px] font-black uppercase tracking-widest text-black/60">Governor Online</span>
              </div>
              <button 
                onClick={() => setIsNotepadOpen(true)}
                className="p-2 text-black/40 hover:text-accent-blue transition-all active:scale-90 bg-black/5 rounded-lg border border-black/5 flex items-center gap-2"
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

        {/* Global Navigation Sidebar Drawer */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/40 z-[80] backdrop-blur-sm"
              />
              <motion.aside
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 w-72 bg-white z-[90] flex flex-col border-r border-black/5 shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="h-16 flex items-center justify-between px-6 border-b border-black/5 shrink-0">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-black/60">Navigation</h2>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
                    <X size={18} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                  {/* Global Pages */}
                  <div className="space-y-1">
                    <div className="text-[8px] font-black uppercase tracking-widest text-black/20 px-3 mb-2">Global Pages</div>
                    {globalNavItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveGlobalPage(item.id); setIsSidebarOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left",
                          activeGlobalPage === item.id
                            ? "bg-accent-blue/10 text-accent-blue"
                            : "text-black/50 hover:bg-black/5 hover:text-black"
                        )}
                      >
                        <item.icon size={16} />
                        <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Sub Pages — only when on studio */}
                  {activeGlobalPage === 'studio' && (
                    <div className="space-y-1 border-t border-black/5 pt-4">
                      <div className="text-[8px] font-black uppercase tracking-widest text-black/20 px-3 mb-2">Studio Sections</div>
                      {subNavItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => { setActiveSubPage(item.id); setIsSidebarOpen(false); }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left",
                            activeSubPage === item.id
                              ? "bg-accent-pink/10 text-accent-pink"
                              : "text-black/50 hover:bg-black/5 hover:text-black"
                          )}
                        >
                          <item.icon size={16} />
                          <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

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
}
