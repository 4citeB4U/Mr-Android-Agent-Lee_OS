/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.COMPONENT.CHAT.INTERFACE
TAG: UI.COMPONENT.CHATINTERFACE.INPUT

COLOR_ONION_HEX:
NEON=#8B5CF6
FLUO=#A78BFA
PASTEL=#DDD6FE

ICON_ASCII:
family=lucide
glyph=message-square

5WH:
WHAT = Chat interface input bar — text input, voice, file upload, save, and studio send controls
WHY = Primary user interaction point for sending commands to Agent Lee and the agent team
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/ChatInterface.tsx
WHEN = 2026
HOW = React form component with controlled text input, file input ref, and icon button actions

AGENTS:
ASSESS
AUDIT

LICENSE:
MIT
*/

import React, { useState, useRef } from 'react';
import { Send, Mic, Upload, Sparkles, Loader2, X, Database, Code, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatInterfaceProps {
  onSendMessage: (message: string) => void;
  onFileUpload: (file: File) => void;
  onGenerate: () => void;
  onSave?: () => void;
  onSendToStudio?: () => void;
  hasVoxel?: boolean;
  isGenerating?: boolean;
  isListening?: boolean;
  onStartVoice?: () => void;
  onStopVoice?: () => void;
  className?: string;
  placeholder?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  onFileUpload,
  onGenerate,
  onSave,
  onSendToStudio,
  hasVoxel = false,
  isGenerating = false,
  isListening = false,
  onStartVoice,
  onStopVoice,
  className,
  placeholder = "Talk to Agent Lee..."
}) => {
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto p-2 md:p-4 flex flex-col gap-2", className)}>
      {/* Top Bar: Action Buttons / Tags */}
      <div className="flex items-center gap-2 px-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-slate-300 rounded-full transition-colors font-bold text-[10px] uppercase tracking-widest shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload
        </button>

        {hasVoxel && onSave && (
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-[#00f2ff]/80 rounded-full transition-colors font-bold text-[10px] uppercase tracking-widest shrink-0"
          >
            <Database className="w-3.5 h-3.5" />
            Download / Save
          </button>
        )}

        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !input.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-emerald-400 rounded-full transition-colors font-bold text-[10px] uppercase tracking-widest shrink-0 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Agent Sparkles
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-slate-300 rounded-full transition-colors font-bold text-[10px] uppercase tracking-widest shrink-0"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>

        {onSendToStudio && (
          <button
            type="button"
            onClick={onSendToStudio}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-purple-400 rounded-full transition-colors font-bold text-[10px] uppercase tracking-widest shrink-0"
          >
            <Code className="w-3.5 h-3.5" />
            Studio
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1 group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white/[0.06] border border-white/[0.1] text-white rounded-2xl px-4 py-3 md:py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-[#00f2ff]/40 transition-all text-sm font-medium placeholder:text-white/30"
          />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-sm disabled:opacity-50"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </form>
    </div>
  );
};
