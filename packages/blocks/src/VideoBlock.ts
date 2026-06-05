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

function _parseTimeToSeconds(value: string): number {
  const parts = value.split(":").map((p) => parseInt(p.trim(), 10));
  if (parts.some((p) => Number.isNaN(p) || p < 0)) return 0;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

function _formatSecondsToTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getYouTubeVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

function getVimeoVideoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

function buildMediaUrl(
  url: string,
  provider: VideoProvider,
  options: {
    autoplay: boolean;
    startAtSeconds: number;
    privacyMode: boolean;
  },
): string {
  try {
    if (provider === "youtube") {
      const vid = getYouTubeVideoId(url);
      if (!vid) return url;
      const domain = options.privacyMode ? "www.youtube-nocookie.com" : "www.youtube.com";
      const embedUrl = new URL(`https://${domain}/embed/${vid}`);
      if (options.autoplay) {
        embedUrl.searchParams.set("autoplay", "1");
      }
      if (options.startAtSeconds > 0) {
        embedUrl.searchParams.set("start", String(options.startAtSeconds));
      }
      return embedUrl.toString();
    }

    if (provider === "vimeo") {
      const vid = getVimeoVideoId(url);
      if (!vid) return url;
      const embedUrl = new URL(`https://player.vimeo.com/video/${vid}`);
      if (options.autoplay) {
        embedUrl.searchParams.set("autoplay", "1");
      }
      let result = embedUrl.toString();
      if (options.startAtSeconds > 0) {
        result += `#t=${options.startAtSeconds}`;
      }
      return result;
    }

    // HTML5 / direct URL
    return url;
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
  privacyMode?: boolean;
  quality?: "auto" | "720p" | "1080p" | "4k";
  poster?: string;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
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
    privacyMode: z.boolean().optional(),
    quality: z.enum(["auto", "720p", "1080p", "4k"]).optional(),
    poster: z.string().optional(),
    loop: z.boolean().optional(),
    muted: z.boolean().optional(),
    controls: z.boolean().optional(),
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
    privacyMode: true,
    quality: "auto",
    loop: false,
    muted: false,
    controls: true,
  },
  config: { category: "media", canHaveChildren: false },
  render(data) {
    const parsed = videoBlockDataSchema.parse(data);
    const privacyMode = parsed.privacyMode ?? true;
    const quality = parsed.quality ?? "auto";
    const loop = parsed.loop ?? false;
    const muted = parsed.muted ?? false;
    const controls = parsed.controls ?? true;

    const mediaUrl = buildMediaUrl(parsed.url, parsed.provider, {
      autoplay: parsed.autoplay,
      startAtSeconds: parsed.startAtSeconds,
      privacyMode,
    });

    const captionMarkup = parsed.caption
      ? `<div class="pulse-video-caption"><span>${escapeHtml(
          parsed.caption,
        )}</span></div>`
      : "";

    const qualityBadge =
      parsed.provider === "html5" && quality !== "auto"
        ? `<span class="pulse-video-quality">${escapeHtml(
            quality,
          )}</span>`
        : "";

    const providerColors: Record<VideoProvider, string> = {
      youtube: "#FF0000",
      vimeo: "#1AB7EA",
      html5: "var(--pulse-red)",
    };

    const providerIconColor = providerColors[parsed.provider];

    const headerBar =
      parsed.provider !== "html5"
        ? `<div class="pulse-video-header" style="--provider-color:${providerIconColor}"><span class="pulse-video-header-dot"></span><span class="pulse-video-header-dot"></span><span class="pulse-video-header-dot"></span><span class="pulse-video-header-label">${escapeHtml(parsed.provider)}</span></div>`
        : "";

    const startTimeHandler =
      parsed.provider === "html5" && parsed.startAtSeconds > 0
        ? ` onloadedmetadata="this.currentTime=${parsed.startAtSeconds}"`
        : "";

    const playbackClassHandler =
      parsed.provider === "html5"
        ? ` onplay="this.closest('.pulse-video-card')?.classList.add('is-playing')" onpause="this.closest('.pulse-video-card')?.classList.remove('is-playing')" onended="this.closest('.pulse-video-card')?.classList.remove('is-playing')"`
        : "";

    const commonAttrs = `title="${escapeHtml(
      parsed.title,
    )}" loading="lazy"`;

    if (parsed.provider === "html5") {
      const posterAttr = parsed.poster
        ? ` poster="${escapeHtml(parsed.poster)}"`
        : "";
      const loopAttr = loop ? " loop" : "";
      const mutedAttr = muted || parsed.autoplay ? " muted" : "";
      const controlsAttr = controls ? " controls" : "";
      const autoplayAttr = parsed.autoplay ? " autoplay" : "";

      return `<div class="pulse-video-card" data-block-type="video" data-provider="${parsed.provider}" data-video-url="${escapeHtml(mediaUrl)}">
        ${headerBar}
        <div class="pulse-video-aspect">
          <video src="${escapeHtml(mediaUrl)}"${commonAttrs} preload="metadata"${posterAttr}${controlsAttr}${loopAttr}${mutedAttr}${autoplayAttr}${startTimeHandler}${playbackClassHandler}></video>
          <div class="pulse-video-play-overlay">
            <div class="pulse-video-play-btn"></div>
          </div>
          ${qualityBadge}
          ${captionMarkup}
        </div>
      </div>`;
    }

    // Click-to-load for YouTube/Vimeo to avoid localhost blocking and improve privacy
    const embedId = 'v_' + Math.random().toString(36).slice(2, 9);
    const clickToLoadHtml = parsed.provider === 'youtube'
      ? (() => {
          const vid = getYouTubeVideoId(parsed.url);
          const thumb = vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : '';
          return `<div id="${embedId}" class="pulse-video-clickload" data-provider="youtube" data-src="${escapeHtml(mediaUrl)}" data-thumb="${escapeHtml(thumb)}" data-title="${escapeHtml(parsed.title)}">
            <img src="${escapeHtml(thumb)}" alt="${escapeHtml(parsed.title)}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:none;display:block;" />
            <div class="pulse-video-play-overlay">
              <div class="pulse-video-play-btn"></div>
            </div>
            <div class="pulse-video-clickload-overlay">
              <span class="pulse-video-clickload-text">Click to load video</span>
              <a href="${escapeHtml(parsed.url)}" target="_blank" rel="noopener noreferrer" class="pulse-video-external-link">Watch on ${escapeHtml(parsed.provider === 'youtube' ? 'YouTube' : 'Vimeo')}</a>
            </div>
            ${captionMarkup}
          </div>`;
        })()
      : `<div id="${embedId}" class="pulse-video-clickload" data-provider="${parsed.provider}" data-src="${escapeHtml(mediaUrl)}" data-title="${escapeHtml(parsed.title)}">
          <div class="pulse-video-play-overlay">
            <div class="pulse-video-play-btn"></div>
          </div>
          <div class="pulse-video-clickload-overlay">
            <span class="pulse-video-clickload-text">Click to load video</span>
          </div>
          ${captionMarkup}
        </div>`;

    return `<div class="pulse-video-card" data-block-type="video" data-provider="${parsed.provider}" data-video-url="${escapeHtml(mediaUrl)}">
      ${headerBar}
      <div class="pulse-video-aspect">
        ${clickToLoadHtml}
      </div>
    </div>`;
  },
  serialize(data) {
    const parsed = videoBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return videoBlockDataSchema.parse(parseJson<VideoBlockData>(content));
  },
};
