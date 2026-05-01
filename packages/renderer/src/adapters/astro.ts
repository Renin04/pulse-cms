import type { Block } from "@pulse/core";
import type { RendererConfig, DocumentRenderOutput } from "../types/renderer";
import { renderDocumentSSR, buildSSRContext } from "../runtime/ssr";

/**
 * Options for the Astro adapter.
 */
export interface AstroAdapterOptions {
  /**
   * Astro rendering mode for the current page.
   * - `"static"` — pre-rendered at build time (default)
   * - `"server"` — rendered on every request (SSR)
   * - `"hybrid"` — per-page opt-in to SSR
   */
  mode?: "static" | "server" | "hybrid";
  /** Base renderer config forwarded to the render pipeline. */
  rendererConfig?: RendererConfig;
}

/**
 * Metadata hints for Astro integration.
 */
export interface AstroRenderMeta {
  /** Whether the output was rendered server-side. */
  isSSR: boolean;
  /**
   * Whether the page should be pre-rendered.
   * Maps to Astro's `export const prerender = true`.
   */
  prerender: boolean;
  /** Astro rendering mode used for this render. */
  mode: "static" | "server" | "hybrid";
}

/**
 * Result of an Astro-adapted render call.
 */
export interface AstroRenderResult {
  output: DocumentRenderOutput;
  meta: AstroRenderMeta;
}

/**
 * Render a Pulse document for use in an Astro `.astro` component or
 * Astro API endpoint.
 *
 * - `"static"` mode: always SSR-safe, marks output as pre-renderable.
 * - `"server"` mode: SSR-safe, marks output as dynamic (no prerender).
 * - `"hybrid"` mode: SSR-safe, consumer decides prerender per-page.
 *
 * Safe to call in Astro frontmatter (`---` blocks) and API routes.
 */
export function renderForAstro(
  blocks: Block[],
  options: AstroAdapterOptions = {},
): AstroRenderResult {
  const { mode = "static", rendererConfig = {} } = options;

  const config: RendererConfig = {
    ...rendererConfig,
    ssr: true,
  };

  const output = renderDocumentSSR(blocks, config);

  const meta: AstroRenderMeta = {
    isSSR: true,
    prerender: mode === "static",
    mode,
  };

  return { output, meta };
}

/**
 * Build an Astro-compatible inline `<script>` tag carrying Pulse block data
 * for client-side islands or View Transitions hydration.
 *
 * Embed the returned string in your `.astro` template via `<Fragment set:html>`.
 */
export function buildAstroDataScript(
  blocks: Block[],
  scriptId = "pulse-astro-data",
): string {
  const json = JSON.stringify(blocks)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  return `<script id="${scriptId}" type="application/json">${json}</script>`;
}

/**
 * Returns the Astro `prerender` export value for the given render meta.
 * Use as: `export const prerender = getAstroPrerenderFlag(meta)`.
 */
export function getAstroPrerenderFlag(meta: AstroRenderMeta): boolean {
  return meta.prerender;
}

/**
 * Extract the SSR context object suitable for Astro server-side rendering.
 */
export function buildAstroSSRContext(theme?: string) {
  return buildSSRContext({ theme });
}
