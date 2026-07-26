import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";
import { renderInlineMarkdown } from "./BlockquoteBlock";
import { renderMath } from "./mathRenderer";
import type { MathAlign, MathCaptionAlign } from "./MathEquationBlock";

export interface AutoSolveEquationBlockData extends Record<string, unknown> {
  /** Equation source solved client-side on Run (see mathSolver.ts scope). */
  equation: string;
  align?: MathAlign;
  /** Caption below the stage; supports inline links/refs (quote pattern). */
  caption?: string;
  captionAlign?: MathCaptionAlign;
}

export const autoSolveEquationBlockDataSchema = z
  .object({
    equation: z.string(),
    align: z.enum(["left", "center", "right"]).optional(),
    caption: z.string().optional(),
    captionAlign: z.enum(["left", "center", "right", "justify"]).optional(),
  })
  .strict();

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

const MATH_ALIGNS: readonly MathAlign[] = ["left", "center", "right"];
const CAPTION_ALIGNS: readonly MathCaptionAlign[] = ["left", "center", "right", "justify"];

/** Tolerant coercion so mistyped/legacy saves keep rendering. */
export function normalizeAutoSolveEquationData(raw: unknown): AutoSolveEquationBlockData {
  const record = asRecord(raw) ?? {};

  const equation =
    typeof record.equation === "string"
      ? record.equation
      : typeof record.latex === "string"
        ? record.latex
        : "";

  const align = MATH_ALIGNS.includes(record.align as MathAlign)
    ? (record.align as MathAlign)
    : undefined;
  const captionAlign = CAPTION_ALIGNS.includes(record.captionAlign as MathCaptionAlign)
    ? (record.captionAlign as MathCaptionAlign)
    : undefined;
  const caption =
    typeof record.caption === "string" && record.caption.trim().length > 0
      ? record.caption
      : undefined;

  return autoSolveEquationBlockDataSchema.parse({
    equation,
    ...(align ? { align } : {}),
    ...(caption ? { caption } : {}),
    ...(captionAlign ? { captionAlign } : {}),
  });
}

const PLAY_ICON = `<svg class="pulse-autosolve__icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 3.2v9.6c0 .6.7 1 1.2.7l7-4.8c.5-.3.5-1 0-1.4l-7-4.8c-.5-.3-1.2.1-1.2.7Z" fill="currentColor"/></svg>`;
const RESET_ICON = `<svg class="pulse-autosolve__icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M13.8 8A5.8 5.8 0 1 1 8 2.2c1.6 0 3.1.6 4.2 1.8l1.6 1.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.8 2.2v3.5h-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const AutoSolveEquationBlock: BlockTypeDefinition<AutoSolveEquationBlockData> = {
  type: "auto-solve-equation",
  name: "Auto-solve equation",
  icon: "AUTOSOLVE",
  schema: autoSolveEquationBlockDataSchema,
  defaultData: {
    equation: "2(x + 3) = 10",
    align: "center",
    caption: "Press Run — solved locally, step by step",
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = normalizeAutoSolveEquationData(data);
    const align = parsed.align ?? "center";
    const captionAlign = parsed.captionAlign ?? "center";
    const math = renderMath(parsed.equation, { displayMode: true });
    const regionLabel = parsed.caption?.trim()
      ? `Auto-solve equation: ${parsed.caption.trim()}`
      : "Auto-solve equation";

    const caption = parsed.caption?.trim()
      ? `<p class="pulse-autosolve__caption" style="text-align: ${escapeHtml(captionAlign)};">${renderInlineMarkdown(parsed.caption)}</p>`
      : "";

    return (
      `<section class="pulse-autosolve" data-block-type="auto-solve-equation" data-align="${escapeHtml(align)}" data-equation="${escapeHtml(parsed.equation)}" data-state="idle" role="region" aria-label="${escapeHtml(regionLabel)}">` +
      `<div class="pulse-autosolve__stage">${math}</div>` +
      caption +
      `<div class="pulse-autosolve__controls">` +
      `<button type="button" class="pulse-autosolve__run">${PLAY_ICON}<span>Solve step by step</span></button>` +
      `<button type="button" class="pulse-autosolve__reset" hidden>${RESET_ICON}<span>Reset</span></button>` +
      `</div>` +
      `<div class="pulse-autosolve__steps" aria-live="polite"></div>` +
      `</section>`
    );
  },
  serialize(data) {
    const parsed = normalizeAutoSolveEquationData(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return normalizeAutoSolveEquationData(parseJson<AutoSolveEquationBlockData>(content));
  },
};
