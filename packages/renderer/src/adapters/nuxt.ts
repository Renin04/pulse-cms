import type { Block } from "@pulse/core";
import type { RendererConfig, DocumentRenderOutput } from "../types/renderer";
import { renderDocumentSSR, buildSSRContext, isBrowserEnvironment } from "../runtime/ssr";

/**
 * Options for the Nuxt adapter.
 */
export interface NuxtAdapterOptions {
  /** Whether to force SSR mode regardless of environment detection. */
  forceSSR?: boolean;
  /** Base renderer config forwarded to the render pipeline. */
  rendererConfig?: RendererConfig;
}

/**
 * Metadata hints for Nuxt (2/3) integration.
 */
export interface NuxtRenderMeta {
  /** Whether the output was rendered server-side. */
  isSSR: boolean;
  /**
   * Whether the page can be pre-rendered (static generation).
   * Maps to Nuxt's `routeRules.prerender`.
   */
  prerender: boolean;
  /**
   * Suggested `routeRules.headers` Cache-Control value for Nuxt Nitro.
   */
  cacheControl: string;
}

/**
 * Result of a Nuxt-adapted render call.
 */
export interface NuxtRenderResult {
  output: DocumentRenderOutput;
  meta: NuxtRenderMeta;
}

/**
 * Render a Pulse document for use in a Nuxt server plugin, composable, or
 * Nitro server route.
 *
 * - Detects SSR context automatically; use `forceSSR` to override.
 * - Provides Nuxt Nitro-compatible `routeRules` metadata.
 * - Safe to call from `useAsyncData`, `useFetch`, or Nitro event handlers.
 */
export function renderForNuxt(
  blocks: Block[],
  options: NuxtAdapterOptions = {},
): NuxtRenderResult {
  const { forceSSR = false, rendererConfig = {} } = options;
  const isSSR = forceSSR || !isBrowserEnvironment();

  const config: RendererConfig = {
    ...rendererConfig,
    ssr: isSSR,
  };

  const output = renderDocumentSSR(blocks, config);

  const meta: NuxtRenderMeta = {
    isSSR,
    prerender: isSSR,
    cacheControl: isSSR
      ? "s-maxage=3600, stale-while-revalidate=86400"
      : "no-store",
  };

  return { output, meta };
}

/**
 * Build a Nuxt-compatible inline payload script that carries Pulse block
 * data for `useNuxtData` or manual hydration.
 *
 * The script uses `application/json` and a stable id so that client-side
 * Nuxt composables can pick it up without an extra network round-trip.
 */
export function buildNuxtPayloadScript(
  blocks: Block[],
  scriptId = "pulse-nuxt-data",
): string {
  const json = JSON.stringify(blocks)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  return `<script id="${scriptId}" type="application/json">${json}</script>`;
}

/**
 * Build Nuxt `routeRules` configuration for a Pulse-powered route.
 * Pass the returned object into the `routeRules` key of your `nuxt.config.ts`.
 */
export function buildNuxtRouteRules(
  meta: NuxtRenderMeta,
): Record<string, unknown> {
  return {
    prerender: meta.prerender,
    headers: {
      "cache-control": meta.cacheControl,
    },
  };
}

/**
 * Extract the SSR context object suitable for Nuxt server-side composables.
 */
export function buildNuxtSSRContext(theme?: string) {
  return buildSSRContext({ theme });
}
