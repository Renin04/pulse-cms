import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

const ALLOWED_BEFORE_AFTER_PROTOCOLS = new Set(["http:", "https:"]);

function hasAllowedImageProtocol(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    return ALLOWED_BEFORE_AFTER_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

export interface BeforeAfterBlockData extends Record<string, unknown> {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel: string;
  afterLabel: string;
  position: number;
}

export const beforeAfterBlockDataSchema = z
  .object({
    beforeUrl: z.string().refine(hasAllowedImageProtocol, {
      message: "Unsupported before image URL protocol",
    }),
    afterUrl: z.string().refine(hasAllowedImageProtocol, {
      message: "Unsupported after image URL protocol",
    }),
    beforeLabel: z.string(),
    afterLabel: z.string(),
    position: z.number().min(0).max(100),
  })
  .strict();

export function setBeforeAfterPosition(
  data: BeforeAfterBlockData,
  position: number,
): BeforeAfterBlockData {
  const parsed = beforeAfterBlockDataSchema.parse(data);

  return beforeAfterBlockDataSchema.parse({
    ...parsed,
    position,
  });
}

export const BeforeAfterBlock: BlockTypeDefinition<BeforeAfterBlockData> = {
  type: "before-after",
  name: "Before/After",
  icon: "BEFORE_AFTER",
  schema: beforeAfterBlockDataSchema,
  defaultData: {
    beforeUrl: "https://example.com/before.jpg",
    afterUrl: "https://example.com/after.jpg",
    beforeLabel: "Before",
    afterLabel: "After",
    position: 50,
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = beforeAfterBlockDataSchema.parse(data);

    return `<section data-block-type="before-after" data-position="${escapeHtml(
      String(parsed.position),
    )}"><figure><img src="${escapeHtml(parsed.beforeUrl)}" alt="${escapeHtml(
      parsed.beforeLabel,
    )}" loading="lazy" decoding="async" /><figcaption>${escapeHtml(parsed.beforeLabel)}</figcaption></figure><figure><img src="${escapeHtml(
      parsed.afterUrl,
    )}" alt="${escapeHtml(parsed.afterLabel)}" loading="lazy" decoding="async" /><figcaption>${escapeHtml(
      parsed.afterLabel,
    )}</figcaption></figure></section>`;
  },
  serialize(data) {
    const parsed = beforeAfterBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return beforeAfterBlockDataSchema.parse(parseJson<BeforeAfterBlockData>(content));
  },
};
