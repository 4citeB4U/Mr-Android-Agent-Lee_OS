/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.COMPONENT.SYSTEM.AWARENESS
TAG: UI.COMPONENT.SYSTEM.AWARENESS.PANEL

COLOR_ONION_HEX:
NEON=#00F2FF
FLUO=#1BF7CD
PASTEL=#CBD5E1

ICON_ASCII:
family=lucide
glyph=network

5WH:
WHAT = Shared awareness panel for surfacing governance, diagnostics routing, and body topology
WHY = Keeps all major app surfaces aligned to the same body map and Memory Lake authority model
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/SystemAwarenessPanel.tsx
WHEN = 2026
HOW = Reusable React component backed by the shared system awareness registry

AGENTS:
ASSESS
ALIGN
AUDIT
SHIELD

LICENSE:
MIT
*/

import React from 'react';
import { Activity, Database, Network, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  AGENT_LEE_GOVERNANCE_ORDER,
  BODY_SYSTEM_ATLAS,
  BodySurfaceId,
  getSurfaceAwareness
} from '../core/agent_lee_system_awareness';

interface SystemAwarenessPanelProps {
  surfaceId: BodySurfaceId;
  variant?: 'shell' | 'compact' | 'full';
  className?: string;
}

export function SystemAwarenessPanel({
  surfaceId,
  variant = 'compact',
  className
}: SystemAwarenessPanelProps) {
  const surface = getSurfaceAwareness(surfaceId);

  if (variant === 'shell') {
    return (
      <div className={cn('rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3', className)}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-black/70">
            <Database size={12} style={{ color: surface.color }} />
            Memory Governed
          </div>
          <div className="h-3 w-px bg-black/10" />
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-black/60">
            <Activity size={12} />
            Diagnostics Aware
          </div>
          <div className="h-3 w-px bg-black/10" />
          <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: surface.color }}>
            {surface.label}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:p-5', className)}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.32em]" style={{ color: surface.color }}>
              Body Awareness
            </div>
            <div className="text-sm font-bold text-white mt-1">{surface.label}</div>
          </div>
          <div className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[9px] font-bold uppercase tracking-widest text-slate-300">
            {surface.layer}
          </div>
        </div>
        <div className="text-[12px] text-slate-300 leading-relaxed mb-4">{surface.summary}</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-3">
            <div className="text-[8px] font-black uppercase tracking-[0.22em] text-cyan-300 mb-1">Memory Lake</div>
            <div className="text-[11px] text-slate-200 leading-relaxed">{surface.memoryRole}</div>
          </div>
          <div className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/5 p-3">
            <div className="text-[8px] font-black uppercase tracking-[0.22em] text-fuchsia-300 mb-1">Diagnostics Brain</div>
            <div className="text-[11px] text-slate-200 leading-relaxed">{surface.diagnosticRole}</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-3">
            <div className="text-[8px] font-black uppercase tracking-[0.22em] text-emerald-300 mb-1">Route</div>
            <div className="text-[11px] text-slate-200 leading-relaxed">{surface.route}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6', className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-5">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.35em]" style={{ color: surface.color }}>
            Total Body Awareness
          </div>
          <div className="text-lg font-bold text-white mt-2">{surface.label}</div>
          <div className="text-sm text-slate-400 mt-1">{surface.layer}</div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-slate-300">
          <Network size={12} />
          Routed Through Memory + Diagnostics
        </div>
      </div>

      <div className="text-[13px] text-slate-300 leading-relaxed mb-5">{surface.summary}</div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-5 rounded-2xl border border-white/5 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300 mb-3">
            <ShieldCheck size={12} />
            Governance Order
          </div>
          <div className="space-y-3">
            {AGENT_LEE_GOVERNANCE_ORDER.map(step => (
              <div key={step.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">{step.label}</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">{step.role}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-4 rounded-2xl border border-white/5 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-fuchsia-300 mb-3">
            <Activity size={12} />
            Monitoring Lanes
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {surface.monitors.map(monitor => (
              <span key={monitor} className="px-2.5 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-bold uppercase tracking-wide text-slate-200">
                {monitor}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2">Linked Systems</div>
          <div className="space-y-2">
            {surface.linkedSystems.map(system => (
              <div key={system} className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-[11px] text-slate-300">
                {system}
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-3 rounded-2xl border border-white/5 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300 mb-3">
            <Database size={12} />
            Body Atlas
          </div>
          <div className="space-y-2">
            {BODY_SYSTEM_ATLAS.map(entry => (
              <div key={entry.label} className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                <div className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-500">{entry.label}</div>
                <div className="text-[11px] text-slate-200 mt-1">{entry.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}