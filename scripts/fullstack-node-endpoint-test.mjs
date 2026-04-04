/*
LEEWAY HEADER — DO NOT REMOVE

REGION: QA.FULLSTACK.VERIFIER
TAG: QA.FULLSTACK.VERIFIER.NODE_ENDPOINT

COLOR_ONION_HEX:
NEON=#00E5FF
FLUO=#18FFFF
PASTEL=#B2EBF2

ICON_ASCII:
family=lucide
glyph=network

5WH:
WHAT = Full-stack node and endpoint verifier for Agent Lee system contracts
WHY = Validates that surfaces, MCP nodes, and endpoint contracts are wired and observable end-to-end
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = scripts/fullstack-node-endpoint-test.mjs
WHEN = 2026
HOW = Static and optional live probes generate JSON/Markdown pass-fail reports in reports/

AGENTS:
ASSESS
AUDIT
SHIELD

LICENSE:
MIT
*/

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const MCP_ROOT = path.join(ROOT, 'MCP agents');
const REPORT_JSON = path.join(ROOT, 'reports', 'fullstack-node-endpoint-test.json');
const REPORT_MD = path.join(ROOT, 'reports', 'fullstack-node-endpoint-test.md');
const LIVE_MODE = process.argv.includes('--live');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function exists(p) {
  return fs.existsSync(p);
}

function walk(dir, out = []) {
  if (!exists(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}

function matchAll(text, regex) {
  const out = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    out.push(m[1]);
  }
  return out;
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function extractPortCandidates(text) {
  const candidates = new Set();
  for (const m of text.matchAll(/env\([^,]+,\s*"(\d{2,5})"\)/g)) {
    candidates.add(Number(m[1]));
  }
  for (const m of text.matchAll(/process\.env\.[A-Z0-9_]+\s*\|\|\s*"(\d{2,5})"/g)) {
    candidates.add(Number(m[1]));
  }
  for (const m of text.matchAll(/process\.env\.[A-Z0-9_]+\s*\|\|\s*(\d{2,5})/g)) {
    candidates.add(Number(m[1]));
  }
  return Array.from(candidates).filter((n) => Number.isFinite(n) && n > 0 && n < 65536);
}

async function probeUrl(url, method = 'GET', timeoutMs = 2000) {
  const started = Date.now();
  try {
    // Avoid AbortController teardown instability on Windows by using Promise.race timeout.
    const fetchPromise = fetch(url, {
      method,
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
      body: method === 'POST' ? '{}' : undefined,
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), timeoutMs);
    });

    const res = await Promise.race([fetchPromise, timeoutPromise]);
    return {
      ok: res.ok,
      status: res.status,
      latencyMs: Date.now() - started,
      url,
      method,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - started,
      url,
      method,
      error: String(error?.message || error),
    };
  }
}

const files = walk(ROOT).filter((f) => /\.(ts|tsx|js|md|json)$/.test(f));

const results = {
  generatedAt: new Date().toISOString(),
  summary: {
    passed: 0,
    failed: 0,
    warnings: 0,
  },
  checks: [],
};

function pass(name, details) {
  results.summary.passed += 1;
  results.checks.push({ status: 'PASS', name, details });
}

function fail(name, details) {
  results.summary.failed += 1;
  results.checks.push({ status: 'FAIL', name, details });
}

function warn(name, details) {
  results.summary.warnings += 1;
  results.checks.push({ status: 'WARN', name, details });
}

// 1) Surface node coverage
const awarenessPath = path.join(ROOT, 'core', 'agent_lee_system_awareness.ts');
const layoutPath = path.join(ROOT, 'components', 'Layout.tsx');
const appPath = path.join(ROOT, 'App.tsx');

