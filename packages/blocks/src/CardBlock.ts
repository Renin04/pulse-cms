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

export type CardBackgroundType = "image" | "solid" | "gradient";
export type CardImageFit = "cover" | "fill" | "fit";
export type CardGeometricForm =
  | "none"
  | "circle"
  | "triangle"
  | "square"
  | "diamond"
  | "hexagon"
  | "wave"
  | "dots"
  | "lines"
  | "custom";
export type CardGeometricPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";
export type CardCtaAlign = "left" | "center" | "right";
export type CardOverlayAlign = "left" | "center" | "right";
export type CardOverlayFontSize = "sm" | "md" | "lg" | "xl";

export interface CardBlockData extends Record<string, unknown> {
  title: string;
  body: string;

  // Background
  backgroundType?: CardBackgroundType;
  backgroundImageUrl?: string;
  backgroundImageFit?: CardImageFit;
  backgroundColor?: string;
  backgroundGradient?: string;

  // Geometric decoration
  geometricForm?: CardGeometricForm;
  geometricSvg?: string;
  geometricPosition?: CardGeometricPosition;
  geometricColor?: string;
  geometricOpacity?: number;

  // CTA
  ctaLabel?: string;
  ctaLinkUrl?: string;
  ctaAlign?: CardCtaAlign;

  // Overlay text
  overlayText?: string;
  overlayAlign?: CardOverlayAlign;
  overlayFontSize?: CardOverlayFontSize;

  // Legacy fields (migrated automatically)
  mediaUrl?: string;
  linkUrl?: string;
}

export const cardBlockDataSchema = z
  .object({
    title: z.string(),
    body: z.string(),
    backgroundType: z.enum(["image", "solid", "gradient"]).optional(),
    backgroundImageUrl: z
      .string()
      .refine(hasAllowedCardProtocol, {
        message: "Unsupported card background image URL protocol",
      })
      .optional(),
    backgroundImageFit: z.enum(["cover", "fill", "fit"]).optional(),
    backgroundColor: z.string().optional(),
    backgroundGradient: z.string().optional(),
    geometricForm: z
      .enum([
        "none",
        "circle",
        "triangle",
        "square",
        "diamond",
        "hexagon",
        "wave",
        "dots",
        "lines",
        "custom",
      ])
      .optional(),
    geometricSvg: z.string().optional(),
    geometricPosition: z
      .enum(["top-left", "top-right", "bottom-left", "bottom-right", "center"])
      .optional(),
    geometricColor: z.string().optional(),
    geometricOpacity: z.number().min(0).max(1).optional(),
    ctaLabel: z.string().optional(),
    ctaLinkUrl: z
      .string()
      .refine(hasAllowedCardProtocol, {
        message: "Unsupported card CTA URL protocol",
      })
      .optional(),
    ctaAlign: z.enum(["left", "center", "right"]).optional(),
    overlayText: z.string().optional(),
    overlayAlign: z.enum(["left", "center", "right"]).optional(),
    overlayFontSize: z.enum(["sm", "md", "lg", "xl"]).optional(),
    // Legacy fields (migrated automatically)
    mediaUrl: z
      .string()
      .refine(hasAllowedCardProtocol, {
        message: "Unsupported card media URL protocol",
      })
      .optional(),
    linkUrl: z
      .string()
      .refine(hasAllowedCardProtocol, {
        message: "Unsupported card link URL protocol",
      })
      .optional(),
  })
  .strict();

