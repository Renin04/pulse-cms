import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorStateSnapshot } from "../types";
import type { EditorRoot } from "../ui/EditorRoot";

export const FOCUS_NEXT_BLOCK_COMMAND_ID = "editor.focusNextBlock";
export const FOCUS_PREVIOUS_BLOCK_COMMAND_ID = "editor.focusPreviousBlock";

export function focusNextBlockCommand<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(editor: EditorRoot<TBlock>): EditorStateSnapshot<TBlock> {
  return editor.focusNextBlock();
}

export function focusPreviousBlockCommand<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(editor: EditorRoot<TBlock>): EditorStateSnapshot<TBlock> {
  return editor.focusPreviousBlock();
}
