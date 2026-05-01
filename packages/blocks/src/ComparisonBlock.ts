import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export interface ComparisonRow {
  id: string;
  label: string;
  leftValue: string;
  rightValue: string;
}

export interface ComparisonBlockData extends Record<string, unknown> {
  leftTitle: string;
  rightTitle: string;
  rows: ComparisonRow[];
}

const comparisonRowSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    leftValue: z.string(),
    rightValue: z.string(),
  })
  .strict();

export const comparisonBlockDataSchema = z
  .object({
    leftTitle: z.string(),
    rightTitle: z.string(),
    rows: z.array(comparisonRowSchema).max(50),
  })
  .strict();

function createComparisonRowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `comparison-row-${crypto.randomUUID()}`;
  }

  return `comparison-row-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function addComparisonRow(
  data: ComparisonBlockData,
  row: Omit<ComparisonRow, "id"> & { id?: string },
): ComparisonBlockData {
  const parsed = comparisonBlockDataSchema.parse(data);

  return comparisonBlockDataSchema.parse({
    ...parsed,
    rows: [
      ...parsed.rows,
      {
        ...row,
        id: row.id ?? createComparisonRowId(),
      },
    ],
  });
}

export const ComparisonBlock: BlockTypeDefinition<ComparisonBlockData> = {
  type: "comparison",
  name: "Comparison",
  icon: "COMPARISON",
  schema: comparisonBlockDataSchema,
  defaultData: {
    leftTitle: "Option A",
    rightTitle: "Option B",
    rows: [
      {
        id: "comparison-row-1",
        label: "Speed",
        leftValue: "Fast",
        rightValue: "Moderate",
      },
    ],
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = comparisonBlockDataSchema.parse(data);
    const rows = parsed.rows
      .map(
        (row) =>
          `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(
            row.leftValue,
          )}</td><td>${escapeHtml(row.rightValue)}</td></tr>`,
      )
      .join("");

    return `<section data-block-type="comparison"><table><thead><tr><th></th><th>${escapeHtml(
      parsed.leftTitle,
    )}</th><th>${escapeHtml(parsed.rightTitle)}</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  },
  serialize(data) {
    const parsed = comparisonBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return comparisonBlockDataSchema.parse(parseJson<ComparisonBlockData>(content));
  },
};
