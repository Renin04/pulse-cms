import type { DocumentSnapshot } from "../../core/src/state/DocumentState";
import type { SelectionSnapshot } from "../../core/src/state/SelectionState";
import type { Block, BlockData } from "../../core/src/types/block";

export interface EditorStateSnapshot<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  document: DocumentSnapshot<TBlock>;
  selection: SelectionSnapshot;
  focusedBlockId: string | null;
  activeBlockIds: string[];
}

export interface EditorBlockRenderContext<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  block: TBlock;
  index: number;
  isFocused: boolean;
  isSelected: boolean;
}

export type EditorBlockRenderer<
  TBlock extends Block<BlockData> = Block<BlockData>,
> = (context: EditorBlockRenderContext<TBlock>) => string;
