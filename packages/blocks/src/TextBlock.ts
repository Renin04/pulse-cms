import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson, sanitizeUrl } from "./types";

export interface TextBlockMarks {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  code: boolean;
}

export type TextAlignment = "left" | "center" | "right" | "justify";

export interface TextBlockData extends Record<string, unknown> {
  text: string;
  marks: TextBlockMarks;
  align?: TextAlignment;
}

export const textBlockDataSchema = z
  .object({
    text: z.string(),
    marks: z
      .object({
        bold: z.boolean(),
        italic: z.boolean(),
        underline: z.boolean(),
        code: z.boolean(),
      })
      .strict(),
    align: z.enum(["left", "center", "right", "justify"]).optional(),
  })
  .strict();

function escapeAndBreaks(text: string): string {
  return escapeHtml(text).replaceAll("\n", "<br />");
}

function renderInlineLinks(text: string): string {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)(?:\{rel="([^"]*)"\})?/g;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    result += escapeAndBreaks(text.slice(lastIndex, match.index));
    const relAttr = match[3] ? ` rel="${escapeHtml(match[3])}"` : "";
    const safeUrl = sanitizeUrl(match[2]);
    if (safeUrl) {
      result += `<a href="${escapeHtml(safeUrl)}" class="pulse-inline-link"${relAttr}>${escapeHtml(match[1])}</a>`;
    } else {
      result += escapeAndBreaks(match[0]);
    }
    lastIndex = match.index + match[0].length;
  }

  result += escapeAndBreaks(text.slice(lastIndex));
  return result;
}

function applyMarks(text: string, marks: TextBlockMarks): string {
  let output = renderInlineLinks(text);

  if (marks.code) {
    output = `<code>${output}</code>`;
  }

  if (marks.bold) {
    output = `<strong>${output}</strong>`;
  }

  if (marks.italic) {
    output = `<em>${output}</em>`;
  }

  if (marks.underline) {
    output = `<u>${output}</u>`;
  }

  return output;
}

export const TextBlock: BlockTypeDefinition<TextBlockData> = {
  type: "text",
  name: "Text",
  icon: "T",
  schema: textBlockDataSchema,
  defaultData: {
    text: "",
    marks: {
      bold: false,
      italic: false,
      underline: false,
      code: false,
    },
    align: "left",
  },
  config: {
    category: "basic",
    isInline: false,
    canHaveChildren: false,
  },
  render(data) {
    const parsed = textBlockDataSchema.parse(data);
    const align = parsed.align ?? "left";
    const alignAttr = align === "left" ? "" : ` style="text-align: ${align};"`;
    return `<p data-block-type="text"${alignAttr}>${applyMarks(parsed.text, parsed.marks)}</p>`;
  },
  serialize(data) {
    const parsed = textBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return textBlockDataSchema.parse(parseJson<TextBlockData>(content));
  },
};
