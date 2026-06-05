import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";
import { renderInlineMarkdown } from "./BlockquoteBlock";

export type ImageFit = "cover" | "contain" | "fill";
export type ImageStatus = "idle" | "uploading" | "ready" | "error";
export type ImageAlign = "left" | "center" | "right" | "justify";
export type ImageDisplaySize = "small" | "medium" | "large" | "full";
export type ImageFormat = "original" | "webp" | "jpeg" | "png";

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
  align?: ImageAlign;
  captionAlign?: ImageAlign;
  displaySize?: ImageDisplaySize;
  format?: ImageFormat;
  compression?: number;
  fileSize?: number;
  mediaAssetId?: string;
  originalWidth?: number;
  originalHeight?: number;
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
    captionAlign: z.enum(["left", "center", "right", "justify"]).optional(),
    displaySize: z.enum(["small", "medium", "large", "full"]).optional(),
    format: z.enum(["original", "webp", "jpeg", "png"]).optional(),
    compression: z.number().optional(),
    fileSize: z.number().optional(),
    mediaAssetId: z.string().optional(),
    originalWidth: z.number().optional(),
    originalHeight: z.number().optional(),
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
    captionAlign: "center",
    displaySize: "large",
    format: "original",
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

    // Respect user dimensions with loose bounds (issue #41)
    const MAX_DIM = 10000;
    const MIN_DIM = 1;
    const w = Math.max(MIN_DIM, Math.min(MAX_DIM, parsed.width));
    const h = Math.max(MIN_DIM, Math.min(MAX_DIM, parsed.height));
    const sizeAttr = w && h ? ` width="${w}" height="${h}"` : "";

    // Display size constraints (issue #43 & #51.5)
    const displaySize = parsed.displaySize || "large";
    const displaySizeConfig: Record<string, { figureMaxWidth: string; imgMaxHeight: string }> = {
      small: { figureMaxWidth: "400px", imgMaxHeight: "300px" },
      medium: { figureMaxWidth: "640px", imgMaxHeight: "480px" },
      large: { figureMaxWidth: "960px", imgMaxHeight: "640px" },
      full: { figureMaxWidth: "100%", imgMaxHeight: "80vh" },
    };
    const sizeConfig = displaySizeConfig[displaySize] || displaySizeConfig.large;
    const figureStyle = `max-width:${sizeConfig.figureMaxWidth};`;
    const imgMaxHeight = sizeConfig.imgMaxHeight;

    // Align using margins on the figure
    const alignMargins: Record<string, string> = {
      left: "margin-left:0;margin-right:auto;",
      center: "margin-left:auto;margin-right:auto;",
      right: "margin-left:auto;margin-right:0;",
      justify: "margin-left:auto;margin-right:auto;",
    };
    const alignStyle = parsed.align ? alignMargins[parsed.align] || "" : "";

    // Caption alignment (issue #42)
    const captionAlignStyle = parsed.captionAlign
      ? `text-align: ${parsed.captionAlign};`
      : "text-align: center;";

    // Attribution metadata with clickable source link
    function isUrl(str: string): boolean {
      return /^https?:\/\//.test(str);
    }
    const attributionParts: string[] = [];
    if (parsed.credit) attributionParts.push(`Credit: ${escapeHtml(parsed.credit)}`);
    if (parsed.source) {
      if (isUrl(parsed.source)) {
        attributionParts.push(`Source: <a href="${escapeHtml(parsed.source)}" target="_blank" rel="noopener noreferrer" style="color:var(--pulse-red);text-decoration:underline;">${escapeHtml(new URL(parsed.source).hostname)}</a>`);
      } else {
        attributionParts.push(`Source: ${escapeHtml(parsed.source)}`);
      }
    }
    if (parsed.license) attributionParts.push(`License: ${escapeHtml(parsed.license)}`);
    const attribution = attributionParts.length > 0
      ? `<span class="image-attribution">${attributionParts.join(" | ")}</span>`
      : "";

    // Caption supports inline markdown links/refs like blockquote (issue #4)
    const captionContent = [
      parsed.caption ? renderInlineMarkdown(parsed.caption) : "",
      attribution,
    ].filter(Boolean).join("");

    // Clean caption (issue #45)
    const captionHtml = captionContent
      ? `<figcaption class="image-caption" style="padding:0.5rem 0;font-size:0.875rem;color:var(--neutral-600);${captionAlignStyle}">${captionContent}</figcaption>`
      : "";

    const formatAttr = parsed.format && parsed.format !== "original" ? ` data-format="${parsed.format}"` : "";

    const imgStyle = `width:100%;max-height:${imgMaxHeight};aspect-ratio:${w}/${h};object-fit:${parsed.fit};max-width:100%;display:block;border-radius:0.75rem;`;
    const combinedFigureStyle = `${figureStyle}${alignStyle}`;
    const tooltipAttr = parsed.alt ? ` data-tooltip="${escapeHtml(parsed.alt)}"` : "";
    return `<figure data-block-type="image" data-status="${parsed.status}" data-display-size="${displaySize}"${formatAttr} class="pulse-image-figure"${tooltipAttr ? ` data-tooltip="${escapeHtml(parsed.alt)}"` : ''} style="${combinedFigureStyle}"><img src="${escapeHtml(
      parsed.src,
    )}" alt="${escapeHtml(parsed.alt)}"${titleAttr}${sizeAttr} loading="lazy" decoding="async" style="${imgStyle}" />${captionHtml}</figure>`;
  },
  serialize(data) {
    const parsed = imageBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return imageBlockDataSchema.parse(parseJson<ImageBlockData>(content));
  },
};
