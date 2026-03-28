/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.LEEWAYSKILLS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=brain-circuit

5WH:
WHAT = Leeway Skills registry service
WHY = Gives Agent Lee always-on access to packaged Leeway skill metadata and MCP wiring
WHO = LEEWAY Align Agent
WHERE = backend\src\services\leewaySkills.ts
WHEN = 2026
HOW = Loads the installed @agentlee5/agent-skills registry, matches relevant skills, and exposes MCP bootstrap config

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import fs from "fs";
import path from "path";
import type { MCPServerConfigType } from "../runtime/agentRuntime/core/config/AppConfig.js";

type SkillRecord = {
  name: string;
  category: string;
  path: string;
  version?: string;
  tags?: string[];
  description?: string;
  capabilities?: string[];
  enabled?: boolean;
  source?: string;
};

type SkillRegistry = {
  version?: string;
  totalSkills?: number;
  totalCategories?: number;
  skills?: SkillRecord[];
};

type SkillSummary = {
  enabled: boolean;
  installed: boolean;
  packageRoot: string;
  registryPath: string;
  mcpEntryPath: string;
  serverId: string;
  totalSkills: number;
  totalCategories: number;
};

type CachedRegistry = {
  registry: SkillRegistry;
  mtimeMs: number;
};

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value.trim() === "") {
    return fallback;
  }
  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}

function sanitizeEnv(env: NodeJS.ProcessEnv): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") {
      clean[key] = value;
    }
  }
  return clean;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 3);
}

function scoreSkill(skill: SkillRecord, tokens: string[]): number {
  if (tokens.length === 0) {
    return 0;
  }

  const name = (skill.name || "").toLowerCase();
  const category = (skill.category || "").toLowerCase();
  const description = (skill.description || "").toLowerCase();
  const tags = (skill.tags || []).map((tag) => tag.toLowerCase());
  const capabilities = (skill.capabilities || []).map((capability) =>
    capability.toLowerCase(),
  );

  let score = 0;
  for (const token of tokens) {
    if (name.includes(token)) score += 6;
    if (category.includes(token)) score += 4;
    if (description.includes(token)) score += 2;
    if (tags.some((tag) => tag.includes(token))) score += 3;
    if (capabilities.some((capability) => capability.includes(token))) score += 3;
  }

  return score;
}

class LeewaySkillsService {
  private cache: CachedRegistry | null = null;

  isEnabled(): boolean {
    return toBool(process.env.AGENTLEE_SKILLS_ENABLED, true);
  }

  getServerId(): string {
    return (process.env.AGENTLEE_SKILLS_SERVER_ID || "agent-skills").trim();
  }

  getPackageRoot(): string {
    return (
      process.env.AGENTLEE_SKILLS_PACKAGE_ROOT ||
      path.resolve(
        process.cwd(),
        "node_modules",
        "@agentlee5",
        "agent-skills",
      )
    ).trim();
  }

  getRegistryPath(): string {
    return (
      process.env.AGENTLEE_SKILLS_REGISTRY_PATH ||
      path.join(this.getPackageRoot(), "scripts", "skills-registry.json")
    ).trim();
  }

  getMcpEntryPath(): string {
    return (
      process.env.AGENTLEE_SKILLS_MCP_ENTRY ||
      path.join(this.getPackageRoot(), "mcp-server", "dist", "index.js")
    ).trim();
  }

  async getRegistry(): Promise<SkillRegistry | null> {
    const registryPath = this.getRegistryPath();
    try {
      const stats = await fs.promises.stat(registryPath);
      if (this.cache && this.cache.mtimeMs === stats.mtimeMs) {
        return this.cache.registry;
      }

      const raw = await fs.promises.readFile(registryPath, "utf-8");
      const registry = JSON.parse(raw) as SkillRegistry;
      this.cache = { registry, mtimeMs: stats.mtimeMs };
      return registry;
    } catch {
      return null;
    }
  }

  async getSummary(): Promise<SkillSummary> {
    const registry = await this.getRegistry();
    const installed =
      fs.existsSync(this.getPackageRoot()) && fs.existsSync(this.getMcpEntryPath());

    return {
      enabled: this.isEnabled(),
      installed,
      packageRoot: this.getPackageRoot(),
      registryPath: this.getRegistryPath(),
      mcpEntryPath: this.getMcpEntryPath(),
      serverId: this.getServerId(),
      totalSkills:
        registry?.skills?.filter((skill) => skill.enabled !== false).length ??
        registry?.totalSkills ??
        0,
      totalCategories: registry?.totalCategories ?? 0,
    };
  }

  async getRelevantSkills(text: string, limit = 5): Promise<SkillRecord[]> {
    const registry = await this.getRegistry();
    if (!registry?.skills?.length) {
      return [];
    }

    const tokens = tokenize(text);
    const scored = registry.skills
      .filter((skill) => skill.enabled !== false)
      .map((skill) => ({ skill, score: scoreSkill(skill, tokens) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map((entry) => entry.skill);
  }

  async buildSkillContext(text: string, limit = 5): Promise<string> {
    const summary = await this.getSummary();
    if (!summary.enabled || !summary.installed) {
      return "";
    }

    const relevant = await this.getRelevantSkills(text, limit);
    if (relevant.length === 0) {
      return "";
    }

    const lines = relevant.map((skill) => {
      const capabilities = (skill.capabilities || []).slice(0, 3).join(", ");
      const details = capabilities
        ? `Capabilities: ${capabilities}.`
        : "";
      return `- ${skill.name} [${skill.category}]: ${skill.description || "Packaged Leeway skill."} ${details}`.trim();
    });

    return [
      "LEEWAY_AGENT_SKILLS_CONTEXT:",
      `Registry online with ${summary.totalSkills} packaged skills across ${summary.totalCategories} categories.`,
      "Default to these packaged Leeway skills when they fit the user's request:",
      ...lines,
    ].join("\n");
  }

  async getMcpServerConfig(): Promise<Record<string, MCPServerConfigType>> {
    const summary = await this.getSummary();
    if (!summary.enabled || !summary.installed) {
      return {};
    }

    return {
      [summary.serverId]: {
        command: process.execPath,
        args: [summary.mcpEntryPath],
        env: sanitizeEnv(process.env),
      },
    };
  }
}

export const leewaySkillsService = new LeewaySkillsService();
