import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";
import { renderInlineMarkdown } from "./BlockquoteBlock";

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
export type GalleryImageFit = "cover" | "contain" | "fill";
export type GalleryImageAlign = "left" | "center" | "right" | "justify";

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  title?: string;
  fit?: GalleryImageFit;
  linkUrl?: string;
  linkTarget?: string;
  linkRel?: string;
  captionAlign?: GalleryImageAlign;
  titleAlign?: GalleryImageAlign;
}

export interface GalleryBlockData extends Record<string, unknown> {
  title?: string;
  layout: GalleryLayout;
  columns: number;
  gap?: number;
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
    title: z.string().optional(),
    fit: z.enum(["cover", "contain", "fill"]).optional(),
    linkUrl: z.string().optional(),
    linkTarget: z.string().optional(),
    linkRel: z.string().optional(),
    captionAlign: z.enum(["left", "center", "right", "justify"]).optional(),
    titleAlign: z.enum(["left", "center", "right", "justify"]).optional(),
  })
  .strict();

export const galleryBlockDataSchema = z
  .object({
    title: z.string().optional(),
    layout: z.enum(["grid", "masonry"]),
    columns: z.number().int().min(1).max(6),
    gap: z.number().int().min(0).max(64).optional(),
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
    gap: 12,
    images: [
      {
        id: "gallery-image-1",
        src: "https://example.com/gallery-1.jpg",
        alt: "Gallery image",
        fit: "cover",
      },
    ],
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = galleryBlockDataSchema.parse(data);
    const title = parsed.title
      ? `<h3 class="pulse-gallery__title">${escapeHtml(parsed.title)}</h3>`
      : "";
    const gap = parsed.gap ?? 12;

    const linkHint = `<span class="pulse-gallery__link-hint" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg></span>`;

    const images = parsed.images
      .map((image) => {
        const fit = image.fit ?? "cover";
        const imgHtml = `<img src="${escapeHtml(image.src)}" alt="${escapeHtml(
          image.alt,
        )}" loading="lazy" decoding="async" class="pulse-gallery__image" style="object-fit:${fit};" />`;

        const titleEl = image.title
          ? `<div class="pulse-gallery__item-title" style="text-align:${image.titleAlign ?? "left"}">${escapeHtml(image.title)}</div>`
          : "";

        const captionContent = image.caption ? renderInlineMarkdown(image.caption) : "";
        const captionEl = captionContent
          ? `<figcaption class="pulse-gallery__caption" style="text-align:${image.captionAlign ?? "center"}">${captionContent}</figcaption>`
          : "";

        if (image.linkUrl) {
          const targetAttr = image.linkTarget ? ` target="${escapeHtml(image.linkTarget)}"` : "";
          const relAttr = image.linkRel
            ? ` rel="${escapeHtml(image.linkRel)}"`
            : ' rel="noopener noreferrer"';
          return `<figure class="pulse-gallery__item" role="listitem">${titleEl}<a href="${escapeHtml(
            image.linkUrl,
          )}"${targetAttr}${relAttr} class="pulse-gallery__link" aria-label="${escapeHtml(
            image.alt,
          )}">${imgHtml}${linkHint}</a>${captionEl}</figure>`;
        }

        return `<figure class="pulse-gallery__item" role="listitem">${titleEl}<div class="pulse-gallery__media">${imgHtml}</div>${captionEl}</figure>`;
      })
      .join("");

    const containerStyle = `--gallery-columns:${parsed.columns};--gallery-gap:${gap}px;`;

    return `<section class="pulse-gallery pulse-gallery--${parsed.layout}" data-block-type="gallery" data-layout="${parsed.layout}" data-columns="${parsed.columns}" style="${containerStyle}">${title}<div class="pulse-gallery__grid" role="list">${images}</div></section>`;
  },
  serialize(data) {
    const parsed = galleryBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return galleryBlockDataSchema.parse(parseJson<GalleryBlockData>(content));
  },
};
