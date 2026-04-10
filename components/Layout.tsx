/*
LEEWAY HEADER  DO NOT REMOVE

REGION: UI.COMPONENT.LAYOUT.SHELL
TAG: UI.COMPONENT.LAYOUT.SHELL.ROOT

COLOR_ONION_HEX:
NEON=#00FFFF
FLUO=#00E5FF
PASTEL=#B2EBF2

ICON_ASCII:
family=lucide
glyph=layout-dashboard

5WH:
WHAT = Root layout shell  clean header, hamburger drawer (nav + chat), AgentleeMic footer, floating chat
WHY = Reduced clutter: all interaction lives in hamburger; 3D voxel mic in footer; floating cards on right
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/Layout.tsx
WHEN = 2026
HOW = Hamburger holds nav + AgentLee widget + full ChatConsole; header has title + upload/download/share;
      footer shows only AgentleeMic (advanced 3D voxel); FloatingChat overlays right side for 5-second message cards

AGENTS:
ASSESS
AUDIT
leeway

LICENSE:
MIT
*/

import React, { useState, useRef } from 'react';
import {
  Menu, X,
  Home, Globe, Activity, Code2, Database,
  Palette, Rocket, Monitor, Settings, BookMarked,
  ChevronDown, Crown, Upload,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { AgentLee } from './AgentLee';
import { ChatConsole, ChatMessage } from './ChatConsole';
import { FloatingChat } from './FloatingChat';
import { AgentLeeWidget } from './AgentLeeWidget';
import { AgentLeeMic, AgentState, AgentLeeMicProps } from './AgentleeMic';
import { audioOrchestrator } from '../utils/audioOrchestrator';

export type PageId =
  | 'home' | 'diagnostics' | 'settings' | 'deployment'
  | 'memory' | 'code' | 'database' | 'creators'
  | 'universe' | 'vm';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
  voxelCode: string | null;
  isSpeaking?: boolean;
  isChangingForm?: boolean;
  onSendMessage: (msg: string) => void;
  onFileUpload: (file: File) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  savedVoxels: any[];
  onSaveToLake: () => void;
  onSelectFromLake: (voxel: any) => void;
  onSendToStudio?: () => void;
  backgroundImage?: string | null;
  /** Full conversation history — shown in hamburger drawer and floating cards */
  messages?: ChatMessage[];
}

// Navigation items with plain, readable labels
const NAV_ITEMS: { id: PageId; label: string; icon: any; color: string }[] = [
  { id: 'home',        label: 'Home',         icon: Home,       color: '#FFD700' },
  { id: 'universe',    label: 'Universe',     icon: Globe,      color: '#FFD700' },
  { id: 'diagnostics', label: 'Status',       icon: Activity,   color: '#10B981' },
  { id: 'code',        label: 'Code Lab',     icon: Code2,      color: '#F97316' },
  { id: 'memory',      label: 'Memory Lake',  icon: BookMarked, color: '#3B82F6' },
  { id: 'database',    label: 'Database',     icon: Database,   color: '#8B5CF6' },
  { id: 'creators',    label: 'Studio',       icon: Palette,    color: '#EC4899' },
  { id: 'deployment',  label: 'Launch',       icon: Rocket,     color: '#06B6D4' },
  { id: 'vm',          label: 'Workstation',  icon: Monitor,    color: '#F97316' },
  { id: 'settings',    label: 'Settings',     icon: Settings,   color: '#EF4444' },
];

