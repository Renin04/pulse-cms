import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

const ALLOWED_VIDEO_PROTOCOLS = new Set(["http:", "https:"]);

function hasAllowedVideoProtocol(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    return ALLOWED_VIDEO_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

function appendVideoParams(
  url: string,
  options: {
    autoplay: boolean;
    startAtSeconds: number;
  },
): string {
  try {
    const parsedUrl = new URL(url);
    if (options.autoplay) {
      parsedUrl.searchParams.set("autoplay", "1");
    }
    if (options.startAtSeconds > 0) {
      parsedUrl.searchParams.set("start", String(options.startAtSeconds));
    }
    return parsedUrl.toString();
  } catch {
    return url;
  }
}

export type VideoProvider = "youtube" | "vimeo" | "html5";

export interface VideoBlockData extends Record<string, unknown> {
  url: string;
  provider: VideoProvider;
  title: string;
  caption?: string;
  autoplay: boolean;
  startAtSeconds: number;
}

export const videoBlockDataSchema = z
  .object({
    url: z.string().refine(hasAllowedVideoProtocol, {
      message: "Unsupported video URL protocol",
    }),
    provider: z.enum(["youtube", "vimeo", "html5"]),
    title: z.string(),
    caption: z.string().optional(),
    autoplay: z.boolean(),
    startAtSeconds: z.number().int().min(0),
  })
  .strict();

export const VideoBlock: BlockTypeDefinition<VideoBlockData> = {
  type: "video",
  name: "Video",
  icon: "VIDEO",
  schema: videoBlockDataSchema,
  defaultData: {
    url: "https://example.com/video.mp4",
    provider: "html5",
    title: "Video",
    autoplay: false,
    startAtSeconds: 0,
  },
  config: {
    category: "media",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = videoBlockDataSchema.parse(data);
    const mediaUrl = appendVideoParams(parsed.url, {
      autoplay: parsed.autoplay,
      startAtSeconds: parsed.startAtSeconds,
    });
    const captionMarkup = parsed.caption
      ? `<figcaption>${escapeHtml(parsed.caption)}</figcaption>`
      : "";

    if (parsed.provider === "html5") {
      return `<figure data-block-type="video" data-provider="${parsed.provider}"><video src="${escapeHtml(
        mediaUrl,
      )}" title="${escapeHtml(parsed.title)}" controls preload="metadata"${
        parsed.autoplay ? " autoplay muted" : ""
      }></video>${captionMarkup}</figure>`;
    }

    return `<figure data-block-type="video" data-provider="${parsed.provider}"><iframe src="${escapeHtml(
      mediaUrl,
    )}" title="${escapeHtml(
      parsed.title,
    )}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>${captionMarkup}</figure>`;
  },
  serialize(data) {
    const parsed = videoBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return videoBlockDataSchema.parse(parseJson<VideoBlockData>(content));
  },
};
