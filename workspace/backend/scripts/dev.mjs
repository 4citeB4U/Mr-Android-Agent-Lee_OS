/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.DEV.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = dev module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\scripts\dev.mjs
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { spawn } from 'child_process';

const requestedPort = Number(process.env.PORT || '8001');
let port = Number.isFinite(requestedPort) && requestedPort > 0 ? requestedPort : 8001;

// Avoid the most common conflict: frontend/ngrok on 8000.
// If the user explicitly wants 8000, they can set FORCE_PORT=1.
if (port === 8000 && process.env.FORCE_PORT !== '1') {
  console.warn('[backend:dev] PORT=8000 detected; switching to PORT=8001 to avoid frontend port conflicts. Set FORCE_PORT=1 to override.');
  port = 8001;
}

process.env.PORT = String(port);

// Keep websocket separate from HTTP.
if (!process.env.WS_PORT) {
  process.env.WS_PORT = '8003';
}

const child = spawn(
  'tsx',
  ['watch', 'src/index.ts'],
  {
    stdio: 'inherit',
    shell: true,
    env: process.env
  }
);

child.on('exit', (code) => process.exit(code ?? 1));
