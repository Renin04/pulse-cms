import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

const ALLOWED_HERO_PROTOCOLS = new Set(["http:", "https:"]);

function hasAllowedHeroProtocol(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    return ALLOWED_HERO_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

export interface HeroSectionBlockData extends Record<string, unknown> {
  title: string;
  subtitle?: string;
  backgroundUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export const heroSectionBlockDataSchema = z
  .object({
    title: z.string(),
    subtitle: z.string().optional(),
    backgroundUrl: z.string().refine(hasAllowedHeroProtocol, {
      message: "Unsupported hero background URL protocol",
    }).optional(),
    ctaLabel: z.string().optional(),
    ctaUrl: z.string().refine(hasAllowedHeroProtocol, {
      message: "Unsupported hero CTA URL protocol",
    }).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if ((value.ctaLabel && !value.ctaUrl) || (!value.ctaLabel && value.ctaUrl)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hero CTA requires both label and URL",
        path: ["ctaLabel"],
      });
    }
  });

export const HeroSectionBlock: BlockTypeDefinition<HeroSectionBlockData> = {
  type: "hero-section",
  name: "Hero section",
  icon: "HERO",
  schema: heroSectionBlockDataSchema,
  defaultData: {
    title: "Create immersive stories",
    subtitle: "Build interactive reading experiences with Pulse.",
    backgroundUrl: "https://example.com/hero.jpg",
    ctaLabel: "Get started",
    ctaUrl: "https://example.com/get-started",
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = heroSectionBlockDataSchema.parse(data);
    const subtitleMarkup = parsed.subtitle ? `<p>${escapeHtml(parsed.subtitle)}</p>` : "";
    const ctaMarkup = parsed.ctaLabel && parsed.ctaUrl
      ? `<a href="${escapeHtml(parsed.ctaUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
          parsed.ctaLabel,
        )}</a>`
      : "";
    const backgroundStyle = parsed.backgroundUrl
      ? ` style="background-image:url('${escapeHtml(parsed.backgroundUrl)}');"`
      : "";

    return `<section data-block-type="hero-section"${backgroundStyle}><h2>${escapeHtml(
      parsed.title,
    )}</h2>${subtitleMarkup}${ctaMarkup}</section>`;
  },
  serialize(data) {
    const parsed = heroSectionBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return heroSectionBlockDataSchema.parse(parseJson<HeroSectionBlockData>(content));
  },
};
