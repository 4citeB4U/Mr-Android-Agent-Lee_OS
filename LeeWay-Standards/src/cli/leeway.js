#!/usr/bin/env node
/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE.SDK.CLI
TAG: CORE.SDK.CLI.LEEWAY

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=terminal

5WH:
WHAT = LEEWAY CLI — the primary command-line interface for the LEEWAY governance SDK
WHY = Developers need a single command to run governance checks, audits, and repairs
WHO = Rapid Web Development
WHERE = src/cli/leeway.js
WHEN = 2026
HOW = Node.js CLI using process.argv, no heavy dependencies, direct agent invocation

AGENTS:
ASSESS
ALIGN
AUDIT
DOCTOR
REGISTRY

LICENSE:
MIT
*/

import { DoctorAgent } from '../agents/orchestration/doctor-agent.js';
import { AuditAgent } from '../agents/governance/audit-agent.js';
import { AssessAgent } from '../agents/governance/assess-agent.js';
import { RegistryAgent } from '../agents/standards/registry-agent.js';
import { ArchitectureMapAgent } from '../agents/discovery/architecture-map-agent.js';
import { AlignAgent } from '../agents/governance/align-agent.js';
import { SecretScanAgent } from '../agents/security/secret-scan-agent.js';
import { readdir, readFile } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';

const rootDir = process.cwd();
const args = process.argv.slice(2);
const command = args[0] || 'help';

const BANNER = `
  ██╗     ███████╗███████╗██╗    ██╗ █████╗ ██╗   ██╗
  ██║     ██╔════╝██╔════╝██║    ██║██╔══██╗╚██╗ ██╔╝
  ██║     █████╗  █████╗  ██║ █╗ ██║███████║ ╚████╔╝
  ██║     ██╔══╝  ██╔══╝  ██║███╗██║██╔══██║  ╚██╔╝
  ███████╗███████╗███████╗╚███╔███╔╝██║  ██║   ██║
  ╚══════╝╚══════╝╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝
  LEEWAY™ v1.0.1 — Autonomous Code Governance SDK
`;

const COMMANDS = {
  doctor: 'Run full system health and compliance diagnosis',
  audit: 'Score LEEWAY compliance across all code files',
  assess: 'Survey what files and headers exist in the codebase',
  align: 'Add missing LEEWAY headers (dry-run by default)',
  registry: 'Build and save the LEEWAY file and tag registry',
  map: 'Generate a codebase architecture map',
  scan: 'Scan for hardcoded secrets',
  help: 'Show this help message',
};

async function runDoctor() {
  console.log(BANNER);
  console.log('Running LEEWAY Doctor...\n');
  const agent = new DoctorAgent({ rootDir });
  const report = await agent.run();
  console.log(agent.formatReport(report));
  process.exit(report.healthy ? 0 : 1);
}

async function runAudit() {
  console.log(BANNER);
  console.log('Running LEEWAY Audit...\n');
  const agent = new AuditAgent({ rootDir });
  const report = await agent.runAndSave();
  console.log(agent._formatTextReport(report));
  if (report.savedTo) {
    console.log(`\n📄 Reports saved to:\n  JSON: ${report.savedTo.json}\n  Text: ${report.savedTo.text}`);
  }
  process.exit(report.summary.averageScore >= 60 ? 0 : 1);
}

async function runAssess() {
  console.log(BANNER);
  console.log('Running LEEWAY Assessment...\n');
  const agent = new AssessAgent({ rootDir });
  const result = await agent.run();
  console.log('── ASSESSMENT SUMMARY ─────────────────────────────');
  console.log(`  Total Files      : ${result.inventory.totalFiles}`);
  console.log(`  Code Files       : ${result.inventory.codeFiles}`);
  console.log(`  Header Coverage  : ${result.summary.headerCoverage}`);
  console.log(`  Missing Headers  : ${result.summary.filesNeedingHeaders}`);
  console.log(`  Duplicate Tags   : ${result.summary.duplicateTagCount}`);
  console.log(`  Regions Found    : ${result.summary.regionsFound}`);

  if (result.inventory.missingHeaders.length > 0) {
    console.log('\n── FILES MISSING HEADERS (first 10) ───────────────');
    result.inventory.missingHeaders.slice(0, 10).forEach(f => console.log(`  ⚠️  ${f}`));
  }
  if (result.inventory.duplicateTags.length > 0) {
    console.log('\n── DUPLICATE TAGS ──────────────────────────────────');
    result.inventory.duplicateTags.forEach(d => {
      console.log(`  ⚠️  ${d.tag}`);
      d.files.forEach(f => console.log(`      → ${f}`));
    });
  }
}