if (exists(awarenessPath) && exists(layoutPath) && exists(appPath)) {
  const awarenessText = read(awarenessPath);
  const layoutText = read(layoutPath);
  const appText = read(appPath);

  const awarenessBlock = awarenessText.split('export const SURFACE_AWARENESS')[1] || '';
  const awarenessSurfaceIds = Array.from(new Set(matchAll(awarenessBlock, /^\s{2}([a-z]+):\s*\{/gm)));
  const layoutNavIds = Array.from(new Set(matchAll(layoutText, /\{\s*id:\s*'([a-z]+)'/g)));
  const appPageMatches = appText.match(/'home'|'diagnostics'|'settings'|'deployment'|'memory'|'code'|'database'|'creators'/g) || [];
  const appValidPages = Array.from(new Set(appPageMatches.map((s) => s.replace(/'/g, ''))));

  const missingInLayout = awarenessSurfaceIds.filter((id) => !layoutNavIds.includes(id));
  const missingInApp = awarenessSurfaceIds.filter((id) => !appValidPages.includes(id));

  if (missingInLayout.length === 0 && missingInApp.length === 0) {
    pass('Surface graph is aligned across awareness, layout, and app routing', {
      surfaces: awarenessSurfaceIds,
    });
  } else {
    fail('Surface graph mismatch detected', {
      missingInLayout,
      missingInApp,
    });
  }
} else {
  fail('Surface graph files missing', {
    awarenessPath: exists(awarenessPath),
    layoutPath: exists(layoutPath),
    appPath: exists(appPath),
  });
}

// 2) Diagnostics emitter coverage for pages
const pagesDir = path.join(ROOT, 'pages');
if (exists(pagesDir)) {
  const pageFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.tsx'));
  const emitCoverage = [];
  for (const file of pageFiles) {
    const full = path.join(pagesDir, file);
    const text = read(full);
    const emitsDiagnostics = /pushDiagnosticsReport\s*\(/.test(text);
    emitCoverage.push({ file: rel(full), emitsDiagnostics });
  }
  const missing = emitCoverage.filter((e) => !e.emitsDiagnostics).map((e) => e.file);
  if (missing.length === 0) {
    pass('Every page emits diagnostics reports', emitCoverage);
  } else {
    warn('Some pages do not emit diagnostics reports', { missing, emitCoverage });
  }
}

// 3) EventBus movement wiring: emitted events must have at least one listener
const codeFiles = files.filter((f) => /\.(ts|tsx|js)$/.test(f));
const emitted = new Set();
const listened = new Set();
for (const file of codeFiles) {
  const text = read(file);
  for (const ev of matchAll(text, /eventBus\.emit\('([^']+)'/g)) emitted.add(ev);
  for (const ev of matchAll(text, /eventBus\.on\('([^']+)'/g)) listened.add(ev);
}
const emittedNoListener = Array.from(emitted).filter((ev) => !listened.has(ev));
if (emittedNoListener.length === 0) {
  pass('All emitted EventBus events have listeners', {
    emitted: Array.from(emitted).sort(),
  });
} else {
  warn('Some emitted EventBus events have no direct listeners', {
    emittedNoListener,
    emitted: Array.from(emitted).sort(),
    listened: Array.from(listened).sort(),
  });
}

// 4) MCP endpoint node contracts
if (exists(MCP_ROOT)) {
  const mcpDirs = fs.readdirSync(MCP_ROOT)
    .map((name) => path.join(MCP_ROOT, name))
    .filter((p) => fs.existsSync(p) && fs.statSync(p).isDirectory() && p.endsWith('-mcp'));

  const mcpResults = [];
  for (const dir of mcpDirs) {
    const indexTs = path.join(dir, 'index.ts');
    if (!exists(indexTs)) {
      mcpResults.push({ agent: rel(dir), ok: false, reason: 'missing index.ts' });
      continue;
    }
    const text = read(indexTs);
    const hasRoot = /app\.get\(\s*"\/"|app\.get\(\s*'\/'/.test(text);
    const hasSse = /app\.get\(\s*"\/sse"|app\.get\(\s*'\/sse'/.test(text);
    const hasMessage = /app\.post\(\s*"\/message"|app\.post\(\s*'\/message'/.test(text);
    const hasListTool = /setRequestHandler\(\s*ListToolsRequestSchema/.test(text);
    const hasCallTool = /setRequestHandler\(\s*CallToolRequestSchema/.test(text);
    const portCandidates = extractPortCandidates(text);
    const ok = hasRoot && hasSse && hasMessage && hasListTool && hasCallTool;
    mcpResults.push({
      agent: rel(dir),
      ok,
      hasRoot,
      hasSse,
      hasMessage,
      hasListTool,
      hasCallTool,
      portCandidates,
    });
  }

  const failed = mcpResults.filter((r) => !r.ok);
  if (failed.length === 0) {
    pass('All MCP agent nodes expose required endpoint/tool contracts', mcpResults);
  } else {
    fail('MCP endpoint/tool contract gaps detected', { failed, mcpResults });
  }

  if (LIVE_MODE) {
    const liveChecks = [];
    for (const item of mcpResults) {
      const ports = (item.portCandidates || []).length > 0 ? item.portCandidates : [];
      if (ports.length === 0) {
        liveChecks.push({ agent: item.agent, reachable: false, reason: 'no-port-candidate' });
        continue;
      }
      let reachable = false;
      const attempts = [];
      for (const port of ports) {
        const rootProbe = await probeUrl(`http://127.0.0.1:${port}/`, 'GET');
        const sseProbe = await probeUrl(`http://127.0.0.1:${port}/sse`, 'GET');
        const messageProbe = await probeUrl(`http://127.0.0.1:${port}/message`, 'POST');
        attempts.push({ port, rootProbe, sseProbe, messageProbe });
        // Endpoint considered reachable when transport responds, even with 4xx on invalid payload.
        const transportReachable =
          rootProbe.status !== null || sseProbe.status !== null || messageProbe.status !== null;
        if (transportReachable) {
          reachable = true;
        }
      }
      liveChecks.push({
        agent: item.agent,
        reachable,
        attempts,
      });
    }

    const unreachable = liveChecks.filter((c) => !c.reachable);
    if (unreachable.length === 0) {
      pass('Live MCP endpoint probes are reachable', { liveChecks });
    } else {
      warn('Some MCP endpoints are not currently reachable in live mode', {
        unreachable,
        liveChecks,
      });
    }
  }
}

// 5) Firebase function endpoint contracts
const fnProxy = path.join(ROOT, 'functions', 'src', 'geminiProxy.ts');
const fnIndex = path.join(ROOT, 'functions', 'src', 'index.ts');
if (exists(fnProxy) && exists(fnIndex)) {
  const proxyText = read(fnProxy);
  const indexText = read(fnIndex);
  const hasProxy = /export\s+const\s+geminiProxy\s*=\s*functions\.https\.onRequest/.test(proxyText);
  const hasStream = /export\s+const\s+geminiStream\s*=\s*functions\.https\.onRequest/.test(proxyText);
  const exportsFromIndex = /export\s*\{\s*geminiProxy\s*,\s*geminiStream\s*\}/.test(indexText);
  if (hasProxy && hasStream && exportsFromIndex) {
    pass('Firebase function endpoints are defined and exported', {
      hasProxy,
      hasStream,
      exportsFromIndex,
    });
  } else {
    fail('Firebase function endpoint export contract failed', {
      hasProxy,
      hasStream,
      exportsFromIndex,
    });
  }
}

// 6) Gemini free-tier model policy safety scan
const modelSafetyHits = [];
for (const file of codeFiles) {
  const text = read(file);
  if (/gemini-1\.5-flash|gemini-1\.5-pro/.test(text)) {
    modelSafetyHits.push(rel(file));
  }
}
if (modelSafetyHits.length === 0) {
  pass('No paid-tier Gemini model IDs found in runtime code scan', {});
} else {
  warn('Potential non-free-tier model IDs detected', { files: modelSafetyHits });
}

ensureDir(path.dirname(REPORT_JSON));
fs.writeFileSync(REPORT_JSON, JSON.stringify(results, null, 2), 'utf8');

const md = [];
md.push('# Full-Stack Node and Endpoint Test Report');
md.push('');
md.push(`Generated: ${results.generatedAt}`);
md.push('');
md.push(`- Passed: ${results.summary.passed}`);
md.push(`- Failed: ${results.summary.failed}`);
md.push(`- Warnings: ${results.summary.warnings}`);
md.push(`- Live Mode: ${LIVE_MODE ? 'enabled' : 'disabled'}`);
md.push('');
for (const check of results.checks) {
  md.push(`## [${check.status}] ${check.name}`);
  md.push('');
  md.push('```json');
  md.push(JSON.stringify(check.details, null, 2));
  md.push('```');
  md.push('');
}
fs.writeFileSync(REPORT_MD, md.join('\n'), 'utf8');

const exitCode = results.summary.failed > 0 ? 1 : 0;
console.log(JSON.stringify({ summary: results.summary, reportJson: rel(REPORT_JSON), reportMd: rel(REPORT_MD) }, null, 2));
process.exit(exitCode);
