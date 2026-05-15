import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export interface SpoilerBlockData extends Record<string, unknown> {
  label: string;
  content: string;
  revealed: boolean;
}

export const spoilerBlockDataSchema = z
  .object({
    label: z.string(),
    content: z.string(),
    revealed: z.boolean(),
  })
  .strict();

export function revealSpoiler(data: SpoilerBlockData): SpoilerBlockData {
  const parsed = spoilerBlockDataSchema.parse(data);

  return spoilerBlockDataSchema.parse({
    ...parsed,
    revealed: true,
  });
}

export const SpoilerBlock: BlockTypeDefinition<SpoilerBlockData> = {
  type: "spoiler",
  name: "Spoiler",
  icon: "SPOILER",
  schema: spoilerBlockDataSchema,
  defaultData: {
    label: "Spoiler",
    content: "Hidden details",
    revealed: false,
  },
  config: {
    category: "interactive",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = spoilerBlockDataSchema.parse(data);
    const spoilerId = `spoiler-${Math.random().toString(36).slice(2, 8)}`;

    return `<section data-block-type="spoiler" id="${spoilerId}" class="pulse-spoiler" data-revealed="${String(parsed.revealed)}"><button type="button" class="pulse-spoiler-btn" style="padding:10px 16px;border-radius:10px;border:1px solid var(--neutral-200);background:var(--neutral-50);cursor:pointer;font-weight:600;display:flex;align-items:center;gap:8px;width:100%;text-align:left;"><span class="pulse-spoiler-icon" style="transition:transform 0.2s;display:inline-block;transform:${parsed.revealed ? 'rotate(90deg)' : 'rotate(0deg)'};">▶</span>${escapeHtml(parsed.label)}</button><div class="pulse-spoiler-content" style="padding:12px 16px;border:1px solid var(--neutral-200);border-top:none;border-radius:0 0 10px 10px;background:#fff;display:${parsed.revealed ? 'block' : 'none'};"><p style="white-space:pre-wrap;margin:0;">${escapeHtml(parsed.content)}</p></div></section>`;
  },
  serialize(data) {
    const parsed = spoilerBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return spoilerBlockDataSchema.parse(parseJson<SpoilerBlockData>(content));
  },
};
