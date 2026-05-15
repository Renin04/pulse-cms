import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export type ImageFit = "cover" | "contain" | "fill";
export type ImageStatus = "idle" | "uploading" | "ready" | "error";

export interface ImageBlockData extends Record<string, unknown> {
  src: string | null;
  alt: string;
  title?: string;
  width: number;
  height: number;
  caption?: string;
  credit?: string;
  source?: string;
  license?: string;
  fit: ImageFit;
  status: ImageStatus;
  errorMessage?: string;
  align?: "left" | "center" | "right" | "justify";
}

export interface ImageUploadSuccess {
  src: string;
  width: number;
  height: number;
  alt?: string;
  title?: string;
  caption?: string;
  credit?: string;
  source?: string;
  license?: string;
}

export const imageBlockDataSchema = z
  .object({
    src: z.string().nullable(),
    alt: z.string(),
    title: z.string().optional(),
    width: z.number().int().min(1),
    height: z.number().int().min(1),
    caption: z.string().optional(),
    credit: z.string().optional(),
    source: z.string().optional(),
    license: z.string().optional(),
    fit: z.enum(["cover", "contain", "fill"]),
    status: z.enum(["idle", "uploading", "ready", "error"]),
    errorMessage: z.string().optional(),
    align: z.enum(["left", "center", "right", "justify"]).optional(),
  })
  .strict();

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function startImageUpload(data: ImageBlockData): ImageBlockData {
  const parsed = imageBlockDataSchema.parse(data);

  return imageBlockDataSchema.parse({
    ...parsed,
    status: "uploading",
    errorMessage: undefined,
  });
}

export function applyImageUploadSuccess(
  data: ImageBlockData,
  result: ImageUploadSuccess,
): ImageBlockData {
  const parsed = imageBlockDataSchema.parse(data);

  return imageBlockDataSchema.parse({
    ...parsed,
    src: result.src,
    width: result.width,
    height: result.height,
    alt: result.alt ?? parsed.alt,
    title: result.title ?? parsed.title,
    caption: result.caption ?? parsed.caption,
    credit: result.credit ?? parsed.credit,
    source: result.source ?? parsed.source,
    license: result.license ?? parsed.license,
    status: "ready",
    errorMessage: undefined,
  });
}

export function applyImageUploadError(
  data: ImageBlockData,
  error: unknown,
): ImageBlockData {
  const parsed = imageBlockDataSchema.parse(data);

  return imageBlockDataSchema.parse({
    ...parsed,
    status: "error",
    errorMessage: normalizeErrorMessage(error),
  });
}

export function resizeImage(
  data: ImageBlockData,
  width: number,
  height: number,
): ImageBlockData {
  const parsed = imageBlockDataSchema.parse(data);

  return imageBlockDataSchema.parse({
    ...parsed,
    width,
    height,
  });
}

export const ImageBlock: BlockTypeDefinition<ImageBlockData> = {
  type: "image",
  name: "Image",
  icon: "IMG",
  schema: imageBlockDataSchema,
  defaultData: {
    src: null,
    alt: "",
    width: 800,
    height: 450,
    fit: "cover",
    status: "idle",
  },
  config: {
    category: "media",
    isVoid: true,
    canHaveChildren: false,
  },
  render(data) {
    const parsed = imageBlockDataSchema.parse(data);

    if (parsed.status === "error") {
      const errorMessage = parsed.errorMessage ?? "Image upload failed";
      return `<figure data-block-type="image" data-status="error"><div role="alert">${escapeHtml(
        errorMessage,
      )}</div></figure>`;
    }

    if (!parsed.src) {
      return '<figure data-block-type="image" data-status="empty"><div>No image selected</div></figure>';
    }

    const titleAttr = parsed.title ? ` title="${escapeHtml(parsed.title)}"` : "";
    const captionHtml = parsed.caption
      ? `<figcaption>${escapeHtml(parsed.caption)}</figcaption>`
      : "";
    
    // Build attribution metadata
    const attributionParts: string[] = [];
    if (parsed.credit) attributionParts.push(`Credit: ${parsed.credit}`);
    if (parsed.source) attributionParts.push(`Source: ${parsed.source}`);
    if (parsed.license) attributionParts.push(`License: ${parsed.license}`);
    const attribution = attributionParts.length > 0 
      ? `<small class="image-attribution">${escapeHtml(attributionParts.join(" | "))}</small>` 
      : "";
    
    const alignStyle = parsed.align ? `text-align: ${parsed.align}; ` : "";

    // Sanitize dimensions to prevent extreme aspect ratios causing layout shifts
    const MAX_DIM = 10000;
    const MIN_DIM = 10;
    let w = parsed.width;
    let h = parsed.height;
    const aspectRatio = w / h;
    if (w > MAX_DIM || h > MAX_DIM || w < MIN_DIM || h < MIN_DIM || aspectRatio > 10 || aspectRatio < 0.1) {
      w = 0;
      h = 0;
    }
    const sizeAttr = w && h ? ` width="${w}" height="${h}"` : "";

    return `<figure data-block-type="image" data-status="${parsed.status}" style="${alignStyle}"><img src="${escapeHtml(
      parsed.src,
    )}" alt="${escapeHtml(parsed.alt)}"${titleAttr}${sizeAttr} loading="lazy" decoding="async" style="object-fit:${parsed.fit}" />${captionHtml}${attribution}</figure>`;
  },
  serialize(data) {
    const parsed = imageBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return imageBlockDataSchema.parse(parseJson<ImageBlockData>(content));
  },
};
