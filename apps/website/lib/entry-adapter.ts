import type { Block, BlockData, EntryStatus } from "@pulse/core";
import { PulseRenderer, RendererRegistry, registerBuiltinRenderers, renderBranch, renderConditional, renderCodePlayground } from "@pulse/renderer";
import { formatReferenceNumber, sanitizeUrl } from "@pulse/blocks";
import type { EntryDetail } from "./api-client";

export interface AdaptedBlogEntry {
  id: string;
  slug: string;
  title: string;
  status: EntryStatus;
  excerpt: string;
  eyebrow: string;
  author: string;
  tags: string[];
  featured: boolean;
  featuredImage?: string;
  featuredImageAlt?: string;
  ogImage?: string;
  seoTitle: string;
  seoDescription: string;
  seoScore: number;
  wordCount: number;
  readTime: string;
  blocks: Block<BlockData>[];
  html: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  origin?: string;
}

let rendererReady = false;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAndBreaks(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

const ABJAD_LETTERS = [
  "ا", "ب", "ج", "د", "ه", "و", "ز", "ح", "ط", "ي", "ك", "ل", "م", "ن",
  "س", "ع", "ف", "ص", "ق", "ر", "ش", "ت", "ث", "خ", "ذ", "ض", "ظ", "غ",
];

function getAbjadLetter(index: number): string {
  if (index < 1) return "ا";
  if (index <= ABJAD_LETTERS.length) return ABJAD_LETTERS[index - 1];
  const cycles = Math.floor((index - 1) / ABJAD_LETTERS.length);
  const remainder = ((index - 1) % ABJAD_LETTERS.length) + 1;
  const letter = ABJAD_LETTERS[remainder - 1];
  return cycles > 0 ? `${letter}(${cycles + 1})` : letter;
}

type RefStyle = "numeric" | "alphabetic" | "greek" | "abjad";

interface InlineRef {
  url: string;
  text?: string;
  style: RefStyle;
}

const INLINE_REF_REGEX = /\[ref\]\(([^)]+)\)(?:\{([^}]*)\})?/g;

function extractRefs(text: string): InlineRef[] {
  const refs: InlineRef[] = [];
  let match: RegExpExecArray | null;
  while ((match = INLINE_REF_REGEX.exec(text)) !== null) {
    const url = match[1];
    const attrs = match[2] || "";
    const textMatch = attrs.match(/text="([^"]*)"/);
    const styleMatch = attrs.match(/style="([^"]*)"/);
    refs.push({
      url,
      text: textMatch ? textMatch[1] : undefined,
      style: (styleMatch ? styleMatch[1] : "numeric") as RefStyle,
    });
  }
  return refs;
}

function renderInlineContent(text: string, refCounter: { value: number }): string {
  const regex = /\[([^\]]+)\]\(([^)]+)\)(?:\{([^}]*)\})?/g;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    result += escapeAndBreaks(text.slice(lastIndex, match.index));
    const label = match[1];
    const url = match[2];
    const attrs = match[3] || "";

    const safeUrl = sanitizeUrl(url);
    if (label === "ref") {
      refCounter.value++;
      const textMatch = attrs.match(/text="([^"]*)"/);
      const styleMatch = attrs.match(/style="([^"]*)"/);
      const targetMatch = attrs.match(/target="([^"]*)"/);
      const relMatch = attrs.match(/rel="([^"]*)"/);
      const refText = textMatch ? textMatch[1] : "";
      const style = (styleMatch ? styleMatch[1] : "numeric") as RefStyle;
      const target = targetMatch ? targetMatch[1] : "";
      const rel = relMatch ? relMatch[1] : "";
      const num = formatReferenceNumber(refCounter.value, style);
      const titleAttr = refText ? ` title="${escapeHtml(refText)}"` : "";
      const targetAttr = target ? ` target="${escapeHtml(target)}"` : "";
      const relAttr = rel ? ` rel="${escapeHtml(rel)}"` : "";
      if (safeUrl) {
        result += `<sup class="pulse-reference"><a href="${escapeHtml(safeUrl)}"${titleAttr}${targetAttr}${relAttr}>${num}</a></sup>`;
      } else {
        result += escapeAndBreaks(match[0]);
      }
    } else if (safeUrl) {
      const relMatch = attrs.match(/rel="([^"]*)"/);
      const rel = relMatch ? relMatch[1] : "";
      const targetMatch = attrs.match(/target="([^"]*)"/);
      const target = targetMatch ? targetMatch[1] : "";
      const relAttr = rel ? ` rel="${escapeHtml(rel)}"` : "";
      const targetAttr = target ? ` target="${escapeHtml(target)}"` : "";
      result += `<a href="${escapeHtml(safeUrl)}" class="pulse-inline-link"${relAttr}${targetAttr}>${escapeHtml(label)}</a>`;
    } else {
      result += escapeAndBreaks(match[0]);
    }
    lastIndex = match.index + match[0].length;
  }

  result += escapeAndBreaks(text.slice(lastIndex));
  return result;
}

function toSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function ensureRenderer(): void {
  if (rendererReady) return;
  registerBuiltinRenderers(RendererRegistry.getInstance());
  RendererRegistry.getInstance().override("branch", renderBranch);
  RendererRegistry.getInstance().override("conditional", renderConditional);
  RendererRegistry.getInstance().override("code-playground", renderCodePlayground);
  rendererReady = true;
}

function getFieldValue(fieldValues: unknown[], fieldId: string): unknown {
  if (!Array.isArray(fieldValues)) return undefined;
  const fv = fieldValues.find((item: any) => item?.fieldId === fieldId);
  return (fv as any)?.value;
}

function getBlockText(block: Block<BlockData>): string {
  const data = block.data as Record<string, unknown>;
  if (typeof data.text === "string") return data.text;
  if (typeof data.body === "string") {
    const title = typeof data.title === "string" ? data.title : "";
    return `${title} ${data.body}`.trim();
  }
  if (typeof data.code === "string") return data.code;
  if (Array.isArray(data.items)) {
    return data.items.filter((i): i is string => typeof i === "string").join(" ");
  }
  return "";
}

function countWords(blocks: Block<BlockData>[]): number {
  const text = blocks.map(getBlockText).join(" ").trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function formatReadTime(wordCount: number): string {
  const minutes = Math.max(1, Math.ceil(wordCount / 220));
  return `${minutes} min read`;
}

function renderHtml(blocks: Block<BlockData>[]): string {
  try {
    ensureRenderer();

    // First pass: collect all inline refs from text/heading/blockquote blocks
    const allRefs: InlineRef[] = [];
    for (const block of blocks) {
      if (block.type === "text" || block.type === "heading" || block.type === "blockquote" || block.type === "list") {
        const data = block.data as Record<string, unknown>;
        if (block.type === "list" && Array.isArray(data.items)) {
          for (const item of data.items) {
            if (typeof item === "string") {
              allRefs.push(...extractRefs(item));
            }
          }
        } else {
          const text =
            typeof data.text === "string"
              ? data.text
              : typeof data.quote === "string"
                ? data.quote
                : "";
          allRefs.push(...extractRefs(text));
        }
      }
    }

    // Override renderers with shared ref counter for global numbering
    const refCounter = { value: 0 };

    RendererRegistry.getInstance().override("text", (block) => {
      const data = block.data as {
        text: string;
        marks: { bold: boolean; italic: boolean; underline: boolean; code: boolean };
        align?: string;
      };
      const align = data.align ?? "left";
      const alignAttr = align === "left" ? "" : ` style="text-align: ${align};"`;
      let output = renderInlineContent(data.text, refCounter);
      if (data.marks.code) output = `<code>${output}</code>`;
      if (data.marks.bold) output = `<strong>${output}</strong>`;
      if (data.marks.italic) output = `<em>${output}</em>`;
      if (data.marks.underline) output = `<u>${output}</u>`;
      return `<p data-block-type="text"${alignAttr}>${output}</p>`;
    });

    RendererRegistry.getInstance().override("heading", (block) => {
      const data = block.data as { text: string; level: number; anchorId?: string };
      const tag = `h${data.level}`;
      const anchorId = data.anchorId ?? toSlug(data.text);
      return `<${tag} id="${escapeHtml(anchorId)}" data-block-type="heading">${renderInlineContent(data.text, refCounter)}</${tag}>`;
    });

    RendererRegistry.getInstance().override("blockquote", (block) => {
      const data = block.data as { quote: string; citation?: string };
      const citation = data.citation ? `<cite>${escapeHtml(data.citation)}</cite>` : "";
      return `<blockquote data-block-type="blockquote"><p>${renderInlineContent(data.quote, refCounter)}</p>${citation}</blockquote>`;
    });

    RendererRegistry.getInstance().override("list", (block) => {
      const data = block.data as { style: string; items: string[]; start?: number; align?: string };
      const align = data.align ?? "left";
      const alignAttr = align === "left" ? "" : ` style="text-align: ${align};"`;
      const startIndex = data.start ?? 1;
      const startAttribute = data.start && data.style !== "unordered" ? ` start="${data.start}"` : "";
      const listStyleClass = data.style === "roman" ? "pulse-list-roman" : data.style === "numeric" ? "pulse-list-numeric" : "";
      const classAttr = listStyleClass ? ` class="${listStyleClass}"` : "";
      const items = data.items
        .map((item, i) => {
          if (data.style === "abjad") {
            const marker = getAbjadLetter(i + startIndex);
            return `<li data-marker="${escapeHtml(marker)}">${renderInlineContent(item, refCounter)}</li>`;
          }
          return `<li>${renderInlineContent(item, refCounter)}</li>`;
        })
        .join("");
      if (data.style === "unordered") {
        return `<ul data-block-type="list"${alignAttr}>${items}</ul>`;
      }
      return `<ol${startAttribute} data-block-type="list"${classAttr}${alignAttr}>${items}</ol>`;
    });

    const renderer = new PulseRenderer();
    const html = renderer.renderDocument(blocks).html;

    // Add footnotes section for references that have text or url
    const footnotes = allRefs.filter((r) => r.text || r.url);
    if (footnotes.length > 0) {
      const footnotesHtml = footnotes
        .map((ref, index) => {
          const num = formatReferenceNumber(index + 1, ref.style);
          const content = ref.text || ref.url || "";
          const link = ref.url
            ? `<a href="${escapeHtml(ref.url)}">${escapeHtml(ref.text || ref.url)}</a>`
            : escapeHtml(content);
          return `<li id="ref-${index + 1}"><span class="pulse-ref-marker">${num}.</span> ${link}</li>`;
        })
        .join("");
      return `<div class="studio-rendered">${html}\n<section class="pulse-references"><h3>References</h3><ol>${footnotesHtml}</ol></section></div>`;
    }

    return `<div class="studio-rendered">${html}</div>`;
  } catch {
    return "";
  }
}

function computeSEOScore(entry: AdaptedBlogEntry): number {
  let score = 0;
  if (entry.seoTitle && entry.seoTitle.length >= 30 && entry.seoTitle.length <= 60) score += 30;
  else if (entry.seoTitle) score += 15;
  if (entry.seoDescription && entry.seoDescription.length >= 50 && entry.seoDescription.length <= 160)
    score += 30;
  else if (entry.seoDescription) score += 15;
  if (entry.featuredImage || entry.ogImage) score += 20;
  if (entry.tags.length > 0) score += 10;
  if (entry.wordCount > 300) score += 10;
  return Math.min(100, score);
}

export function adaptEntryDetail(entry: EntryDetail | null): AdaptedBlogEntry | null {
  if (!entry) return null;

  const fieldValues = Array.isArray(entry.fieldValues) ? entry.fieldValues : [];
  const metadata = (entry.metadata as Record<string, unknown> | undefined) || {};
  const blocks = Array.isArray(entry.blocks) ? (entry.blocks as Block<BlockData>[]) : [];

  const excerpt = String(getFieldValue(fieldValues, "excerpt") || "");
  const eyebrow = String(getFieldValue(fieldValues, "eyebrow") || "Pulse Story");
  const featured = Boolean(getFieldValue(fieldValues, "featured") ?? false);
  const featuredImage = String(
    getFieldValue(fieldValues, "featuredImage") || metadata.ogImage || "",
  );
  const featuredImageAlt = String(getFieldValue(fieldValues, "featuredImageAlt") || "");
  const ogImage = String(metadata.ogImage || featuredImage || "");

  // Author: use author object from API, fallback to field value
  const authorName =
    entry.author?.displayName ||
    entry.author?.email ||
    String(getFieldValue(fieldValues, "author") || "Pulse Team");

  // Tags: from taxonomyTerms if available, else fieldValues
  let tags: string[] = [];
  if (entry.taxonomyTerms && entry.taxonomyTerms.length > 0) {
    tags = entry.taxonomyTerms.map((t) => t.name);
  } else {
    const tagValue = getFieldValue(fieldValues, "tags");
    if (Array.isArray(tagValue)) {
      tags = tagValue.filter((t): t is string => typeof t === "string");
    }
  }

  const seoTitle = String(metadata.seoTitle || entry.title);
  const seoDescription = String(metadata.seoDescription || excerpt);

  const wordCount = countWords(blocks);
  const readTime = formatReadTime(wordCount);
  const html = renderHtml(blocks);

  const adapted: AdaptedBlogEntry = {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    status: entry.status as EntryStatus,
    excerpt,
    eyebrow,
    author: authorName,
    tags,
    featured,
    featuredImage: featuredImage || undefined,
    featuredImageAlt: featuredImageAlt || undefined,
    ogImage: ogImage || undefined,
    seoTitle,
    seoDescription,
    seoScore: 0,
    wordCount,
    readTime,
    blocks,
    html,
    publishedAt: entry.publishedAt ?? null,
    scheduledAt: entry.scheduledAt ?? null,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    origin: entry.origin,
  };

  adapted.seoScore = computeSEOScore(adapted);
  return adapted;
}

export function adaptEntryList(entries: EntryDetail[]): AdaptedBlogEntry[] {
  return entries.map((e) => adaptEntryDetail(e)).filter((e): e is AdaptedBlogEntry => e !== null);
}
