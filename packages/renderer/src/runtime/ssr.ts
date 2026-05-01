import type { Block } from "@pulse/core";
import type {
  DocumentRenderOutput,
  RenderContext,
  RenderOutput,
  RendererConfig,
} from "../types/renderer";
import { RendererRegistry } from "../registry/RendererRegistry";
import { escapeHtml } from "../render/render";

/**
 * Detect whether the current runtime environment has browser globals.
 * Returns false in Node.js / edge runtimes (SSR-safe environments).
 */
export function isBrowserEnvironment(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as Record<string, unknown>)["window"] !== "undefined" &&
    typeof (globalThis as Record<string, unknown>)["document"] !== "undefined"
  );
}

/**
 * Assert that the current environment is SSR-safe (no browser globals).
 * Throws a descriptive error if called in a browser context.
 * Useful for guarding server-only code paths.
 */
export function assertSSRSafe(label = "renderSSR"): void {
  if (isBrowserEnvironment()) {
    throw new Error(
      `[Pulse] ${label} must only be called in a server-side (SSR) environment. ` +
        "Browser globals (window/document) were detected.",
    );
  }
}

/**
 * Build a fully SSR-safe RenderContext.
 * Always sets isSSR = true and never reads browser globals.
 */
export function buildSSRContext(
  overrides: Partial<RenderContext> = {},
): RenderContext {
  return {
    depth: overrides.depth ?? 0,
    isSSR: true,
    theme: overrides.theme,
  };
}

/**
 * Render a single block in an SSR-safe context.
 * Does not read window, document, or navigator.
 * Falls back to the config's unknownBlockFallback for unregistered types.
 */
export function renderBlockSSR(
  block: Block,
  config: RendererConfig = {},
  contextOverrides: Partial<RenderContext> = {},
): RenderOutput {
  const registry = RendererRegistry.getInstance();
  const ctx = buildSSRContext({ theme: config.theme, ...contextOverrides });

  const rendererFn = registry.get(block.type);

  let html: string;
  if (rendererFn) {
    html = rendererFn(block, ctx);
  } else {
    const fallback = config.unknownBlockFallback;
    if (fallback === undefined || fallback === null) {
      html = "";
    } else if (typeof fallback === "function") {
      html = fallback(block);
    } else {
      html = fallback;
    }
  }

  return { html, blockId: block.id, blockType: block.type };
}

/**
 * Render an ordered array of blocks in an SSR-safe context.
 * Produces a DocumentRenderOutput identical in shape to renderDocument()
 * but guaranteed to be free of browser-global access.
 */
export function renderDocumentSSR(
  blocks: Block[],
  config: RendererConfig = {},
): DocumentRenderOutput {
  const rendered: RenderOutput[] = blocks.map((block) =>
    renderBlockSSR(block, config),
  );
  const html = rendered.map((r) => r.html).join("\n");
  return { html, blocks: rendered };
}

export { escapeHtml };
