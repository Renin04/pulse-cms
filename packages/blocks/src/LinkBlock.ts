import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

const ALLOWED_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

function hasAllowedLinkProtocol(url: string): boolean {
  try {
    return ALLOWED_LINK_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

export interface LinkBlockData extends Record<string, unknown> {
  text: string;
  url: string;
  openInNewTab: boolean;
  title?: string;
  rel?: string;
  align?: "left" | "center" | "right" | "justify";
}

export const linkBlockDataSchema = z
  .object({
    text: z.string(),
    url: z.string().url().refine(hasAllowedLinkProtocol, {
      message: "Unsupported link protocol",
    }),
    openInNewTab: z.boolean(),
    title: z.string().optional(),
    rel: z.string().optional(),
    align: z.enum(["left", "center", "right", "justify"]).optional(),
  })
  .strict();

export const LinkBlock: BlockTypeDefinition<LinkBlockData> = {
  type: "link",
  name: "Link",
  icon: "LINK",
  schema: linkBlockDataSchema,
  defaultData: {
    text: "Link",
    url: "https://example.com",
    openInNewTab: true,
  },
  config: {
    category: "basic",
    isInline: true,
    canHaveChildren: false,
  },
  render(data) {
    const parsed = linkBlockDataSchema.parse(data);
    const titleAttribute = parsed.title ? ` title="${escapeHtml(parsed.title)}"` : "";
    const targetAttribute = parsed.openInNewTab ? ' target="_blank"' : "";
    const relValue =
      parsed.rel ?? (parsed.openInNewTab ? "noopener noreferrer" : undefined);
    const relAttribute = relValue ? ` rel="${escapeHtml(relValue)}"` : "";
    const alignAttr = parsed.align ? ` style="text-align: ${escapeHtml(parsed.align)}; display: block;"` : "";

    return `<a data-block-type="link" href="${escapeHtml(
      parsed.url,
    )}"${titleAttribute}${targetAttribute}${relAttribute}${alignAttr}>${escapeHtml(parsed.text)}</a>`;
  },
  serialize(data) {
    const parsed = linkBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return linkBlockDataSchema.parse(parseJson<LinkBlockData>(content));
  },
};
