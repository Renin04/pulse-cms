import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export interface ListBlockData extends Record<string, unknown> {
  style?: "ordered" | "unordered";
  items: string[];
  start?: number;
}

const canonicalListBlockDataSchema = z
  .object({
    style: z.enum(["ordered", "unordered"]),
    items: z.array(z.string()),
    start: z.number().int().min(1).optional(),
  })
  .strict();

export const listBlockDataSchema = z.preprocess((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return value;
    }

    const record = value as Record<string, unknown>;
    const { ordered, ...rest } = record;

    if (typeof ordered === "boolean") {
      return {
        ...rest,
        style:
          typeof rest.style === "string"
            ? rest.style
            : ordered
              ? "ordered"
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
    const items = parsed.items
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");

    if (parsed.style === "ordered") {
      const startAttribute = parsed.start ? ` start="${parsed.start}"` : "";
      return `<ol${startAttribute} data-block-type="list">${items}</ol>`;
    }

    return `<ul data-block-type="list">${items}</ul>`;
  },
  serialize(data) {
    const parsed = listBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return listBlockDataSchema.parse(parseJson<ListBlockData>(content));
  },
};
