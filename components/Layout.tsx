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
WHAT = Root layout shell  clean header, hamburger drawer (nav + chat), mic footer, floating chat
WHY = Reduced clutter: all interaction lives in hamburger; mic in footer; floating cards on right
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/Layout.tsx
WHEN = 2026
HOW = Hamburger holds nav + AgentLee widget + full ChatConsole; header has title + upload/download/share;
      footer shows only Mac Million Mic; FloatingChat overlays right side for 5-second message cards

AGENTS:
ASSESS
AUDIT
GEMINI

LICENSE:
MIT
*/

import React, { useState, useRef } from 'react';
import {
  Menu, X, Upload, Download, Share2,
  Home, Globe, Activity, Code2, Database,
  Palette, Rocket, Monitor, Settings, BookMarked,
  ChevronDown, Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { AgentLee } from './AgentLee';
import { ChatConsole, ChatMessage } from './ChatConsole';
import { FloatingChat } from './FloatingChat';
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
  isListening?: boolean;
  onStartVoice?: () => void;
  onStopVoice?: () => void;
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
  /** Full conversation history  shown in hamburger drawer and floating cards */
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
  isListening = false,
  onStartVoice,
  onStopVoice,
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

  const handleSave = () => {
    audioOrchestrator.handleEvent('button:click');
    onSaveToLake();
  };

  const handleShare = async () => {
    audioOrchestrator.handleEvent('button:click');
    if (navigator.share) {
      await navigator.share({ title: 'Agent Lee OS', url: window.location.href }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  };

  const handleMicClick = () => {
    if (isListening && onStopVoice) onStopVoice();
    else if (!isListening && onStartVoice) onStartVoice();
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#FDFDFD] text-black font-sans overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#FDFDFD]" />
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
      <header className="relative z-50 shrink-0 h-16 flex items-center justify-between px-4 md:px-6 bg-white/90 backdrop-blur-md border-b border-black/5 shadow-sm">

        {/* Left  hamburger */}
        <button
          aria-label="Open menu"
          onClick={() => { audioOrchestrator.handleEvent('button:click'); setIsDrawerOpen(true); }}
          className="p-2 rounded-2xl hover:bg-black/5 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <Menu className="w-6 h-6 text-black" />
        </button>

        {/* Center  title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
          <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center shadow">
            <Crown className="w-4 h-4 text-yellow-400" />
          </div>
          <h1 className="text-base md:text-lg font-black tracking-tight text-black select-none">
            Agent Lee OS
          </h1>
        </div>

        {/* Right  Upload / Save / Share */}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={handleUploadClick}
            title="Upload file"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 hover:bg-black/10 active:bg-black/15 transition-colors text-black text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          <button
            onClick={handleSave}
            title="Save to Memory Lake"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 hover:bg-black/10 active:bg-black/15 transition-colors text-black text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={handleShare}
            title="Share"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 hover:bg-black/10 active:bg-black/15 transition-colors text-black text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
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
            className="h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar pb-24"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Engine Library  floats near top of hero */}
        <div className="absolute top-3 left-4 z-20">
          <div className="relative">
            <button
              onClick={() => { audioOrchestrator.handleEvent('button:click'); setIsLibraryOpen(p => !p); }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 backdrop-blur border border-black/10 shadow-sm hover:shadow-md hover:bg-white active:scale-95 transition-all text-xs font-bold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              <BookMarked className="w-4 h-4 text-blue-500" />
              Engine Library
              <ChevronDown className={cn('w-3 h-3 transition-transform', isLibraryOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {isLibraryOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute left-0 mt-2 w-64 bg-white border border-black/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-black/5 bg-black/[0.03]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/50">Saved Items</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-2">
                    {savedVoxels.length === 0 ? (
                      <p className="p-4 text-center text-[10px] text-black/40 uppercase tracking-widest">Nothing saved yet</p>
                    ) : (
                      savedVoxels.map(voxel => (
                        <button
                          key={voxel.id}
                          onClick={() => { audioOrchestrator.handleEvent('button:click'); onSelectFromLake(voxel); setIsLibraryOpen(false); }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-black/5 rounded-xl transition-all text-left group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-black/10 overflow-hidden flex-shrink-0">
                            <img src={voxel.image} alt={voxel.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate text-black">{voxel.name}</p>
                            <p className="text-[9px] text-black/40 uppercase">{voxel.date}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-black/5">
                    <button
                      onClick={() => { audioOrchestrator.handleEvent('nav:click'); onPageChange('memory'); setIsLibraryOpen(false); }}
                      className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      Open Memory Lake
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/*  FOOTER  Mac Million Mic only  */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center py-3 pointer-events-none">
        <button
          onClick={handleMicClick}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          className={cn(
            'relative pointer-events-auto rounded-full transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20',
            isListening && 'animate-pulse'
          )}
        >
          {isListening && (
            <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-60 pointer-events-none" />
          )}
          <img
            src="/images/MacMillionMic.png"
            alt="Tap to speak"
            className={cn(
              'w-16 h-16 object-contain drop-shadow-lg transition-all',
              isListening
                ? 'scale-110 drop-shadow-[0_0_14px_rgba(239,68,68,0.7)]'
                : 'drop-shadow-[0_0_8px_rgba(0,0,0,0.25)] hover:scale-105'
            )}
          />
        </button>
      </footer>

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
              className="fixed left-0 top-0 bottom-0 z-[200] w-[320px] max-w-[90vw] bg-white flex flex-col shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Drawer header */}
              <div className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-black/5 bg-black/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <span className="text-sm font-black tracking-tight">Menu</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl hover:bg-black/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* AgentLee mini status */}
              <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-black/5">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-black/10 shadow-sm bg-black/5">
                  <AgentLee
                    voxelCode={voxelCode}
                    isSpeaking={isSpeaking}
                    isChangingForm={isChangingForm}
                    size="small"
                    className="w-full h-full"
                    backgroundImage={backgroundImage}
                  />
                  {isSpeaking && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400 animate-pulse pointer-events-none" />
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight">Agent Lee</p>
                  <p className="text-[10px] text-black/40 uppercase tracking-widest font-semibold">
                    {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Ready'}
                  </p>
                </div>
              </div>

              {/* Navigation grid */}
              <nav className="shrink-0 px-2 py-2 border-b border-black/5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-black/30 px-2 mb-1.5">Pages</p>
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
                          active ? 'font-black shadow-sm' : 'text-black/60 hover:text-black hover:bg-black/5 font-bold'
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
                  onStartVoice={onStartVoice}
                  onStopVoice={onStopVoice}
                  isListening={isListening}
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
