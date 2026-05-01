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

export interface MangaPanel {
  id: string;
  imageUrl?: string;
  caption?: string;
  dialogue?: string;
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
    imageUrl: z.string().refine(hasAllowedImageProtocol, {
      message: "Unsupported manga panel image URL protocol",
    }).optional(),
    caption: z.string().optional(),
    dialogue: z.string().optional(),
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
  panel: Omit<MangaPanel, "id"> & { id?: string } = {},
): MangaPanelBlockData {
  const parsed = mangaPanelBlockDataSchema.parse(data);

  return mangaPanelBlockDataSchema.parse({
    ...parsed,
    panels: [
      ...parsed.panels,
      {
        id: panel.id ?? createPanelId(),
        imageUrl: panel.imageUrl,
        caption: panel.caption,
        dialogue: panel.dialogue,
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
    title: "Storyboard sequence",
    layout: "two-up",
    panels: [
      {
        id: "manga-panel-1",
        caption: "Opening panel",
      },
      {
        id: "manga-panel-2",
        caption: "Reaction panel",
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
    const title = parsed.title ? `<h3>${escapeHtml(parsed.title)}</h3>` : "";
    const panels = parsed.panels
      .map((panel) => {
        const image = panel.imageUrl
          ? `<img src="${escapeHtml(panel.imageUrl)}" alt="${escapeHtml(panel.caption ?? "Panel")}" />`
          : '<div data-placeholder="true">Panel</div>';
        const caption = panel.caption ? `<figcaption>${escapeHtml(panel.caption)}</figcaption>` : "";
        const dialogue = panel.dialogue
          ? `<blockquote>${escapeHtml(panel.dialogue)}</blockquote>`
          : "";
        return `<figure>${image}${caption}${dialogue}</figure>`;
      })
      .join("");

    return `<section data-block-type="manga-panel" data-layout="${parsed.layout}" dir="${parsed.readingDirection}">${title}<div>${panels}</div></section>`;
  },
  serialize(data) {
    const parsed = mangaPanelBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return mangaPanelBlockDataSchema.parse(parseJson<MangaPanelBlockData>(content));
  },
};
