import type { BlockData } from "@pulse/core";
import type { BlockRendererFn } from "../types/renderer";

/**
 * Registry that maps block types to their renderer functions.
 * Follows the same singleton + resetInstance pattern as BlockRegistry in @pulse/core.
 */
export class RendererRegistry {
  private static instance: RendererRegistry | null = null;

  private readonly renderers = new Map<string, BlockRendererFn<BlockData>>();

  private constructor() {}

  static getInstance(): RendererRegistry {
    if (!RendererRegistry.instance) {
      RendererRegistry.instance = new RendererRegistry();
    }
    return RendererRegistry.instance;
  }

  static resetInstance(): void {
    RendererRegistry.instance = null;
  }

  /**
   * Register a renderer function for a block type.
   * Throws if the type is already registered.
   */
  register<TData extends BlockData>(
    type: string,
    fn: BlockRendererFn<TData>,
  ): void {
    if (!type || typeof type !== "string") {
      throw new Error("Block type must be a non-empty string");
    }
    if (this.renderers.has(type)) {
      throw new Error(`Renderer for block type "${type}" is already registered`);
    }
    this.renderers.set(type, fn as BlockRendererFn<BlockData>);
  }

  /**
   * Replace an existing renderer (or register if absent).
   */
  override<TData extends BlockData>(
    type: string,
    fn: BlockRendererFn<TData>,
  ): void {
    if (!type || typeof type !== "string") {
      throw new Error("Block type must be a non-empty string");
    }
    this.renderers.set(type, fn as BlockRendererFn<BlockData>);
  }

  /**
   * Unregister a renderer. Returns true if it existed.
   */
  unregister(type: string): boolean {
    return this.renderers.delete(type);
  }

  /**
   * Check whether a renderer is registered for the given type.
   */
  has(type: string): boolean {
    return this.renderers.has(type);
  }

  /**
   * Retrieve the renderer function for a block type, or undefined.
   */
  get<TData extends BlockData>(
    type: string,
  ): BlockRendererFn<TData> | undefined {
    return this.renderers.get(type) as BlockRendererFn<TData> | undefined;
  }

  /**
   * Return all registered block type names.
   */
  registeredTypes(): string[] {
    return Array.from(this.renderers.keys());
  }
}
