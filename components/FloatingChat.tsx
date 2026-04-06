/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.COMPONENT.CHAT.FLOATING
TAG: UI.COMPONENT.FLOATING.CHAT.CARDS

5WH:
WHAT = TikTok-style floating message cards — appear on right side, visible 5s, then fade out
WHY = Keeps workspace clean while still surfacing new messages non-intrusively
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/FloatingChat.tsx
WHEN = 2026
HOW = Monitors messages prop for new entries, creates timed card objects, stacks upward, scrolls
      under header (top-20), pure pointer-events-none overlay

LICENSE:
MIT
*/

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ChatConsole';

interface FloatingChatProps {
  messages: ChatMessage[];
}

interface FloatingCard {
  id: string;
  content: string;
  role: 'user' | 'agent';
  agent?: string;
}

const AGENT_COLORS: Record<string, string> = {
  AgentLee: '#FFD700',
  Nova:     '#F97316',
  Atlas:    '#06B6D4',
  Echo:     '#EC4899',
  Sage:     '#8B5CF6',
  Shield:   '#EF4444',
  Pixel:    '#22C55E',
  Nexus:    '#3B82F6',
  Aria:     '#A78BFA',
};

const VISIBLE_MS = 5000;
const FADE_MS    = 350;

export const FloatingChat: React.FC<FloatingChatProps> = ({ messages }) => {
  const [cards, setCards] = useState<FloatingCard[]>([]);
  const seenIds = useRef<Set<string>>(new Set());
  const timers  = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    // Find messages we haven't shown yet
    const unseen = messages.filter(
      m => !seenIds.current.has(m.id) && !m.streaming && m.content.length > 0
    );

    if (unseen.length === 0) return;

    unseen.forEach(msg => {
      seenIds.current.add(msg.id);

      const card: FloatingCard = {
        id:      msg.id,
        content: msg.content,
        role:    msg.role,
        agent:   msg.agent,
      };

      setCards(prev => [...prev, card]);

      // Schedule removal
      const removeTimer = setTimeout(() => {
        setCards(prev => prev.filter(c => c.id !== msg.id));
        timers.current.delete(msg.id);
      }, VISIBLE_MS + FADE_MS);

      timers.current.set(msg.id, removeTimer);
    });
  }, [messages]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach(t => clearTimeout(t));
    };
  }, []);

  return (
    <div
      className="fixed right-4 top-20 z-30 flex flex-col-reverse gap-2 pointer-events-none"
      style={{ maxWidth: 280, maxHeight: 'calc(100vh - 180px)', overflow: 'hidden' }}
    >
      <AnimatePresence mode="popLayout">
        {cards.map(card => {
          const color = card.agent
            ? (AGENT_COLORS[card.agent] ?? '#94a3b8')
            : '#3b82f6';

          // Truncate overly long responses to a readable snippet
          const snippet = card.content
            .replace(/```[\s\S]*?```/g, '[code]')
            .replace(/\*\*/g, '')
            .slice(0, 200);

          return (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.94 }}
              animate={{ opacity: 1, x: 0,  scale: 1 }}
              exit={{    opacity: 0, x: 40, scale: 0.94 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="rounded-2xl px-4 py-3 shadow-lg"
              style={{
                background:    'rgba(8,16,30,0.92)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border:        '1px solid rgba(255,255,255,0.08)',
                borderLeft:    `3px solid ${color}`,
              }}
            >
              {card.agent && (
                <p
                  className="text-[9px] font-black uppercase tracking-widest mb-1"
                  style={{ color }}
                >
                  {card.agent}
                </p>
              )}
              <p className="text-xs font-medium text-slate-100 leading-relaxed">
                {snippet}
                {card.content.length > 200 && (
                  <span className="text-slate-400 ml-1">…</span>
                )}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
