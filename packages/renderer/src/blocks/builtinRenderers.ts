import type { Block, BlockData } from "@pulse/core";
import type { BlockTypeDefinition } from "../../../blocks/src/types";
import type { BlockRendererFn } from "../types/renderer";
import { RendererRegistry } from "../registry/RendererRegistry";
import {
  BUILTIN_BLOCK_DEFINITIONS,
  BASIC_BLOCK_DEFINITIONS,
  EXTENDED_BLOCK_DEFINITIONS,
  INTERACTIVE_CREATIVE_BLOCK_DEFINITIONS,
  PHASE2_EXPANSION_BLOCK_DEFINITIONS,
} from "../../../blocks/src/index";

/**
 * Wrap a BlockTypeDefinition.render() method as a RendererRegistry-compatible BlockRendererFn.
 * Bridges the @pulse/blocks render contract to the @pulse/renderer contract.
 */
function wrapBlockDefinition<TData extends BlockData>(
  definition: BlockTypeDefinition<TData>,
): BlockRendererFn<TData> {
  return (block: Block<TData>): string => {
    return definition.render(block.data, { mode: "renderer" });
  };
}

/**
 * Register a single BlockTypeDefinition into the RendererRegistry.
 * Safe to call multiple times — uses override() to avoid duplicate-registration errors.
 */
export function registerBlockRenderer<TData extends BlockData>(
  definition: BlockTypeDefinition<TData>,
  registry: RendererRegistry = RendererRegistry.getInstance(),
): void {
  registry.override(definition.type, wrapBlockDefinition(definition));
}

/**
 * Register all basic block renderers (text, heading, list, blockquote, horizontal-rule, link, code, image).
 */
export function registerBasicRenderers(
  registry: RendererRegistry = RendererRegistry.getInstance(),
): void {
  for (const definition of BASIC_BLOCK_DEFINITIONS) {
    registerBlockRenderer(definition as BlockTypeDefinition<BlockData>, registry);
  }
}

/**
 * Register all extended block renderers (video, audio, file, table, embed, callout, alert).
 */
export function registerExtendedRenderers(
  registry: RendererRegistry = RendererRegistry.getInstance(),
): void {
  for (const definition of EXTENDED_BLOCK_DEFINITIONS) {
    registerBlockRenderer(definition as BlockTypeDefinition<BlockData>, registry);
  }
}

/**
 * Register all interactive/creative block renderers (quiz, poll, survey, manga-panel, etc.).
 */
export function registerInteractiveRenderers(
  registry: RendererRegistry = RendererRegistry.getInstance(),
): void {
  for (const definition of INTERACTIVE_CREATIVE_BLOCK_DEFINITIONS) {
    registerBlockRenderer(definition as BlockTypeDefinition<BlockData>, registry);
  }
}

/**
 * Register all Phase 2 expansion block renderers (flashcard, accordion, tabs, toggle, etc.).
 */
export function registerPhase2Renderers(
  registry: RendererRegistry = RendererRegistry.getInstance(),
): void {
  for (const definition of PHASE2_EXPANSION_BLOCK_DEFINITIONS) {
    registerBlockRenderer(definition as BlockTypeDefinition<BlockData>, registry);
  }
}

/**
 * Register ALL built-in block renderers into the RendererRegistry.
 * This is the main entry point for bootstrapping the renderer with full block support.
 */
export function registerBuiltinRenderers(
  registry: RendererRegistry = RendererRegistry.getInstance(),
): void {
  for (const definition of BUILTIN_BLOCK_DEFINITIONS) {
    registerBlockRenderer(definition as BlockTypeDefinition<BlockData>, registry);
  }
}
