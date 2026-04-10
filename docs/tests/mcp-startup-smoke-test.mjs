/*
LEEWAY HEADER — DO NOT REMOVE

REGION: QA.MCP.STARTUP
TAG: QA.MCP.STARTUP.SMOKE

COLOR_ONION_HEX:
NEON=#69F0AE
FLUO=#00E676
PASTEL=#C8E6C9

ICON_ASCII:
family=lucide
glyph=play-circle

5WH:
WHAT = MCP startup smoke test runner for unreachable nodes identified by live verifier
WHY = Converts unreachable endpoint warnings into concrete per-node startup diagnostics and failure evidence
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = scripts/mcp-startup-smoke-test.mjs
WHEN = 2026
HOW = Reads live verifier report, attempts process startup, probes / /sse /message, and writes reports/

AGENTS:
ASSESS
AUDIT
HEALTH

LICENSE:
MIT
*/

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ROOT = process.cwd();
const REPORT_IN = path.join(ROOT, 'reports', 'fullstack-node-endpoint-test.json');
const REPORT_OUT_JSON = path.join(ROOT, 'reports', 'mcp-startup-smoke-test.json');
const REPORT_OUT_MD = path.join(ROOT, 'reports', 'mcp-startup-smoke-test.md');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function probe(url, method = 'GET', timeoutMs = 1500) {
  try {
    const fetchPromise = fetch(url, {
      method,
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
      body: method === 'POST' ? '{}' : undefined,
    });
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs));
    const res = await Promise.race([fetchPromise, timeout]);
    return { ok: true, status: res.status };
  } catch (error) {
    return { ok: false, status: null, error: String(error?.message || error) };
  }
}

function parseLiveReport() {
  if (!fs.existsSync(REPORT_IN)) {
    throw new Error('Missing input report: reports/fullstack-node-endpoint-test.json');
  }
  const report = JSON.parse(fs.readFileSync(REPORT_IN, 'utf8'));
  const contract = report.checks.find((c) => c.name.includes('MCP agent nodes expose required endpoint/tool contracts'));
  const liveWarn = report.checks.find((c) => c.name.includes('Some MCP endpoints are not currently reachable in live mode'));
  const details = contract?.details || [];
  const unreachable = new Set((liveWarn?.details?.unreachable || []).map((u) => u.agent));

  return details
    .filter((d) => unreachable.has(d.agent))
    .map((d) => ({
      agent: d.agent,
      dir: path.join(ROOT, d.agent),
      port: Array.isArray(d.portCandidates) ? d.portCandidates.find((p) => Number.isFinite(p) && p > 0 && p < 65536) : null,
    }));
}

async function smokeOne(item) {
  if (!item.port) {
    return { agent: item.agent, started: false, reason: 'no-port-candidate' };
  }

  const stdout = [];
  const stderr = [];

  const child = spawn('npx tsx index.ts', {
    shell: true,
    cwd: item.dir,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (buf) => stdout.push(String(buf)));
  child.stderr.on('data', (buf) => stderr.push(String(buf)));

  let exited = false;
  let exitCode = null;
  child.on('exit', (code) => {
    exited = true;
    exitCode = code;
  });

  await sleep(5000);

  const root = await probe(`http://127.0.0.1:${item.port}/`, 'GET');
  const sse = await probe(`http://127.0.0.1:${item.port}/sse`, 'GET');
  const message = await probe(`http://127.0.0.1:${item.port}/message`, 'POST');

  const started = root.ok || sse.ok || message.ok || root.status !== null || sse.status !== null || message.status !== null;

  if (!exited) {
    child.kill();
    await sleep(250);
    if (!child.killed) {
      child.kill('SIGKILL');
    }
  }

  return {
    agent: item.agent,
    port: item.port,
    started,
    exited,
    exitCode,
    root,
    sse,
    message,
    stdout: stdout.join('').slice(-2000),
    stderr: stderr.join('').slice(-2000),
  };
}

async function main() {
  const targets = parseLiveReport();
  const results = [];

  for (const t of targets) {
    results.push(await smokeOne(t));
  }

  const summary = {
    total: results.length,
    started: results.filter((r) => r.started).length,
    failedToStart: results.filter((r) => !r.started).length,
  };

  const output = { generatedAt: new Date().toISOString(), summary, results };
  fs.writeFileSync(REPORT_OUT_JSON, JSON.stringify(output, null, 2), 'utf8');

  const md = [];
  md.push('# MCP Startup Smoke Test');
  md.push('');
  md.push(`Generated: ${output.generatedAt}`);
  md.push(`- Total targets: ${summary.total}`);
  md.push(`- Started/reachable: ${summary.started}`);
  md.push(`- Failed to start: ${summary.failedToStart}`);
  md.push('');

  for (const r of results) {
    md.push(`## ${r.agent}`);
    md.push('');
    md.push(`- Port: ${r.port}`);
    md.push(`- Started: ${r.started}`);
    md.push(`- Exited early: ${r.exited}`);
    md.push(`- Exit code: ${r.exitCode}`);
    md.push(`- / status: ${r.root?.status ?? 'n/a'}`);
    md.push(`- /sse status: ${r.sse?.status ?? 'n/a'}`);
    md.push(`- /message status: ${r.message?.status ?? 'n/a'}`);
    if (r.stderr) {
      md.push('');
      md.push('```text');
      md.push(r.stderr);
      md.push('```');
    }
    md.push('');
  }

  fs.writeFileSync(REPORT_OUT_MD, md.join('\n'), 'utf8');
  console.log(JSON.stringify({ summary, reportJson: path.relative(ROOT, REPORT_OUT_JSON), reportMd: path.relative(ROOT, REPORT_OUT_MD) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
