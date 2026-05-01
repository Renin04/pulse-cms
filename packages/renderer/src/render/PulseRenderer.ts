import type { Block, BlockData } from "@pulse/core";
import type {
  BlockRendererFn,
  DocumentRenderOutput,
  RenderOutput,
  RendererConfig,
} from "../types/renderer";
import { RendererRegistry } from "../registry/RendererRegistry";
import { renderBlock, renderDocument } from "./render";

/**
 * Stateful renderer instance bound to a specific config.
 * Consumers can use this class directly or use the standalone render helpers.
 */
export class PulseRenderer {
  private readonly config: RendererConfig;

  constructor(config: RendererConfig = {}) {
    this.config = config;
  }

  /**
   * Register a block renderer on the shared RendererRegistry.
   */
  register<TData extends BlockData>(
    type: string,
    fn: BlockRendererFn<TData>,
  ): this {
    RendererRegistry.getInstance().register(type, fn);
    return this;
  }

  /**
   * Override (or register) a block renderer on the shared RendererRegistry.
   */
  override<TData extends BlockData>(
    type: string,
    fn: BlockRendererFn<TData>,
  ): this {
    RendererRegistry.getInstance().override(type, fn);
    return this;
  }

  /**
   * Render a single block using this renderer's config.
   */
  renderBlock(block: Block): RenderOutput {
    return renderBlock(block, this.config);
  }

  /**
   * Render an ordered array of blocks using this renderer's config.
   */
  renderDocument(blocks: Block[]): DocumentRenderOutput {
    return renderDocument(blocks, this.config);
  }
}
