import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

const ALLOWED_CARD_PROTOCOLS = new Set(["http:", "https:"]);

function hasAllowedCardProtocol(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    return ALLOWED_CARD_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

export interface CardBlockData extends Record<string, unknown> {
  title: string;
  body: string;
  mediaUrl?: string;
  linkUrl?: string;
  ctaLabel?: string;
}

export const cardBlockDataSchema = z
  .object({
    title: z.string(),
    body: z.string(),
    mediaUrl: z.string().refine(hasAllowedCardProtocol, {
      message: "Unsupported card media URL protocol",
    }).optional(),
    linkUrl: z.string().refine(hasAllowedCardProtocol, {
      message: "Unsupported card link URL protocol",
    }).optional(),
    ctaLabel: z.string().optional(),
  })
  .strict();

export const CardBlock: BlockTypeDefinition<CardBlockData> = {
  type: "card",
  name: "Card",
  icon: "CARD",
  schema: cardBlockDataSchema,
  defaultData: {
    title: "Feature card",
    body: "Summarize a key idea with optional media and CTA.",
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = cardBlockDataSchema.parse(data);
    const image = parsed.mediaUrl
      ? `<img src="${escapeHtml(parsed.mediaUrl)}" alt="${escapeHtml(parsed.title)}" loading="lazy" decoding="async" />`
      : "";
    const cta = parsed.linkUrl && parsed.ctaLabel
      ? `<a href="${escapeHtml(parsed.linkUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
          parsed.ctaLabel,
        )}</a>`
      : "";

    return `<article data-block-type="card">${image}<h3>${escapeHtml(parsed.title)}</h3><p>${escapeHtml(
      parsed.body,
    )}</p>${cta}</article>`;
  },
  serialize(data) {
    const parsed = cardBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return cardBlockDataSchema.parse(parseJson<CardBlockData>(content));
  },
};
