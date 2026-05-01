import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export type AlertSeverity = "info" | "success" | "warning" | "error";

export interface AlertBlockData extends Record<string, unknown> {
  severity: AlertSeverity;
  title?: string;
  message: string;
  dismissible: boolean;
  isDismissed: boolean;
}

export const alertBlockDataSchema = z
  .object({
    severity: z.enum(["info", "success", "warning", "error"]),
    title: z.string().optional(),
    message: z.string(),
    dismissible: z.boolean(),
    isDismissed: z.boolean(),
  })
  .strict()
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

    const titleMarkup = parsed.title
      ? `<strong>${escapeHtml(parsed.title)}</strong>`
      : "";
    const dismissMarkup = parsed.dismissible
      ? '<button type="button" aria-label="Dismiss alert">×</button>'
      : "";

    return `<div data-block-type="alert" data-severity="${parsed.severity}" role="alert">${titleMarkup}<p>${escapeHtml(
      parsed.message,
    )}</p>${dismissMarkup}</div>`;
  },
  serialize(data) {
    const parsed = alertBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return alertBlockDataSchema.parse(parseJson<AlertBlockData>(content));
  },
};
