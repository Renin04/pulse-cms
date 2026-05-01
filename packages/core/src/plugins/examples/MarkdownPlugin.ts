import { z } from "zod";

import type { Plugin } from "../../types/plugin";

export interface MarkdownPluginConfig {
  autoDetectHeadings: boolean;
  maxHeadingDepth: number;
}

export const markdownPluginConfigSchema = z
  .object({
    autoDetectHeadings: z.boolean(),
    maxHeadingDepth: z.number().int().min(1).max(6),
  })
  .strict();

export const MarkdownPlugin: Plugin<MarkdownPluginConfig> = {
  name: "pulse-plugin-markdown",
  version: "1.0.0",
  description: "Adds markdown-aware editor hooks.",
  configSchema: markdownPluginConfigSchema,
  defaultConfig: {
    autoDetectHeadings: true,
    maxHeadingDepth: 6,
  },
  onEnable(api) {
    api.onContentChange((payload) => {
      if (payload.source === "user" && api.getConfig().autoDetectHeadings) {
        // Placeholder hook for markdown parsing integrations.
      }
    });
  },
};
