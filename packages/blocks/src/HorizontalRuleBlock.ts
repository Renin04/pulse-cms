import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { parseJson } from "./types";

export interface HorizontalRuleBlockData extends Record<string, never> {}

export const horizontalRuleBlockDataSchema = z.object({}).strict();

export const HorizontalRuleBlock: BlockTypeDefinition<HorizontalRuleBlockData> = {
  type: "horizontal-rule",
  name: "Horizontal Rule",
  icon: "---",
  schema: horizontalRuleBlockDataSchema,
  defaultData: {},
  config: {
    category: "basic",
    isVoid: true,
    canHaveChildren: false,
  },
  render(data) {
    horizontalRuleBlockDataSchema.parse(data);
    return '<hr data-block-type="horizontal-rule" />';
  },
  serialize(data) {
    const parsed = horizontalRuleBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return horizontalRuleBlockDataSchema.parse(parseJson<HorizontalRuleBlockData>(content));
  },
};
