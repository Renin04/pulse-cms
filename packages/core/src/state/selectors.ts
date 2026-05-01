import type { Block, BlockData } from "../types/block";
import type { DocumentSnapshot } from "./DocumentState";
import type { HistorySnapshot } from "./HistoryState";
import type { SelectionSnapshot } from "./SelectionState";

export interface CoreStateSnapshot<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  document: DocumentSnapshot<TBlock>;
  selection: SelectionSnapshot;
  history: HistorySnapshot<DocumentSnapshot<TBlock>>;
}

export function selectDocument<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(state: CoreStateSnapshot<TBlock>): DocumentSnapshot<TBlock> {
  return state.document;
}

export function selectBlocks<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(state: CoreStateSnapshot<TBlock>): TBlock[] {
  return state.document.blocks;
}

export function selectBlockById<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(state: CoreStateSnapshot<TBlock>, blockId: string): TBlock | undefined {
  return state.document.blocks.find((block) => block.id === blockId);
}

export function selectBlocksByType<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(state: CoreStateSnapshot<TBlock>, blockType: string): TBlock[] {
  return state.document.blocks.filter((block) => block.type === blockType);
}

export function selectDocumentTitle<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(state: CoreStateSnapshot<TBlock>): string | undefined {
  return state.document.metadata.title;
}

export function selectSelectedBlockIds<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(state: CoreStateSnapshot<TBlock>): string[] {
  if (state.selection.multiBlockIds.length > 0) {
    return state.selection.multiBlockIds;
  }

  if (state.selection.range) {
    const ids = [
      state.selection.range.start.blockId,
      state.selection.range.end.blockId,
    ];
    return Array.from(new Set(ids));
  }

  if (state.selection.cursor) {
    return [state.selection.cursor.blockId];
  }

  return [];
}

export function selectCanUndo<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(state: CoreStateSnapshot<TBlock>): boolean {
  return state.history.past.length > 0;
}

export function selectCanRedo<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(state: CoreStateSnapshot<TBlock>): boolean {
  return state.history.future.length > 0;
}

export function selectHistorySize<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(state: CoreStateSnapshot<TBlock>): number {
  return state.history.past.length + 1 + state.history.future.length;
}

export function selectDocumentRevision<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(state: CoreStateSnapshot<TBlock>): number {
  return typeof state.document.metadata.revision === "number"
    ? state.document.metadata.revision
    : 0;
}

export function selectSavedRevision<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(state: CoreStateSnapshot<TBlock>): number {
  return typeof state.document.metadata.savedRevision === "number"
    ? state.document.metadata.savedRevision
    : 0;
}

export function selectLastSavedAt<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(state: CoreStateSnapshot<TBlock>): string | undefined {
  return typeof state.document.metadata.lastSavedAt === "string"
    ? state.document.metadata.lastSavedAt
    : undefined;
}

export function selectIsDirty<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(state: CoreStateSnapshot<TBlock>): boolean {
  return selectDocumentRevision(state) > selectSavedRevision(state);
}
