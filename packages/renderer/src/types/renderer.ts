import type { Block, BlockData } from "@pulse/core";

/**
 * The output produced by rendering a single block.
 * Framework-agnostic: the `html` field carries a serialized HTML string.
 */
export interface RenderOutput {
  /** Serialized HTML string for the block. */
  html: string;
  /** Block id that produced this output. */
  blockId: string;
  /** Block type that was rendered. */
  blockType: string;
}

/**
 * A function that converts a block's data into an HTML string.
 * Must be pure and side-effect free.
 */
export type BlockRendererFn<TData extends BlockData = BlockData> = (
  block: Block<TData>,
  context: RenderContext,
) => string;

/**
 * Contextual information passed to every block renderer.
 */
export interface RenderContext {
  /** Depth of the block in the document tree (root = 0). */
  depth: number;
  /** Whether the output is being generated in an SSR environment. */
  isSSR: boolean;
  /** Resolved theme name, if any. */
  theme?: string;
}

/**
 * Top-level configuration for the Pulse renderer.
 */
export interface RendererConfig {
  /**
   * HTML string to render when a block type has no registered renderer.
   * Defaults to an empty string.
   */
  unknownBlockFallback?: string | ((block: Block) => string);
  /** Whether the renderer is running in an SSR context. Defaults to false. */
  ssr?: boolean;
  /** Active theme name. */
  theme?: string;
}

/**
 * Result of rendering a full document (array of blocks).
 */
export interface DocumentRenderOutput {
  /** Concatenated HTML for all blocks. */
  html: string;
  /** Per-block render outputs, in document order. */
  blocks: RenderOutput[];
}
