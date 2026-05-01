import {
  DocumentState,
  type CreateDocumentOptions,
  type ExportBlocksOptions,
  type ImportBlocksOptions,
} from "../../../core/src/state/DocumentState";
import {
  SelectionState,
  type SelectionClearReason,
  type SelectionRange,
} from "../../../core/src/state/SelectionState";
import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorStateSnapshot } from "../types";

type BlockUpdater<TBlock extends Block<BlockData>> = (block: TBlock) => TBlock;

export interface CreateEditorStateOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  document?: CreateDocumentOptions<TBlock>;
  documentState?: DocumentState<TBlock>;
  selectionState?: SelectionState;
}

export type EditorStateChangeReason = "document" | "selection" | "focus";

export type EditorStateChangeListener<
  TBlock extends Block<BlockData> = Block<BlockData>,
> = (snapshot: EditorStateSnapshot<TBlock>, reason: EditorStateChangeReason) => void;

export class EditorStateAdapter<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  private readonly documentState: DocumentState<TBlock>;
  private readonly selectionState: SelectionState;
  private readonly listeners = new Set<EditorStateChangeListener<TBlock>>();
  private focusedBlockId: string | null = null;

  constructor(options: CreateEditorStateOptions<TBlock> = {}) {
    this.documentState = options.documentState ?? new DocumentState<TBlock>(options.document);
    this.selectionState = options.selectionState ?? new SelectionState();
    this.ensureValidFocus();
  }

  getDocumentState(): DocumentState<TBlock> {
    return this.documentState;
  }

  getSelectionState(): SelectionState {
    return this.selectionState;
  }

  subscribe(listener: EditorStateChangeListener<TBlock>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): EditorStateSnapshot<TBlock> {
    const documentSnapshot = this.documentState.getSnapshot();
    const selectionSnapshot = this.selectionState.getSnapshot();
    const blockIds = documentSnapshot.blocks.map((block) => block.id);
    const focusedBlockId = this.resolveFocusedBlockId(blockIds, selectionSnapshot);

    return {
      document: documentSnapshot,
      selection: selectionSnapshot,
      focusedBlockId,
      activeBlockIds: this.resolveActiveBlockIds(selectionSnapshot, focusedBlockId),
    };
  }

  setFocusedBlock(blockId: string | null, offset: number = 0): EditorStateSnapshot<TBlock> {
    if (blockId === null) {
      this.focusedBlockId = null;
      this.selectionState.clear("programmatic");
      return this.emitChange("focus");
    }

    if (!this.documentState.getBlockById(blockId)) {
      throw new Error(`Cannot focus missing block "${blockId}"`);
    }

    this.focusedBlockId = blockId;
    this.selectionState.setCursor(blockId, offset);
    return this.emitChange("focus");
  }

  focusNextBlock(): EditorStateSnapshot<TBlock> {
    const blocks = this.documentState.getBlocks();
    if (blocks.length === 0) {
      return this.setFocusedBlock(null);
    }

    const currentIndex = this.focusedBlockId
      ? blocks.findIndex((block) => block.id === this.focusedBlockId)
      : -1;
    const nextIndex = Math.min(currentIndex + 1, blocks.length - 1);

    return this.setFocusedBlock(blocks[nextIndex].id);
  }

  focusPreviousBlock(): EditorStateSnapshot<TBlock> {
    const blocks = this.documentState.getBlocks();
    if (blocks.length === 0) {
      return this.setFocusedBlock(null);
    }

    const currentIndex = this.focusedBlockId
      ? blocks.findIndex((block) => block.id === this.focusedBlockId)
      : 0;
    const nextIndex = Math.max(currentIndex - 1, 0);

    return this.setFocusedBlock(blocks[nextIndex].id);
  }

  insertBlock(block: TBlock, index?: number): EditorStateSnapshot<TBlock> {
    this.documentState.insertBlock(block, index);
    this.ensureValidFocus();
    return this.emitChange("document");
  }

  updateBlock(blockId: string, updater: BlockUpdater<TBlock>): EditorStateSnapshot<TBlock> {
    this.documentState.updateBlock(blockId, updater);
    this.ensureValidFocus();
    return this.emitChange("document");
  }

  removeBlock(blockId: string): EditorStateSnapshot<TBlock> {
    this.documentState.removeBlock(blockId);
    this.ensureValidFocus();
    return this.emitChange("document");
  }

  moveBlock(blockId: string, toIndex: number): EditorStateSnapshot<TBlock> {
    this.documentState.moveBlock(blockId, toIndex);
    this.ensureValidFocus();
    return this.emitChange("document");
  }

  markDocumentSaved(savedAt?: string): EditorStateSnapshot<TBlock> {
    this.documentState.markSaved(savedAt);
    this.ensureValidFocus();
    return this.emitChange("document");
  }

  exportBlocks(options: ExportBlocksOptions = {}): string {
    return this.documentState.exportBlocks(options);
  }

  importBlocks(
    serialized: string,
    options: ImportBlocksOptions = {},
  ): EditorStateSnapshot<TBlock> {
    this.documentState.importBlocks(serialized, options);
    this.ensureValidFocus();
    return this.emitChange("document");
  }

  setSelectionRange(range: SelectionRange): EditorStateSnapshot<TBlock> {
    this.selectionState.setRange(range);
    this.ensureValidFocus();
    return this.emitChange("selection");
  }

  selectBlocks(blockIds: string[]): EditorStateSnapshot<TBlock> {
    this.selectionState.selectBlocks(blockIds);
    this.ensureValidFocus();
    return this.emitChange("selection");
  }

  clearSelection(reason: SelectionClearReason = "programmatic"): EditorStateSnapshot<TBlock> {
    this.selectionState.clear(reason);
    if (reason === "blur") {
      this.focusedBlockId = null;
    } else {
      this.ensureValidFocus();
    }

    return this.emitChange("selection");
  }

  private ensureValidFocus(): void {
    const blocks = this.documentState.getBlocks();
    const blockIds = new Set(blocks.map((block) => block.id));
    const selectionSnapshot = this.selectionState.getSnapshot();

    if (selectionSnapshot.cursor && blockIds.has(selectionSnapshot.cursor.blockId)) {
      this.focusedBlockId = selectionSnapshot.cursor.blockId;
      return;
    }

    if (this.focusedBlockId && blockIds.has(this.focusedBlockId)) {
      return;
    }

    if (blocks.length === 0) {
      this.focusedBlockId = null;
      this.selectionState.clear("programmatic");
      return;
    }

    this.focusedBlockId = blocks[0].id;
    this.selectionState.setCursor(this.focusedBlockId, 0);
  }

  private resolveFocusedBlockId(
    blockIds: string[],
    selectionSnapshot: ReturnType<SelectionState["getSnapshot"]>,
  ): string | null {
    const blockIdSet = new Set(blockIds);

    if (selectionSnapshot.cursor && blockIdSet.has(selectionSnapshot.cursor.blockId)) {
      this.focusedBlockId = selectionSnapshot.cursor.blockId;
      return this.focusedBlockId;
    }

    if (this.focusedBlockId && blockIdSet.has(this.focusedBlockId)) {
      return this.focusedBlockId;
    }

    this.focusedBlockId = blockIds[0] ?? null;
    return this.focusedBlockId;
  }

  private resolveActiveBlockIds(
    selectionSnapshot: ReturnType<SelectionState["getSnapshot"]>,
    focusedBlockId: string | null,
  ): string[] {
    if (selectionSnapshot.multiBlockIds.length > 0) {
      return [...selectionSnapshot.multiBlockIds];
    }

    return focusedBlockId ? [focusedBlockId] : [];
  }

  private emitChange(reason: EditorStateChangeReason): EditorStateSnapshot<TBlock> {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot, reason);
    }
    return snapshot;
  }
}

export function createEditorStateAdapter<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  options: CreateEditorStateOptions<TBlock> = {},
): EditorStateAdapter<TBlock> {
  return new EditorStateAdapter(options);
}
