/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.COMPONENT.CHAT.CONSOLE
TAG: UI.COMPONENT.CHATCONSOLE.STREAM

COLOR_ONION_HEX:
NEON=#00FFFF
FLUO=#00E5FF
PASTEL=#B2EBF2

ICON_ASCII:
family=lucide
glyph=message-circle

5WH:
WHAT = Persistent streaming chat console — displays the full conversation thread with Agent Lee and all sub-agents
WHY = Without this, all Gemini responses were lost silently; this is the primary user feedback surface
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/ChatConsole.tsx
WHEN = 2026
HOW = React component subscribing to conversation state, streaming tokens in real-time, with TTS playback toggle

AGENTS:
ASSESS
AUDIT
GEMINI

LICENSE:
MIT
*/

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Mic, MicOff, Volume2, VolumeX, Copy, Check, ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  agent?: string;  // 'AgentLee' | 'Nova' | 'Atlas' etc.
  content: string;
  streaming?: boolean;
  emotion?: string;
  timestamp: Date;
}

interface ChatConsoleProps {
  messages: ChatMessage[];
  isStreaming?: boolean;
  currentStreamText?: string;
  onSendMessage: (msg: string) => void;
  onStartVoice?: () => void;
  onStopVoice?: () => void;
  isListening?: boolean;
  className?: string;
  collapsed?: boolean;
}

// Agent color palette
const AGENT_COLORS: Record<string, string> = {
  AgentLee: 'text-cyan-400',
  Nova:     'text-amber-400',
  Atlas:    'text-blue-400',
  Echo:     'text-pink-400',
  Sage:     'text-green-400',
  Shield:   'text-emerald-400',
  Pixel:    'text-purple-400',
  Nexus:    'text-orange-400',
  Aria:     'text-rose-400',
};

const AGENT_BG: Record<string, string> = {
  AgentLee: 'bg-cyan-500/10 border-cyan-500/20',
  Nova:     'bg-amber-500/10 border-amber-500/20',
  Atlas:    'bg-blue-500/10 border-blue-500/20',
  Echo:     'bg-pink-500/10 border-pink-500/20',
  Sage:     'bg-green-500/10 border-green-500/20',
  Shield:   'bg-emerald-500/10 border-emerald-500/20',
  Pixel:    'bg-purple-500/10 border-purple-500/20',
  Nexus:    'bg-orange-500/10 border-orange-500/20',
  Aria:     'bg-rose-500/10 border-rose-500/20',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
      title="Copy message"
    >
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
    </button>
  );
}

const MessageBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const isUser = msg.role === 'user';
  const agentName = msg.agent || 'AgentLee';
  const agentColor = AGENT_COLORS[agentName] || 'text-cyan-400';
  const agentBg = AGENT_BG[agentName] || 'bg-cyan-500/10 border-cyan-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-3 group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border',
        isUser 
          ? 'bg-slate-700 border-slate-600' 
          : cn(agentBg)
      )}>
        {isUser 
          ? <User size={14} className="text-slate-300" />
          : <Bot size={14} className={agentColor} />
        }
      </div>

      {/* Message body */}
      <div className={cn('flex flex-col gap-1 max-w-[85%] min-w-0', isUser && 'items-end')}>
        {!isUser && (
          <span className={cn('text-[10px] font-bold uppercase tracking-widest', agentColor)}>
            {agentName}
          </span>
        )}
        <div className={cn(
          'relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words border',
          isUser
            ? 'bg-cyan-500 text-black border-cyan-400/50 rounded-tr-sm'
            : 'bg-slate-800/80 text-slate-100 border-white/10 rounded-tl-sm',
          msg.streaming && 'border-cyan-500/40'
        )}>
          {/* Streaming cursor */}
          {msg.streaming && (
            <span className="inline-block w-0.5 h-4 bg-cyan-400 animate-pulse ml-0.5 align-middle" />
          )}
          <span className="whitespace-pre-wrap">{msg.content}</span>
        </div>
        <div className={cn('flex items-center gap-1', isUser && 'flex-row-reverse')}>
          <span className="text-[9px] text-slate-600 font-mono">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && <CopyButton text={msg.content} />}
        </div>
      </div>
    </motion.div>
  );
}

export const ChatConsole: React.FC<ChatConsoleProps> = ({
  messages,
  isStreaming = false,
  onSendMessage,
  onStartVoice,
  onStopVoice,
  isListening = false,
  className,
  collapsed = false,
}) => {
  const [input, setInput] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn(
      'flex flex-col bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl',
      'transition-all duration-300',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles size={14} className="text-cyan-400" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-widest">Agent Lee Console</span>
          {isStreaming && (
            <div className="flex items-center gap-1 text-cyan-400">
              <Loader2 size={10} className="animate-spin" />
              <span className="text-[9px] font-medium">Generating...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTtsEnabled(v => !v)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
            title={ttsEnabled ? 'Mute TTS' : 'Enable TTS'}
          >
            {ttsEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
          <button
            onClick={() => setIsCollapsed(v => !v)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronDown
              size={13}
              className={cn('transition-transform', isCollapsed ? 'rotate-180' : '')}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* Messages area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[400px] custom-scrollbar"
            >
              {/* Removed default welcome message and bot icon per user request */}
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
            </div>

            {/* Input area */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-3 py-2.5 border-t border-white/10 bg-slate-900/60 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                placeholder={isListening ? 'Listening…' : 'Ask Agent Lee anything…'}
                className={cn(
                  'flex-1 bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white',
                  'placeholder:text-slate-600 outline-none focus:border-cyan-500/60',
                  'disabled:opacity-50 transition-all'
                )}
              />

              {/* Voice button - Disabled, use footer AgentleeMic instead */}
              <button
                type="button"
                className={cn(
                  'p-1.5 rounded-xl transition-all shrink-0 bg-transparent hover:bg-white/5',
                  'opacity-50 cursor-not-allowed'
                )}
                title="Use footer AgentleeMic instead"
                disabled
              >
                <svg className="w-[18px] h-[18px] text-gray-400 object-contain" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" />
                </svg>
              </button>

              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0',
                  'bg-cyan-500 text-black shadow-[0_0_12px_rgba(34,211,238,0.3)]',
                  'hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none'
                )}
              >
                {isStreaming ? <Loader2 size={14} className="animate-spin" /> : 'Send'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatConsole;
