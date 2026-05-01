import { z } from "zod";

import type { Plugin, PluginConfig } from "../types/plugin";

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

export const pluginDefinitionSchema = z
  .object({
    name: z.string().min(1),
    version: z.string().min(1),
    author: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    dependencies: z.array(z.string().min(1)).optional(),
    configSchema: zodTypeSchema.optional(),
    defaultConfig: z.union([z.record(z.unknown()), functionSchema]).optional(),
    onInstall: functionSchema.optional(),
    onEnable: functionSchema.optional(),
    onDisable: functionSchema.optional(),
    onUninstall: functionSchema.optional(),
  })
  .strict();

export function validatePluginDefinition<TConfig extends PluginConfig>(
  plugin: Plugin<TConfig>,
): Plugin<TConfig> {
  pluginDefinitionSchema.parse(plugin);
  return plugin;
}
