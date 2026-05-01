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

    return `<div data-block-type="embed" data-provider="${escapeHtml(
      parsed.provider,
    )}" style="position:relative;width:100%;padding-top:${paddingTop};"><iframe src="${escapeHtml(
      parsed.url,
    )}" title="${escapeHtml(
      parsed.title,
    )}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-popups"${allowFullscreen} style="position:absolute;inset:0;width:100%;height:100%;border:0;"></iframe></div>`;
  },
  serialize(data) {
    const parsed = embedBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return embedBlockDataSchema.parse(parseJson<EmbedBlockData>(content));
  },
};
