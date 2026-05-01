import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export type CalloutVariant = "info" | "tip" | "warning" | "success" | "note";

export interface CalloutBlockData extends Record<string, unknown> {
  variant: CalloutVariant;
  title?: string;
  body: string;
  icon?: string;
}

export const calloutBlockDataSchema = z
  .object({
    variant: z.enum(["info", "tip", "warning", "success", "note"]),
    title: z.string().optional(),
    body: z.string(),
    icon: z.string().max(8).optional(),
  })
  .strict();

export function updateCallout(
  data: CalloutBlockData,
  patch: Partial<CalloutBlockData>,
): CalloutBlockData {
  const parsed = calloutBlockDataSchema.parse(data);
  return calloutBlockDataSchema.parse({
    ...parsed,
    ...patch,
  });
}

export const CalloutBlock: BlockTypeDefinition<CalloutBlockData> = {
  type: "callout",
  name: "Callout",
  icon: "CALLOUT",
  schema: calloutBlockDataSchema,
  defaultData: {
    variant: "info",
    title: "Callout",
    body: "Highlight important context for readers.",
    icon: "i",
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = calloutBlockDataSchema.parse(data);
    const titleMarkup = parsed.title ? `<strong>${escapeHtml(parsed.title)}</strong>` : "";
    const iconMarkup = parsed.icon ? `<span data-callout-icon="true">${escapeHtml(parsed.icon)}</span>` : "";

    return `<aside data-block-type="callout" data-variant="${parsed.variant}">${iconMarkup}${titleMarkup}<p>${escapeHtml(
      parsed.body,
    )}</p></aside>`;
  },
  serialize(data) {
    const parsed = calloutBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return calloutBlockDataSchema.parse(parseJson<CalloutBlockData>(content));
  },
};
