import {
  createEditorStateAdapter,
  type EditorStateAdapter,
} from "../../editor/src/state/EditorStateAdapter";
import type { Block, BlockData } from "../../core/src/types/block";
import type { EditorStateSnapshot } from "../../editor/src/types";
import type { UseEditorOptions } from "./types";

export interface EditorBridgeOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> extends UseEditorOptions<TBlock> {}

export class EditorBridge<TBlock extends Block<BlockData> = Block<BlockData>> {
  private readonly adapter: EditorStateAdapter<TBlock>;
  private readonly externalListeners = new Set<
    (snapshot: EditorStateSnapshot<TBlock>) => void
  >();

  constructor(options: EditorBridgeOptions<TBlock> = {}) {
    this.adapter = createEditorStateAdapter<TBlock>(options);

    this.adapter.subscribe((snapshot) => {
      if (options.onChange) {
        options.onChange(snapshot);
      }
      for (const listener of this.externalListeners) {
        listener(snapshot);
      }
    });
  }

  getSnapshot(): EditorStateSnapshot<TBlock> {
    return this.adapter.getSnapshot();
  }

  subscribe(listener: (snapshot: EditorStateSnapshot<TBlock>) => void): () => void {
    this.externalListeners.add(listener);
    return () => {
      this.externalListeners.delete(listener);
    };
  }

  insertBlock(block: TBlock, index?: number): void {
    this.adapter.insertBlock(block, index);
  }

  updateBlock(blockId: string, updater: (block: TBlock) => TBlock): void {
    this.adapter.updateBlock(blockId, updater);
  }

  removeBlock(blockId: string): void {
    this.adapter.removeBlock(blockId);
  }

  moveBlock(blockId: string, toIndex: number): void {
    this.adapter.moveBlock(blockId, toIndex);
  }

  setFocus(blockId: string | null): void {
    this.adapter.setFocusedBlock(blockId);
  }

  clearFocus(): void {
    this.adapter.setFocusedBlock(null);
  }

  selectBlocks(blockIds: string[]): void {
    this.adapter.selectBlocks(blockIds);
  }

  clearSelection(): void {
    this.adapter.clearSelection();
  }

  getAdapter(): EditorStateAdapter<TBlock> {
    return this.adapter;
  }
}

export function createEditorBridge<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(options?: EditorBridgeOptions<TBlock>): EditorBridge<TBlock> {
  return new EditorBridge(options);
}
