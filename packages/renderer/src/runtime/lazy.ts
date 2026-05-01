import type { Block } from "@pulse/core";
import type { RendererConfig, RenderOutput } from "../types/renderer";
import { renderBlockSSR } from "./ssr";

/**
 * Block types considered "heavy" — deferred until visible by default.
 */
export const HEAVY_BLOCK_TYPES: ReadonlySet<string> = new Set([
  "code-playground",
  "video",
  "embed",
  "map",
  "chart",
  "interactive",
  "branch",
  "conditional",
]);

/**
 * Strategy for lazy-loading a block boundary.
 * - `"intersection"` — load when the placeholder enters the viewport (IntersectionObserver).
 * - `"idle"` — load during browser idle time (requestIdleCallback).
 * - `"eager"` — no deferral; render immediately (same as non-lazy).
 */
export type LazyStrategy = "intersection" | "idle" | "eager";

/**
 * Options for a lazy block boundary.
 */
export interface LazyBoundaryOptions {
  /** Render strategy. Defaults to `"intersection"`. */
  strategy?: LazyStrategy;
  /**
   * Placeholder HTML shown while the block is deferred.
   * Defaults to a minimal `pulse-lazy-placeholder` div.
   */
  placeholder?: string;
  /**
   * IntersectionObserver root margin (only used with `"intersection"` strategy).
   * Defaults to `"200px"` to pre-load slightly before visible.
   */
  rootMargin?: string;
  /** Base renderer config forwarded when the block is eventually rendered. */
  rendererConfig?: RendererConfig;
}

/**
 * Result of wrapping a block in a lazy boundary.
 */
export interface LazyBoundaryResult {
  /**
   * HTML string to embed in the page.
   * For `"eager"` strategy this is the fully rendered block HTML.
   * For deferred strategies this is a placeholder wrapper with data attributes
   * that the client-side hydration script uses to load the real content.
   */
  html: string;
  /** Whether the block was deferred (false means it was rendered eagerly). */
  deferred: boolean;
  /** The strategy that was applied. */
  strategy: LazyStrategy;
  /** The original block id. */
  blockId: string;
  /** The original block type. */
  blockType: string;
}

/**
 * Determine whether a block should be lazily loaded by default.
 * Returns true for block types listed in HEAVY_BLOCK_TYPES.
 */
export function isHeavyBlock(block: Block): boolean {
  return HEAVY_BLOCK_TYPES.has(block.type);
}

/**
 * Build the default placeholder HTML for a deferred block.
 */
function buildPlaceholder(block: Block, rootMargin: string): string {
  return (
    `<div class="pulse-lazy-placeholder" ` +
    `data-pulse-lazy="${block.id}" ` +
    `data-pulse-type="${block.type}" ` +
    `data-pulse-margin="${rootMargin}" ` +
    `aria-hidden="true" ` +
    `style="min-height:1px"></div>`
  );
}

/**
 * Wrap a single block in a lazy-load boundary.
 *
 * - For `"eager"` strategy (or non-heavy blocks when `forceDefer` is false),
 *   the block is rendered immediately via the SSR pipeline.
 * - For `"intersection"` / `"idle"` strategies, a lightweight placeholder is
 *   emitted; the client-side hydration runtime is responsible for swapping it
 *   with real content when the trigger fires.
 *
 * This function is SSR-safe: it never reads browser globals.
 */
export function createLazyBoundary(
  block: Block,
  options: LazyBoundaryOptions = {},
): LazyBoundaryResult {
  const {
    strategy = "intersection",
    rootMargin = "200px",
    rendererConfig = {},
  } = options;

  if (strategy === "eager") {
    const rendered = renderBlockSSR(block, rendererConfig);
    return {
      html: rendered.html,
      deferred: false,
      strategy,
      blockId: block.id,
      blockType: block.type,
    };
  }

  const placeholder =
    options.placeholder ?? buildPlaceholder(block, rootMargin);

  const wrapper =
    `<div class="pulse-lazy-boundary" ` +
    `data-pulse-lazy-strategy="${strategy}" ` +
    `data-pulse-block-id="${block.id}" ` +
    `data-pulse-block-type="${block.type}">` +
    placeholder +
    `</div>`;

  return {
    html: wrapper,
    deferred: true,
    strategy,
    blockId: block.id,
    blockType: block.type,
  };
}

/**
 * Process an array of blocks, wrapping heavy blocks in lazy boundaries and
 * rendering light blocks immediately.
 *
 * Returns per-block results in document order.
 */
export function applyLazyBoundaries(
  blocks: Block[],
  options: LazyBoundaryOptions = {},
): LazyBoundaryResult[] {
  return blocks.map((block) => {
    const shouldDefer =
      options.strategy !== "eager" && isHeavyBlock(block);
    return createLazyBoundary(block, {
      ...options,
      strategy: shouldDefer ? (options.strategy ?? "intersection") : "eager",
    });
  });
}

/**
 * Render an array of blocks with lazy boundaries applied, returning a single
 * concatenated HTML string.
 *
 * Heavy blocks are deferred; light blocks are rendered inline.
 * The output is SSR-safe and can be embedded directly in server responses.
 */
export function renderWithLazyBoundaries(
  blocks: Block[],
  options: LazyBoundaryOptions = {},
): string {
  return applyLazyBoundaries(blocks, options)
    .map((r) => r.html)
    .join("\n");
}

/**
 * Eagerly render a block that was previously deferred.
 * Useful for server-side pre-rendering of above-the-fold content
 * or for testing the full render path of a heavy block.
 */
export function renderDeferredBlock(
  block: Block,
  rendererConfig: RendererConfig = {},
): RenderOutput {
  return renderBlockSSR(block, rendererConfig);
}