function audioNavClick(
  id: PageId,
  current: PageId,
  onPageChange: (p: PageId) => void,
  onClose: () => void
) {
  if (id !== current) {
    audioOrchestrator.handleEvent('nav:click');
    onPageChange(id);
  }
  onClose();
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentPage,
  onPageChange,
  voxelCode,
  isSpeaking = false,
  isChangingForm = false,
  onSendMessage,
  onFileUpload,
  onGenerate,
  isGenerating = false,
  savedVoxels,
  onSaveToLake,
  onSelectFromLake,
  onSendToStudio,
  backgroundImage = null,
  messages = [],
}) => {
  const [isDrawerOpen, setIsDrawerOpen]   = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    audioOrchestrator.handleEvent('button:click');
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white font-sans overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-black" />
        <AnimatePresence>
          {backgroundImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <img
                src={backgroundImage}
                alt=""
                className="w-full h-full object-cover blur-2xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/*  HEADER  */}
      <header className="relative z-50 shrink-0 h-16 flex items-center justify-between px-4 md:px-6 bg-[#020408]/95 backdrop-blur-md border-b border-white/[0.06]">

        {/* Left  hamburger */}
        <button
          aria-label="Open menu"
          onClick={() => { audioOrchestrator.handleEvent('button:click'); setIsDrawerOpen(true); }}
          className="p-2 rounded-2xl hover:bg-white/[0.07] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>

        {/* Center  title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
          <div className="w-7 h-7 bg-[#00f2ff]/10 border border-[#00f2ff]/30 rounded-lg flex items-center justify-center">
            <Crown className="w-4 h-4 text-yellow-400" />
          </div>
          <h1 className="text-base md:text-lg font-black tracking-tight text-white select-none">
            Agent Lee OS
          </h1>
        </div>

        {/* Right — intentionally empty */}
        <div />
      </header>

      {/*  MAIN CONTENT  */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={
              ['code', 'creators', 'deployment', 'vm'].includes(currentPage)
                ? 'h-full w-full overflow-hidden'
                : 'h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar pb-64'
            }
          >
            {children}
          </motion.div>
        </AnimatePresence>

      </main>


      {/*  AGENTLEE MIC — Fixed Bottom Center, No Footer  */}
      <div className="fixed bottom-4 left-1/2 z-[1001] -translate-x-1/2 pointer-events-none">
        <div className="pointer-events-auto rounded-full transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none">
            {(
              <AgentLeeMic
                compact={true}
                className="w-32 h-32"
                onStateChange={(state: AgentState) => {
                  if (state !== AgentState.IDLE && state !== AgentState.LISTENING) {
                    audioOrchestrator.handleEvent('agent:active');
                  }
                  if (state === AgentState.ERROR) {
                    console.error('[Layout] Mic Error - Check RTC status and .env configuration');
                  }
                }}
              />
            ) as React.ReactElement<AgentLeeMicProps, typeof AgentLeeMic>}
        </div>
      </div>

      {/*  FLOATING CHAT (right side, TikTok-style)  */}
      <FloatingChat messages={messages} />

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/*  HAMBURGER DRAWER  */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              key="bd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-black/30 backdrop-blur-sm"
              onClick={() => setIsDrawerOpen(false)}
            />

            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 36 }}
              className="fixed left-0 top-0 bottom-0 z-[200] w-[320px] max-w-[90vw] bg-[#08101e] flex flex-col shadow-2xl shadow-black/60 border-r border-white/[0.06] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Drawer header */}
              <div className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#00f2ff]/10 border border-[#00f2ff]/30 rounded-md flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <span className="text-sm font-black tracking-tight text-white">Menu</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/[0.07] transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* AgentLee mini status */}
              <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/[0.1] bg-slate-800/50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent" />
                  <div className="text-[10px] font-black text-cyan-400">LEE</div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#08101e]" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight">Agent Lee</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">
                    {isSpeaking ? 'Speaking' : 'Ready'}
                  </p>
                </div>
              </div>

              {/* Engine Library */}
              <div className="shrink-0 px-2 py-2 border-b border-white/[0.06]">
                <button
                  onClick={() => { audioOrchestrator.handleEvent('button:click'); setIsLibraryOpen(p => !p); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/[0.06] transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">Engine Library</span>
                  </div>
                  <ChevronDown className={cn('w-3.5 h-3.5 text-white/40 transition-transform', isLibraryOpen && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {isLibraryOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 rounded-xl border border-white/[0.08] overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {savedVoxels.length === 0 ? (
                            <p className="p-3 text-center text-[10px] text-white/40 uppercase tracking-widest">Nothing saved yet</p>
                          ) : (
                            savedVoxels.map(voxel => (
                              <button
                                key={voxel.id}
                                onClick={() => { audioOrchestrator.handleEvent('button:click'); onSelectFromLake(voxel); setIsLibraryOpen(false); setIsDrawerOpen(false); }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-white/[0.06] transition-all text-left group">
                                <div className="w-8 h-8 rounded-lg bg-black/10 overflow-hidden flex-shrink-0">
                                  <img src={voxel.image} alt={voxel.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate text-white">{voxel.name}</p>
                                  <p className="text-[9px] text-white/40 uppercase">{voxel.date}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                        <div className="border-t border-white/[0.06] p-1">
                          <button
                            onClick={() => { audioOrchestrator.handleEvent('nav:click'); onPageChange('memory'); setIsLibraryOpen(false); setIsDrawerOpen(false); }}
                            className="w-full flex items-center gap-1.5 justify-center py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all">
                            <Upload className="w-3 h-3" />
                            Open Memory Lake
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation grid */}
              <nav className="shrink-0 px-2 py-2 border-b border-white/[0.06]">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 px-2 mb-1.5">Pages</p>
                <div className="grid grid-cols-2 gap-1">
                  {NAV_ITEMS.map(item => {
                    const Icon = item.icon;
                    const active = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => audioNavClick(item.id, currentPage, onPageChange, () => setIsDrawerOpen(false))}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-left focus-visible:outline-none focus-visible:ring-2',
                          active ? 'font-black shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/[0.07] font-bold'
                        )}
                        style={active ? { background: `${item.color}1A`, color: item.color } : {}}
                      >
                        <Icon className="w-4 h-4 shrink-0" style={{ color: active ? item.color : 'inherit' }} />
                        <span className="text-xs truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Chat history + input (fills remaining height) */}
              <div className="flex-1 overflow-hidden">
                <ChatConsole
                  messages={messages}
                  onSendMessage={onSendMessage}
                  className="h-full border-none shadow-none rounded-none bg-transparent"
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

