import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export interface AccordionItem {
  id: string;
  title: string;
  content: string;
  defaultOpen: boolean;
}

export interface AccordionBlockData extends Record<string, unknown> {
  allowMultiple: boolean;
  items: AccordionItem[];
}

const accordionItemSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    defaultOpen: z.boolean(),
  })
  .strict();

export const accordionBlockDataSchema = z
  .object({
    allowMultiple: z.boolean(),
    items: z.array(accordionItemSchema).max(40),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.allowMultiple) {
      return;
    }

    const openCount = value.items.filter((item) => item.defaultOpen).length;
    if (openCount > 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Single-open accordion can only have one expanded item",
        path: ["items"],
      });
    }
  });

function createAccordionItemId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `accordion-item-${crypto.randomUUID()}`;
  }

  return `accordion-item-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function addAccordionItem(
  data: AccordionBlockData,
  item: Omit<AccordionItem, "id"> & { id?: string },
): AccordionBlockData {
  const parsed = accordionBlockDataSchema.parse(data);

  return accordionBlockDataSchema.parse({
    ...parsed,
    items: [
      ...parsed.items,
      {
        ...item,
        id: item.id ?? createAccordionItemId(),
      },
    ],
  });
}

export const AccordionBlock: BlockTypeDefinition<AccordionBlockData> = {
  type: "accordion",
  name: "Accordion",
  icon: "ACCORDION",
  schema: accordionBlockDataSchema,
  defaultData: {
    allowMultiple: false,
    items: [
      {
        id: "accordion-item-1",
        title: "What is Pulse?",
        content: "Pulse is a modular block-based writing engine.",
        defaultOpen: true,
      },
    ],
  },
  config: {
    category: "interactive",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = accordionBlockDataSchema.parse(data);
    const items = parsed.items
      .map(
        (item) =>
          `<details${item.defaultOpen ? " open" : ""}><summary>${escapeHtml(
            item.title,
          )}</summary><p>${escapeHtml(item.content)}</p></details>`,
      )
      .join("");

    return `<section data-block-type="accordion" data-allow-multiple="${String(
      parsed.allowMultiple,
    )}">${items}</section>`;
  },
  serialize(data) {
    const parsed = accordionBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return accordionBlockDataSchema.parse(parseJson<AccordionBlockData>(content));
  },
};
