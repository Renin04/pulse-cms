import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";
import { renderInlineMarkdown } from "./BlockquoteBlock";

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
  enablePreview?: boolean;
  descriptionAlign?: "left" | "center" | "right" | "justify";
  linkUrl?: string;
  align?: "left" | "center" | "right" | "justify";
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
    enablePreview: z.boolean().optional(),
    descriptionAlign: z.enum(["left", "center", "right", "justify"]).optional(),
    linkUrl: z.string().optional(),
    align: z.enum(["left", "center", "right", "justify"]).optional(),
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

function formatMimeType(mimeType?: string): string {
  if (!mimeType) return "";
  const map: Record<string, string> = {
    "application/pdf": "PDF",
    "application/msword": "Word",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
    "application/vnd.ms-excel": "Excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
    "application/vnd.ms-powerpoint": "PowerPoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint",
    "application/zip": "Archive",
    "application/x-rar-compressed": "Archive",
    "application/x-7z-compressed": "Archive",
    "application/gzip": "Archive",
    "application/x-tar": "Archive",
  };
  if (map[mimeType]) return map[mimeType];
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("text/")) return "Text";
  // Strip application/ prefix as fallback
  return mimeType.replace(/^application\//, "");
}

function getFileIconSvg(mimeType?: string, name?: string): string {
  const ext = name?.split('.').pop()?.toLowerCase() || '';
  const m = mimeType || '';

  // PDF
  if (m === 'application/pdf' || ext === 'pdf') {
    return `<svg class="pulse-file-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6M9 17h3"/></svg>`;
  }
  // Word / Documents
  if (m.includes('word') || m.includes('document') || ext === 'doc' || ext === 'docx' || ext === 'odt' || ext === 'rtf') {
    return `<svg class="pulse-file-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
  }
  // Excel / Spreadsheets
  if (m.includes('excel') || m.includes('sheet') || ext === 'xls' || ext === 'xlsx' || ext === 'csv' || ext === 'ods') {
    return `<svg class="pulse-file-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2v2H8zm0 4h2v2H8zm4-4h2v2h-2zm0 4h2v2h-2z"/></svg>`;
  }
  // PowerPoint / Presentations
  if (m.includes('powerpoint') || m.includes('presentation') || ext === 'ppt' || ext === 'pptx' || ext === 'odp') {
    return `<svg class="pulse-file-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="12" cy="14" r="3"/><path d="M12 11v-1"/></svg>`;
  }
  // Archives
  if (m.includes('zip') || m.includes('compressed') || m.includes('archive') || ext === 'zip' || ext === 'rar' || ext === '7z' || ext === 'tar' || ext === 'gz') {
    return `<svg class="pulse-file-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>`;
  }
  // Images
  if (m.startsWith('image/') || ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif' || ext === 'webp' || ext === 'svg') {
    return `<svg class="pulse-file-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`;
  }
  // Audio
  if (m.startsWith('audio/') || ext === 'mp3' || ext === 'wav' || ext === 'ogg' || ext === 'flac' || ext === 'm4a') {
    return `<svg class="pulse-file-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
  }
  // Video
  if (m.startsWith('video/') || ext === 'mp4' || ext === 'mov' || ext === 'avi' || ext === 'mkv' || ext === 'webm') {
    return `<svg class="pulse-file-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="2.18"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`;
  }
  // Code / Text
  if (m.includes('text') || m.includes('json') || m.includes('javascript') || m.includes('html') || ext === 'txt' || ext === 'json' || ext === 'js' || ext === 'ts' || ext === 'html' || ext === 'css' || ext === 'xml') {
    return `<svg class="pulse-file-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
  }
  // Generic
  return `<svg class="pulse-file-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
}

function getPreviewUrl(url: string, mimeType?: string): string | null {
  const m = mimeType || '';
  // Direct iframe for PDFs
  if (m === 'application/pdf') {
    return url;
  }
  // Google Docs viewer for Office docs
  if (m.includes('word') || m.includes('document') || m.includes('excel') || m.includes('sheet') || m.includes('powerpoint') || m.includes('presentation')) {
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
  }
  // Images can be previewed directly
  if (m.startsWith('image/')) {
    return url;
  }
  // Text files
  if (m.startsWith('text/')) {
    return url;
  }
  return null;
}

function canPreview(mimeType?: string): boolean {
  const m = mimeType || '';
  return m === 'application/pdf' ||
    m.startsWith('image/') ||
    m.startsWith('text/') ||
    m.includes('word') ||
    m.includes('document') ||
    m.includes('excel') ||
    m.includes('sheet') ||
    m.includes('powerpoint') ||
    m.includes('presentation');
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

    const descAlign = parsed.descriptionAlign || "left";

    // Backward-compatible align support
    const alignMargins: Record<string, string> = {
      left: "margin-left:0;margin-right:auto;",
      center: "margin-left:auto;margin-right:auto;",
      right: "margin-left:auto;margin-right:0;",
      justify: "margin-left:auto;margin-right:auto;",
    };
    const alignStyle = parsed.align ? alignMargins[parsed.align] || "" : "";

    const iconSvg = getFileIconSvg(parsed.mimeType, parsed.name);
    const sizeText = typeof parsed.sizeBytes === "number" ? formatFileSize(parsed.sizeBytes) : "";
    const typeLabel = formatMimeType(parsed.mimeType);
    const extText = parsed.name?.split('.').pop()?.toUpperCase() || "FILE";

    const target = parsed.openInNewTab ? ' target="_blank"' : "";
    const rel = parsed.openInNewTab ? ' rel="noopener noreferrer"' : "";

    // Description now supports inline markdown (links & references)
    const descriptionMarkup = parsed.description
      ? `<p class="pulse-file-description" style="text-align:${descAlign};">${renderInlineMarkdown(parsed.description)}</p>`
      : "";

    const linkMarkup = parsed.linkUrl?.trim()
      ? `<a href="${escapeHtml(parsed.linkUrl.trim())}" class="pulse-file-source-link" target="_blank" rel="noopener noreferrer">View source</a>`
      : "";

    // Preview section
    let previewMarkup = "";
    if (parsed.enablePreview && canPreview(parsed.mimeType)) {
      const previewUrl = getPreviewUrl(parsed.url, parsed.mimeType);
      if (previewUrl) {
        const isImage = parsed.mimeType?.startsWith('image/');
        if (isImage) {
          previewMarkup = `<div class="pulse-file-preview"><img src="${escapeHtml(previewUrl)}" alt="${escapeHtml(parsed.name)}" loading="lazy" /></div>`;
        } else {
          const isExternalPreview = previewUrl.startsWith('https://');
          const fallbackNote = isExternalPreview
            ? `<div class="pulse-file-preview-fallback"><div class="pulse-file-preview-fallback-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><p>Preview loading… If blocked, <a href="${escapeHtml(parsed.url)}" target="_blank" rel="noopener noreferrer">open file directly</a></p></div>`
            : "";
          previewMarkup = `<div class="pulse-file-preview"><iframe src="${escapeHtml(previewUrl)}" title="${escapeHtml(parsed.name)}" loading="lazy" sandbox="allow-scripts allow-same-origin"></iframe>${fallbackNote}</div>`;
        }
      }
    }

    return `<figure class="pulse-file-card" data-block-type="file" style="${alignStyle}">
  ${previewMarkup}
  <div class="pulse-file-body">
    <div class="pulse-file-icon">${iconSvg}<span class="pulse-file-ext">${escapeHtml(extText)}</span></div>
    <div class="pulse-file-info">
      <div class="pulse-file-name" title="${escapeHtml(parsed.name)}">${escapeHtml(parsed.name)}</div>
      ${sizeText || typeLabel ? `<div class="pulse-file-meta">${sizeText ? escapeHtml(sizeText) : ""}${sizeText && typeLabel ? ` · ` : ""}${typeLabel ? escapeHtml(typeLabel) : ""}</div>` : ""}
    </div>
    <a class="pulse-file-download" href="${escapeHtml(parsed.url)}" download${target}${rel}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      <span>Download</span>
    </a>
  </div>
  ${linkMarkup}
  ${descriptionMarkup}
</figure>`;
  },
  serialize(data) {
    const parsed = fileBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return fileBlockDataSchema.parse(parseJson<FileBlockData>(content));
  },
};
