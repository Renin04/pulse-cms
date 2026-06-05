import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";
import { renderInlineMarkdown } from "./BlockquoteBlock";

export interface TableBlockData extends Record<string, unknown> {
  columns: string[];
  rows: string[][];
  caption?: string;
  captionAlign?: "left" | "center" | "right";
  columnAligns?: ("left" | "center" | "right")[];
}

export const tableBlockDataSchema = z
  .object({
    columns: z.array(z.string()).max(12),
    rows: z.array(z.array(z.string())),
    caption: z.string().optional(),
    captionAlign: z.enum(["left", "center", "right"]).optional(),
    columnAligns: z.array(z.enum(["left", "center", "right"])).max(12).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    for (let rowIndex = 0; rowIndex < value.rows.length; rowIndex += 1) {
      const row = value.rows[rowIndex];
      if (row.length !== value.columns.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Row ${rowIndex + 1} must include ${value.columns.length} columns`,
          path: ["rows", rowIndex],
        });
      }
    }
    if (value.columnAligns && value.columnAligns.length > value.columns.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `columnAligns length (${value.columnAligns.length}) cannot exceed columns length (${value.columns.length})`,
        path: ["columnAligns"],
      });
    }
  });

function normalizeRow(columns: string[], row?: string[]): string[] {
  const values = row ? [...row] : [];
  if (values.length > columns.length) {
    return values.slice(0, columns.length);
  }

  while (values.length < columns.length) {
    values.push("");
  }

  return values;
}

export function addTableRow(data: TableBlockData, row?: string[]): TableBlockData {
  const parsed = tableBlockDataSchema.parse(data);

  return tableBlockDataSchema.parse({
    ...parsed,
    rows: [...parsed.rows, normalizeRow(parsed.columns, row)],
  });
}

export function updateTableCell(
  data: TableBlockData,
  rowIndex: number,
  columnIndex: number,
  value: string,
): TableBlockData {
  const parsed = tableBlockDataSchema.parse(data);
  if (rowIndex < 0 || rowIndex >= parsed.rows.length) {
    throw new Error(`Row index "${rowIndex}" is out of range`);
  }
  if (columnIndex < 0 || columnIndex >= parsed.columns.length) {
    throw new Error(`Column index "${columnIndex}" is out of range`);
  }

  const rows = parsed.rows.map((row, index) => (index === rowIndex ? [...row] : row));
  rows[rowIndex][columnIndex] = value;

  return tableBlockDataSchema.parse({
    ...parsed,
    rows,
  });
}

export const TableBlock: BlockTypeDefinition<TableBlockData> = {
  type: "table",
  name: "Table",
  icon: "TABLE",
  schema: tableBlockDataSchema,
  defaultData: {
    columns: ["Column 1", "Column 2"],
    rows: [["", ""]],
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = tableBlockDataSchema.parse(data);

    const captionAlign = parsed.captionAlign || "left";
    const captionMarkup = parsed.caption
      ? `<figcaption class="pulse-table-caption" style="text-align:${captionAlign};">${renderInlineMarkdown(parsed.caption)}</figcaption>`
      : "";

    const colAligns = parsed.columnAligns || [];
    const getColAlign = (index: number) => colAligns[index] || "left";

    const headings = parsed.columns
      .map((column, i) => `<th style="text-align:${getColAlign(i)};">${renderInlineMarkdown(column)}</th>`)
      .join("");

    const bodyRows = parsed.rows
      .map(
        (row) =>
          `<tr>${row
            .map((cell, i) => `<td style="text-align:${getColAlign(i)};">${renderInlineMarkdown(cell)}</td>`)
            .join("")}</tr>`,
      )
      .join("");

    return `<figure class="pulse-table-wrapper" data-block-type="table">
  <div class="pulse-table-scroll">
    <table>
      <thead><tr>${headings}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </div>
  ${captionMarkup}
</figure>`;
  },
  serialize(data) {
    const parsed = tableBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return tableBlockDataSchema.parse(parseJson<TableBlockData>(content));
  },
};
