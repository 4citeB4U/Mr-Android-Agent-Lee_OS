/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.EXTRACTIONPROMPT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ExtractionPrompt module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\compaction\ExtractionPrompt.ts
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
 * ExtractionPrompt - Prompt template for memory extraction
 * 
 * Pure function: returns prompt text.
 */

export class ExtractionPrompt {
  /**
   * Build prompt for extracting important memories from conversation
   */
  static build(messages: Array<{ role: string; content: string }>): string {
    const conversation = messages
      .map(m => `[${m.role}]: ${m.content}`)
      .join('\n\n');

    return `Analyze this conversation and extract important information worth remembering long-term.

Extract ONLY items that match these categories:
- **Decisions**: Choices made about architecture, tools, approaches
- **Preferences**: User likes/dislikes, coding style, communication preferences  
- **Facts**: Important facts learned (names, dates, project details)
- **Action Items**: TODOs, follow-ups, things to remember to do
- **Lessons**: Mistakes made, lessons learned, best practices discovered

DO NOT extract:
- Small talk or greetings
- Temporary context (debugging steps that are resolved)
- Information that's obvious from code/files
- Duplicate information

Output as a bullet list. Each item should be a single, self-contained sentence.
Prefix each with the category in brackets.

Example output:
- [Decision] Chose DuckDB over SQLite for vector search support
- [Preference] User prefers TypeScript strict mode with explicit types
- [Action Item] Need to set up CI/CD pipeline by next week

CONVERSATION:
${conversation}

EXTRACTED MEMORIES:`;
  }

  /**
   * Parse extraction response into memory items
   */
  static parse(response: string): MemoryItem[] {
    const lines = response.split('\n').filter(l => l.trim().startsWith('-'));
    const items: MemoryItem[] = [];

    for (const line of lines) {
      const match = line.match(/^-\s*\[(\w[\w\s]*)\]\s*(.+)$/);
      if (match) {
        items.push({
          category: match[1].trim().toLowerCase(),
          content: match[2].trim(),
        });
      }
    }

    return items;
  }
}

export interface MemoryItem {
  category: string;
  content: string;
}
