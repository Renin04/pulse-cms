import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export type ChartType = "bar" | "line" | "pie";

export interface ChartDataset {
  id: string;
  label: string;
  values: number[];
}

export interface ChartBlockData extends Record<string, unknown> {
  title?: string;
  chartType: ChartType;
  labels: string[];
  datasets: ChartDataset[];
}

const chartDatasetSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    values: z.array(z.number().finite()),
  })
  .strict();

export const chartBlockDataSchema = z
  .object({
    title: z.string().optional(),
    chartType: z.enum(["bar", "line", "pie"]),
    labels: z.array(z.string()).max(20),
    datasets: z.array(chartDatasetSchema).max(8),
  })
  .strict()
  .superRefine((value, context) => {
    for (const dataset of value.datasets) {
      if (dataset.values.length !== value.labels.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Dataset "${dataset.label}" must include ${value.labels.length} values`,
          path: ["datasets"],
        });
      }
    }
  });

function createDatasetId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `chart-dataset-${crypto.randomUUID()}`;
  }

  return `chart-dataset-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function addChartDataset(
  data: ChartBlockData,
  dataset: Omit<ChartDataset, "id"> & { id?: string },
): ChartBlockData {
  const parsed = chartBlockDataSchema.parse(data);

  return chartBlockDataSchema.parse({
    ...parsed,
    datasets: [
      ...parsed.datasets,
      {
        ...dataset,
        id: dataset.id ?? createDatasetId(),
      },
    ],
  });
}

export const ChartBlock: BlockTypeDefinition<ChartBlockData> = {
  type: "chart",
  name: "Chart",
  icon: "CHART",
  schema: chartBlockDataSchema,
  defaultData: {
    title: "Chart",
    chartType: "bar",
    labels: ["Q1", "Q2", "Q3"],
    datasets: [
      {
        id: "chart-dataset-1",
        label: "Visitors",
        values: [120, 180, 210],
      },
    ],
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = chartBlockDataSchema.parse(data);
    const heading = parsed.title ? `<h3>${escapeHtml(parsed.title)}</h3>` : "";
    const labels = `<thead><tr><th>Series</th>${parsed.labels
      .map((label) => `<th>${escapeHtml(label)}</th>`)
      .join("")}</tr></thead>`;
    const rows = parsed.datasets
      .map(
        (dataset) =>
          `<tr><td>${escapeHtml(dataset.label)}</td>${dataset.values
            .map((value) => `<td>${escapeHtml(String(value))}</td>`)
            .join("")}</tr>`,
      )
      .join("");

    return `<section data-block-type="chart" data-chart-type="${parsed.chartType}">${heading}<table>${labels}<tbody>${rows}</tbody></table></section>`;
  },
  serialize(data) {
    const parsed = chartBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return chartBlockDataSchema.parse(parseJson<ChartBlockData>(content));
  },
};
