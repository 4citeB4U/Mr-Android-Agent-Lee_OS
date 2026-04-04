/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.COMPONENT.AGENTS.PANEL
TAG: UI.COMPONENT.AGENTTEAMPANEL.STATUSBAR

COLOR_ONION_HEX:
NEON=#06B6D4
FLUO=#22D3EE
PASTEL=#A5F3FC

ICON_ASCII:
family=lucide
glyph=users

5WH:
WHAT = Agent team status panel — shows live activity indicators for each active agent
WHY = Provides real-time visibility into which agents are operating and what task they are working on
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/AgentTeamPanel.tsx
WHEN = 2026
HOW = React component subscribing to EventBus agent:active/done/error events, rendering floating card list

AGENTS:
ASSESS
AUDIT

LICENSE:
MIT
*/

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '../core/EventBus';

interface AgentStatus {
  agent: string;
  task: string;
  active: boolean;
  lastUpdated: number;
}

export const AgentTeamPanel: React.FC = () => {
  const [agents, setAgents] = useState<Map<string, AgentStatus>>(new Map());

  useEffect(() => {
    const handleActive = ({ agent, task }: { agent: string; task: string }) => {
      setAgents(prev => {
        const next = new Map(prev);
        next.set(agent, { agent, task, active: true, lastUpdated: Date.now() });
        return next;
      });
    };

    const handleDone = ({ agent }: { agent: string }) => {
      setAgents(prev => {
        const next = new Map(prev);
        const current = next.get(agent) as AgentStatus | undefined;
        if (current) {
          next.set(agent, { ...current, active: false, lastUpdated: Date.now() });
        }
        return next;
      });
    };

    const handleError = ({ agent, error }: { agent: string; error: string }) => {
        setAgents(prev => {
          const next = new Map(prev);
          const current = next.get(agent) as AgentStatus | undefined;
          if (current) {
            next.set(agent, { ...current, task: `Error: ${error}`, active: false, lastUpdated: Date.now() });
          }
          return next;
        });
      };

    const unsubActive = eventBus.on('agent:active', handleActive as any);
    const unsubDone = eventBus.on('agent:done', handleDone as any);
    const unsubError = eventBus.on('agent:error', handleError as any);

    return () => {
      unsubActive();
      unsubDone();
      unsubError();
    };
  }, []);

  const activeAgents = Array.from(agents.values())
    .filter((a: AgentStatus) => Date.now() - a.lastUpdated < 10000) // Don't show old states forever
    .sort((a: AgentStatus, b: AgentStatus) => b.lastUpdated - a.lastUpdated);

  if (activeAgents.length === 0) return null;

  return (
    <div className="fixed top-24 right-6 z-40 w-80 pointer-events-none">
      <AnimatePresence>
        {activeAgents.map((status: any) => (
          <motion.div
            key={status.agent}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, transition: { duration: 0.5 } }}
            className={`mb-3 flex flex-col gap-1 overflow-hidden rounded-xl border bg-black/60 p-4 shadow-xl backdrop-blur-md ${
              status.active ? 'border-cyan-500/50' : 'border-emerald-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-widest ${status.active ? 'text-cyan-400' : 'text-emerald-400'}`}>
                {status.agent}
              </span>
              {status.active ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-300 leading-tight">
              {status.task}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
