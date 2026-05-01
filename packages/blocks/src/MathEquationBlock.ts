import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export interface MathEquationBlockData extends Record<string, unknown> {
  latex: string;
  displayMode: boolean;
}

export const mathEquationBlockDataSchema = z
  .object({
    latex: z.string(),
    displayMode: z.boolean(),
  })
  .strict();

export const MathEquationBlock: BlockTypeDefinition<MathEquationBlockData> = {
  type: "math-equation",
  name: "Math equation",
  icon: "MATH",
  schema: mathEquationBlockDataSchema,
  defaultData: {
    latex: "E = mc^2",
    displayMode: true,
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = mathEquationBlockDataSchema.parse(data);
    const tag = parsed.displayMode ? "div" : "span";

    return `<${tag} data-block-type="math-equation" data-display-mode="${String(
      parsed.displayMode,
    )}"><code>${escapeHtml(parsed.latex)}</code></${tag}>`;
  },
  serialize(data) {
    const parsed = mathEquationBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return mathEquationBlockDataSchema.parse(parseJson<MathEquationBlockData>(content));
  },
};
