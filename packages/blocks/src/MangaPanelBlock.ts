import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

const ALLOWED_MANGA_IMAGE_PROTOCOLS = new Set(["http:", "https:"]);

function hasAllowedImageProtocol(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    return ALLOWED_MANGA_IMAGE_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

export type MangaPanelLayout = "single" | "two-up" | "grid-2x2" | "strip";
export type MangaPanelSize = "normal" | "wide" | "tall" | "hero";
export type MangaPanelMode = "pic" | "text";

export interface MangaPanel {
  id: string;
  mode?: MangaPanelMode;
  imageUrl?: string;
  caption?: string;
  dialogue?: string;
  textContent?: string;
  backgroundColor?: string;
  textColor?: string;
  panelSize?: MangaPanelSize;
  originalWidth?: number;
  originalHeight?: number;
}

export interface MangaPanelBlockData extends Record<string, unknown> {
  title?: string;
  layout: MangaPanelLayout;
  panels: MangaPanel[];
  readingDirection: "ltr" | "rtl";
}

const mangaPanelSchema = z
  .object({
    id: z.string(),
    mode: z.enum(["pic", "text"]).default("pic"),
    imageUrl: z.string().refine(hasAllowedImageProtocol, {
      message: "Unsupported manga panel image URL protocol",
    }).optional(),
    caption: z.string().optional(),
    dialogue: z.string().optional(),
    textContent: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    panelSize: z.enum(["normal", "wide", "tall", "hero"]).default("normal"),
    originalWidth: z.number().optional(),
    originalHeight: z.number().optional(),
  })
  .strict();

export const mangaPanelBlockDataSchema = z
  .object({
    title: z.string().optional(),
    layout: z.enum(["single", "two-up", "grid-2x2", "strip"]),
    panels: z.array(mangaPanelSchema).max(20),
    readingDirection: z.enum(["ltr", "rtl"]),
  })
  .strict();

function createPanelId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `manga-panel-${crypto.randomUUID()}`;
  }

  return `manga-panel-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function addMangaPanel(
  data: MangaPanelBlockData,
  panel: Partial<Omit<MangaPanel, "id">> & { id?: string } = {},
): MangaPanelBlockData {
  const parsed = mangaPanelBlockDataSchema.parse(data);

  return mangaPanelBlockDataSchema.parse({
    ...parsed,
    panels: [
      ...parsed.panels,
      {
        id: panel.id ?? createPanelId(),
        mode: panel.mode ?? "pic",
        imageUrl: panel.imageUrl,
        caption: panel.caption,
        dialogue: panel.dialogue,
        textContent: panel.textContent,
        backgroundColor: panel.backgroundColor,
        textColor: panel.textColor,
        panelSize: panel.panelSize ?? "normal",
        originalWidth: panel.originalWidth,
        originalHeight: panel.originalHeight,
      },
    ],
  });
}

export function setMangaLayout(
  data: MangaPanelBlockData,
  layout: MangaPanelLayout,
): MangaPanelBlockData {
  const parsed = mangaPanelBlockDataSchema.parse(data);
  return mangaPanelBlockDataSchema.parse({
    ...parsed,
    layout,
  });
}

export const MangaPanelBlock: BlockTypeDefinition<MangaPanelBlockData> = {
  type: "manga-panel",
  name: "Manga Panel",
  icon: "MANGA",
  schema: mangaPanelBlockDataSchema,
  defaultData: {
    title: "Storyboard",
    layout: "two-up",
    panels: [
      {
        id: "manga-panel-1",
        mode: "pic",
        caption: "Opening scene",
        panelSize: "normal",
      },
      {
        id: "manga-panel-2",
        mode: "text",
        textContent: "Once upon a time, in a land far away...",
        backgroundColor: "#1a1a2e",
        textColor: "#ffffff",
        panelSize: "normal",
      },
    ],
    readingDirection: "rtl",
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = mangaPanelBlockDataSchema.parse(data);
    const title = parsed.title
      ? `<h3 class="pulse-manga-title">${escapeHtml(parsed.title)}</h3>`
      : "";

    const panels = parsed.panels
      .map((panel) => {
        const sizeClass = `pulse-manga-panel--${panel.panelSize}`;
        const modeAttr = `data-mode="${panel.mode}"`;

        let innerHtml = "";

        if (panel.mode === "text") {
          const bgStyle = panel.backgroundColor
            ? `background-color:${escapeHtml(panel.backgroundColor)};`
            : "";
          const textStyle = panel.textColor
            ? `color:${escapeHtml(panel.textColor)};`
            : "";
          innerHtml = `
            <div class="pulse-manga-panel__text-box" style="${bgStyle}${textStyle}">
              <p class="pulse-manga-panel__text-content">${escapeHtml(panel.textContent || "")}</p>
            </div>
          `;
        } else {
          const image = panel.imageUrl
            ? `<img src="${escapeHtml(panel.imageUrl)}" alt="${escapeHtml(panel.caption ?? "Panel")}" loading="lazy" decoding="async" />`
            : '<div class="pulse-manga-panel__placeholder"><span>Panel</span></div>';
          const caption = panel.caption
            ? `<figcaption class="pulse-manga-panel__caption">${escapeHtml(panel.caption)}</figcaption>`
            : "";
          const dialogue = panel.dialogue
            ? `<p class="pulse-manga-panel__dialogue">${escapeHtml(panel.dialogue)}</p>`
            : "";
          const content = (panel.caption || panel.dialogue)
            ? `<div class="pulse-manga-panel__content">${caption}${dialogue}</div>`
            : "";
          innerHtml = `${image}${content}`;
        }

        return `<figure class="pulse-manga-panel ${sizeClass}" ${modeAttr}>${innerHtml}</figure>`;
      })
      .join("");

    return `<section data-block-type="manga-panel" data-layout="${parsed.layout}" dir="${parsed.readingDirection}" class="pulse-manga-layout pulse-manga-layout--${parsed.layout}">${title}<div class="pulse-manga-grid">${panels}</div></section>`;
  },
  serialize(data) {
    const parsed = mangaPanelBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return mangaPanelBlockDataSchema.parse(parseJson<MangaPanelBlockData>(content));
  },
};
