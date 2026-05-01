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
  })
  .strict();

function resolveAudioCaption(data: AudioBlockData): string | undefined {
  if (data.caption) {
    return data.caption;
  }

  if (data.artist) {
    return `${data.title} - ${data.artist}`;
  }

  return data.title || undefined;
}

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
  },
  config: {
    category: "media",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = audioBlockDataSchema.parse(data);
    const caption = resolveAudioCaption(parsed);
    const captionMarkup = caption
      ? `<figcaption>${escapeHtml(caption)}</figcaption>`
      : "";

    return `<figure data-block-type="audio"><audio controls preload="metadata" src="${escapeHtml(
      parsed.src,
    )}"${parsed.autoplay ? " autoplay" : ""}${
      parsed.loop ? " loop" : ""
    }></audio>${captionMarkup}</figure>`;
  },
  serialize(data) {
    const parsed = audioBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return audioBlockDataSchema.parse(parseJson<AudioBlockData>(content));
  },
};
