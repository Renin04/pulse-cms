import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export interface ToggleBlockData extends Record<string, unknown> {
  label: string;
  content: string;
  defaultOn: boolean;
}

export const toggleBlockDataSchema = z
  .object({
    label: z.string(),
    content: z.string(),
    defaultOn: z.boolean(),
  })
  .strict();

export function toggleDefaultState(data: ToggleBlockData): ToggleBlockData {
  const parsed = toggleBlockDataSchema.parse(data);

  return toggleBlockDataSchema.parse({
    ...parsed,
    defaultOn: !parsed.defaultOn,
  });
}

export const ToggleBlock: BlockTypeDefinition<ToggleBlockData> = {
  type: "toggle",
  name: "Toggle",
  icon: "TOGGLE",
  schema: toggleBlockDataSchema,
  defaultData: {
    label: "Show details",
    content: "Additional details go here.",
    defaultOn: false,
  },
  config: {
    category: "interactive",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = toggleBlockDataSchema.parse(data);

    return `<details data-block-type="toggle"${parsed.defaultOn ? " open" : ""}><summary>${escapeHtml(
      parsed.label,
    )}</summary><p>${escapeHtml(parsed.content)}</p></details>`;
  },
  serialize(data) {
    const parsed = toggleBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return toggleBlockDataSchema.parse(parseJson<ToggleBlockData>(content));
  },
};
