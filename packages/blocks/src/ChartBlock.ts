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
  caption?: string;
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
    caption: z.string().optional(),
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeDataset(raw: unknown, index: number): ChartDataset | null {
  const record = asRecord(raw);
  if (!record) return null;
  const values = Array.isArray(record.values)
    ? record.values.filter(
        (value): value is number => typeof value === "number" && Number.isFinite(value),
      )
    : [];
  const rawId = record.id;
  const id =
    typeof rawId === "string" && rawId.length > 0
      ? rawId
      : `chart-dataset-legacy-${index + 1}`;
  return {
    id,
    label: typeof record.label === "string" ? record.label : "",
    values,
  };
}

/**
 * Coerce arbitrary saved data into valid ChartBlockData. Current
 * `labels`/`datasets` payloads pass through (missing dataset ids are filled);
 * legacy `categories`/`series` payloads are migrated, and legacy pie `slices`
 * become a single dataset across the slice labels. Value/label count
 * mismatches are NOT repaired here — the schema's superRefine rejects them.
 */
export function normalizeChartData(raw: unknown): ChartBlockData {
  const record = asRecord(raw) ?? {};

  const chartType: ChartType =
    record.chartType === "line" || record.chartType === "pie" ? record.chartType : "bar";

  const rawDatasets = Array.isArray(record.datasets)
    ? record.datasets
    : Array.isArray(record.series)
      ? record.series
      : null;

  let labels: string[];
  let datasets: ChartDataset[];

  if (rawDatasets) {
    const rawLabels = Array.isArray(record.labels)
      ? record.labels
      : Array.isArray(record.categories)
        ? record.categories
        : [];
    labels = rawLabels
      .filter((label): label is string => typeof label === "string")
      .slice(0, 20);

    const seenIds = new Set<string>();
    datasets = [];
    for (let index = 0; index < rawDatasets.length && datasets.length < 8; index += 1) {
      const dataset = normalizeDataset(rawDatasets[index], index);
      if (!dataset) continue;
      let id = dataset.id;
      let suffix = 2;
      while (seenIds.has(id)) {
        id = `${dataset.id}-${suffix}`;
        suffix += 1;
      }
      seenIds.add(id);
      datasets.push({ ...dataset, id });
    }
  } else {
    // Legacy pie shape: slices carry both the labels and the values.
    const slices = (Array.isArray(record.slices) ? record.slices : [])
      .map(asRecord)
      .filter((slice): slice is Record<string, unknown> => slice !== null)
      .slice(0, 20);
    labels = slices.map((slice) =>
      typeof slice.label === "string" ? slice.label : "",
    );
    datasets = [
      {
        id: "chart-dataset-legacy-1",
        label: "",
        values: slices.map((slice) =>
          typeof slice.value === "number" && Number.isFinite(slice.value)
            ? slice.value
            : 0,
        ),
      },
    ];
  }

  const title =
    typeof record.title === "string" && record.title.trim().length > 0
      ? record.title
      : undefined;
  const caption =
    typeof record.caption === "string" && record.caption.trim().length > 0
      ? record.caption
      : undefined;

  // Deliberately NOT schema-parsed here: a values/labels length mismatch must
  // surface through the caller's schema validation (readable issues) instead
  // of an opaque "normalizer failed" ZodError.
  return {
    ...(title ? { title } : {}),
    chartType,
    labels,
    datasets,
    ...(caption ? { caption } : {}),
  };
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