async function runAlign() {
  const dryRun = !args.includes('--apply');
  console.log(BANNER);
  console.log(`Running LEEWAY Align (${dryRun ? 'DRY RUN — use --apply to write changes' : 'APPLYING CHANGES'})...\n`);

  const assessAgent = new AssessAgent({ rootDir });
  const assessment = await assessAgent.run();
  const missing = assessment.inventory.missingHeaders;

  if (missing.length === 0) {
    console.log('✅ All code files have LEEWAY headers. Nothing to align.');
    return;
  }

  const alignAgent = new AlignAgent({ rootDir, dryRun });
  const result = await alignAgent.alignHeaders(missing);

  console.log(`Processed ${result.processed} files`);
  result.results.forEach(r => {
    const icon = r.action === 'header_added' ? '✅' : r.action === 'error' ? '❌' : '⏭️ ';
    console.log(`  ${icon} [${r.action}] ${r.file}`);
  });

  if (dryRun && result.results.some(r => r.action === 'header_added')) {
    console.log('\n💡 Run with --apply to write changes: leeway align --apply');
  }
}

async function runRegistry() {
  console.log(BANNER);
  console.log('Building LEEWAY Registry...\n');
  const agent = new RegistryAgent({ rootDir });
  const registry = await agent.buildAndSave();
  console.log(`✅ Registry built: ${Object.keys(registry.files).length} files indexed`);
  console.log(`   Tags found: ${Object.keys(registry.tags).length}`);
  console.log(`   Regions: ${Object.keys(registry.regions).join(', ')}`);
  if (registry.savedTo) console.log(`   Saved to: ${registry.savedTo}`);
}

async function runMap() {
  console.log(BANNER);
  console.log('Building Architecture Map...\n');
  const agent = new ArchitectureMapAgent({ rootDir });
  const ascii = await agent.buildAsciiDiagram();
  console.log(ascii);
}

async function runScan() {
  console.log(BANNER);
  console.log('Scanning for secrets...\n');
  const agent = new SecretScanAgent({ rootDir });
  const CODE_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.env', '.json', '.yaml', '.yml']);
  const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'coverage']);

  let totalFindings = 0;
  const walk = async (dir, depth = 0) => {
    if (depth > 8) return;
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) { await walk(fullPath, depth + 1); }
      else if (CODE_EXTENSIONS.has(extname(entry.name))) {
        const result = await agent.scanFile(fullPath);
        if (!result.clean) {
          totalFindings += result.findings.length;
          console.log(`\n❌ ${relative(rootDir, fullPath)}`);
          result.findings.forEach(f => console.log(`   Line ${f.line}: [${f.rule}] ${f.label}`));
        }
      }
    }
  };
  await walk(rootDir);

  if (totalFindings === 0) {
    console.log('✅ No secrets detected');
  } else {
    console.log(`\n⚠️  ${totalFindings} potential secret(s) found. Review and remediate immediately.`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(BANNER);
  console.log('Usage: leeway <command> [options]\n');
  console.log('Commands:');
  for (const [cmd, desc] of Object.entries(COMMANDS)) {
    console.log(`  ${cmd.padEnd(12)} ${desc}`);
  }
  console.log('\nOptions:');
  console.log('  --apply      Apply changes (used with align command)');
  console.log('  --help       Show this help message');
  console.log('');
}

switch (command) {
  case 'doctor':   await runDoctor();   break;
  case 'audit':    await runAudit();    break;
  case 'assess':   await runAssess();   break;
  case 'align':    await runAlign();    break;
  case 'registry': await runRegistry(); break;
  case 'map':      await runMap();      break;
  case 'scan':     await runScan();     break;
  case 'help':
  case '--help':
  default:         showHelp();          break;
}
