import type { BlockDefinition, BlockData } from "../../core/src/types/block";

export interface BlockRenderContext {
  mode?: "editor" | "renderer";
  selected?: boolean;
}

export interface BlockTypeDefinition<TData extends BlockData = BlockData>
  extends BlockDefinition<TData> {
  icon: string;
  render(data: TData, context?: BlockRenderContext): string;
  serialize(data: TData): string;
  deserialize(content: string): TData;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const ALLOWED_INLINE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

export function sanitizeUrl(url: string): string | null {
  if (!url) return null;
  // Allow relative paths (starting with /, ./, or ../)
  if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (ALLOWED_INLINE_PROTOCOLS.has(parsed.protocol)) {
      return url;
    }
  } catch {
    // Not a valid absolute URL — try bare domain fallback
    if (!url.includes(":") && url.includes(".")) {
      return `https://${url}`;
    }
  }
  return null;
}

export function parseJson<TData>(content: string): TData {
  try {
    return JSON.parse(content) as TData;
  } catch (error) {
    throw new Error(`Failed to parse serialized block: ${String(error)}`);
  }
}

/**
 * Deterministic render id (djb2 hash of the block's parsed data). Blocks that
 * emit ids into HTML MUST NOT use Math.random/crypto.randomUUID at render
 * time: a random id makes the SSR document differ from the RSC payload, and
 * React then replaces the hydrated article DOM, discarding every listener
 * the public hydrators attached. A data-derived id is stable across renders.
 */
export function stableRenderId(prefix: string, seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `${prefix}-${Math.abs(hash).toString(36)}`;
}
