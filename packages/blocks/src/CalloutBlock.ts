import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";
import { renderInlineMarkdown } from "./BlockquoteBlock";

export type CalloutVariant = "info" | "tip" | "warning" | "success" | "note";

export interface CalloutBlockData extends Record<string, unknown> {
  variant: CalloutVariant;
  title?: string;
  body: string;
  align?: "left" | "center" | "right" | "justify";
}

export const calloutBlockDataSchema = z.object({
  variant: z.enum(["info", "tip", "warning", "success", "note"]),
  title: z.string().optional(),
  body: z.string(),
  align: z.enum(["left", "center", "right", "justify"]).optional(),
});

export function updateCallout(
  data: CalloutBlockData,
  patch: Partial<CalloutBlockData>,
): CalloutBlockData {
  const parsed = calloutBlockDataSchema.parse(data);
  return calloutBlockDataSchema.parse({
    ...parsed,
    ...patch,
  });
}

function variantIcon(variant: CalloutVariant): string {
  const icons: Record<CalloutVariant, string> = {
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    tip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M12 12v.01"/><path d="M12 21a9 9 0 0 0 9-9c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9z"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    note: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  };
  return icons[variant];
}

function variantLabel(variant: CalloutVariant): string {
  const labels: Record<CalloutVariant, string> = {
    info: "Info",
    tip: "Tip",
    warning: "Warning",
    success: "Success",
    note: "Note",
  };
  return labels[variant];
}

export const CalloutBlock: BlockTypeDefinition<CalloutBlockData> = {
  type: "callout",
  name: "Callout",
  icon: "CALLOUT",
  schema: calloutBlockDataSchema,
  defaultData: {
    variant: "info",
    title: "Callout",
    body: "Highlight important context for readers.",
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = calloutBlockDataSchema.parse(data);
    const alignAttr = parsed.align ? ` style="text-align:${escapeHtml(parsed.align)};"` : "";
    const iconSvg = variantIcon(parsed.variant);
    const label = variantLabel(parsed.variant);
    const titleMarkup = parsed.title
      ? `<span class="pulse-callout-title">${renderInlineMarkdown(parsed.title)}</span>`
      : "";

    return `<aside class="pulse-callout pulse-callout-${parsed.variant}" data-block-type="callout" data-variant="${parsed.variant}"${alignAttr}>
  <div class="pulse-callout-header">
    <span class="pulse-callout-icon" aria-hidden="true">${iconSvg}</span>
    <span class="pulse-callout-label">${label}</span>
  </div>
  ${titleMarkup}
  <div class="pulse-callout-body">${renderInlineMarkdown(parsed.body)}</div>
</aside>`;
  },
  serialize(data) {
    const parsed = calloutBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return calloutBlockDataSchema.parse(parseJson<CalloutBlockData>(content));
  },
};
