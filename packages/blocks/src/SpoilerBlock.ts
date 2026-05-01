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

    return `<section data-block-type="spoiler" data-revealed="${String(
      parsed.revealed,
    )}"><button type="button">${escapeHtml(parsed.label)}</button><div${
      parsed.revealed ? "" : ' hidden="hidden"'
    }>${escapeHtml(parsed.content)}</div></section>`;
  },
  serialize(data) {
    const parsed = spoilerBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return spoilerBlockDataSchema.parse(parseJson<SpoilerBlockData>(content));
  },
};
