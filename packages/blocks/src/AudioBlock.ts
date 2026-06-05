import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

const ALLOWED_AUDIO_PROTOCOLS = new Set(["http:", "https:"]);

function hasAllowedAudioProtocol(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    return ALLOWED_AUDIO_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

export interface AudioBlockData extends Record<string, unknown> {
  src: string;
  title: string;
  artist?: string;
  caption?: string;
  autoplay: boolean;
  loop: boolean;
  coverUrl?: string;
  align?: "left" | "center" | "right" | "justify";
  captionAlign?: "left" | "center" | "right" | "justify";
  mediaAssetId?: string;
  fileSize?: number;
  linkUrl?: string;
}

export const audioBlockDataSchema = z
  .object({
    src: z.string().refine(hasAllowedAudioProtocol, {
      message: "Unsupported audio URL protocol",
    }),
    title: z.string(),
    artist: z.string().optional(),
    caption: z.string().optional(),
    autoplay: z.boolean(),
    loop: z.boolean(),
    coverUrl: z.string().optional(),
    align: z.enum(["left", "center", "right", "justify"]).optional(),
    captionAlign: z.enum(["left", "center", "right", "justify"]).optional(),
    mediaAssetId: z.string().optional(),
    fileSize: z.number().optional(),
    linkUrl: z.string().optional(),
  })
  .strict();

export const AudioBlock: BlockTypeDefinition<AudioBlockData> = {
  type: "audio",
  name: "Audio",
  icon: "AUDIO",
  schema: audioBlockDataSchema,
  defaultData: {
    src: "https://example.com/audio.mp3",
    title: "Audio clip",
    autoplay: false,
    loop: false,
    align: "center",
  },
  config: {
    category: "media",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = audioBlockDataSchema.parse(data);

    const hasCaption = Boolean(parsed.caption?.trim());
    const hasArtist = Boolean(parsed.artist?.trim());

    // Build the info line: title + artist
    const titleHtml = escapeHtml(parsed.title);
    const artistHtml = hasArtist ? escapeHtml(parsed.artist!) : "";

    // Caption is shown separately, never merged with artist
    const captionAlignStyle = parsed.captionAlign ? `text-align:${parsed.captionAlign};` : "";
    const captionHtml = hasCaption
      ? `<figcaption class="pulse-audio-caption"${captionAlignStyle ? ` style="${captionAlignStyle}"` : ""}>${escapeHtml(parsed.caption!)}</figcaption>`
      : "";

    const linkHtml = parsed.linkUrl?.trim()
      ? `<a href="${escapeHtml(parsed.linkUrl.trim())}" class="pulse-audio-link" target="_blank" rel="noopener noreferrer">${escapeHtml(parsed.title)}</a>`
      : "";

    // Waveform bars for visual flair
    const waveBars = Array.from({ length: 12 })
      .map(
        (_, i) =>
          `<span style="animation-delay:${(i * 0.08).toFixed(2)}s"></span>`,
      )
      .join("");

    const coverBg = parsed.coverUrl
      ? `background-image:url('${escapeHtml(parsed.coverUrl)}');`
      : "";

    // Alignment using margins on the figure
    const alignMargins: Record<string, string> = {
      left: "margin-left:0;margin-right:auto;",
      center: "margin-left:auto;margin-right:auto;",
      right: "margin-left:auto;margin-right:0;",
      justify: "margin-left:auto;margin-right:auto;",
    };
    const alignStyle = parsed.align ? alignMargins[parsed.align] || "" : "margin-left:auto;margin-right:auto;";
    const figureStyle = alignStyle ? ` style="${alignStyle}"` : "";

    return `<figure class="pulse-audio-player" data-block-type="audio" data-autoplay="${parsed.autoplay}" data-loop="${parsed.loop}"${figureStyle}>
  <div class="pulse-audio-card">
    <div class="pulse-audio-visual" style="${coverBg}">
      ${parsed.coverUrl ? "" : `<div class="pulse-audio-wave">${waveBars}</div>`}
    </div>
    <div class="pulse-audio-body">
      <div class="pulse-audio-meta">
        <div class="pulse-audio-title" title="${titleHtml}">${titleHtml}</div>
        ${hasArtist ? `<div class="pulse-audio-artist" title="${artistHtml}">${artistHtml}</div>` : ""}
      </div>
      <audio class="pulse-audio-element" controls preload="metadata" src="${escapeHtml(parsed.src)}"${parsed.autoplay ? " autoplay" : ""}${parsed.loop ? " loop" : ""}></audio>
      ${linkHtml ? `<div class="pulse-audio-link-wrap">${linkHtml}</div>` : ""}
    </div>
  </div>
  ${captionHtml}
</figure>`;
  },
  serialize(data) {
    const parsed = audioBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return audioBlockDataSchema.parse(parseJson<AudioBlockData>(content));
  },
};
