import { z } from "zod";

import type { Plugin } from "../../types/plugin";

export interface SlashCommandsPluginConfig {
  triggerCharacter: string;
  suggestOnSelection: boolean;
}

export const slashCommandsPluginConfigSchema = z
  .object({
    triggerCharacter: z.string().min(1).max(2),
    suggestOnSelection: z.boolean(),
  })
  .strict();

export const SlashCommandsPlugin: Plugin<SlashCommandsPluginConfig> = {
  name: "pulse-plugin-slash-commands",
  version: "1.0.0",
  description: "Provides slash-command suggestion hooks.",
  configSchema: slashCommandsPluginConfigSchema,
  defaultConfig: {
    triggerCharacter: "/",
    suggestOnSelection: true,
  },
  onEnable(api) {
    api.onSelectionChange((payload) => {
      if (payload.blockId && api.getConfig().suggestOnSelection) {
        // Placeholder hook for opening slash command suggestions.
      }
    });
  },
};
