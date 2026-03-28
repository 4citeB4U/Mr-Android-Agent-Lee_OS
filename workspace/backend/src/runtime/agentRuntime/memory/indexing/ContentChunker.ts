/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CONTENTCHUNKER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ContentChunker module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\memory\indexing\ContentChunker.ts
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
 * ContentChunker - Splits markdown content into indexable chunks
 * 
 * Pure function: deterministic, no I/O.
 * Splits by markdown headers, handles nested headers,
 * splits long sections into paragraphs.
 */

export interface ContentChunk {
  /** Section header (e.g., "## Decisions") */
  header: string | null;
  /** Chunk text content (includes header for context) */
  content: string;
  /** Position index within source file */
  chunkIndex: number;
  /** Character count */
  charCount: number;
}

export interface ChunkerOptions {
  /** Max characters before splitting section into paragraphs (default: 1000) */
  maxChunkSize: number;
  /** Min characters to keep a chunk (default: 50) */
  minChunkSize: number;
  /** Header levels to split on (default: [1, 2, 3]) */
  splitOnHeaders: number[];
}

const DEFAULT_OPTIONS: ChunkerOptions = {
  maxChunkSize: 1000,
  minChunkSize: 50,
  splitOnHeaders: [1, 2, 3],
};

export class ContentChunker {
  /**
   * Split markdown content into chunks by headers
   */
  static chunk(content: string, options?: Partial<ChunkerOptions>): ContentChunk[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    if (!content || content.trim().length === 0) {
      return [];
    }

    const sections = ContentChunker.splitByHeaders(content, opts.splitOnHeaders);
    const chunks: ContentChunk[] = [];
    let chunkIndex = 0;

    for (const section of sections) {
      const sectionChunks = ContentChunker.splitLongSection(
        section.header,
        section.body,
        opts.maxChunkSize,
        opts.minChunkSize
      );

      for (const chunk of sectionChunks) {
        if (chunk.content.trim().length >= opts.minChunkSize) {
          chunks.push({
            ...chunk,
            chunkIndex: chunkIndex++,
          });
        }
      }
    }

    return chunks;
  }

  /**
   * Split content by markdown headers
   */
  private static splitByHeaders(
    content: string,
    headerLevels: number[]
  ): Array<{ header: string | null; body: string }> {
    // Build regex to match specified header levels
    const headerPattern = headerLevels
      .map(level => `#{${level}}`)
      .join('|');
    const regex = new RegExp(`^((?:${headerPattern})\\s+.+)$`, 'gm');

    const sections: Array<{ header: string | null; body: string }> = [];
    let lastIndex = 0;
    let lastHeader: string | null = null;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      // Capture text before this header
      const beforeText = content.slice(lastIndex, match.index).trim();
      if (beforeText.length > 0 || lastHeader !== null) {
        sections.push({
          header: lastHeader,
          body: beforeText,
        });
      }

      lastHeader = match[1].trim();
      lastIndex = match.index + match[0].length;
    }

    // Capture remaining text after last header
    const remainingText = content.slice(lastIndex).trim();
    if (remainingText.length > 0 || lastHeader !== null) {
      sections.push({
        header: lastHeader,
        body: remainingText,
      });
    }

    // If no headers found, return entire content as one section
    if (sections.length === 0 && content.trim().length > 0) {
      sections.push({
        header: null,
        body: content.trim(),
      });
    }

    return sections;
  }

  /**
   * Split a long section into paragraph-sized chunks
   */
  private static splitLongSection(
    header: string | null,
    body: string,
    maxSize: number,
    minSize: number
  ): ContentChunk[] {
    const fullContent = header ? `${header}\n\n${body}` : body;

    // If short enough, return as single chunk
    if (fullContent.length <= maxSize) {
      return [{
        header,
        content: fullContent,
        chunkIndex: 0,
        charCount: fullContent.length,
      }];
    }

    // Split by double newlines (paragraphs)
    const paragraphs = body.split(/\n\n+/).filter(p => p.trim().length > 0);
    const chunks: ContentChunk[] = [];
    let currentContent = header ? `${header}\n\n` : '';

    for (const paragraph of paragraphs) {
      const wouldBe = currentContent + paragraph;

      if (wouldBe.length > maxSize && currentContent.trim().length >= minSize) {
        // Flush current chunk
        chunks.push({
          header,
          content: currentContent.trim(),
          chunkIndex: 0,
          charCount: currentContent.trim().length,
        });
        // Start new chunk with header context
        currentContent = header ? `${header} (cont.)\n\n${paragraph}\n\n` : `${paragraph}\n\n`;
      } else {
        currentContent += `${paragraph}\n\n`;
      }
    }

    // Flush remaining
    if (currentContent.trim().length >= minSize) {
      chunks.push({
        header,
        content: currentContent.trim(),
        chunkIndex: 0,
        charCount: currentContent.trim().length,
      });
    }

    return chunks;
  }
}
