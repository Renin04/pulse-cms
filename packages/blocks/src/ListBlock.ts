import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson, sanitizeUrl } from "./types";
import { formatReferenceNumber, type ReferenceStyle } from "./ReferenceBlock";

export type ListStyle = "unordered" | "numeric" | "roman" | "abjad";

export interface ListBlockData extends Record<string, unknown> {
  style?: ListStyle;
  items: string[];
  start?: number;
  align?: "left" | "center" | "right" | "justify";
}

const ABJAD_LETTERS = [
  "ا", "ب", "ج", "د", "ه", "و", "ز", "ح", "ط", "ي", "ك", "ل", "م", "ن",
  "س", "ع", "ف", "ص", "ق", "ر", "ش", "ت", "ث", "خ", "ذ", "ض", "ظ", "غ",
];

function renderInlineMarkdown(text: string): string {
  const regex = /\[([^\]]+)\]\(([^)]+)\)(?:\{([^}]*)\})?/g;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    result += escapeHtml(text.slice(lastIndex, match.index)).replace(/\n/g, "<br />");
    const label = match[1];
    const url = match[2];
    const attrs = match[3] || "";

    const safeUrl = sanitizeUrl(url);
    if (label === "ref") {
      const textMatch = attrs.match(/text="([^"]*)"/);
      const styleMatch = attrs.match(/style="([^"]*)"/);
      const targetMatch = attrs.match(/target="([^"]*)"/);
      const relMatch = attrs.match(/rel="([^"]*)"/);
      const refText = textMatch ? textMatch[1] : "";
      const style = (styleMatch ? styleMatch[1] : "numeric") as ReferenceStyle;
      const target = targetMatch ? targetMatch[1] : "";
      const rel = relMatch ? relMatch[1] : "";
      const num = formatReferenceNumber(1, style);
      const targetAttr = target ? ` target="${escapeHtml(target)}"` : "";
      const relAttr = rel ? ` rel="${escapeHtml(rel)}"` : "";
      if (safeUrl) {
        const supRef = `<sup class="pulse-reference"><a href="${escapeHtml(safeUrl)}"${targetAttr}${relAttr}>${num}</a></sup>`;
        if (refText) {
          result += `<span class="pulse-reference-group"><a href="${escapeHtml(safeUrl)}" class="pulse-reference-text"${targetAttr}${relAttr}>${escapeHtml(refText)}</a>${supRef}</span>`;
        } else {
          result += supRef;
        }
      } else {
        result += escapeHtml(match[0]);
      }
    } else {
      const relMatch = attrs.match(/rel="([^"]*)"/);
      const rel = relMatch ? relMatch[1] : "";
      const targetMatch = attrs.match(/target="([^"]*)"/);
      const target = targetMatch ? targetMatch[1] : "";
      const relAttr = rel ? ` rel="${escapeHtml(rel)}"` : "";
      const targetAttr = target ? ` target="${escapeHtml(target)}"` : "";
      if (safeUrl) {
        result += `<a href="${escapeHtml(safeUrl)}"${relAttr}${targetAttr}>${escapeHtml(label)}</a>`;
      } else {
        result += escapeHtml(match[0]);
      }
    }
    lastIndex = match.index + match[0].length;
  }

  result += escapeHtml(text.slice(lastIndex)).replace(/\n/g, "<br />");
  return result;
}

function getAbjadLetter(index: number): string {
  // index is 1-based
  if (index < 1) return "ا";
  if (index <= ABJAD_LETTERS.length) return ABJAD_LETTERS[index - 1];
  // For indices beyond 28, cycle through with composite notation
  const cycles = Math.floor((index - 1) / ABJAD_LETTERS.length);
  const remainder = ((index - 1) % ABJAD_LETTERS.length) + 1;
  const letter = ABJAD_LETTERS[remainder - 1];
  return cycles > 0 ? `${letter}(${cycles + 1})` : letter;
}

const canonicalListBlockDataSchema = z
  .object({
    style: z.enum(["unordered", "numeric", "roman", "abjad"]),
    items: z.array(z.string()),
    start: z.number().int().min(1).optional(),
    align: z.enum(["left", "center", "right", "justify"]).optional(),
  })
  .strict();

export const listBlockDataSchema = z.preprocess((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return value;
    }

    const record = value as Record<string, unknown>;
    const { ordered, ...rest } = record;

    // Migrate legacy "ordered" style to "numeric"
    if (typeof rest.style === "string" && rest.style === "ordered") {
      rest.style = "numeric";
    }

    if (typeof ordered === "boolean") {
      return {
        ...rest,
        style:
          typeof rest.style === "string"
            ? rest.style
            : ordered
              ? "numeric"
              : "unordered",
      };
    }

    return record;
  }, canonicalListBlockDataSchema) as z.ZodType<ListBlockData>;

export const ListBlock: BlockTypeDefinition<ListBlockData> = {
  type: "list",
  name: "List",
  icon: "L",
  schema: listBlockDataSchema,
  defaultData: {
    style: "unordered",
    items: ["List item"],
  },
  config: {
    category: "basic",
  },
  render(data) {
    const parsed = listBlockDataSchema.parse(data);
    const alignAttr = parsed.align ? ` style="text-align: ${escapeHtml(parsed.align)};"` : "";

    if (parsed.style === "unordered") {
      const items = parsed.items
        .map((item) => `<li>${renderInlineMarkdown(item)}</li>`)
        .join("");
      return `<ul data-block-type="list"${alignAttr}>${items}</ul>`;
    }

    const startAttribute = parsed.start ? ` start="${parsed.start}"` : "";
    const startIndex = parsed.start ?? 1;

    if (parsed.style === "abjad") {
      const items = parsed.items
        .map((item, i) => {
          const marker = getAbjadLetter(i + startIndex);
          return `<li data-marker="${escapeHtml(marker)}">${renderInlineMarkdown(item)}</li>`;
        })
        .join("");
      return `<ol${startAttribute} data-block-type="list" data-list-style="abjad"${alignAttr}>${items}</ol>`;
    }

    const listStyleClass = parsed.style === "roman" ? "pulse-list-roman" : "pulse-list-numeric";
    const items = parsed.items
      .map((item) => `<li>${renderInlineMarkdown(item)}</li>`)
      .join("");
    return `<ol${startAttribute} data-block-type="list" class="${listStyleClass}"${alignAttr}>${items}</ol>`;
  },
  serialize(data) {
    const parsed = listBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return listBlockDataSchema.parse(parseJson<ListBlockData>(content));
  },
};
