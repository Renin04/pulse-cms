import type { Block, BlockData } from "../../core/src/types/block";
import type { EditorStateSnapshot } from "../../editor/src/types";
import type { CreateEditorStateOptions } from "../../editor/src/state/EditorStateAdapter";

export type { EditorStateSnapshot };
export type { CreateEditorStateOptions };

export interface UseEditorOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> extends CreateEditorStateOptions<TBlock> {
  onChange?: (snapshot: EditorStateSnapshot<TBlock>) => void;
}

export interface UseEditorReturn<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  snapshot: EditorStateSnapshot<TBlock>;
  insertBlock: (block: TBlock, index?: number) => void;
  updateBlock: (blockId: string, updater: (block: TBlock) => TBlock) => void;
  removeBlock: (blockId: string) => void;
  moveBlock: (blockId: string, toIndex: number) => void;
  setFocus: (blockId: string | null) => void;
  clearFocus: () => void;
  selectBlocks: (blockIds: string[]) => void;
  clearSelection: () => void;
}
