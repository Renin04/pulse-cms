import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson, stableRenderId } from "./types";

const GRIP_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14" aria-hidden="true"><path d="M6 3 3 8l3 5M10 3l3 5-3 5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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
    const position = Math.round(parsed.position);
    const sliderId = stableRenderId("pulse-ba", JSON.stringify(parsed));
    const valueText = `${parsed.beforeLabel} ${position}%, ${parsed.afterLabel} ${100 - position}%`;

    // Interactive slider: CSS alone renders the split at --ba-position; the
    // hydrator wires pointer/keyboard input. Shown once hydrated.
    const stage =
      `<div class="pulse-ba__stage">` +
      `<img class="pulse-ba__img pulse-ba__img--before" src="${escapeHtml(parsed.beforeUrl)}" alt="${escapeHtml(
        parsed.beforeLabel,
      )}" loading="lazy" decoding="async" />` +
      `<img class="pulse-ba__img pulse-ba__img--after" src="${escapeHtml(parsed.afterUrl)}" alt="${escapeHtml(
        parsed.afterLabel,
      )}" loading="lazy" decoding="async" aria-hidden="true" />` +
      `<span class="pulse-ba__chip pulse-ba__chip--before">${escapeHtml(parsed.beforeLabel)}</span>` +
      `<span class="pulse-ba__chip pulse-ba__chip--after">${escapeHtml(parsed.afterLabel)}</span>` +
      `<div class="pulse-ba__handle" id="${sliderId}" tabindex="0" role="slider" aria-label="Before/after comparison slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${position}" aria-valuetext="${escapeHtml(
        valueText,
      )}"><span class="pulse-ba__grip" aria-hidden="true">${GRIP_ICON}</span></div>` +
      `</div>`;

    // No-JS fallback: the two stacked figures stay fully readable.
    const fallback =
      `<div class="pulse-ba__fallback">` +
      `<figure><img src="${escapeHtml(parsed.beforeUrl)}" alt="${escapeHtml(
        parsed.beforeLabel,
      )}" loading="lazy" decoding="async" /><figcaption>${escapeHtml(parsed.beforeLabel)}</figcaption></figure>` +
      `<figure><img src="${escapeHtml(parsed.afterUrl)}" alt="${escapeHtml(
        parsed.afterLabel,
      )}" loading="lazy" decoding="async" /><figcaption>${escapeHtml(parsed.afterLabel)}</figcaption></figure>` +
      `</div>`;

    return `<section class="pulse-ba" data-block-type="before-after" data-position="${escapeHtml(
      String(parsed.position),
    )}" style="--ba-position:${escapeHtml(String(parsed.position))}" role="group" aria-label="Before and after comparison">${stage}${fallback}</section>`;
  },
  serialize(data) {
    const parsed = beforeAfterBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return beforeAfterBlockDataSchema.parse(parseJson<BeforeAfterBlockData>(content));
  },
};