function migrateCardData(data: CardBlockData): CardBlockData {
  const legacyMedia = data.mediaUrl;
  const legacyLink = data.linkUrl;

  const hasNewBackground = data.backgroundType && (data.backgroundType !== "solid" || data.backgroundColor);
  const shouldMigrateBackground = !hasNewBackground && legacyMedia;

  const hasNewCta = data.ctaLinkUrl;
  const shouldMigrateCta = !hasNewCta && legacyLink && data.ctaLabel;

  if (!shouldMigrateBackground && !shouldMigrateCta) {
    return {
      ...data,
      backgroundType: data.backgroundType ?? "solid",
      backgroundColor: data.backgroundColor ?? "#ffffff",
      geometricForm: data.geometricForm ?? "none",
      geometricPosition: data.geometricPosition ?? "top-right",
      geometricColor: data.geometricColor ?? "rgba(255,40,0,0.12)",
      geometricOpacity: data.geometricOpacity ?? 0.15,
      ctaAlign: data.ctaAlign ?? "center",
      overlayAlign: data.overlayAlign ?? "center",
      overlayFontSize: data.overlayFontSize ?? "md",
    };
  }

  return {
    ...data,
    backgroundType: shouldMigrateBackground ? "image" : (data.backgroundType ?? "solid"),
    backgroundImageUrl: shouldMigrateBackground ? legacyMedia : data.backgroundImageUrl,
    backgroundImageFit: data.backgroundImageFit ?? "cover",
    backgroundColor: data.backgroundColor ?? "#ffffff",
    ctaLinkUrl: shouldMigrateCta ? legacyLink : data.ctaLinkUrl,
    ctaAlign: data.ctaAlign ?? "center",
    overlayAlign: data.overlayAlign ?? "center",
    overlayFontSize: data.overlayFontSize ?? "md",
    geometricForm: data.geometricForm ?? "none",
    geometricPosition: data.geometricPosition ?? "top-right",
    geometricColor: data.geometricColor ?? "rgba(255,40,0,0.12)",
    geometricOpacity: data.geometricOpacity ?? 0.15,
  };
}

const PRESET_SVGS: Record<string, string> = {
  circle: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="50" cy="50" r="24" fill="currentColor" opacity="0.35"/></svg>`,
  triangle: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><polygon points="50,8 92,84 8,84" fill="currentColor" opacity="0.22"/><polygon points="50,28 76,72 24,72" fill="currentColor" opacity="0.45"/></svg>`,
  square: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="8" y="8" width="84" height="84" rx="14" fill="currentColor" opacity="0.18"/><rect x="24" y="24" width="52" height="52" rx="10" fill="currentColor" opacity="0.35"/></svg>`,
  diamond: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><polygon points="50,6 94,50 50,94 6,50" fill="currentColor" opacity="0.16"/><polygon points="50,26 74,50 50,74 26,50" fill="currentColor" opacity="0.42"/></svg>`,
  hexagon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><polygon points="50,4 91,26 91,74 50,96 9,74 9,26" fill="currentColor" opacity="0.16"/><polygon points="50,24 74,38 74,62 50,76 26,62 26,38" fill="currentColor" opacity="0.38"/></svg>`,
  wave: `<svg viewBox="0 0 200 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M0,36 Q20,14 40,36 T80,36 T120,36 T160,36 T200,36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.55"/><path d="M0,48 Q20,26 40,48 T80,48 T120,48 T160,48 T200,48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/></svg>`,
  dots: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="18" cy="22" r="5" fill="currentColor"/><circle cx="50" cy="22" r="5" fill="currentColor"/><circle cx="82" cy="22" r="5" fill="currentColor"/><circle cx="18" cy="50" r="5" fill="currentColor" opacity="0.55"/><circle cx="50" cy="50" r="5" fill="currentColor" opacity="0.55"/><circle cx="82" cy="50" r="5" fill="currentColor" opacity="0.55"/><circle cx="18" cy="78" r="5" fill="currentColor" opacity="0.3"/><circle cx="50" cy="78" r="5" fill="currentColor" opacity="0.3"/><circle cx="82" cy="78" r="5" fill="currentColor" opacity="0.3"/></svg>`,
  lines: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><line x1="10" y1="24" x2="90" y2="24" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" opacity="0.55"/><line x1="10" y1="42" x2="70" y2="42" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.35"/><line x1="10" y1="60" x2="90" y2="60" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" opacity="0.55"/><line x1="10" y1="78" x2="55" y2="78" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.35"/></svg>`,
};

