import type { Block } from "@pulse/core";
import type { DocumentRenderOutput, RendererConfig } from "../types/renderer";
import { renderDocumentSSR } from "./ssr";

/**
 * Metadata extracted from a rendered document.
 * Useful for static site generators and SEO pipelines.
 */
export interface DocumentMetadata {
  /** Plain-text title derived from the first heading block, if present. */
  title: string | null;
  /** Plain-text excerpt derived from the first paragraph block, if present. */
  excerpt: string | null;
  /** Estimated reading time in minutes (based on ~200 wpm). */
  readingTimeMinutes: number;
  /** Total word count across all text-bearing blocks. */
  wordCount: number;
  /** All heading texts found in the document, in order. */
  headings: string[];
  /** All image src URLs found in the document, in order. */
  images: string[];
}

/**
 * Output of renderToStaticHtml — combines the rendered HTML with extracted metadata.
 */
export interface StaticRenderOutput extends DocumentRenderOutput {
  /** Metadata extracted from the document blocks. */
  metadata: DocumentMetadata;
}

/** Average words per minute used for reading-time estimation. */
const WORDS_PER_MINUTE = 200;

/**
 * Strip HTML tags from a string, returning plain text.
 * Used internally for word-count and excerpt extraction.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Extract a plain-text string from a block's data field.
 * Handles common text-bearing fields: text, content, caption, title.
 */
function extractText(data: Record<string, unknown>): string {
  for (const key of ["text", "content", "caption", "title"] as const) {
    const val = data[key];
    if (typeof val === "string" && val.length > 0) return val;
  }
  return "";
}

/**
 * Extract document metadata from an array of blocks.
 * Pure function — no rendering, no side effects.
 */
export function extractMetadata(blocks: Block[]): DocumentMetadata {
  let title: string | null = null;
  let excerpt: string | null = null;
  const headings: string[] = [];
  const images: string[] = [];
  let totalWords = 0;

  for (const block of blocks) {
    const data = block.data as Record<string, unknown>;

    if (block.type === "heading") {
      const text = extractText(data);
      if (text) {
        headings.push(text);
        if (title === null) title = text;
      }
    }

    if (block.type === "paragraph") {
      const text = extractText(data);
      if (text) {
        const words = text.trim().split(/\s+/).filter(Boolean);
        totalWords += words.length;
        if (excerpt === null && words.length > 0) {
          excerpt = words.slice(0, 30).join(" ");
          if (words.length > 30) excerpt += "…";
        }
      }
    }

    if (block.type === "image") {
      const src = data["src"];
      if (typeof src === "string" && src.length > 0) images.push(src);
    }

    // Count words in any other text-bearing block
    if (!["heading", "paragraph", "image"].includes(block.type)) {
      const text = extractText(data);
      if (text) {
        totalWords += text.trim().split(/\s+/).filter(Boolean).length;
      }
    }
  }

  const readingTimeMinutes = Math.max(
    1,
    Math.ceil(totalWords / WORDS_PER_MINUTE),
  );

  return { title, excerpt, readingTimeMinutes, wordCount: totalWords, headings, images };
}

/**
 * Render a document to a static HTML string with extracted metadata.
 * Safe for use in Node.js, edge runtimes, and static site generators.
 * Never accesses browser globals (window, document, navigator).
 *
 * @param blocks - Ordered array of blocks to render.
 * @param config - Optional renderer configuration.
 * @returns StaticRenderOutput with html, per-block outputs, and metadata.
 */
export function renderToStaticHtml(
  blocks: Block[],
  config: RendererConfig = {},
): StaticRenderOutput {
  const docOutput = renderDocumentSSR(blocks, { ...config, ssr: true });
  const metadata = extractMetadata(blocks);
  return { ...docOutput, metadata };
}

export { stripHtml };
