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
    const targetAttribute = parsed.openInNewTab ? ' target="_blank"' : "";
    const relValue =
      parsed.rel ?? (parsed.openInNewTab ? "noopener noreferrer" : undefined);
    const relAttribute = relValue ? ` rel="${escapeHtml(relValue)}"` : "";
    const alignStyle = parsed.align ? `text-align: ${escapeHtml(parsed.align)};` : "";

    // Extract domain for display
    let domain = parsed.url;
    try {
      domain = new URL(parsed.url).hostname.replace(/^www\./, "");
    } catch { /* keep raw url */ }

    const titleHtml = parsed.title ? `<div style="font-size:0.7rem;color:#6B7280;margin-top:3px;line-height:1.4;font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(parsed.title)}</div>` : "";

    const cardHtml = `
<a data-block-type="link" href="${escapeHtml(parsed.url)}"${targetAttribute}${relAttribute}
   style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;border:1px solid #E5E7EB;background:#FFFFFF;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-decoration:none;width:100%;transition:box-shadow 0.2s ease,transform 0.2s ease;${alignStyle}"
   onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';this.style.transform='translateY(-1px)';"
   onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.06)';this.style.transform='translateY(0)';"
>
  <span style="flex-shrink:0;width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#FF2800 0%,#FF5333 100%);display:grid;place-items:center;color:#fff;font-size:14px;font-weight:700;line-height:1;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
  </span>
  <span style="min-width:0;">
    <span style="display:block;font-size:0.85rem;font-weight:600;color:#373737;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(parsed.text)}</span>
    <span style="display:block;font-size:0.7rem;color:#6B7280;margin-top:2px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(domain)}</span>
    ${titleHtml}
  </span>
  <span style="flex-shrink:0;margin-left:auto;color:#9CA3AF;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
  </span>
</a>`;

    return parsed.align ? `<div style="${alignStyle}display:block;">${cardHtml}</div>` : cardHtml;
  },
  serialize(data) {
    const parsed = linkBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return linkBlockDataSchema.parse(parseJson<LinkBlockData>(content));
  },
};
