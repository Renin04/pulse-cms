import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export type SpeechBubbleTone = "neutral" | "happy" | "angry" | "thinking";
export type SpeechBubbleAlign = "left" | "center" | "right";

export interface SpeechBubbleBlockData extends Record<string, unknown> {
  speaker: string;
  text: string;
  tone: SpeechBubbleTone;
  align: SpeechBubbleAlign;
}

export const speechBubbleBlockDataSchema = z
  .object({
    speaker: z.string(),
    text: z.string(),
    tone: z.enum(["neutral", "happy", "angry", "thinking"]),
    align: z.enum(["left", "center", "right"]),
  })
  .strict();

export const SpeechBubbleBlock: BlockTypeDefinition<SpeechBubbleBlockData> = {
  type: "speech-bubble",
  name: "Speech Bubble",
  icon: "BUBBLE",
  schema: speechBubbleBlockDataSchema,
  defaultData: {
    speaker: "Narrator",
    text: "We can now compose stories with comic-style dialogue.",
    tone: "neutral",
    align: "left",
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = speechBubbleBlockDataSchema.parse(data);
    return `<figure data-block-type="speech-bubble" data-tone="${parsed.tone}" data-align="${parsed.align}"><blockquote>${escapeHtml(
      parsed.text,
    )}</blockquote><figcaption>${escapeHtml(parsed.speaker)}</figcaption></figure>`;
  },
  serialize(data) {
    const parsed = speechBubbleBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return speechBubbleBlockDataSchema.parse(parseJson<SpeechBubbleBlockData>(content));
  },
};
