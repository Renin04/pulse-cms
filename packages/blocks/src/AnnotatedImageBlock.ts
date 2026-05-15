import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

const ALLOWED_ANNOTATED_IMAGE_PROTOCOLS = new Set(["http:", "https:"]);

function hasAllowedImageProtocol(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    return ALLOWED_ANNOTATED_IMAGE_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

export interface ImageHotspot {
  id: string;
  x: number;
  y: number;
  label: string;
  description?: string;
}

export interface AnnotatedImageBlockData extends Record<string, unknown> {
  imageUrl: string;
  alt: string;
  caption?: string;
  hotspots: ImageHotspot[];
}

const imageHotspotSchema = z
  .object({
    id: z.string(),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    label: z.string(),
    description: z.string().optional(),
  })
  .strict();

export const annotatedImageBlockDataSchema = z
  .object({
    imageUrl: z.string().refine(hasAllowedImageProtocol, {
      message: "Unsupported annotated image URL protocol",
    }),
    alt: z.string(),
    caption: z.string().optional(),
    hotspots: z.array(imageHotspotSchema).max(30),
  })
  .strict();

function createHotspotId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `hotspot-${crypto.randomUUID()}`;
  }

  return `hotspot-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function addImageHotspot(
  data: AnnotatedImageBlockData,
  hotspot: Omit<ImageHotspot, "id"> & { id?: string },
): AnnotatedImageBlockData {
  const parsed = annotatedImageBlockDataSchema.parse(data);

  return annotatedImageBlockDataSchema.parse({
    ...parsed,
    hotspots: [
      ...parsed.hotspots,
      {
        ...hotspot,
        id: hotspot.id ?? createHotspotId(),
      },
    ],
  });
}

export const AnnotatedImageBlock: BlockTypeDefinition<AnnotatedImageBlockData> = {
  type: "annotated-image",
  name: "Annotated image",
  icon: "ANNOTATED_IMAGE",
  schema: annotatedImageBlockDataSchema,
  defaultData: {
    imageUrl: "https://example.com/annotated-image.jpg",
    alt: "Annotated image",
    hotspots: [
      {
        id: "hotspot-1",
        x: 40,
        y: 55,
        label: "Highlight",
      },
    ],
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = annotatedImageBlockDataSchema.parse(data);
    const caption = parsed.caption ? `<figcaption>${escapeHtml(parsed.caption)}</figcaption>` : "";
    const hotspots = parsed.hotspots
      .map(
        (hotspot) =>
          `<button type="button" data-hotspot-id="${escapeHtml(hotspot.id)}" style="left:${escapeHtml(
            String(hotspot.x),
          )}%;top:${escapeHtml(String(hotspot.y))}%;">${escapeHtml(hotspot.label)}</button>`,
      )
      .join("");

    return `<figure data-block-type="annotated-image"><div data-hotspot-layer="true"><img src="${escapeHtml(
      parsed.imageUrl,
    )}" alt="${escapeHtml(parsed.alt)}" loading="lazy" decoding="async" />${hotspots}</div>${caption}</figure>`;
  },
  serialize(data) {
    const parsed = annotatedImageBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return annotatedImageBlockDataSchema.parse(parseJson<AnnotatedImageBlockData>(content));
  },
};
