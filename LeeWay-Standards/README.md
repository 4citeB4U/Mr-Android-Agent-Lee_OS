# LEEWAY™ STANDARDS

## The Autonomous Code Governance Framework

**LEEWAY™ (Logically Enhanced Engineering Web Architecture Yield)** is a software development standard that transforms codebases into **self-describing, auditable, AI-readable systems**.

The **LEEWAY SDK** is a lightweight agent platform that embeds governance, safety, readability, and repair assistance directly into the developer workflow — without requiring a heavy LLM runtime.

---

## Quick Start

### Install (npm)
```bash
npm install leeway-sdk
npx leeway doctor
```
### Install (GitHub)
```bash
npm install github:4citeB4U/LeeWay-Standards#main
npx leeway doctor
npx leeway audit
```

---

## The Core Philosophy

Traditional codebases become chaotic over time.

Files lose context. Developers leave. Documentation becomes outdated.

LEEWAY solves this by embedding **identity and intent directly into the code itself**.

Every file must answer five fundamental questions:

- **WHAT** does this file do?
- **WHY** does it exist?
- **WHO** created or owns it?
- **WHERE** does it belong in the system?
- **HOW** does it operate?

This concept is known as the **5WH Identity Model**.

---

## The Three Pillars of LEEWAY

### 1. Identity

Every file must clearly identify itself via a **LEEWAY header** at the top that defines:

- system region
- component tag
- color classification
- icon reference
- 5WH identity block
- allowed AI agents

### 2. Structure

LEEWAY enforces a **structured architecture**. Files must be placed in directories that match their function.

| Directory | Region | Purpose |
|-----------|--------|---------|
| `src/components/` | UI | User interface components |
| `src/core/` | CORE | Core system logic |
| `src/data/` | DATA | Storage and database access |
| `src/ai/` | AI | AI orchestration and models |
| `src/seo/` | SEO | Search and discovery logic |
| `src/utils/` | UTIL | Utilities and helpers |
| `src/mcp/` | MCP | Multi-Component Processing |
| `src/security/` | SECURITY | Security and policies |

### 3. Governance

A LEEWAY system constantly validates itself:

- Is every file documented?
- Are files in the correct location?
- Are security rules followed?
- Is there duplicate logic?

---

## The LEEWAY Header

Every file must begin with a **LEEWAY identity header**:

```javascript
/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.APP.SURFACE
TAG: UI.COMPONENT.NEXUS.BUTTON

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=layout-dashboard

5WH:
WHAT = Nexus voice control button
WHY = Primary interface for voice commands
WHO = Rapid Web Development
WHERE = src/components/NexusButton.tsx
WHEN = 2026
HOW = React + Tailwind component

AGENTS:
AZR
PHI3
leeway
QWEN
LLAMA
ECHO

LICENSE:
MIT
*/
```

---

## Tagging System

Every file must include a **TAG** that describes its role.

**Tag format:** `DOMAIN.SUBDOMAIN.ASSET.PURPOSE`

```
UI.COMPONENT.NEXUS.BUTTON
AI.ORCHESTRATION.MODEL.LOADER
DATA.LOCAL.STORE.MAIN
SEO.SCHEMA.GENERATOR.JSONLD
UTIL.FORMAT.DATE.HELPER
```

---

## File Naming Rules

| Context | Convention | Example |
|---------|-----------|---------|
| Folders | kebab-case | `voice-engine/` |
| React Components | PascalCase | `VoiceControlPanel.tsx` |
| Functions/Variables | camelCase | `generateSchemaMarkup()` |

---

## SDK Agent Roster (40 Agents)

### Group A — AAA Governance
| Agent | Purpose |
|-------|---------|
| `assess-agent` | Surveys what already exists before anything is created |
| `align-agent` | Normalizes files, settings, and structure |
| `audit-agent` | Scores compliance and generates reports |

### Group B — Code Readability & Standards
| Agent | Purpose |
|-------|---------|
| `header-agent` | Inserts and repairs LEEWAY headers |
| `tag-agent` | Infers TAG values from file path and role |
| `region-agent` | Assigns REGION correctly |
| `discovery-pipeline-agent` | Ensures every artifact has discovery metadata |
| `authority-agent` | Declares allowed actions and execution scope |
| `placement-agent` | Checks file placement against structure rules |
| `registry-agent` | Updates tag registry and system map |

### Group C — MCP & Agent Safety
| Agent | Purpose |
|-------|---------|
| `endpoint-agent` | Detects existing health and HTTP endpoints |
| `transport-agent` | Verifies approved MCP transport usage |
| `port-agent` | Assigns and validates ports from a registry |
| `process-agent` | Handles process ownership and zombie cleanup |
| `env-agent` | Validates required vs optional env vars |
| `runtime-agent` | Checks module/runtime compatibility |
| `manifest-agent` | Validates manifest completeness and tool definitions |
| `health-agent-lite` | Runs lightweight startup and readiness checks |

