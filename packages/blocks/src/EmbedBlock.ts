import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

const ALLOWED_EMBED_PROTOCOLS = new Set(["http:", "https:"]);

function hasAllowedEmbedProtocol(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    return ALLOWED_EMBED_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

export type EmbedAspectRatio = "16:9" | "4:3" | "1:1" | "21:9";

export interface EmbedBlockData extends Record<string, unknown> {
  url: string;
  title: string;
  provider: string;
  aspectRatio: EmbedAspectRatio;
  allowFullscreen: boolean;
}

export const embedBlockDataSchema = z
  .object({
    url: z.string().refine(hasAllowedEmbedProtocol, {
      message: "Unsupported embed URL protocol",
    }),
    title: z.string(),
    provider: z.string(),
    aspectRatio: z.enum(["16:9", "4:3", "1:1", "21:9"]),
    allowFullscreen: z.boolean(),
  })
  .strict();

function ratioToPaddingTop(aspectRatio: EmbedAspectRatio): string {
  if (aspectRatio === "16:9") {
    return "56.25%";
  }

  if (aspectRatio === "4:3") {
    return "75%";
  }

  if (aspectRatio === "1:1") {
    return "100%";
  }

  return "42.86%";
}

function getProviderInitials(provider: string): string {
  const p = provider.toLowerCase();
  if (p.includes('youtube')) return 'YT';
  if (p.includes('vimeo')) return 'VM';
  if (p.includes('spotify')) return 'SF';
  if (p.includes('soundcloud')) return 'SC';
  if (p.includes('twitter') || p.includes('x')) return 'X';
  if (p.includes('instagram')) return 'IG';
  if (p.includes('facebook') || p.includes('meta')) return 'FB';
  if (p.includes('tiktok')) return 'TT';
  if (p.includes('twitch')) return 'TV';
  if (p.includes('figma')) return 'FG';
  if (p.includes('codepen')) return 'CP';
  if (p.includes('github')) return 'GH';
  if (p.includes('google')) return 'GO';
  if (p.includes('apple')) return 'AP';
  if (p.includes('slideshare') || p.includes('slide')) return 'SL';
  if (p.includes('pdf')) return 'PDF';
  return provider.slice(0, 2).toUpperCase() || 'EM';
}

export const EmbedBlock: BlockTypeDefinition<EmbedBlockData> = {
  type: "embed",
  name: "Embed",
  icon: "EMBED",
  schema: embedBlockDataSchema,
  defaultData: {
    url: "https://example.com/embed",
    title: "Embedded content",
    provider: "generic",
    aspectRatio: "16:9",
    allowFullscreen: true,
  },
  config: {
    category: "advanced",
    isVoid: true,
    canHaveChildren: false,
  },
  render(data) {
    const parsed = embedBlockDataSchema.parse(data);
    const paddingTop = ratioToPaddingTop(parsed.aspectRatio);
    const allowFullscreen = parsed.allowFullscreen ? " allowfullscreen" : "";
    const initials = getProviderInitials(parsed.provider);
    const safeProvider = escapeHtml(parsed.provider);
    const safeTitle = escapeHtml(parsed.title);
    const safeUrl = escapeHtml(parsed.url);

    return `<figure class="pulse-embed-card" data-block-type="embed" data-provider="${safeProvider}">
  <div class="pulse-embed-header">
    <div class="pulse-embed-initials" aria-hidden="true">${escapeHtml(initials)}</div>
    <div class="pulse-embed-meta">
      <span class="pulse-embed-provider">${safeProvider}</span>
      <span class="pulse-embed-title">${safeTitle}</span>
    </div>
  </div>
  <div class="pulse-embed-frame" style="position:relative;width:100%;padding-top:${paddingTop};">
    <iframe src="${safeUrl}" title="${safeTitle}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-popups"${allowFullscreen} style="position:absolute;inset:0;width:100%;height:100%;border:0;display:block;"></iframe>
    <div class="pulse-embed-placeholder">
      <p>Loading ${safeProvider} content</p>
      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Open directly</a>
    </div>
  </div>
</figure>`;
  },
  serialize(data) {
    const parsed = embedBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return embedBlockDataSchema.parse(parseJson<EmbedBlockData>(content));
  },
};
