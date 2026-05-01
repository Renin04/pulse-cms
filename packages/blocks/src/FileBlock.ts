import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

const ALLOWED_FILE_PROTOCOLS = new Set(["http:", "https:"]);

function hasAllowedFileProtocol(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    return ALLOWED_FILE_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

export interface FileBlockData extends Record<string, unknown> {
  name: string;
  url: string;
  sizeBytes?: number;
  mimeType?: string;
  description?: string;
  openInNewTab: boolean;
}

export const fileBlockDataSchema = z
  .object({
    name: z.string(),
    url: z.string().refine(hasAllowedFileProtocol, {
      message: "Unsupported file URL protocol",
    }),
    sizeBytes: z.number().int().min(0).optional(),
    mimeType: z.string().optional(),
    description: z.string().optional(),
    openInNewTab: z.boolean(),
  })
  .strict();

function formatFileSize(sizeBytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = sizeBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const displayValue = size >= 10 || unitIndex === 0 ? Math.round(size) : Number(size.toFixed(1));
  return `${displayValue} ${units[unitIndex]}`;
}

export const FileBlock: BlockTypeDefinition<FileBlockData> = {
  type: "file",
  name: "File",
  icon: "FILE",
  schema: fileBlockDataSchema,
  defaultData: {
    name: "Attachment",
    url: "https://example.com/file.pdf",
    openInNewTab: true,
  },
  config: {
    category: "media",
    isVoid: true,
    canHaveChildren: false,
  },
  render(data) {
    const parsed = fileBlockDataSchema.parse(data);
    const target = parsed.openInNewTab ? ' target="_blank"' : "";
    const rel = parsed.openInNewTab ? ' rel="noopener noreferrer"' : "";
    const metadata: string[] = [];

    if (typeof parsed.sizeBytes === "number") {
      metadata.push(formatFileSize(parsed.sizeBytes));
    }

    if (parsed.mimeType) {
      metadata.push(parsed.mimeType);
    }

    const metadataMarkup = metadata.length > 0 ? `<div>${escapeHtml(metadata.join(" • "))}</div>` : "";
    const descriptionMarkup = parsed.description
      ? `<p>${escapeHtml(parsed.description)}</p>`
      : "";

    return `<div data-block-type="file"><a href="${escapeHtml(parsed.url)}"${target}${rel}>${escapeHtml(
      parsed.name,
    )}</a>${metadataMarkup}${descriptionMarkup}</div>`;
  },
  serialize(data) {
    const parsed = fileBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return fileBlockDataSchema.parse(parseJson<FileBlockData>(content));
  },
};
