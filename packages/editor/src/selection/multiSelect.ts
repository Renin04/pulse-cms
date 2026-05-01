import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorStateAdapter } from "../state/EditorStateAdapter";

function cloneValue<TValue>(value: TValue): TValue {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as TValue;
}

function createGeneratedId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function getSelectedBlockIds<TBlock extends Block<BlockData>>(
  state: EditorStateAdapter<TBlock>,
): string[] {
  const snapshot = state.getSnapshot();

  if (snapshot.activeBlockIds.length > 0) {
    return [...snapshot.activeBlockIds];
  }

  if (snapshot.focusedBlockId) {
    return [snapshot.focusedBlockId];
  }

  return [];
}

export function selectBlockRange<TBlock extends Block<BlockData>>(
  state: EditorStateAdapter<TBlock>,
  anchorBlockId: string,
  focusBlockId: string,
): string[] {
  const blocks = state.getSnapshot().document.blocks;
  const anchorIndex = blocks.findIndex((block) => block.id === anchorBlockId);
  const focusIndex = blocks.findIndex((block) => block.id === focusBlockId);

  if (anchorIndex < 0 || focusIndex < 0) {
    throw new Error("Cannot create block range selection with missing block ids");
  }

  const start = Math.min(anchorIndex, focusIndex);
  const end = Math.max(anchorIndex, focusIndex);
  const selectedIds = blocks.slice(start, end + 1).map((block) => block.id);

  state.selectBlocks(selectedIds);
  return selectedIds;
}

export function deleteSelectedBlocks<TBlock extends Block<BlockData>>(
  state: EditorStateAdapter<TBlock>,
): string[] {
  const selectedIds = getSelectedBlockIds(state);

  for (const blockId of selectedIds) {
    state.removeBlock(blockId);
  }

  state.clearSelection("programmatic");
  return selectedIds;
}

export function duplicateSelectedBlocks<TBlock extends Block<BlockData>>(
  state: EditorStateAdapter<TBlock>,
): string[] {
  const snapshot = state.getSnapshot();
  const selectedIds = getSelectedBlockIds(state);
  const blocks = snapshot.document.blocks;

  const selectedPairs = selectedIds
    .map((blockId) => ({
      blockId,
      index: blocks.findIndex((block) => block.id === blockId),
    }))
    .filter((pair) => pair.index >= 0)
    .sort((left, right) => left.index - right.index);

  const duplicatedIds: string[] = [];

  selectedPairs.forEach((pair, offset) => {
    const sourceBlock = blocks[pair.index];
    const timestamp = new Date().toISOString();
    const clonedBlock = {
      ...cloneValue(sourceBlock),
      id: createGeneratedId(sourceBlock.type),
      createdAt: timestamp,
      updatedAt: timestamp,
    } as TBlock;

    state.insertBlock(clonedBlock, pair.index + 1 + offset);
    duplicatedIds.push(clonedBlock.id);
  });

  state.selectBlocks(duplicatedIds);

  return duplicatedIds;
}
