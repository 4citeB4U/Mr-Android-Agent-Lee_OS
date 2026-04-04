/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.PAGE.VM.WORKSTATION
TAG: UI.PAGE.VM.WORKSTATION.AGENTLEE

COLOR_ONION_HEX:
NEON=#00E5FF
FLUO=#67E8F9
PASTEL=#CFFAFE

ICON_ASCII:
family=lucide
glyph=monitor

5WH:
WHAT = Page wrapper that mounts AgentLeeVM with self-contained state
WHY = AgentLeeVM requires parent-managed props; this page wires all state locally so it can be
      navigated to directly from App.tsx without polluting global App state
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = pages/AgentLeeWorkstation.tsx
WHEN = 2026
HOW = Manages vfs/messages/showPreview/activeFilePath state locally; routes onSendMessage to GeminiClient

AGENTS:
ASSESS
AUDIT
NOVA
SHIELD

LICENSE:
MIT
*/

import React, { useState, useCallback } from 'react';
import { AgentLeeVM, initialVFS, VFSDirectory } from '../components/AgentLeeVM';
import { GeminiClient } from '../core/GeminiClient';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';

type VMMessage = { role: 'user' | 'agent' | 'system'; content: string };

const SYSTEM_PROMPT = `${buildAgentLeeCorePrompt()}

You are operating inside the Agent Lee Workstation (VM). Your role is to help the user:
- Write, review, and refine code in the virtual file system
- Plan and execute coding missions step-by-step
- Diagnose errors and suggest fixes
- Manage project structure and file organization

Always reply concisely. Prefix autonomously-triggered file updates with "Updated: /path/to/file".
Prefix web searches with "[SEARCH]".`;

const AgentLeeWorkstation: React.FC = () => {
  const [vfs, setVfs] = useState<VFSDirectory>(initialVFS);
  const [activeFilePath, setActiveFilePath] = useState<string>('/src/App.tsx');
  const [showPreview, setShowPreview] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<VMMessage[]>([
    { role: 'system', content: 'Agent Lee Workstation initialized. Ready for your mission.' },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isThinking) return;

    setMessages(prev => [...prev, { role: 'user', content }]);
    setIsThinking(true);

    try {
      const history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role === 'agent' ? 'model' as const : 'user' as const, content: m.content }));

      const reply = await GeminiClient.stream({
        prompt: content,
        systemPrompt: SYSTEM_PROMPT,
        agent: 'AgentLee',
        history,
        streamCallback: (chunk) => {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === 'agent') {
              return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
            }
            return [...prev, { role: 'agent', content: chunk }];
          });
        },
      });

      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'agent') return prev;
        return [...prev, { role: 'agent', content: reply }];
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessages(prev => [...prev, { role: 'system', content: `Error: ${msg}` }]);
    } finally {
      setIsThinking(false);
    }
  }, [isThinking, messages]);

  return (
    <AgentLeeVM
      vfs={vfs}
      onVFSChange={setVfs}
      activeFilePath={activeFilePath}
      setActiveFilePath={setActiveFilePath}
      showPreview={showPreview}
      setShowPreview={setShowPreview}
      isMinimized={isMinimized}
      setIsMinimized={setIsMinimized}
      messages={messages}
      onSendMessage={handleSendMessage}
      isThinking={isThinking}
    />
  );
};

export default AgentLeeWorkstation;
