/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: MCP.TRANSPORT.DOMAIN_INDEX.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = index module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\mcp\domain\index.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

// Entities
export * from './MCPServer.js';
export * from './MCPTool.js';

// Interfaces
export * from './IMCPManager.js';
export * from './IMCPServerConnection.js';
export * from './IMCPToolRegistry.js';

// Errors
export * from './errors/index.js';
