import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export type ReferenceStyle = "numeric" | "alphabetic" | "greek" | "abjad";

export interface ReferenceBlockData extends Record<string, unknown> {
  url?: string;
  text?: string;
  style: ReferenceStyle;
}

export const referenceBlockDataSchema = z
  .object({
    url: z.string().optional(),
    text: z.string().optional(),
    style: z.enum(["numeric", "alphabetic", "greek", "abjad"]),
  })
  .strict();

/* ─── Number formatters ─── */

function numberToAlphabetic(n: number): string {
  let result = "";
  while (n > 0) {
    n--;
    result = String.fromCharCode(97 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

const GREEK_LETTERS = "αβγδεζηθικλμνξοπρστυφχψω".split("");

function numberToGreek(n: number): string {
  let result = "";
  const base = GREEK_LETTERS.length;
  while (n > 0) {
    n--;
    result = GREEK_LETTERS[n % base] + result;
    n = Math.floor(n / base);
  }
  return result;
}

const ABJAD_LETTERS = "ابجدهوزحطیکلمنسعفصقرشتثخذضظغ".split("");

function numberToAbjad(n: number): string {
  let result = "";
  const base = ABJAD_LETTERS.length;
  while (n > 0) {
    n--;
    result = ABJAD_LETTERS[n % base] + result;
    n = Math.floor(n / base);
  }
  return result;
}

export function formatReferenceNumber(n: number, style: ReferenceStyle): string {
  switch (style) {
    case "numeric":
      return String(n);
    case "alphabetic":
      return numberToAlphabetic(n);
    case "greek":
      return numberToGreek(n);
    case "abjad":
      return numberToAbjad(n);
    default:
      return String(n);
  }
}

/* ─── Block definition ─── */

export const ReferenceBlock: BlockTypeDefinition<ReferenceBlockData> = {
  type: "reference",
  name: "Reference",
  icon: "REF",
  schema: referenceBlockDataSchema,
  defaultData: {
    style: "numeric",
  },
  config: {
    category: "basic",
    isVoid: true,
    canHaveChildren: false,
  },
  render(data) {
    const parsed = referenceBlockDataSchema.parse(data);
    // Document-level renderers merge reference superscripts inline with
    // preceding blocks. This fallback renders a standalone superscript.
    const num = formatReferenceNumber(1, parsed.style);
    const titleAttr = parsed.text ? ` title="${escapeHtml(parsed.text)}"` : "";
    if (parsed.url) {
      return `<sup class="pulse-reference"><a href="${escapeHtml(parsed.url)}"${titleAttr}>${num}</a></sup>`;
    }
    return `<sup class="pulse-reference"${titleAttr}>${num}</sup>`;
  },
  serialize(data) {
    return JSON.stringify(referenceBlockDataSchema.parse(data));
  },
  deserialize(content) {
    return referenceBlockDataSchema.parse(parseJson<ReferenceBlockData>(content));
  },
};
