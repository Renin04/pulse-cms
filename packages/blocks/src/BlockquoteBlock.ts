import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export interface BlockquoteBlockData extends Record<string, unknown> {
  quote: string;
  citation?: string;
  align?: "left" | "center" | "right" | "justify";
}

export const blockquoteBlockDataSchema = z
  .object({
    quote: z.string(),
    citation: z.string().optional(),
    align: z.enum(["left", "center", "right", "justify"]).optional(),
  })
  .strict();

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
    const citation = parsed.citation ? `<cite>${escapeHtml(parsed.citation)}</cite>` : "";
    const alignAttr = parsed.align ? ` style="text-align: ${escapeHtml(parsed.align)};"` : "";

    return `<blockquote data-block-type="blockquote"${alignAttr}><p>${escapeHtml(
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
