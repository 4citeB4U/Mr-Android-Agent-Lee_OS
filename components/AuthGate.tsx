/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.COMPONENT.AUTH.GATE
TAG: UI.COMPONENT.AUTHGATE.OAUTH

COLOR_ONION_HEX:
NEON=#4285F4
FLUO=#5A9AF5
PASTEL=#BFDBFE

ICON_ASCII:
family=lucide
glyph=shield-check

5WH:
WHAT = Authentication gate — blocks the OS until the user signs in with leeway OAuth
WHY = Ensures all leeway API calls are authorized under the user's own leeway account quota
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/AuthGate.tsx
WHEN = 2026
HOW = React component checking useAuth state — shows sign-in prompt if not authenticated, children otherwise

AGENTS:
ASSESS
AUDIT
SECURITY

LICENSE:
MIT
*/

import React from 'react';
import { useAuth } from '../core/AuthProvider';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, signInWithleeway } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="text-cyan-400 font-mono animate-pulse">
          INITIALIZING SECURE LINK...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 px-4 text-center">
        <div className="mb-12">
          {/* A simple placeholder logo/icon for Agent Lee */}
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-cyan-950 border border-cyan-800 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
            <span className="text-4xl font-black text-cyan-400">LEE</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">AGENT LEE <span className="text-cyan-400">OS</span></h1>
          <p className="text-zinc-400 font-mono text-sm max-w-sm">
            Sovereign Agentic Operating System powered by leeway.
          </p>
        </div>

        <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/5 p-8 shadow-2xl">
          <h2 className="mb-6 text-xl font-bold text-white">Secure Access</h2>
          <p className="mb-8 text-sm text-zinc-400 leading-relaxed">
            Please sign in with your leeway account. No API keys are required; Agent Lee accesses backend intelligence securely via OAuth.
          </p>
          
          <button
            onClick={signInWithleeway}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-white/[0.08] border border-white/20 px-6 py-4 font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-[#00f2ff]/10 opacity-0 transition-opacity group-hover:opacity-100" />
            <svg className="h-6 w-6 relative z-10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="relative z-10 tracking-widest text-sm uppercase">Continue with leeway</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

