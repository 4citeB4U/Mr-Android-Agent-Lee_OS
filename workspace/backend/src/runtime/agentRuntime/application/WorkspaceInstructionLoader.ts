/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.WORKSPACEINSTRUCTIONLOADER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = WorkspaceInstructionLoader module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\application\WorkspaceInstructionLoader.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

/**
 * WorkspaceInstructionLoader - loads workspace instruction files only
 *
 * Simplified replacement for SystemPromptBuilder:
 * - No tool schema aggregation
 * - No MCP sections
 * - No plugin instructions
 * - Workspace files only (SOUL.md, AGENTS.md, USER.md, TOOLS.md)
 */

import * as fs from "fs/promises";
import * as path from "path";
import { ILogger } from "../core/interfaces/ILogger.js";
import { ITracer } from "../core/interfaces/ITracer.js";
import { IWorkspaceInstructionLoader } from "../domain/interfaces/IWorkspaceInstructionLoader.js";

export class WorkspaceInstructionLoader implements IWorkspaceInstructionLoader {
  constructor(
    private readonly logger: ILogger,
    private readonly tracer: ITracer,
  ) {}

  async loadInstructions(
    workspaceRoot: string,
    instructionFiles: string[],
  ): Promise<string> {
    return await this.tracer.span(
      "WorkspaceInstructionLoader.loadInstructions",
      async (span) => {
        try {
          if (
            !workspaceRoot ||
            !instructionFiles ||
            instructionFiles.length === 0
          ) {
            return "";
          }

          const sections: string[] = [];
          let loadedCount = 0;

          for (const filename of instructionFiles) {
            const filePath = path.join(workspaceRoot, filename);

            try {
              await fs.access(filePath);
              const content = await fs.readFile(filePath, "utf-8");

              if (content.trim().length === 0) {
                this.logger.debug("Skipping empty instruction file", {
                  filename,
                });
                continue;
              }

              sections.push(`## ${filename}\n\n${content}`);
              span.setAttribute(
                `instruction_file.${filename}.size`,
                content.length,
              );
              loadedCount++;

              this.logger.debug("Loaded instruction file", {
                filename,
                size: content.length,
              });
            } catch (error: any) {
              if (error.code === "ENOENT") {
                this.logger.debug("Instruction file not found, skipping", {
                  filename,
                });
              } else {
                this.logger.debug("Failed to read instruction file", {
                  filename,
                  error: error.message,
                });
              }
            }
          }

          span.setAttribute("instruction_files.loaded", loadedCount);

          if (sections.length === 0) {
            return "";
          }

          return `# Workspace Context\n\n${sections.join("\n\n---\n\n")}`;
        } catch (error: any) {
          this.logger.error("Failed to load workspace instructions", error);
          span.setStatus("error", error.message);
          return "";
        }
      },
    );
  }
}
