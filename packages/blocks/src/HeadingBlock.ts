import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export interface HeadingBlockData extends Record<string, unknown> {
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  anchorId?: string;
}

export const headingBlockDataSchema = z
  .object({
    text: z.string(),
    level: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
    ]),
    anchorId: z.string().optional(),
  })
  .strict();

function toSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function renderInlineLinks(text: string): string {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)(?:\{rel="([^"]*)"\})?/g;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    result += escapeHtml(text.slice(lastIndex, match.index));
    const relAttr = match[3] ? ` rel="${escapeHtml(match[3])}"` : "";
    result += `<a href="${escapeHtml(match[2])}" class="pulse-inline-link"${relAttr}>${escapeHtml(match[1])}</a>`;
    lastIndex = match.index + match[0].length;
  }

  result += escapeHtml(text.slice(lastIndex));
  return result;
}

export const HeadingBlock: BlockTypeDefinition<HeadingBlockData> = {
  type: "heading",
  name: "Heading",
  icon: "H",
  schema: headingBlockDataSchema,
  defaultData: {
    text: "Heading",
    level: 2,
  },
  config: {
    category: "basic",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = headingBlockDataSchema.parse(data);
    const tag = `h${parsed.level}`;
    const anchorId = parsed.anchorId ?? toSlug(parsed.text);

    return `<${tag} id="${escapeHtml(anchorId)}" data-block-type="heading">${renderInlineLinks(
      parsed.text,
    )}</${tag}>`;
  },
  serialize(data) {
    const parsed = headingBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return headingBlockDataSchema.parse(parseJson<HeadingBlockData>(content));
  },
};