const CTA_ARROW_ICON = `<svg class="pulse-card__cta-arrow" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function buildBackgroundStyle(data: CardBlockData): string {
  const fit = data.backgroundImageFit ?? "cover";
  const fitValue =
    fit === "fill" ? "100% 100%" : fit === "fit" ? "contain" : "cover";

  switch (data.backgroundType) {
    case "image":
      return data.backgroundImageUrl
        ? `background-image:url(${escapeHtml(data.backgroundImageUrl)});background-size:${fitValue};background-position:center;background-repeat:${fit === "fit" ? "no-repeat" : "repeat"};`
        : "";
    case "solid":
      return data.backgroundColor
        ? `background:${escapeHtml(data.backgroundColor)};`
        : "";
    case "gradient":
      return data.backgroundGradient
        ? `background:${escapeHtml(data.backgroundGradient)};`
        : "";
    default:
      return "";
  }
}

function buildGeometricElement(data: CardBlockData): string {
  const form = data.geometricForm ?? "none";
  if (form === "none") return "";

  let svg = "";
  if (form === "custom" && data.geometricSvg) {
    svg = data.geometricSvg;
  } else if (form in PRESET_SVGS) {
    svg = PRESET_SVGS[form];
  }
  if (!svg) return "";

  const pos = data.geometricPosition ?? "top-right";
  const color = escapeHtml(data.geometricColor ?? "rgba(255,40,0,0.12)");
  const opacity = data.geometricOpacity ?? 0.15;

  const positionClass = `pulse-card__geo--${pos}`;

  return `<div class="pulse-card__geometric ${positionClass}" style="color:${color};opacity:${opacity}">${svg}</div>`;
}

function buildOverlayElement(data: CardBlockData): string {
  if (!data.overlayText) return "";
  const align = data.overlayAlign ?? "center";
  const size = data.overlayFontSize ?? "md";
  return `<div class="pulse-card__overlay pulse-card__overlay--${align} pulse-card__overlay--${size}">${escapeHtml(data.overlayText)}</div>`;
}

function buildCtaElement(data: CardBlockData): string {
  if (!data.ctaLinkUrl || !data.ctaLabel) return "";
  const align = data.ctaAlign ?? "center";
  return `<div class="pulse-card__cta pulse-card__cta--${align}"><a href="${escapeHtml(data.ctaLinkUrl)}" class="pulse-card__cta-btn" target="_blank" rel="noopener noreferrer" role="button"><span class="pulse-card__cta-label">${escapeHtml(data.ctaLabel)}</span>${CTA_ARROW_ICON}</a></div>`;
}

function buildImageScrim(data: CardBlockData): string {
  if (data.backgroundType !== "image" || !data.backgroundImageUrl) return "";
  return `<div class="pulse-card__scrim" aria-hidden="true"></div>`;
}

export const CardBlock: BlockTypeDefinition<CardBlockData> = {
  type: "card",
  name: "Card",
  icon: "CARD",
  schema: cardBlockDataSchema,
  defaultData: {
    title: "Feature card",
    body: "Summarize a key idea with optional media and CTA.",
    backgroundType: "solid",
    backgroundColor: "#ffffff",
    geometricForm: "none",
    geometricPosition: "top-right",
    geometricColor: "rgba(255,40,0,0.12)",
    geometricOpacity: 0.15,
    ctaAlign: "center",
    overlayAlign: "center",
    overlayFontSize: "md",
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = migrateCardData(cardBlockDataSchema.parse(data));
    const bgStyle = buildBackgroundStyle(parsed);
    const bgClass = `pulse-card--bg-${parsed.backgroundType}`;
    const scrim = buildImageScrim(parsed);
    const geo = buildGeometricElement(parsed);
    const overlay = buildOverlayElement(parsed);
    const cta = buildCtaElement(parsed);

    return (
      `<article class="pulse-card ${bgClass}" data-block-type="card" data-pulse-card-bg="${parsed.backgroundType}" aria-label="${escapeHtml(parsed.title)}" style="${bgStyle}">` +
      `${scrim}${geo}${overlay}` +
      `<div class="pulse-card__content">` +
      `<h3 class="pulse-card__title">${escapeHtml(parsed.title)}</h3>` +
      `<p class="pulse-card__body">${escapeHtml(parsed.body)}</p>` +
      `${cta}</div></article>`
    );
  },
  serialize(data) {
    const parsed = migrateCardData(cardBlockDataSchema.parse(data));
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return migrateCardData(cardBlockDataSchema.parse(parseJson<CardBlockData>(content)));
  },
};
