import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export interface TableBlockData extends Record<string, unknown> {
  columns: string[];
  rows: string[][];
  caption?: string;
}

export const tableBlockDataSchema = z
  .object({
    columns: z.array(z.string()).max(12),
    rows: z.array(z.array(z.string())),
    caption: z.string().optional(),
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
    const headings = parsed.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("");
    const bodyRows = parsed.rows
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
      .join("");
    const captionMarkup = parsed.caption ? `<caption>${escapeHtml(parsed.caption)}</caption>` : "";

    return `<figure data-block-type="table"><table>${captionMarkup}<thead><tr>${headings}</tr></thead><tbody>${bodyRows}</tbody></table></figure>`;
  },
  serialize(data) {
    const parsed = tableBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return tableBlockDataSchema.parse(parseJson<TableBlockData>(content));
  },
};
