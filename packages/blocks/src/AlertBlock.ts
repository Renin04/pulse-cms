import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";
import { renderInlineMarkdown } from "./BlockquoteBlock";

export type AlertSeverity = "info" | "success" | "warning" | "error";

export interface AlertBlockData extends Record<string, unknown> {
  severity: AlertSeverity;
  title?: string;
  message: string;
  dismissible: boolean;
  isDismissed: boolean;
  align?: "left" | "center" | "right" | "justify";
}

export const alertBlockDataSchema = z
  .object({
    severity: z.enum(["info", "success", "warning", "error"]),
    title: z.string().optional(),
    message: z.string(),
    dismissible: z.boolean(),
    isDismissed: z.boolean(),
    align: z.enum(["left", "center", "right", "justify"]).optional(),
  })
  .superRefine((value, context) => {
    if (value.isDismissed && !value.dismissible) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Alert cannot be dismissed when dismissible is false",
        path: ["isDismissed"],
      });
    }
  });

export function dismissAlert(data: AlertBlockData): AlertBlockData {
  const parsed = alertBlockDataSchema.parse(data);
  if (!parsed.dismissible) {
    throw new Error("Alert is not dismissible");
  }

  return alertBlockDataSchema.parse({
    ...parsed,
    isDismissed: true,
  });
}

export function resetAlert(data: AlertBlockData): AlertBlockData {
  const parsed = alertBlockDataSchema.parse(data);
  return alertBlockDataSchema.parse({
    ...parsed,
    isDismissed: false,
  });
}

function severityIcon(severity: AlertSeverity): string {
  const icons: Record<AlertSeverity, string> = {
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  };
  return icons[severity];
}

export const AlertBlock: BlockTypeDefinition<AlertBlockData> = {
  type: "alert",
  name: "Alert",
  icon: "ALERT",
  schema: alertBlockDataSchema,
  defaultData: {
    severity: "info",
    title: "Alert",
    message: "Important status update.",
    dismissible: true,
    isDismissed: false,
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = alertBlockDataSchema.parse(data);

    if (parsed.isDismissed) {
      return '<div data-block-type="alert" data-dismissed="true" hidden></div>';
    }

    const alignAttr = parsed.align ? ` style="text-align:${escapeHtml(parsed.align)};"` : "";
    const iconSvg = severityIcon(parsed.severity);
    const titleMarkup = parsed.title
      ? `<span class="pulse-alert-title">${renderInlineMarkdown(parsed.title)}</span>`
      : "";
    const dismissMarkup = parsed.dismissible
      ? `<button type="button" class="pulse-alert-dismiss" aria-label="Dismiss alert" data-dismiss-alert><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`
      : "";

    return `<div class="pulse-alert pulse-alert-${parsed.severity}" data-block-type="alert" data-severity="${parsed.severity}" role="alert"${alignAttr}>
  <div class="pulse-alert-inner">
    <span class="pulse-alert-icon" aria-hidden="true">${iconSvg}</span>
    <div class="pulse-alert-content">
      ${titleMarkup}
      <div class="pulse-alert-message">${renderInlineMarkdown(parsed.message)}</div>
    </div>
    ${dismissMarkup}
  </div>
</div>`;
  },
  serialize(data) {
    const parsed = alertBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return alertBlockDataSchema.parse(parseJson<AlertBlockData>(content));
  },
};
