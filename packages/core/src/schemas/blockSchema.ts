import { z } from "zod";

import type { Block, BlockData, BlockDefinition } from "../types/block";

const functionSchema = z.custom<(...args: unknown[]) => unknown>(
  (value) => typeof value === "function",
  "Expected a function",
);

const zodTypeSchema = z.custom<{ parse: (input: unknown) => unknown }>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    "parse" in value &&
    typeof (value as { parse?: unknown }).parse === "function",
  "Expected a Zod schema",
);

export const blockConfigSchema = z
  .object({
    category: z.enum(["basic", "media", "interactive", "advanced"]).optional(),
    isVoid: z.boolean().optional(),
    isInline: z.boolean().optional(),
    canHaveChildren: z.boolean().optional(),
  })
  .strict();

const blockLifecycleHooksSchema = z
  .object({
    onCreate: functionSchema.optional(),
    onUpdate: functionSchema.optional(),
    onDestroy: functionSchema.optional(),
  })
  .strict();

export const blockDefinitionSchema = z
  .object({
    type: z.string().min(1),
    name: z.string().min(1),
    schema: zodTypeSchema,
    defaultData: z.union([z.record(z.string(), z.unknown()), functionSchema]),
    config: blockConfigSchema.optional(),
    hooks: blockLifecycleHooksSchema.optional(),
  })
  .strict();

export const blockSchema = z
  .object({
    id: z.string().min(1),
    parentId: z.string().min(1).nullable().optional(),
    type: z.string().min(1),
    data: z.record(z.string(), z.unknown()),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export function validateBlockDefinition<TData extends BlockData>(
  definition: BlockDefinition<TData>,
): BlockDefinition<TData> {
  blockDefinitionSchema.parse(definition);
  return definition;
}

export function validateBlock<TData extends BlockData>(
  block: Block<TData>,
): Block<TData> {
  blockSchema.parse(block);
  return block;
}
