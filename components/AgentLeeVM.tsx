/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.COMPONENT.VM.WORKSTATION
TAG: UI.COMPONENT.VM.WORKSTATION.AGENTLEE

COLOR_ONION_HEX:
NEON=#00E5FF
FLUO=#67E8F9
PASTEL=#CFFAFE

ICON_ASCII:
family=lucide
glyph=monitor

5WH:
WHAT = Agent Lee VM workstation component for execution, editing, preview, and console workflows
WHY = Serves as the controlled hands-on execution environment for agent-directed coding and system operations
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/AgentLeeVM.tsx
WHEN = 2026
HOW = React VM surface integrating editor, terminal, browser, memory/diagnostics switching, and event-driven interaction

AGENTS:
ASSESS
AUDIT
NOVA
SHIELD

LICENSE:
MIT
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  auth, 
  db, 
  signInWithPopup, 
  googleProvider, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  handleFirestoreError,
  testConnection,
  User as FirebaseUser
} from './firebase.ts';
import { 
  Terminal as TerminalIcon, 
  Code, 
  Globe, 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  Save, 
  Play, 
  RotateCcw, 
  X, 
  Maximize2, 
  Minimize2,
  Search,
  Settings,
  User,
  Layout,
  Layers,
  Zap,
  Cpu,
  Shield,
  Activity,
  MessageSquare,
  Send,
  Loader2,
  Monitor,
  FileText,
  CheckSquare,
  Square,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

// --- Types ---
export interface VFSFile {
  name: string;
  content: string;
  type: 'file';
  path: string;
}

export interface VFSDirectory {
  name: string;
  type: 'dir';
  path: string;
  children: (VFSFile | VFSDirectory)[];
}

export type VFSItem = VFSFile | VFSDirectory;

// --- Initial VFS ---
export const initialVFS: VFSDirectory = {
  name: 'root',
  type: 'dir',
  path: '/',
  children: [
    {
      name: 'src',
      type: 'dir',
      path: '/src',
      children: [
        {
          name: 'App.tsx',
          type: 'file',
          path: '/src/App.tsx',
          content: 'import React from "react";\n\nexport default function App() {\n  return (\n    <div className="p-8 bg-zinc-900 text-white min-h-screen">\n      <h1 className="text-4xl font-bold text-blue-500">Hello Agent Lee VM!</h1>\n      <p className="mt-4 text-zinc-400">This is a live preview from your virtual workspace.</p>\n    </div>\n  );\n}'
        },
        {
          name: 'index.css',
          type: 'file',
          path: '/src/index.css',
          content: 'body { margin: 0; font-family: sans-serif; }'
        },
        {
          name: 'plan.md',
          type: 'file',
          path: '/src/plan.md',
          content: '# Agent Lee Workspace Plan\n\n1. Initialize System\n2. Awaiting User Command...'
        }
      ]
    },
    {
      name: 'package.json',
      type: 'file',
      path: '/package.json',
      content: '{\n  "name": "leevm-project",\n  "dependencies": {\n    "react": "^18.0.0"\n  }\n}'
    },
    {
      name: 'index.html',
      type: 'file',
      path: '/index.html',
      content: '<!DOCTYPE html>\n<html>\n<head>\n  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>\n  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>\n  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="text/babel">\n    const App = () => (\n      <div className="p-8 bg-zinc-900 text-white min-h-screen flex flex-col items-center justify-center text-center">\n        <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg">🍌</div>\n        <h1 className="text-4xl font-black italic tracking-tighter text-yellow-500 mb-2">AgentLeeVM-3000</h1>\n        <p className="text-zinc-400 font-mono text-sm">System initialized. Agent Lee is standing by.</p>\n        <div className="mt-8 p-4 border border-white/10 rounded-lg bg-white/5">\n          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Command the agent to update this view</p>\n        </div>\n      </div>\n    );\n    const root = ReactDOM.createRoot(document.getElementById("root"));\n    root.render(<App />);\n  </script>\n</body>\n</html>'
    },
    {
      name: 'README.md',
      type: 'file',
      path: '/README.md',
      content: '# Agent Lee VM Workspace\n\nWelcome to your Agent Lee Virtual Machine.'
    }
  ]
};

// --- Helper Functions ---
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

const findItemByPath = (vfs: VFSDirectory, path: string): VFSItem | null => {
  if (path === '/') return vfs;
  const parts = path.split('/').filter(Boolean);
  let current: VFSItem = vfs;

  for (const part of parts) {
    if (current.type === 'dir') {
      const found = current.children.find(child => child.name === part);
      if (found) {
        current = found;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
  return current;
};

// --- Components ---

const FileTreeItem: React.FC<{
  item: VFSItem;
  level: number;
  onSelect: (path: string) => void;
  selectedPath: string;
}> = ({ item, level, onSelect, selectedPath }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = selectedPath === item.path;

  if (item.type === 'file') {
    return (
      <button
        onClick={() => onSelect(item.path)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1 text-xs hover:bg-white/5 transition-colors",
          isSelected ? "bg-blue-500/20 text-blue-400 border-l-2 border-blue-500" : "text-zinc-400"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <File size={14} className="shrink-0" />
        <span className="truncate">{item.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-2 py-1 text-xs text-zinc-300 hover:bg-white/5 transition-colors"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Folder size={14} className="text-blue-400 shrink-0" />
        <span className="truncate">{item.name}</span>
      </button>
      {isOpen && (
        <div>
          {item.children.map((child, i) => (
            <FileTreeItem 
              key={i} 
              item={child} 
              level={level + 1} 
              onSelect={onSelect} 
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- OS Apps ---

const Desktop: React.FC<{ onOpenApp: (app: string) => void, installedPackages: string[] }> = ({ onOpenApp, installedPackages }) => {
  const apps = [
    { id: 'vscode', name: 'LeeCode', icon: <Code size={24} />, color: 'text-blue-400' },
    { id: 'browser', name: 'Web Search', icon: <Globe size={24} />, color: 'text-orange-400' },
    { id: 'notepad', name: 'Notepad', icon: <FileText size={24} />, color: 'text-yellow-400' },
    { id: 'pallium', name: 'Pallium', icon: <Folder size={24} />, color: 'text-cyan-400' },
    { id: 'database', name: 'Database', icon: <Database size={24} />, color: 'text-purple-400' },
    { id: 'diagnostics', name: 'Diagnostics', icon: <Activity size={24} />, color: 'text-green-400' },
    { id: 'terminal', name: 'Terminal', icon: <TerminalIcon size={24} />, color: 'text-zinc-400' },
  ];

  const packageApps = [
    { id: 'termux', name: 'Termux', icon: <TerminalIcon size={24} />, color: 'text-green-500' },
    { id: 'userland', name: 'UserLAnd', icon: <Layers size={24} />, color: 'text-blue-500' },
    { id: 'andronix', name: 'Andronix', icon: <Zap size={24} />, color: 'text-orange-500' },
    { id: 'pydroid3', name: 'Pydroid 3', icon: <Code size={24} />, color: 'text-yellow-500' },
  ];

  return (
    <div className="flex-grow bg-[#008080] p-4 flex flex-col gap-8 overflow-y-auto">
      <div className="grid grid-cols-4 gap-4 content-start">
        {apps.map(app => (
          <button
            key={app.id}
            onClick={() => onOpenApp(app.id)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={cn("p-3 bg-zinc-900/20 rounded-lg border border-transparent group-hover:border-white/20 group-hover:bg-zinc-900/40 transition-all shadow-lg", app.color)}>
              {app.icon}
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">{app.name}</span>
          </button>
        ))}
      </div>

      {installedPackages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className="h-px flex-grow bg-white/20" />
            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Installed Packages</span>
            <div className="h-px flex-grow bg-white/20" />
          </div>
          <div className="grid grid-cols-4 gap-4 content-start">
            {packageApps.filter(p => installedPackages.includes(p.id)).map(app => (
              <button
                key={app.id}
                onClick={() => onOpenApp('terminal')} // Open terminal for these for now
                className="flex flex-col items-center gap-1 group"
              >
                <div className={cn("p-3 bg-zinc-900/20 rounded-lg border border-transparent group-hover:border-white/20 group-hover:bg-zinc-900/40 transition-all shadow-lg", app.color)}>
                  {app.icon}
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-md">{app.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Notepad: React.FC<{ content: string }> = ({ content }) => {
  // Simple task parser: lines starting with "- [ ]" or "- [x]"
  const lines = content.split('\n');
  
  return (
    <div className="flex-grow flex flex-col bg-white text-zinc-900 font-sans p-4 overflow-y-auto">
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 mb-4">
        <FileText size={16} className="text-yellow-600" />
        <h2 className="text-xs font-bold uppercase tracking-tighter">Agent Lee's Notepad</h2>
      </div>
      <div className="space-y-2">
        {lines.map((line, i) => {
          const isTask = line.trim().startsWith('- [');
          if (isTask) {
            const checked = line.includes('[x]');
            const text = line.replace(/- \[( |x)\]/, '').trim();
            return (
              <div key={i} className="flex items-start gap-2 group">
                {checked ? (
                  <CheckSquare size={14} className="text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <Square size={14} className="text-zinc-300 shrink-0 mt-0.5" />
                )}
                <span className={cn("text-xs", checked && "line-through text-zinc-400 italic")}>
                  {text}
                </span>
              </div>
            );
          }
          if (line.startsWith('#')) {
            return <h3 key={i} className="text-sm font-black mt-4 mb-2 text-zinc-800">{line.replace(/^#+/, '').trim()}</h3>;
          }
          return <p key={i} className="text-xs leading-relaxed">{line}</p>;
        })}
      </div>
    </div>
  );
};

const Browser: React.FC<{ messages: any[], externalInput?: string }> = ({ messages, externalInput }) => {
  const lastSearch = [...messages].reverse().find(m => m.content.startsWith('[SEARCH]'));
  const initialSearch = lastSearch ? lastSearch.content.replace('[SEARCH]', '').split('Found')[0].trim() : '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const lastSearchRef = useRef(initialSearch);

  useEffect(() => {
    if (initialSearch !== lastSearchRef.current) {
      setSearchQuery(initialSearch);
      lastSearchRef.current = initialSearch;
    }
  }, [initialSearch]);

  useEffect(() => {
    if (externalInput) {
      if (externalInput === 'BKSP') setSearchQuery(prev => prev.slice(0, -1));
      else if (externalInput === 'SPACE') setSearchQuery(prev => prev + ' ');
      else if (externalInput === 'ENTER') {
        // Trigger search logic if needed
      } else if (['SHIFT', 'CTRL', 'ALT', 'WIN', 'FN', 'CAPS', 'ESC', 'TAB', '←', '↑', '↓', '→'].includes(externalInput)) {
        // Ignore
      } else if (externalInput.length === 1) {
        setSearchQuery(prev => prev + externalInput.toLowerCase());
      }
    }
  }, [externalInput]);

  return (
    <div className="flex-grow flex flex-col bg-[#f0f0f0] text-zinc-900 font-sans">
      <div className="bg-zinc-200 p-2 border-b border-zinc-300 flex items-center gap-2">
        <div className="flex gap-1.5 px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-grow bg-white border border-zinc-300 rounded px-3 py-1 text-[10px] flex items-center gap-2 shadow-inner">
          <Globe size={10} className="text-zinc-400" />
          <span className="truncate text-zinc-600">https://www.google.com/search?q={searchQuery || 'agent-lee'}</span>
        </div>
      </div>
      
      <div className="flex-grow p-6 overflow-y-auto bg-white">
        {!searchQuery ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <h1 className="text-4xl font-black italic tracking-tighter text-blue-600">
              <span className="text-blue-500">G</span>
              <span className="text-red-500">o</span>
              <span className="text-yellow-500">o</span>
              <span className="text-blue-500">g</span>
              <span className="text-green-500">l</span>
              <span className="text-red-500">e</span>
            </h1>
            <div className="w-full max-w-sm h-10 border border-zinc-200 rounded-full shadow-sm flex items-center px-4 gap-3">
              <Search size={16} className="text-zinc-400" />
              <span className="text-zinc-300 text-sm">Search Google or type a URL</span>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-xs text-zinc-500 mb-4">About 1,240,000 results (0.42 seconds)</div>
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-1">
                <div className="text-[10px] text-zinc-600 truncate">https://www.duckduckgo.com › result › {i}</div>
                <h3 className="text-blue-700 text-base font-medium hover:underline cursor-pointer">
                  {searchQuery} - Search Results {i}
                </h3>
                <p className="text-xs text-zinc-700 leading-relaxed">
                  This is a simulated search result for "{searchQuery}". Agent Lee is currently analyzing this page to extract relevant information for your request.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Error Boundary ---
const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const Pallium: React.FC<{ user: FirebaseUser | null }> = ({ user }) => {
  const [view, setView] = useState<'drives' | 'slots' | 'tabs' | 'database'>('drives');
  const [selectedDrive, setSelectedDrive] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const drives = ['Lee', 'L', 'E', 'O', 'N', 'A', 'R', 'D'];
  const slots = Array.from({ length: 8 }, (_, i) => i + 1);
  const tabs = Array.from({ length: 8 }, (_, i) => i + 1);

  useEffect(() => {
    if (view === 'database' && user) {
      setIsLoading(true);
      const q = query(
        collection(db, 'drives', 'Lee', 'records'),
        orderBy('lastSync', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedRecords = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecords(fetchedRecords);
        setIsLoading(false);
      }, (error) => {
        handleFirestoreError(error, 'list', 'drives/Lee/records');
        setIsLoading(false);
      });

      return () => unsubscribe();
    }
  }, [view, user]);

  const addMockRecord = async () => {
    if (!user) return;
    try {
      const driveRef = doc(db, 'drives', 'Lee');
      await setDoc(driveRef, {
        name: 'Lee',
        ownerId: user.uid,
        createdAt: Timestamp.now()
      }, { merge: true });

      const recordRef = doc(collection(db, 'drives', 'Lee', 'records'));
      await setDoc(recordRef, {
        uid: `0x${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
        type: 'LOG',
        status: 'ACTIVE',
        content: `System check at ${new Date().toLocaleTimeString()}`,
        lastSync: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, 'write', 'drives/Lee/records');
    }
  };

  return (
    <div className="flex-grow flex flex-col bg-[#c0c0c0] text-zinc-900 font-sans overflow-hidden">
      <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Folder size={12} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Memory Lake Explorer</span>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => setView('database')}
            className="px-2 bg-purple-600 text-white border border-white shadow-[1px_1px_0_#404040] text-[8px]"
          >
            DB MODE
          </button>
          {view !== 'drives' && (
            <button 
              onClick={() => {
                if (view === 'tabs') setView('slots');
                else if (view === 'database') setView('drives');
                else setView('drives');
              }}
              className="px-2 bg-[#c0c0c0] text-black border border-white shadow-[1px_1px_0_#808080] text-[8px]"
            >
              BACK
            </button>
          )}
        </div>
      </div>

      <div className="p-1 bg-[#c0c0c0] border-b border-zinc-500 flex items-center gap-2 text-[8px] font-mono">
        <span className="text-zinc-500">PATH:</span>
        <span className="bg-white border border-zinc-400 px-2 flex-grow">
          ROOT / {view === 'database' ? 'DATABASE_MODE' : `${selectedDrive && `${selectedDrive} DRIVE`} ${selectedSlot && `/ SLOT ${selectedSlot}`}`}
        </span>
      </div>

      <div className="flex-grow p-4 overflow-y-auto bg-white m-2 border-2 border-zinc-500 shadow-inner">
        {view === 'database' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-1 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black italic text-purple-700">MEMORY_LAKE_DB_v1.0</span>
                {user && (
                  <button 
                    onClick={addMockRecord}
                    className="px-1 bg-zinc-100 border border-zinc-300 text-[7px] font-bold hover:bg-zinc-200"
                  >
                    + ADD RECORD
                  </button>
                )}
              </div>
              <span className={cn("text-[8px]", user ? "text-green-600" : "text-red-600")}>
                {user ? "CONNECTED" : "OFFLINE (LOGIN REQ)"}
              </span>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-20 text-[10px] animate-pulse">Loading records...</div>
            ) : records.length > 0 ? (
              <table className="w-full text-[9px] border-collapse">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-300">
                    <th className="p-1 text-left">UID</th>
                    <th className="p-1 text-left">RECORD_TYPE</th>
                    <th className="p-1 text-left">STATUS</th>
                    <th className="p-1 text-left">LAST_SYNC</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => (
                    <tr key={record.id} className="border-b border-zinc-100 hover:bg-purple-50">
                      <td className="p-1 font-mono text-zinc-500">{record.uid}</td>
                      <td className="p-1">{record.type}</td>
                      <td className="p-1">
                        <span className={cn(
                          "px-1 rounded-[2px]",
                          record.status === 'ACTIVE' ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-700"
                        )}>
                          {record.status}
                        </span>
                      </td>
                      <td className="p-1 text-zinc-400">
                        {record.lastSync instanceof Timestamp ? record.lastSync.toDate().toLocaleTimeString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-[10px] text-zinc-400">
                {user ? "No records found in Lee Drive." : "Please login via Database Explorer to view records."}
              </div>
            )}
          </div>
        ) : (
          <>
            {view === 'drives' && (
              <div className="grid grid-cols-4 gap-4">
                {drives.map(drive => (
                  <button 
                    key={drive}
                    onClick={() => { setSelectedDrive(drive); setView('slots'); }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="p-2 bg-zinc-100 rounded border border-zinc-300 group-hover:bg-cyan-50 group-hover:border-cyan-400 transition-all">
                      <Monitor size={24} className={drive === 'Lee' ? "text-blue-600" : "text-cyan-600"} />
                    </div>
                    <span className="text-[9px] font-bold">{drive}: Drive</span>
                  </button>
                ))}
              </div>
            )}

            {view === 'slots' && (
              <div className="grid grid-cols-4 gap-4">
                {slots.map(slot => (
                  <button 
                    key={slot}
                    onClick={() => { setSelectedSlot(slot); setView('tabs'); }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="p-2 bg-zinc-100 rounded border border-zinc-300 group-hover:bg-cyan-50 group-hover:border-cyan-400 transition-all">
                      <Layers size={24} className="text-cyan-500" />
                    </div>
                    <span className="text-[9px] font-bold">Slot {slot}</span>
                  </button>
                ))}
              </div>
            )}

            {view === 'tabs' && (
              <div className="grid grid-cols-4 gap-4">
                {tabs.map(tab => (
                  <div 
                    key={tab}
                    className="flex flex-col items-center gap-1 opacity-80"
                  >
                    <div className="p-2 bg-zinc-50 rounded border border-zinc-200">
                      <File size={24} className="text-zinc-400" />
                    </div>
                    <span className="text-[9px] font-bold">Tab {tab}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const DatabaseExplorer: React.FC<{ user: FirebaseUser | null }> = ({ user }) => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <div className="flex-grow flex flex-col bg-[#f5f5f5] text-zinc-900 font-sans p-4 overflow-y-auto">
      <div className="flex items-center gap-2 border-b border-zinc-300 pb-2 mb-4">
        <Database size={20} className="text-purple-600" />
        <h2 className="text-sm font-black uppercase tracking-widest">Database Explorer</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="p-4 bg-white border border-zinc-300 rounded shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", user ? "bg-green-500" : "bg-red-500")} />
              <span className="text-xs font-bold">Firebase Connection</span>
            </div>
            <span className="text-[10px] text-zinc-500">v9.22.0</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-[8px] text-zinc-400 uppercase font-bold">User Status</label>
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-mono bg-green-50 p-1 border border-green-200 rounded text-green-700 truncate max-w-[150px]">
                    {user.email}
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-[8px] font-bold text-red-600 hover:underline"
                  >
                    DISCONNECT
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="w-full py-2 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Globe size={12} />
                  CONNECT TO FIREBASE
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[8px] text-zinc-400 uppercase font-bold">Database Status</label>
              <div className={cn("text-[10px] font-bold", user ? "text-green-600" : "text-zinc-400")}>
                {user ? "ONLINE / READY" : "WAITING FOR AUTH"}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-zinc-300 rounded shadow-sm">
          <h3 className="text-[10px] font-bold uppercase mb-2">Memory Lake Integration</h3>
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            Memory Lake is currently serving as the primary relational database for Agent Lee VM. 
            All 8 drives (Lee, L, E, O, N, A, R, D) are indexed and queryable via the Database Explorer.
          </p>
          <div className="mt-4 flex gap-2">
            <button className="px-3 py-1 bg-purple-600 text-white text-[9px] font-bold rounded hover:bg-purple-700 transition-colors">
              RUN QUERY
            </button>
            <button className="px-3 py-1 border border-purple-600 text-purple-600 text-[9px] font-bold rounded hover:bg-purple-50 transition-colors">
              SYNC DATA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Diagnostics: React.FC = () => {
  const [metrics, setMetrics] = useState({
    cpu: 0,
    ram: 0,
    battery: 100,
    temp: 32,
    uptime: '00:00:00'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.floor(Math.random() * 40) + 10,
        ram: Math.floor(Math.random() * 20) + 60,
        battery: Math.max(0, prev.battery - 0.01),
        temp: 35 + Math.floor(Math.random() * 5),
        uptime: new Date().toLocaleTimeString()
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-grow flex flex-col bg-[#1a1a1a] text-green-500 font-mono p-4 overflow-y-auto">
      <div className="flex items-center gap-2 border-b border-green-900/50 pb-2 mb-4">
        <Activity size={16} className="animate-pulse" />
        <h2 className="text-xs font-black uppercase tracking-widest">System Telemetrics v4.2</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="p-2 border border-green-900/30 bg-green-900/5">
            <div className="text-[8px] text-green-700 uppercase mb-1">Device Identity</div>
            <div className="text-[10px] font-bold">ANDROID_OS_V14.0</div>
            <div className="text-[8px] opacity-60">Model: SM-G998B (Ultra)</div>
          </div>

          <div className="p-2 border border-green-900/30 bg-green-900/5">
            <div className="text-[8px] text-green-700 uppercase mb-1">CPU Load</div>
            <div className="flex items-center gap-2">
              <div className="flex-grow h-2 bg-green-900/20 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ width: `${metrics.cpu}%` }}
                  className="h-full bg-green-500" 
                />
              </div>
              <span className="text-[10px] w-8">{metrics.cpu}%</span>
            </div>
          </div>

          <div className="p-2 border border-green-900/30 bg-green-900/5">
            <div className="text-[8px] text-green-700 uppercase mb-1">Memory Usage</div>
            <div className="flex items-center gap-2">
              <div className="flex-grow h-2 bg-green-900/20 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ width: `${metrics.ram}%` }}
                  className="h-full bg-blue-500" 
                />
              </div>
              <span className="text-[10px] w-8">{metrics.ram}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-2 border border-green-900/30 bg-green-900/5">
            <div className="text-[8px] text-green-700 uppercase mb-1">Battery Health</div>
            <div className="flex items-center justify-between">
              <span className="text-[10px]">{Math.floor(metrics.battery)}%</span>
              <div className="text-[8px] px-1 bg-green-500/20 rounded">OPTIMAL</div>
            </div>
          </div>

          <div className="p-2 border border-green-900/30 bg-green-900/5">
            <div className="text-[8px] text-green-700 uppercase mb-1">Thermal State</div>
            <div className="text-[10px]">{metrics.temp}°C</div>
          </div>

          <div className="p-2 border border-green-900/30 bg-green-900/5">
            <div className="text-[8px] text-green-700 uppercase mb-1">App Latency</div>
            <div className="text-[10px]">14ms (Stable)</div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-green-900/30 flex justify-between items-center text-[8px] opacity-40">
        <span>SCANNING_DRIVES...</span>
        <span>UPTIME: {metrics.uptime}</span>
      </div>
    </div>
  );
};

const ChatPanel: React.FC<{
  messages: { role: 'user' | 'agent' | 'system', content: string }[];
  onSendMessage: (content: string) => void;
  isThinking: boolean;
}> = ({ messages, onSendMessage, isThinking }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] font-mono">
      <div className="h-7 bg-[#252526] flex items-center px-3 border-b border-black/20 shrink-0">
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <MessageSquare size={10} className="text-green-500" />
          Agent Lee Chat
        </span>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-hide"
      >
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
            <div className={cn(
              "max-w-[90%] p-3 rounded-lg text-[10px] md:text-xs leading-relaxed border",
              msg.role === 'user' 
                ? "bg-green-500/10 text-green-400 border-green-500/20" 
                : "bg-zinc-800/50 text-zinc-300 border-white/5"
            )}>
              <div className="flex items-center gap-2 mb-1 opacity-50 text-[8px] font-black uppercase tracking-tighter">
                {msg.role === 'agent' ? <Shield size={8} /> : <User size={8} />}
                {msg.role}
              </div>
              {msg.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-zinc-800/50 text-green-500/50 p-2 rounded border border-white/5 flex items-center gap-2">
              <Loader2 size={10} className="animate-spin" />
              <span className="text-[8px] uppercase font-black tracking-widest">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-[#252526] border-t border-black/20">
        <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg px-3 py-2 focus-within:border-green-500/50 transition-all">
          <span className="text-green-500 font-bold text-xs">&gt;</span>
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && input.trim()) {
                onSendMessage(input);
                setInput('');
              }
            }}
            placeholder="Ask Agent Lee..."
            className="flex-grow bg-transparent outline-none text-[10px] md:text-xs text-green-400 placeholder:text-green-900/50"
          />
          <button 
            onClick={() => {
              if (input.trim()) {
                onSendMessage(input);
                setInput('');
              }
            }}
            className="text-green-500 hover:text-green-400 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const Terminal: React.FC<{ onInstall?: (pkg: string) => void, installedPackages?: string[], externalInput?: string }> = ({ onInstall, installedPackages, externalInput }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const currentLineRef = useRef('');

  const handleTerminalInput = useCallback((data: string) => {
    if (!xtermRef.current) return;
    const term = xtermRef.current;
    const code = data.charCodeAt(0);

    if (code === 13 || data === '\r') { // Enter
      term.write('\r\n');
      const cmd = currentLineRef.current.trim().toLowerCase();
      if (cmd) {
        if (cmd === 'help') {
          term.writeln('Available commands:');
          term.writeln('  help          - Show this help message');
          term.writeln('  pkg list      - List available packages');
          term.writeln('  pkg install   - Install a package (e.g., pkg install termux)');
          term.writeln('  pkg installed - List installed packages');
          term.writeln('  clear         - Clear the terminal');
        } else if (cmd === 'clear') {
          term.clear();
        } else if (cmd === 'pkg list') {
          term.writeln('Available packages:');
          term.writeln('  termux        - Scripting/CLI environment');
          term.writeln('  userland      - Full Linux distributions');
          term.writeln('  andronix      - Performance/GUI distributions');
        } else if (cmd.startsWith('pkg install ')) {
          const pkg = cmd.replace('pkg install ', '').trim();
          if (['termux', 'userland', 'andronix'].includes(pkg)) {
            term.writeln(`Installing ${pkg}...`);
            setTimeout(() => {
              term.writeln(`Package ${pkg} installed successfully.`);
              onInstall?.(pkg);
              term.write('\r\n\x1b[1;32mlee@vm\x1b[0m:\x1b[1;34m~\x1b[0m$ ');
            }, 1500);
            currentLineRef.current = '';
            return;
          } else {
            term.writeln(`Package ${pkg} not found.`);
          }
        } else if (cmd === 'pkg installed') {
          term.writeln('Installed packages:');
          if (installedPackages && installedPackages.length > 0) {
            installedPackages.forEach(p => term.writeln(`  ${p}`));
          } else {
            term.writeln('  No packages installed.');
          }
        } else {
          term.writeln(`Command not found: ${cmd}`);
        }
      }
      term.write('\x1b[1;32mlee@vm\x1b[0m:\x1b[1;34m~\x1b[0m$ ');
      currentLineRef.current = '';
    } else if (code === 127 || data === '\x7f' || data === '\b') { // Backspace
      if (currentLineRef.current.length > 0) {
        currentLineRef.current = currentLineRef.current.slice(0, -1);
        term.write('\b \b');
      }
    } else if (data === '\t') { // Tab
      // Simple tab completion could go here
    } else if (code < 32) {
      // Control characters - ignore
    } else {
      currentLineRef.current += data;
      term.write(data);
    }
  }, [onInstall, installedPackages]);

  useEffect(() => {
    if (externalInput && xtermRef.current) {
      if (externalInput === 'ENTER') {
        handleTerminalInput('\r');
      } else if (externalInput === 'BKSP') {
        handleTerminalInput('\x7f');
      } else if (externalInput === 'SPACE') {
        handleTerminalInput(' ');
      } else if (externalInput === 'TAB') {
        handleTerminalInput('\t');
      } else if (['SHIFT', 'CTRL', 'ALT', 'WIN', 'FN', 'CAPS', 'ESC', '←', '↑', '↓', '→'].includes(externalInput)) {
        // Ignore
      } else if (externalInput.length === 1) {
        handleTerminalInput(externalInput.toLowerCase());
      }
    }
  }, [externalInput, handleTerminalInput]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: 'JetBrains Mono, monospace',
      theme: {
        background: '#0c0c0c',
        foreground: '#cccccc',
        cursor: '#ffffff',
        selectionBackground: 'rgba(255, 255, 255, 0.3)',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;

    term.writeln('\x1b[1;34mAgent Lee VM Workspace v1.0.0\x1b[0m');
    term.writeln('\x1b[1;32mReady for execution.\x1b[0m');
    term.writeln('Type "help" for a list of commands.');
    term.write('\r\n\x1b[1;32mlee@vm\x1b[0m:\x1b[1;34m~\x1b[0m$ ');

    term.onData(handleTerminalInput);

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      term.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, [handleTerminalInput]);

  return (
    <div className="h-full w-full bg-[#0c0c0c] p-2 overflow-hidden">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
};

// --- Keyboard Component ---
const VirtualKeyboard: React.FC<{ onKeyType: (key: string) => void, onClose: () => void }> = ({ onKeyType, onClose }) => {
  const keys = [
    ['ESC', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'BKSP'],
    ['TAB', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
    ['CAPS', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'ENTER'],
    ['SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'SHIFT'],
    ['CTRL', 'WIN', 'ALT', 'SPACE', 'ALT', 'FN', 'CTRL', '←', '↑', '↓', '→']
  ];

  const handleKeyPress = (key: string) => {
    onKeyType(key);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[75%] max-w-[220px] bg-[#c5bfab] rounded-lg shadow-[0_8px_20px_rgba(0,0,0,0.5)] border-[2px] border-[#b0aa93] p-1 z-[100] flex flex-col gap-0.5 items-center"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-0.5 h-1.5 bg-zinc-800/40" />
      <div className="w-full flex items-center justify-between px-0.5 mb-0.5">
        <div className="flex items-center gap-0.5">
          <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_2px_rgba(34,197,94,0.8)]" />
          <span className="text-[5px] font-black text-[#6a644d] uppercase tracking-[0.1em]">Agent Lee Input</span>
        </div>
        <button 
          onClick={onClose}
          className="p-0.5 hover:bg-red-500/10 rounded text-red-700"
        >
          <X size={8} />
        </button>
      </div>

      <div className="flex flex-col gap-0.5 w-full items-center">
        {keys.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-0.5">
            {row.map((key, colIndex) => (
              <button
                key={`key-${rowIndex}-${colIndex}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleKeyPress(key)}
                className={cn(
                  "bg-[#dcd7c0] border border-[#8a846d] rounded shadow-[0_1px_0_#8a846d] active:shadow-none active:translate-y-[0.5px] text-[4px] font-black text-zinc-800 flex items-center justify-center hover:bg-white",
                  key === 'SPACE' ? "w-16 h-5" : 
                  ['ENTER', 'SHIFT', 'CAPS', 'TAB', 'BKSP', 'CTRL', 'ALT', 'WIN', 'FN'].includes(key) ? "w-6 h-5" : 
                  "w-3.5 h-5"
                )}
              >
                {key === 'BKSP' ? 'DEL' : key}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-0.5 text-[4px] text-[#8a846d] font-bold uppercase tracking-widest opacity-40 italic">Mechanical Feedback Active</div>
    </motion.div>
  );
};

// --- Retro PC Frame Component ---
const RetroPCFrame: React.FC<{ 
  children: React.ReactNode; 
  title: string; 
  onMinimize: () => void; 
  isThinking: boolean;
  onKeyType?: (key: string) => void;
  showKeyboard: boolean;
  setShowKeyboard: (show: boolean) => void;
}> = ({ children, title, onMinimize, isThinking, onKeyType, showKeyboard, setShowKeyboard }) => {
  return (
    <div className="relative flex flex-col h-full items-center">
      {/* Monitor Box */}
      <div className="relative p-2 md:p-3 bg-[#dcd7c0] rounded-[15px] md:rounded-[20px] shadow-[inset_-5px_-5px_10px_rgba(0,0,0,0.2),inset_5px_5px_10px_rgba(255,255,255,0.5),10px_10px_30px_rgba(0,0,0,0.6),0_20px_40px_-10px_rgba(0,0,0,0.5)] border-[4px] md:border-[6px] border-[#c5bfab] flex flex-col w-full aspect-[4/3] overflow-hidden z-20">
        {/* Side Depth Effect (Cube-like) */}
        <div className="absolute top-0 right-0 w-4 h-full bg-[#b0aa93] skew-y-[45deg] origin-top-right opacity-50" />
        <div className="absolute bottom-0 left-0 h-4 w-full bg-[#8a846d] skew-x-[45deg] origin-bottom-left opacity-30" />
        {/* Nanotech Circuit Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 20H40V60H80V40H120" stroke="#8a846d" strokeWidth="0.5" />
            <path d="M400 380H360V340H320V360H280" stroke="#8a846d" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Screen Area */}
        <div className="relative flex-grow bg-[#1a1b1e] rounded-[8px] md:rounded-[12px] border-[4px] md:border-[5px] border-[#b0aa93] shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">
          {/* CRT Curvature Overlay */}
          <div className="absolute inset-0 pointer-events-none z-[60] shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] rounded-[8px] md:rounded-[12px]" />
          
          {/* CRT Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.04] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
          
          {/* Status Indicator */}
          {isThinking && (
            <div className="absolute top-2 right-2 z-[70] flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded border border-green-500/30">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
              <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter">Processing</span>
            </div>
          )}

          {/* Screen Content */}
          <div className="flex-grow flex flex-col overflow-hidden relative z-10">
            {children}
          </div>
        </div>

        {/* Bezel Details */}
        <div className="h-6 md:h-8 mt-1 flex items-center justify-between px-2 md:px-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#b0aa93] shadow-inner border border-[#9a947d]" />
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#b0aa93] shadow-inner border border-[#9a947d]" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[5px] md:text-[7px] font-black text-[#8a846d] tracking-tighter italic">AgentLeeVM-3000</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowKeyboard(!showKeyboard)}
              className={cn(
                "h-3 md:h-4 px-1 rounded-sm border shadow-sm flex items-center justify-center gap-1",
                showKeyboard ? "bg-green-500 border-green-600 text-white" : "bg-[#c0c0c0] border-[#808080] text-[#404040]"
              )}
            >
              <div className="text-[5px] font-black uppercase tracking-tighter">Keyboard</div>
            </button>
            <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
            <button onClick={onMinimize} className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-[#ff4b4b] border border-[#cc3a3a] shadow-sm active:scale-95" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showKeyboard && onKeyType && (
          <VirtualKeyboard onKeyType={onKeyType} onClose={() => setShowKeyboard(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main AgentLeeVM Component ---

interface AgentLeeVMProps {
  vfs: VFSDirectory;
  onVFSChange: (vfs: VFSDirectory) => void;
  activeFilePath: string;
  setActiveFilePath: (path: string) => void;
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (min: boolean) => void;
  messages: { role: 'user' | 'agent' | 'system', content: string }[];
  onSendMessage: (content: string) => void;
  isThinking: boolean;
}

export const AgentLeeVM: React.FC<AgentLeeVMProps> = ({ 
  vfs, 
  onVFSChange, 
  activeFilePath, 
  setActiveFilePath,
  showPreview,
  setShowPreview,
  isMinimized,
  setIsMinimized,
  messages,
  onSendMessage,
  isThinking
}) => {
  const [activeFileContent, setActiveFileContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(200);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'explorer' | 'chat'>('explorer');
  const [vscodeTab, setVscodeTab] = useState<'editor' | 'preview'>('editor');
  const [currentApp, setCurrentApp] = useState<'desktop' | 'vscode' | 'browser' | 'notepad' | 'pallium' | 'diagnostics' | 'database' | 'terminal'>('desktop');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [installedPackages, setInstalledPackages] = useState<string[]>([]);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [lastTypedKey, setLastTypedKey] = useState<string | undefined>(undefined);

  const handleInstallPackage = (pkg: string) => {
    if (!installedPackages.includes(pkg)) {
      setInstalledPackages(prev => [...prev, pkg]);
    }
  };

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Create user doc if it doesn't exist
        const userRef = doc(db, 'users', currentUser.uid);
        setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          createdAt: Timestamp.now()
        }, { merge: true });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isThinking) {
      // Auto-switch apps based on context if possible, or just to console
      setActiveTab('chat');
    }
  }, [isThinking]);

  // Handle app switching based on agent actions
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;

    if (lastMsg.content.includes('[SEARCH]')) {
      setCurrentApp('browser');
    } else if (lastMsg.content.includes('Updated: /src/plan.md')) {
      setCurrentApp('notepad');
      setActiveFilePath('/src/plan.md');
    } else if (lastMsg.content.includes('Updated:')) {
      setCurrentApp('vscode');
      if (lastMsg.content.toLowerCase().includes('preview') || lastMsg.content.toLowerCase().includes('result')) {
        setVscodeTab('preview');
      } else {
        setVscodeTab('editor');
      }
    }
  }, [messages]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarWidth(0);
      } else {
        setSidebarWidth(200);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const file = findItemByPath(vfs, activeFilePath);
    if (file && file.type === 'file') {
      setActiveFileContent(file.content);
    }
  }, [activeFilePath, vfs]);

  const handleSave = () => {
    setIsSaving(true);
    const updateVfs = (dir: VFSDirectory): VFSDirectory => {
      return {
        ...dir,
        children: dir.children.map(child => {
          if (child.path === activeFilePath) {
            return { ...child, content: activeFileContent } as VFSFile;
          }
          if (child.type === 'dir') {
            return updateVfs(child);
          }
          return child;
        })
      };
    };
    onVFSChange(updateVfs(vfs));
    setTimeout(() => setIsSaving(false), 800);
  };

  // Minimized Agent Lee morphing state
  const [enabledShapes, setEnabledShapes] = useState<string[]>(() => {
    const stored = localStorage.getItem('enabledShapes');
    if (stored) {
      try {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr) && arr.every(s => typeof s === 'string')) return arr;
      } catch {}
    }
    return [
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
  });
  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem('enabledShapes');
      if (stored) {
        try {
          const arr = JSON.parse(stored);
          if (Array.isArray(arr) && arr.every(s => typeof s === 'string')) setEnabledShapes(arr);
        } catch {}
      }
    };
    window.addEventListener('enabledShapesChanged', handler);
    return () => window.removeEventListener('enabledShapesChanged', handler);
  }, []);

  if (isMinimized) {
    return (
      <motion.button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-24 right-8 w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-2xl z-50 border-2 border-yellow-500/50"
      >
        {/* Minimized Agent Lee morphing avatar */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AgentLee
            size="small"
            enabledShapes={enabledShapes}
          />
        </div>
        <div className="relative z-10">
          <Cpu className="text-white" size={20} />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </motion.button>
    );
  }

  const handleKeyType = useCallback((key: string) => {
    setLastTypedKey(key);
    // Reset after a short delay to allow re-triggering same key
    setTimeout(() => {
      setLastTypedKey(undefined);
    }, 100);

    if (currentApp === 'vscode' || currentApp === 'notepad') {
      if (key === 'SPACE') setActiveFileContent(prev => prev + ' ');
      else if (key === 'ENTER') setActiveFileContent(prev => prev + '\n');
      else if (key === 'BKSP') setActiveFileContent(prev => prev.slice(0, -1));
      else if (key === 'TAB') setActiveFileContent(prev => prev + '  ');
      else if (['1','2','3','4','5','6','7','8','9','0','-','=','[',']',';',"'",',','.','/','\\'].includes(key)) {
        setActiveFileContent(prev => prev + key);
      }
      else if (['SHIFT', 'CTRL', 'ALT', 'WIN', 'FN', 'CAPS', 'ESC', '←', '↑', '↓', '→'].includes(key)) {
        // Special keys - do nothing for now or add specific logic
      }
      else setActiveFileContent(prev => prev + key.toLowerCase());
    }
  }, [currentApp]);

  useEffect(() => {
    const handlePhysicalKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input or textarea outside the VM
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      let key = e.key.toUpperCase();
      if (key === 'BACKSPACE') key = 'BKSP';
      if (key === ' ') key = 'SPACE';
      if (key === 'ARROWLEFT') key = '←';
      if (key === 'ARROWRIGHT') key = '→';
      if (key === 'ARROWUP') key = '↑';
      if (key === 'ARROWDOWN') key = '↓';
      if (key === 'CONTROL') key = 'CTRL';
      if (key === 'ESCAPE') key = 'ESC';
      
      // Only handle keys that are in our virtual keyboard or common typing keys
      const allKeys = [
        'ESC', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'BKSP',
        'TAB', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\',
        'CAPS', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'ENTER',
        'SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'SPACE',
        'CTRL', 'WIN', 'ALT', 'FN', '←', '↑', '↓', '→'
      ];

      if (allKeys.includes(key) || (key.length === 1 && /^[A-Z0-9]$/.test(key))) {
        handleKeyType(key);
        // Prevent default for some keys to avoid page scrolling/navigation
        if (['SPACE', '←', '↑', '↓', '→', 'TAB', 'BKSP'].includes(key)) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handlePhysicalKeyDown);
    return () => window.removeEventListener('keydown', handlePhysicalKeyDown);
  }, [handleKeyType]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-full h-full flex flex-col"
    >
      <RetroPCFrame 
        title={currentApp === 'desktop' ? 'Agent Lee VM — Desktop' : `Agent Lee VM — ${currentApp.toUpperCase()}`} 
        onMinimize={() => setIsMinimized(true)}
        isThinking={isThinking}
        onKeyType={handleKeyType}
        showKeyboard={showKeyboard}
        setShowKeyboard={setShowKeyboard}
      >
        {/* OS Header / Taskbar */}
        <div className="h-6 bg-[#c0c0c0] border-b border-white shadow-[inset_-1px_-1px_0_#808080] flex items-center justify-between px-2 shrink-0 z-50">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentApp('desktop')}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-[#c0c0c0] border border-white shadow-[1px_1px_0_#808080] active:shadow-none active:translate-x-[0.5px] active:translate-y-[0.5px]"
            >
              <div className="w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center text-[8px]">🍌</div>
              <span className="text-[9px] font-bold text-zinc-900">Start</span>
            </button>
            <div className="w-px h-4 bg-zinc-400 mx-1 shadow-[1px_0_0_white]" />
            <div className="flex gap-1">
              {['vscode', 'browser', 'notepad', 'pallium', 'database', 'diagnostics', 'terminal'].map(app => (
                <button
                  key={app}
                  onClick={() => setCurrentApp(app as any)}
                  className={cn(
                    "px-2 py-0.5 text-[8px] font-bold border border-white shadow-[1px_1px_0_#808080] active:shadow-none",
                    currentApp === app ? "bg-zinc-300 shadow-inner" : "bg-[#c0c0c0]"
                  )}
                >
                  {app === 'pallium' ? 'PALLIUM' : app === 'diagnostics' ? 'DIAG' : app === 'database' ? 'DB' : app === 'terminal' ? 'TERM' : app.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-zinc-300 px-2 py-0.5 border border-zinc-500 shadow-inner text-[8px] font-mono text-zinc-600">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* App Content */}
        <div className="flex-grow flex overflow-hidden relative">
          {currentApp === 'desktop' && <Desktop onOpenApp={(app) => setCurrentApp(app as any)} installedPackages={installedPackages} />}
          
          {currentApp === 'notepad' && (
            <Notepad content={activeFilePath === '/src/plan.md' ? activeFileContent : ((findItemByPath(vfs, '/src/plan.md') as VFSFile)?.content || 'No plan found.')} />
          )}

          {currentApp === 'browser' && <Browser messages={messages} externalInput={lastTypedKey} />}

          {currentApp === 'pallium' && (
            <ErrorBoundary>
              <Pallium user={user} />
            </ErrorBoundary>
          )}

          {currentApp === 'database' && (
            <ErrorBoundary>
              <DatabaseExplorer user={user} />
            </ErrorBoundary>
          )}

          {currentApp === 'diagnostics' && <Diagnostics />}

          {currentApp === 'terminal' && (
            <div className="flex-grow flex flex-col bg-black">
              <Terminal onInstall={handleInstallPackage} installedPackages={installedPackages} externalInput={lastTypedKey} />
            </div>
          )}

          {currentApp === 'vscode' && (
            <div className="flex-grow flex flex-col overflow-hidden bg-[#1e1e1e]">
              {/* VS Code Title Bar */}
              <div className="h-7 bg-[#323233] flex items-center justify-between px-2 shrink-0 border-b border-black/20 z-20">
                <div className="flex items-center gap-2 text-zinc-400 text-[9px] font-medium">
                  <Code size={10} className="text-blue-400" />
                  <span className="truncate max-w-[120px]">LeeCode Studio — {activeFilePath.split('/').pop()}</span>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-grow flex overflow-hidden relative">
                {/* Activity Bar */}
                {!isMobile && (
                  <div className="w-10 bg-[#333333] flex flex-col items-center py-4 gap-4 shrink-0 border-r border-black/20">
                    <button 
                      onClick={() => setActiveTab('explorer')}
                      className={cn("transition-colors", activeTab === 'explorer' ? "text-white border-l-2 border-white px-1" : "text-zinc-500 hover:text-zinc-300")}
                    >
                      <Folder size={18} />
                    </button>
                    <button 
                      onClick={() => setActiveTab('chat')}
                      className={cn("transition-colors", activeTab === 'chat' ? "text-white border-l-2 border-white px-1" : "text-zinc-500 hover:text-zinc-300")}
                    >
                      <MessageSquare size={18} />
                    </button>
                    <button 
                      onClick={() => setVscodeTab('preview')}
                      className={cn("transition-colors", vscodeTab === 'preview' ? "text-green-400 border-l-2 border-green-400 px-1" : "text-zinc-500 hover:text-zinc-300")}
                    >
                      <Globe size={18} />
                    </button>
                  </div>
                )}

                {/* Sidebar */}
                {(!isMobile || sidebarWidth > 0) && (
                  <div 
                    className="bg-[#252526] border-r border-white/5 flex flex-col shrink-0 transition-all overflow-hidden"
                    style={{ width: isMobile ? '100%' : `${sidebarWidth}px`, display: isMobile && sidebarWidth === 0 ? 'none' : 'flex' }}
                  >
                    {activeTab === 'explorer' ? (
                      <>
                        <div className="h-7 flex items-center justify-between px-2 text-[8px] font-bold text-zinc-500 uppercase tracking-widest bg-[#2d2d2d]">
                          <span>Explorer</span>
                        </div>
                        {/* SHAPE SELECTION PANEL */}
                        <div className="flex flex-col gap-2 p-2 border-b border-white/10">
                          <div className="text-cyan-400 font-bold text-[9px] uppercase tracking-widest mb-1">Agent Lee Forms</div>
                          <div className="flex flex-wrap gap-1">
                            {enabledShapes.map((shape, idx) => (
                              <button
                                key={shape}
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('agentlee:cycleShape', { detail: { shapeKey: shape } }));
                                }}
                                className={cn(
                                  "px-2 py-1 rounded text-[10px] font-bold border border-cyan-500/30 bg-cyan-900/20 hover:bg-cyan-500/20 transition-all",
                                  // Optionally highlight current shape if tracked
                                  // currentShape === shape ? "bg-cyan-500 text-black" : "text-cyan-300"
                                )}
                              >
                                {shape}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex-grow overflow-y-auto">
                          <FileTreeItem 
                            item={vfs} 
                            level={0} 
                            onSelect={(path) => {
                              setActiveFilePath(path);
                              setVscodeTab('editor');
                              if (isMobile) setSidebarWidth(0);
                            }} 
                            selectedPath={activeFilePath}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col h-full bg-[#1e1e1e] overflow-hidden">
                        <div className="h-7 flex items-center justify-between px-2 text-[8px] font-bold text-zinc-500 uppercase tracking-widest bg-[#2d2d2d]">
                          <span>Agent Console</span>
                        </div>
                        <div className="flex-grow overflow-y-auto p-2 font-mono text-[10px] space-y-2 overflow-x-hidden">
                          {messages.map((msg, i) => (
                            <div key={i} className={cn(
                              "p-1.5 rounded border break-words overflow-hidden",
                              msg.role === 'user' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : 
                              msg.role === 'system' ? "bg-zinc-800 border-zinc-700 text-zinc-500" :
                              "bg-green-500/10 border-green-500/20 text-green-400"
                            )}>
                              <div className="text-[7px] uppercase font-black mb-0.5 opacity-50">
                                {msg.role === 'agent' ? 'AGENT LEE' : msg.role === 'user' ? 'USER' : 'SYSTEM'}
                              </div>
                              <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Editor / Preview Area */}
                <div className={cn("flex-grow flex flex-col min-w-0", isMobile && sidebarWidth > 0 ? "hidden" : "flex")}>
                  {/* Tabs */}
                  <div className="h-7 bg-[#252526] flex items-center shrink-0 border-b border-black/20">
                    <button 
                      onClick={() => setVscodeTab('editor')}
                      className={cn(
                        "h-full px-3 flex items-center gap-1.5 text-[9px] min-w-[80px] transition-colors",
                        vscodeTab === 'editor' ? "bg-[#1e1e1e] text-white border-t border-blue-500" : "text-zinc-500 hover:bg-[#2a2d2e]"
                      )}
                    >
                      <File size={10} className="text-blue-400" />
                      <span className="truncate">{activeFilePath.split('/').pop()}</span>
                    </button>
                    <button 
                      onClick={() => setVscodeTab('preview')}
                      className={cn(
                        "h-full px-3 flex items-center gap-1.5 text-[9px] min-w-[80px] transition-colors",
                        vscodeTab === 'preview' ? "bg-[#1e1e1e] text-white border-t border-green-500" : "text-zinc-500 hover:bg-[#2a2d2e]"
                      )}
                    >
                      <Globe size={10} className="text-green-400" />
                      <span>Live Preview</span>
                    </button>
                  </div>

                  <div className="flex-grow relative overflow-hidden">
                    {vscodeTab === 'editor' ? (
                      <>
                        <Editor
                          height="100%"
                          path={activeFilePath}
                          defaultLanguage="typescript"
                          theme="vs-dark"
                          value={activeFileContent}
                          onChange={val => setActiveFileContent(val || '')}
                          options={{
                            fontSize: 12,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            padding: { top: 4 },
                            fontFamily: 'JetBrains Mono, monospace',
                            wordWrap: 'on',
                            automaticLayout: true,
                            scrollbar: { vertical: 'hidden', horizontal: 'hidden' }
                          }}
                        />
                        <div className="absolute top-1 right-2 flex items-center gap-1 z-10">
                          <button 
                            onClick={handleSave}
                            className={cn(
                              "flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold transition-all active:scale-95",
                              isSaving ? "bg-zinc-800 text-zinc-500" : "bg-blue-600 hover:bg-blue-500 text-white"
                            )}
                          >
                            <Save size={10} />
                            <span>{isSaving ? 'SAVING...' : 'SAVE'}</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-grow h-full bg-white flex flex-col">
                        {(() => {
                          const indexFile = findItemByPath(vfs, '/index.html') as VFSFile | undefined;
                          const content = indexFile?.content || '';
                          return (
                            <div className="flex-grow flex flex-col">
                              <div className="h-6 bg-slate-100 border-b border-slate-200 flex items-center px-2 gap-2">
                                <div className="flex-1 bg-white border border-slate-200 rounded px-2 py-0.5 text-[8px] text-slate-400 flex items-center gap-1.5">
                                  <Globe size={8} />
                                  <span>localhost:3000</span>
                                </div>
                                <button onClick={() => setVscodeTab('editor')} className="text-slate-400 hover:text-slate-600"><RotateCcw size={10} /></button>
                              </div>
                              <iframe
                                key={content}
                                title="preview"
                                srcDoc={content}
                                className="flex-grow w-full border-none"
                                sandbox="allow-scripts"
                              />
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {vscodeTab === 'editor' && showTerminal && (
                    <div className="h-32 border-t border-white/5 flex flex-col shrink-0">
                      <div className="h-6 bg-[#1e1e1e] flex items-center px-2 gap-3 shrink-0">
                        <button className="text-[8px] font-bold text-white border-b-2 border-white h-full px-1">TERMINAL</button>
                      </div>
                      <div className="flex-grow">
                        <Terminal onInstall={handleInstallPackage} installedPackages={installedPackages} externalInput={lastTypedKey} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* VS Code Status Bar */}
              <div className="h-4 bg-[#007acc] flex items-center justify-between px-2 shrink-0 text-[7px] text-white z-20">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 hover:bg-white/10 px-1 cursor-pointer">
                    <RotateCcw size={8} />
                    <span>Main*</span>
                  </div>
                  <div className="flex items-center gap-1 hover:bg-white/10 px-1 cursor-pointer">
                    <Activity size={8} />
                    <span>Live Share</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span>Ln 1, Col 1</span>
                  <span>UTF-8</span>
                  <span>TypeScript JSX</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </RetroPCFrame>
    </motion.div>
  );
};
