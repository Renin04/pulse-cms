import type { Block } from "@pulse/core";
import type { RendererConfig, DocumentRenderOutput } from "../types/renderer";
import { renderDocumentSSR, buildSSRContext, isBrowserEnvironment } from "../runtime/ssr";

/**
 * Options for the Next.js adapter.
 */
export interface NextAdapterOptions {
  /** Whether to force SSR mode regardless of environment detection. */
  forceSSR?: boolean;
  /** Base renderer config forwarded to the render pipeline. */
  rendererConfig?: RendererConfig;
}

/**
 * Metadata hints for Next.js page/app router integration.
 */
export interface NextRenderMeta {
  /** Whether the output was rendered server-side. */
  isSSR: boolean;
  /** Whether the output is safe to cache as static HTML. */
  isStatic: boolean;
  /** Suggested Cache-Control header value for Next.js route handlers. */
  cacheControl: string;
}

/**
 * Result of a Next.js-adapted render call.
 */
export interface NextRenderResult {
  output: DocumentRenderOutput;
  meta: NextRenderMeta;
}

/**
 * Render a Pulse document for use in a Next.js page or route handler.
 *
 * - In server components / route handlers (SSR), renders via the SSR-safe pipeline.
 * - Attaches Next.js-specific metadata (cache hints, SSR flag).
 * - Safe to call in both App Router server components and Pages Router `getServerSideProps`.
 */
export function renderForNext(
  blocks: Block[],
  options: NextAdapterOptions = {},
): NextRenderResult {
  const { forceSSR = false, rendererConfig = {} } = options;
  const isSSR = forceSSR || !isBrowserEnvironment();

  const config: RendererConfig = {
    ...rendererConfig,
    ssr: isSSR,
  };

  const output = renderDocumentSSR(blocks, config);

  const meta: NextRenderMeta = {
    isSSR,
    isStatic: isSSR,
    cacheControl: isSSR ? "s-maxage=3600, stale-while-revalidate=86400" : "no-store",
  };

  return { output, meta };
}

/**
 * Build a Next.js-compatible script tag that hydrates Pulse block data
 * on the client side. Serializes blocks as JSON into a `<script>` element
 * with a stable id for client-side pickup.
 *
 * Safe to embed in `<head>` or at the end of `<body>`.
 */
export function buildNextHydrationScript(
  blocks: Block[],
  scriptId = "pulse-data",
): string {
  const json = JSON.stringify(blocks)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  return `<script id="${scriptId}" type="application/json">${json}</script>`;
}

/**
 * Extract the SSR context object suitable for passing to Next.js
 * `generateMetadata` or layout components.
 */
export function buildNextSSRContext(theme?: string) {
  return buildSSRContext({ theme });
}
