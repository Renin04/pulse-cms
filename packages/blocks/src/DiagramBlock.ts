import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export type DiagramEngine = "mermaid" | "plantuml";

export interface DiagramBlockData extends Record<string, unknown> {
  engine: DiagramEngine;
  source: string;
  caption?: string;
}

export const diagramBlockDataSchema = z
  .object({
    engine: z.enum(["mermaid", "plantuml"]),
    source: z.string(),
    caption: z.string().optional(),
  })
  .strict();

export const DiagramBlock: BlockTypeDefinition<DiagramBlockData> = {
  type: "diagram",
  name: "Diagram",
  icon: "DIAGRAM",
  schema: diagramBlockDataSchema,
  defaultData: {
    engine: "mermaid",
    source: "graph TD\n  A[Start] --> B[End]",
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = diagramBlockDataSchema.parse(data);
    const caption = parsed.caption ? `<figcaption>${escapeHtml(parsed.caption)}</figcaption>` : "";

    return `<figure data-block-type="diagram" data-engine="${parsed.engine}"><pre><code>${escapeHtml(
      parsed.source,
    )}</code></pre>${caption}</figure>`;
  },
  serialize(data) {
    const parsed = diagramBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return diagramBlockDataSchema.parse(parseJson<DiagramBlockData>(content));
  },
};
