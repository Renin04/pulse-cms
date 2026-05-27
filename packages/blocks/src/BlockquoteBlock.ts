import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson, sanitizeUrl } from "./types";
import { formatReferenceNumber, type ReferenceStyle } from "./ReferenceBlock";

export interface BlockquoteBlockData extends Record<string, unknown> {
  quote: string;
  citation?: string;
  align?: "left" | "center" | "right" | "justify";
  citationAlign?: "left" | "center" | "right" | "justify";
}

export const blockquoteBlockDataSchema = z
  .object({
    quote: z.string(),
    citation: z.string().optional(),
    align: z.enum(["left", "center", "right", "justify"]).optional(),
    citationAlign: z.enum(["left", "center", "right", "justify"]).optional(),
  })
  .strict();

function escapeAndBreaks(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

function renderInlineMarkdown(text: string): string {
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
      const textMatch = attrs.match(/text="([^"]*)"/);
      const styleMatch = attrs.match(/style="([^"]*)"/);
      const targetMatch = attrs.match(/target="([^"]*)"/);
      const relMatch = attrs.match(/rel="([^"]*)"/);
      const refText = textMatch ? textMatch[1] : "";
      const style = (styleMatch ? styleMatch[1] : "numeric") as ReferenceStyle;
      const target = targetMatch ? targetMatch[1] : "";
      const rel = relMatch ? relMatch[1] : "";
      const num = formatReferenceNumber(1, style);
      const titleAttr = refText ? ` title="${escapeHtml(refText)}"` : "";
      const targetAttr = target ? ` target="${escapeHtml(target)}"` : "";
      const relAttr = rel ? ` rel="${escapeHtml(rel)}"` : "";
      if (safeUrl) {
        result += `<sup class="pulse-reference"><a href="${escapeHtml(safeUrl)}"${titleAttr}${targetAttr}${relAttr}>${num}</a></sup>`;
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
        result += `<a href="${escapeHtml(safeUrl)}" class="pulse-inline-link"${relAttr}${targetAttr}>${escapeHtml(label)}</a>`;
      } else {
        result += escapeHtml(match[0]);
      }
    }
    lastIndex = match.index + match[0].length;
  }

  result += escapeAndBreaks(text.slice(lastIndex));
  return result;
}

export const BlockquoteBlock: BlockTypeDefinition<BlockquoteBlockData> = {
  type: "blockquote",
  name: "Blockquote",
  icon: "Q",
  schema: blockquoteBlockDataSchema,
  defaultData: {
    quote: "Quote",
  },
  config: {
    category: "basic",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = blockquoteBlockDataSchema.parse(data);
    const citationAlign = parsed.citationAlign ?? "left";
    const citation = parsed.citation
      ? `<cite style="display: block; text-align: ${escapeHtml(citationAlign)};">${renderInlineMarkdown(parsed.citation)}</cite>`
      : "";
    const alignAttr = parsed.align ? ` style="text-align: ${escapeHtml(parsed.align)};"` : "";

    return `<blockquote data-block-type="blockquote"${alignAttr}><p>${renderInlineMarkdown(
      parsed.quote,
    )}</p>${citation}</blockquote>`;
  },
  serialize(data) {
    const parsed = blockquoteBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return blockquoteBlockDataSchema.parse(parseJson<BlockquoteBlockData>(content));
  },
};
