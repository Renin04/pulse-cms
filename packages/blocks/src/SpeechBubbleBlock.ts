import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson, sanitizeUrl } from "./types";
import { formatReferenceNumber, type ReferenceStyle } from "./ReferenceBlock";

export type SpeechBubbleTone = "neutral" | "happy" | "angry" | "thinking";
export type SpeechBubbleAlign = "left" | "center" | "right";

export interface SpeechBubbleBlockData extends Record<string, unknown> {
  speaker: string;
  text: string;
  tone: SpeechBubbleTone;
  align: SpeechBubbleAlign;
  title?: string;
  titleAlign?: SpeechBubbleAlign | "justify";
  contentAlign?: SpeechBubbleAlign | "justify";
  linkUrl?: string;
  linkTarget?: string;
  linkRel?: string;
}

export const speechBubbleBlockDataSchema = z
  .object({
    speaker: z.string(),
    text: z.string(),
    tone: z.enum(["neutral", "happy", "angry", "thinking"]),
    align: z.enum(["left", "center", "right"]),
    title: z.string().optional(),
    titleAlign: z.enum(["left", "center", "right", "justify"]).optional(),
    contentAlign: z.enum(["left", "center", "right", "justify"]).optional(),
    linkUrl: z.string().optional(),
    linkTarget: z.string().optional(),
    linkRel: z.string().optional(),
  })
  .strict();

function escapeAndBreaks(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

function renderInlineMarkdown(text: string): string {
  const regex = /\[([^\]]+)\]\(([^)]+)\)(?:\{([^}]*)\})?/g;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    result += escapeAndBreaks(text.slice(lastIndex, match.index));
    const label = match[1];
    const url = match[2];
    const attrs = match[3] || "";

    const safeUrl = sanitizeUrl(url);
    if (label === "ref") {
      const textMatch = attrs.match(/text="([^"]*)"/);
      const styleMatch = attrs.match(/style="([^"]*)"/);
      const targetMatch = attrs.match(/target="([^"]*)"/);
      const relMatch = attrs.match(/rel="([^"]*)"/);
      const refText = textMatch ? textMatch[1] : "";
      const style = (styleMatch ? styleMatch[1] : "numeric") as ReferenceStyle;
      const target = targetMatch ? targetMatch[1] : "";
      const rel = relMatch ? relMatch[1] : "";
      const num = formatReferenceNumber(1, style);
      const targetAttr = target ? ` target="${escapeHtml(target)}"` : "";
      const relAttr = rel ? ` rel="${escapeHtml(rel)}"` : "";
      if (safeUrl) {
        const supRef = `<sup class="pulse-reference"><a href="${escapeHtml(safeUrl)}"${targetAttr}${relAttr}>${num}</a></sup>`;
        if (refText) {
          result += `<span class="pulse-reference-group"><a href="${escapeHtml(safeUrl)}" class="pulse-reference-text"${targetAttr}${relAttr}>${escapeHtml(refText)}</a>${supRef}</span>`;
        } else {
          result += supRef;
        }
      } else {
        result += escapeHtml(match[0]);
      }
    } else {
      const relMatch = attrs.match(/rel="([^"]*)"/);
      const rel = relMatch ? relMatch[1] : "";
      const targetMatch = attrs.match(/target="([^"]*)"/);
      const target = targetMatch ? targetMatch[1] : "";
      const relAttr = rel ? ` rel="${escapeHtml(rel)}"` : "";
      const targetAttr = target ? ` target="${escapeHtml(target)}"` : "";
      if (safeUrl) {
        result += `<a href="${escapeHtml(safeUrl)}" class="pulse-inline-link"${relAttr}${targetAttr}>${escapeHtml(label)}</a>`;
      } else {
        result += escapeHtml(match[0]);
      }
    }
    lastIndex = match.index + match[0].length;
  }

  result += escapeAndBreaks(text.slice(lastIndex));
  return result;
}

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
    title: "",
    titleAlign: "left",
    contentAlign: "left",
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = speechBubbleBlockDataSchema.parse(data);

    const titleHtml = parsed.title
      ? `<div class="pulse-speech-bubble__title" style="text-align:${parsed.titleAlign || "left"}">${renderInlineMarkdown(parsed.title)}</div>`
      : "";

    const contentHtml = renderInlineMarkdown(parsed.text);

    return `<figure data-block-type="speech-bubble" data-tone="${parsed.tone}" class="pulse-speech-bubble pulse-speech-bubble--${parsed.tone} pulse-speech-bubble--align-${parsed.align}">${titleHtml}<div class="pulse-speech-bubble__body"><div class="pulse-speech-bubble__text" style="text-align:${parsed.contentAlign || "left"}">${contentHtml}</div><div class="pulse-speech-bubble__tail"></div></div><figcaption class="pulse-speech-bubble__speaker">${escapeHtml(parsed.speaker)}</figcaption></figure>`;
  },
  serialize(data) {
    const parsed = speechBubbleBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return speechBubbleBlockDataSchema.parse(parseJson<SpeechBubbleBlockData>(content));
  },
};
