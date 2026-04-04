/*
LEEWAY HEADER — DO NOT REMOVE

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
WHAT = Root layout shell — header, navigation dock, main content area, widget mode, mobile nav
WHY = Provides the persistent OS-level chrome that wraps all pages and the chat console
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/Layout.tsx
WHEN = 2026
HOW = React functional component with motion animations, nav state, and AgentLee widget mode

AGENTS:
ASSESS
AUDIT
GEMINI

LICENSE:
MIT
*/

import React, { useState } from 'react';
import { 
  Home, Activity, Settings, Rocket, Database, Code, Menu, X, 
  ChevronUp, ChevronDown, Maximize2, Minimize2, 
  Crown, HeartPulse, Hammer, Palette, Scroll, Network, ShieldCheck,
  Globe, MessageSquare, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { AgentLee } from './AgentLee';
import { ChatInterface } from './ChatInterface';
import { SystemAwarenessPanel } from './SystemAwarenessPanel';

export type PageId = 'home' | 'diagnostics' | 'settings' | 'deployment' | 'memory' | 'code' | 'database' | 'creators' | 'universe' | 'vm';

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
  backgroundImage = null
}) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState({ x: 20, y: 20 });
  const [isQuickSelectOpen, setIsQuickSelectOpen] = useState(false);

  const FAMILY_COLORS: Record<string, string> = {
    LEE: "#FFD700",
    FORGE: "#F97316",
    ARCHIVE: "#3B82F6",
    AEGIS: "#EF4444",
    AURA: "#EC4899",
    VECTOR: "#06B6D4",
    SENTINEL: "#10B981",
    CORTEX: "#8B5CF6"
  };

  const navItems: { id: PageId; label: string; icon: any; family: string }[] = [
    { id: 'home', label: 'Sovereign', icon: Home, family: 'LEE' },
    { id: 'universe', label: 'Universe', icon: Globe, family: 'LEE' },
    { id: 'diagnostics', label: 'Pulse', icon: HeartPulse, family: 'SENTINEL' },
    { id: 'code', label: 'Forge', icon: Hammer, family: 'FORGE' },
    { id: 'memory', label: 'Archives', icon: Scroll, family: 'ARCHIVE' },
    { id: 'database', label: 'Knowledge', icon: Network, family: 'CORTEX' },
    { id: 'creators', label: 'Aura', icon: Palette, family: 'AURA' },
    { id: 'deployment', label: 'Launch', icon: Rocket, family: 'NEXUS' },
    { id: 'vm', label: 'Workstation', icon: Monitor, family: 'FORGE' },
    { id: 'settings', label: 'System', icon: ShieldCheck, family: 'AEGIS' },
  ];

  const contentPaddingClass = currentPage === 'home'
    ? 'pb-[180px] md:pb-[200px]'
    : 'pb-[140px] md:pb-[150px]';

  return (
    <div className="fixed inset-0 flex flex-col bg-[#FDFDFD] text-black font-sans selection:bg-primary/20 overflow-hidden">
      {/* Background Layer */}
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
              <img src={backgroundImage} alt="Background" className="w-full h-full object-cover blur-2xl" referrerPolicy="no-referrer" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Header */}
      {!isWidgetMode && (
        <header className="p-3 md:p-6 flex items-center justify-between border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50 h-16 md:h-24 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-xl shadow-black/10">
              <Crown className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Agent Lee <span className="text-primary font-mono text-xs ml-1 opacity-50 uppercase">Agentic OS v1.0</span></h1>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-none">System Status: Optimal</p>
            </div>
          </div>

          <div className="hidden xl:block flex-1 max-w-xl mx-6">
            <SystemAwarenessPanel surfaceId={currentPage} variant="shell" />
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Select Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsQuickSelectOpen(!isQuickSelectOpen)}
                className="px-4 py-2 bg-black/5 hover:bg-black/10 rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
              >
                <Database className="w-4 h-4" />
                Engine Library
                <ChevronDown className={cn("w-3 h-3 transition-transform", isQuickSelectOpen && "rotate-180")} />
              </button>
              
              <AnimatePresence>
                {isQuickSelectOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-white border border-black/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
                  >
                    <div className="p-4 border-b border-black/5 bg-black/5">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-50">Saved Manifestations</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2">
                      {savedVoxels.length === 0 ? (
                        <div className="p-4 text-center text-[10px] text-muted-foreground uppercase tracking-widest">No shapes saved</div>
                      ) : (
                        savedVoxels.map((voxel) => (
                          <button
                            key={voxel.id}
                            onClick={() => {
                              onSelectFromLake(voxel);
                              setIsQuickSelectOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-2 hover:bg-black/5 rounded-xl transition-all text-left group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-black/10 overflow-hidden flex-shrink-0">
                              <img src={voxel.image} alt={voxel.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate">{voxel.name}</p>
                              <p className="text-[9px] text-muted-foreground uppercase">{voxel.date}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-black/5">
                      <button 
                        onClick={() => {
                          onPageChange('memory');
                          setIsQuickSelectOpen(false);
                        }}
                        className="w-full py-2 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg transition-all"
                      >
                        View All in Memory Lake
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Removed unused Phone Button and Widget Mode to strictly enforce only global footer console */}
            <button 
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="p-3 hover:bg-black/5 rounded-2xl transition-all md:hidden"
            >
              {isNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 relative overflow-hidden transition-all duration-500",
        isWidgetMode ? "pointer-events-none opacity-0" : "opacity-100"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar ${contentPaddingClass}`}
          >
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 relative min-h-0">
                {children}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Unified Console (Chat + Nav) */}
      {!isWidgetMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none p-2 sm:p-4 md:p-8">
          <div className="max-w-4xl w-full flex flex-col gap-2 md:gap-4 pointer-events-auto">
            
            {/* Integrated Console Unit */}
            <div className="bg-white/95 backdrop-blur-3xl border border-black/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] overflow-hidden rounded-[24px] sm:rounded-[32px] md:rounded-[48px]">
              {/* Chat Interface */}
              <ChatInterface 
                onSendMessage={onSendMessage}
                onFileUpload={onFileUpload}
                onGenerate={onGenerate}
                isGenerating={isGenerating}
                onSave={onSaveToLake}
                onSendToStudio={onSendToStudio}
                hasVoxel={!!voxelCode}
                isListening={isListening}
                onStartVoice={onStartVoice}
                onStopVoice={onStopVoice}
                className="bg-transparent border-none shadow-none p-2 md:p-4"
              />

              {/* Navigation Dock (Integrated) */}
              <nav className="border-t border-black/5 p-1 md:p-2 flex items-center justify-between bg-black/5 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-0.5 md:gap-1 min-w-max px-2">

                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onPageChange(item.id);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-0.5 px-1.5 sm:px-2 md:px-4 py-1 md:py-2 rounded-xl md:rounded-2xl transition-all relative group flex-shrink-0",
                          isActive ? "text-primary bg-white shadow-sm" : "text-muted-foreground hover:text-black hover:bg-white/50"
                        )}
                      >
                        <Icon 
                          className={cn("w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110", isActive && "animate-pulse")} 
                          style={{ color: isActive ? FAMILY_COLORS[item.family] : 'inherit' }}
                        />
                        <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-tighter" style={{ color: isActive ? FAMILY_COLORS[item.family] : 'inherit' }}>{item.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="nav-active"
                            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                            style={{ backgroundColor: FAMILY_COLORS[item.family] }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Floating minimized Agent Lee — right side, drops from header when off home */}
      <AnimatePresence>
        {!isWidgetMode && currentPage !== 'home' && (
          <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.7 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed right-4 top-20 z-40 flex flex-col items-center gap-1"
          >
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shadow-2xl border border-white/30 backdrop-blur-xl bg-white/20">
                <AgentLee
                  voxelCode={voxelCode}
                  isSpeaking={isSpeaking}
                  isChangingForm={isChangingForm}
                  size="small"
                  className="w-full h-full"
                  backgroundImage={backgroundImage}
                />
              </div>
              {isSpeaking && (
                <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400 animate-pulse pointer-events-none" />
              )}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow animate-pulse" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-black/40 bg-white/60 backdrop-blur px-2 py-0.5 rounded-full">Lee</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Mode specific component completely removed per user request */}

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isNavOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] md:hidden"
            onClick={() => setIsNavOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-64 bg-white p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPageChange(item.id);
                      setIsNavOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all",
                      currentPage === item.id ? "bg-primary/10 text-primary" : "hover:bg-black/5"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
