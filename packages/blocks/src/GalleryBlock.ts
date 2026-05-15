import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

const ALLOWED_GALLERY_PROTOCOLS = new Set(["http:", "https:"]);

function hasAllowedGalleryProtocol(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    return ALLOWED_GALLERY_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

export type GalleryLayout = "grid" | "masonry";

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

export interface GalleryBlockData extends Record<string, unknown> {
  title?: string;
  layout: GalleryLayout;
  columns: number;
  images: GalleryImage[];
}

const galleryImageSchema = z
  .object({
    id: z.string(),
    src: z.string().refine(hasAllowedGalleryProtocol, {
      message: "Unsupported gallery image URL protocol",
    }),
    alt: z.string(),
    caption: z.string().optional(),
  })
  .strict();

export const galleryBlockDataSchema = z
  .object({
    title: z.string().optional(),
    layout: z.enum(["grid", "masonry"]),
    columns: z.number().int().min(1).max(6),
    images: z.array(galleryImageSchema).max(40),
  })
  .strict();

function createImageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `gallery-image-${crypto.randomUUID()}`;
  }

  return `gallery-image-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function addGalleryImage(
  data: GalleryBlockData,
  image: Omit<GalleryImage, "id"> & { id?: string },
): GalleryBlockData {
  const parsed = galleryBlockDataSchema.parse(data);

  return galleryBlockDataSchema.parse({
    ...parsed,
    images: [
      ...parsed.images,
      {
        ...image,
        id: image.id ?? createImageId(),
      },
    ],
  });
}

export const GalleryBlock: BlockTypeDefinition<GalleryBlockData> = {
  type: "gallery",
  name: "Gallery",
  icon: "GALLERY",
  schema: galleryBlockDataSchema,
  defaultData: {
    title: "Gallery",
    layout: "grid",
    columns: 3,
    images: [
      {
        id: "gallery-image-1",
        src: "https://example.com/gallery-1.jpg",
        alt: "Gallery image",
      },
    ],
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = galleryBlockDataSchema.parse(data);
    const title = parsed.title ? `<h3>${escapeHtml(parsed.title)}</h3>` : "";
    const images = parsed.images
      .map((image) => {
        const caption = image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : "";
        return `<figure><img src="${escapeHtml(image.src)}" alt="${escapeHtml(
          image.alt,
        )}" loading="lazy" decoding="async" />${caption}</figure>`;
      })
      .join("");

    return `<section data-block-type="gallery" data-layout="${parsed.layout}" data-columns="${parsed.columns}">${title}<div>${images}</div></section>`;
  },
  serialize(data) {
    const parsed = galleryBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return galleryBlockDataSchema.parse(parseJson<GalleryBlockData>(content));
  },
};
