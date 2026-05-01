import type { Block } from "@pulse/core";
import type {
  DocumentRenderOutput,
  RenderContext,
  RenderOutput,
  RendererConfig,
} from "../types/renderer";
import { RendererRegistry } from "../registry/RendererRegistry";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveUnknownFallback(
  block: Block,
  fallback: RendererConfig["unknownBlockFallback"],
): string {
  if (fallback === undefined || fallback === null) return "";
  if (typeof fallback === "function") return fallback(block);
  return fallback;
}

/**
 * Render a single block to an HTML string.
 */
export function renderBlock(
  block: Block,
  config: RendererConfig = {},
  context: Partial<RenderContext> = {},
): RenderOutput {
  const registry = RendererRegistry.getInstance();
  const ctx: RenderContext = {
    depth: context.depth ?? 0,
    isSSR: context.isSSR ?? config.ssr ?? false,
    theme: context.theme ?? config.theme,
  };

  const rendererFn = registry.get(block.type);

  let html: string;
  if (rendererFn) {
    html = rendererFn(block, ctx);
  } else {
    html = resolveUnknownFallback(block, config.unknownBlockFallback);
  }

  return { html, blockId: block.id, blockType: block.type };
}

/**
 * Render an ordered array of blocks into a full document HTML string.
 */
export function renderDocument(
  blocks: Block[],
  config: RendererConfig = {},
): DocumentRenderOutput {
  const rendered: RenderOutput[] = blocks.map((block) =>
    renderBlock(block, config),
  );
  const html = rendered.map((r) => r.html).join("\n");
  return { html, blocks: rendered };
}

export { escapeHtml };