### Group D — Code Integrity
| Agent | Purpose |
|-------|---------|
| `syntax-agent` | Guards against malformed code |
| `import-agent` | Normalizes import style and local import rules |
| `module-policy-agent` | Prevents CommonJS/ESM drift |
| `duplicate-logic-agent` | Detects repeated logic and duplicate blocks |
| `dependency-graph-agent` | Builds lightweight dependency maps |
| `circular-dependency-agent` | Detects circular imports |
| `refactor-scan-agent` | Suggests safe structural improvements |

### Group E — Security & Trust
| Agent | Purpose |
|-------|---------|
| `secret-scan-agent` | Looks for secrets and unsafe credential handling |
| `permission-agent` | Checks action permissions and runtime boundaries |
| `prompt-security-agent` | Scans prompts for unsafe patterns |
| `tool-access-agent` | Ensures tools are called through approved paths |
| `policy-agent` | Enforces LEEWAY policy bundles |
| `privacy-agent` | Checks privacy and data handling declarations |

### Group F — Discovery & Documentation
| Agent | Purpose |
|-------|---------|
| `schema-agent` | Generates machine-readable schemas |
| `sitemap-agent` | Builds site/discovery maps |
| `intent-registry-agent` | Tracks supported intents and routes |
| `docs-agent` | Generates structured docs from headers |
| `explain-agent` | Explains a file or module in plain English |
| `architecture-map-agent` | Produces a JSON/ASCII architecture map |

### Group G — Orchestration
| Agent | Purpose |
|-------|---------|
| `router-agent` | Chooses which agents to invoke for a task |
| `memory-agent-lite` | Stores SDK-local state and audit receipts |
| `doctor-agent` | Runs full system health and compliance diagnosis |

---

## Using the SDK Programmatically

```javascript
import { AssessAgent, AuditAgent, DoctorAgent } from 'leeway-sdk';

// Assess the codebase
const assess = new AssessAgent({ rootDir: process.cwd() });
const inventory = await assess.run();
console.log(inventory.summary);

// Run a compliance audit
const audit = new AuditAgent({ rootDir: process.cwd() });
const report = await audit.runAndSave();
console.log(`Average compliance: ${report.summary.averageScore}/100`);

// Full system diagnosis
const doctor = new DoctorAgent({ rootDir: process.cwd() });
const diagnosis = await doctor.run();
console.log(doctor.formatReport(diagnosis));
```

---

## Security Rules

The following rules must always be followed:

- **Never** include private API keys, database credentials, or secret tokens in code
- All user input must be sanitized
- AI prompts must be protected against malicious injection
- Dependencies must be verified before installation
- Use `leeway scan` to detect any accidental secrets before committing

---

## Compliance Levels

| Level | Score | Description |
|-------|-------|-------------|
| 🥇 Platinum | 95–100 | Fully LEEWAY-compliant |
| 🥈 Gold | 80–94 | Mostly compliant, minor gaps |
| 🥉 Silver | 60–79 | Partially compliant |
| 🔶 Bronze | 40–59 | Minimal compliance |
| ❌ None | 0–39 | Not LEEWAY-compliant |

---

## Quick Start Rules (For Humans or AI)

1. Always include a LEEWAY header.
2. Assign a correct TAG.
3. Place the file in the correct directory.
4. Follow naming conventions.
5. Avoid duplicate logic.
6. Ensure security rules are followed.
7. Document purpose using the 5WH model.

If these rules are followed, the system will remain **stable, understandable, and scalable**.

---

## Repository Structure

```
LeeWay-Standards/
├── src/
│   ├── index.js                    # SDK main entry
│   ├── core/                       # Core parsing and validation
│   │   ├── header-parser.js
│   │   ├── tag-validator.js
│   │   ├── region-classifier.js
│   │   └── compliance-scorer.js
│   ├── agents/
│   │   ├── governance/             # Group A: AAA Governance
│   │   ├── standards/              # Group B: Standards agents
│   │   ├── mcp/                    # Group C: MCP & Safety agents
│   │   ├── integrity/              # Group D: Code integrity agents
│   │   ├── security/               # Group E: Security agents
│   │   ├── discovery/              # Group F: Discovery agents
│   │   └── orchestration/          # Group G: Orchestration agents
│   └── cli/
│       └── leeway.js               # CLI entry point
├── docs/                           # Standards documentation
├── schemas/                        # JSON schemas
│   ├── leeway-header.schema.json
│   └── leeway-config.schema.json
├── examples/                       # Example LEEWAY-compliant files
│   ├── NexusButton.tsx
│   └── example-agent.js
└── .leeway/
    └── config.json                 # Project governance config
```

---

## License

MIT © Rapid Web Development

