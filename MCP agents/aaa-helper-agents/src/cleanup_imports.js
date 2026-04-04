/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AAA.CLEANUP
TAG: MCP.AAA.CLEANUP.IMPORTS

COLOR_ONION_HEX:
NEON=#FF1744
FLUO=#FF5252
PASTEL=#FFCDD2

ICON_ASCII:
family=lucide
glyph=eraser

5WH:
WHAT = AAA import cleanup utility — removes duplicated express/SSE imports from MCP index files
WHY = Keeps MCP source files syntactically clean and compliant before runtime checks
WHO = Agent Lee OS — MCP AAA System
WHERE = MCP agents/aaa-helper-agents/src/cleanup_imports.js
WHEN = 2026
HOW = Walks MCP agent directories and applies regex cleanup to duplicate import blocks

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
PROPRIETARY
*/

const fs = require('fs');
const path = require('path');

const agentsDir = 'C:/MCP agents';
const dirs = fs.readdirSync(agentsDir).filter(d => d.endsWith('-agent-mcp'));

for (const d of dirs) {
  const p = path.join(agentsDir, d, 'index.ts');
  if (fs.existsSync(p)) {
    let c = fs.readFileSync(p, 'utf8');
    
    // Remove all consecutive duplicates of express and SSEServerTransport
    const regex = /(import express from "express";\nimport \{ SSEServerTransport \} from "@modelcontextprotocol\/sdk\/server\/sse\.js";\n)+/g;
    c = c.replace(regex, 'import express from "express";\nimport { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";\n');
    
    fs.writeFileSync(p, c);
    console.log('Cleaned ' + d);
  }
}
