import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";
import { renderInlineMarkdown } from "./BlockquoteBlock";
import {
  computeChangedTokenIndices,
  renderMath,
  tokenizeMath,
} from "./mathRenderer";
import type { MathAlign, MathCaptionAlign } from "./MathEquationBlock";

export interface SteppedEquationStep {
  id: string;
  /** TeX-subset math source for this step (see mathRenderer.ts). */
  latex: string;
  /** Optional per-step caption; falls back to the block caption. */
  caption?: string;
}

export interface SteppedEquationBlockData extends Record<string, unknown> {
  steps: SteppedEquationStep[];
  /** Block-level master switch for change highlighting (bug #134). */
  highlightChanges: boolean;
  align?: MathAlign;
  /** Shared caption shown for steps without their own caption. */
  caption?: string;
  captionAlign?: MathCaptionAlign;
}

const steppedEquationStepSchema = z
  .object({
    id: z.string(),
    latex: z.string(),
    caption: z.string().optional(),
  })
  .strict();

export const steppedEquationBlockDataSchema = z
  .object({
    steps: z.array(steppedEquationStepSchema).max(24),
    highlightChanges: z.boolean(),
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

function normalizeStep(raw: unknown, index: number): SteppedEquationStep | null {
  const record = asRecord(raw);
  if (!record) return null;
  const latex =
    typeof record.latex === "string"
      ? record.latex
      : typeof record.content === "string"
        ? record.content
        : "";
  if (!latex.trim()) return null;
  const rawId = record.id;
  const id =
    typeof rawId === "string" && rawId.length > 0 ? rawId : `step-legacy-${index + 1}`;
  const caption =
    typeof record.caption === "string" && record.caption.trim().length > 0
      ? record.caption
      : undefined;
  return { id, latex, ...(caption ? { caption } : {}) };
}

/**
 * Coerce arbitrary saved data into valid SteppedEquationBlockData:
 * legacy/mistyped steps are migrated or dropped, ids de-duplicated.
 */
export function normalizeSteppedEquationData(raw: unknown): SteppedEquationBlockData {
  const record = asRecord(raw) ?? {};
  const rawSteps = Array.isArray(record.steps) ? record.steps : [];

  const seenIds = new Set<string>();
  const steps: SteppedEquationStep[] = [];
  for (let index = 0; index < rawSteps.length && steps.length < 24; index += 1) {
    const step = normalizeStep(rawSteps[index], index);
    if (!step) continue;
    let id = step.id;
    let suffix = 2;
    while (seenIds.has(id)) {
      id = `${step.id}-${suffix}`;
      suffix += 1;
    }
    seenIds.add(id);
    steps.push({ ...step, id });
  }

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

  return steppedEquationBlockDataSchema.parse({
    steps,
    highlightChanges: record.highlightChanges !== false,
    ...(align ? { align } : {}),
    ...(caption ? { caption } : {}),
    ...(captionAlign ? { captionAlign } : {}),
  });
}

export function createSteppedEquationStepId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `step-${crypto.randomUUID()}`;
  }
  return `step-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function addSteppedEquationStep(
  data: SteppedEquationBlockData,
  step: Omit<SteppedEquationStep, "id"> & { id?: string },
): SteppedEquationBlockData {
  const parsed = normalizeSteppedEquationData(data);
  return steppedEquationBlockDataSchema.parse({
    ...parsed,
    steps: [...parsed.steps, { ...step, id: step.id ?? createSteppedEquationStepId() }],
  });
}

/**
 * Per-fragment opt-out from change highlighting (bug #134).
 *
 * Marker syntax (documented in the editor): wrap a fragment of a step's
 * source in `\nochange{…}` to always render it un-highlighted, even when it
 * differs from the previous step. `\change{…}` does the opposite (forces
 * highlight). The editor binds a bold-style keyboard shortcut
 * (Ctrl/Cmd+Shift+H) that toggles the `\nochange{…}` wrapper around the
 * current selection; this pure helper performs that toggle.
 *
 * Returns the new source plus the selection range covering the same
 * fragment (so repeated presses toggle wrap → unwrap → wrap).
 */
export function toggleNoChangeMarker(
  source: string,
  selectionStart: number,
  selectionEnd: number,
): { source: string; selectionStart: number; selectionEnd: number } {
  const MARKER = "\\nochange{";
  if (selectionStart >= selectionEnd || selectionStart < 0 || selectionEnd > source.length) {
    return { source, selectionStart, selectionEnd };
  }
  const before = source.slice(Math.max(0, selectionStart - MARKER.length), selectionStart);
  const after = source.slice(selectionEnd, selectionEnd + 1);
  if (before === MARKER && after === "}") {
    // Already wrapped — unwrap.
    const next = source.slice(0, selectionStart - MARKER.length) + source.slice(selectionStart, selectionEnd) + source.slice(selectionEnd + 1);
    return {
      source: next,
      selectionStart: selectionStart - MARKER.length,
      selectionEnd: selectionEnd - MARKER.length,
    };
  }
  const next = source.slice(0, selectionStart) + MARKER + source.slice(selectionStart, selectionEnd) + "}" + source.slice(selectionEnd);
  return {
    source: next,
    selectionStart: selectionStart + MARKER.length,
    selectionEnd: selectionEnd + MARKER.length,
  };
}

const CHEVRON_LEFT_ICON = `<svg class="pulse-stepmath__icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M10 3 5 8l5 5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CHEVRON_RIGHT_ICON = `<svg class="pulse-stepmath__icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m6 3 5 5-5 5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const SteppedEquationBlock: BlockTypeDefinition<SteppedEquationBlockData> = {
  type: "stepped-equation",
  name: "Stepped equation",
  icon: "STEPMATH",
  schema: steppedEquationBlockDataSchema,
  defaultData: {
    highlightChanges: true,
    align: "center",
    caption: "Solving for x",
    steps: [
      { id: "step-1", latex: "2x + 5 = 11" },
      { id: "step-2", latex: "2x = 11 - 5" },
      { id: "step-3", latex: "2x = 6" },
      { id: "step-4", latex: "x = 3" },
    ],
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = normalizeSteppedEquationData(data);
    const align = parsed.align ?? "center";
    const captionAlign = parsed.captionAlign ?? "center";
    const total = parsed.steps.length;
    const regionLabel = parsed.caption?.trim()
      ? `Stepped equation: ${parsed.caption.trim()}`
      : "Stepped equation";

    if (total === 0) {
      return (
        `<section class="pulse-stepmath pulse-stepmath--empty" data-block-type="stepped-equation" role="region" aria-label="${escapeHtml(regionLabel)}">` +
        `<p class="pulse-stepmath__empty">This stepped equation has no steps yet.</p>` +
        `</section>`
      );
    }

    const stepMarkup = parsed.steps
      .map((step, index) => {
        const isActive = index === 0;
        // SSR is deterministic: step 1 visible, hydration steps through.
        const changed =
          parsed.highlightChanges && index > 0
            ? computeChangedTokenIndices(
                tokenizeMath(parsed.steps[index - 1].latex),
                tokenizeMath(step.latex),
              )
            : undefined;
        const math = renderMath(step.latex, {
          displayMode: true,
          changed,
          highlight: parsed.highlightChanges,
        });
        const captionSource = step.caption?.trim() ? step.caption : parsed.caption;
        const caption = captionSource?.trim()
          ? `<p class="pulse-stepmath__caption" style="text-align: ${escapeHtml(captionAlign)};">${renderInlineMarkdown(captionSource)}</p>`
          : "";
        return (
          `<div class="pulse-stepmath__step" data-step-index="${index}" data-active="${String(isActive)}"${isActive ? "" : ' aria-hidden="true"'}>` +
          `<div class="pulse-stepmath__math">${math}</div>` +
          caption +
          `</div>`
        );
      })
      .join("");

    const dots = parsed.steps
      .map((step, index) => {
        const isActive = index === 0;
        return (
          `<button type="button" class="pulse-stepmath__dot" data-dot-index="${index}" data-active="${String(isActive)}"` +
          ` aria-label="Go to step ${index + 1}"${isActive ? ' aria-current="step"' : ""}></button>`
        );
      })
      .join("");

    const controls =
      `<footer class="pulse-stepmath__controls">` +
      `<button type="button" class="pulse-stepmath__nav pulse-stepmath__nav--prev" aria-label="Previous step" disabled>${CHEVRON_LEFT_ICON}</button>` +
      `<div class="pulse-stepmath__status">` +
      `<span class="pulse-stepmath__position" aria-live="polite">Step 1 of ${total}</span>` +
      `<span class="pulse-stepmath__dots" role="group" aria-label="Step picker">${dots}</span>` +
      `</div>` +
      `<button type="button" class="pulse-stepmath__nav pulse-stepmath__nav--next" aria-label="Next step"${total <= 1 ? " disabled" : ""}>${CHEVRON_RIGHT_ICON}</button>` +
      `</footer>`;

    const hint = parsed.highlightChanges
      ? `<p class="pulse-stepmath__hint" aria-hidden="true">Changed parts are highlighted</p>`
      : "";

    return (
      `<section class="pulse-stepmath" data-block-type="stepped-equation" data-highlight="${String(parsed.highlightChanges)}" data-align="${escapeHtml(align)}" role="region" aria-label="${escapeHtml(regionLabel)}">` +
      `<div class="pulse-stepmath__stage">${stepMarkup}</div>` +
      hint +
      controls +
      `</section>`
    );
  },
  serialize(data) {
    const parsed = normalizeSteppedEquationData(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return normalizeSteppedEquationData(parseJson<SteppedEquationBlockData>(content));
  },
};
