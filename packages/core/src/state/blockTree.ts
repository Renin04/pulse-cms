import type { Block, BlockData } from "../types/block";

export type NestedBlock<TBlock extends Block<BlockData> = Block<BlockData>> =
  TBlock & {
    children: NestedBlock<TBlock>[];
  };

interface BlockTreeMaps<TBlock extends Block<BlockData>> {
  byId: Map<string, TBlock>;
  childIdsByParentId: Map<string, string[]>;
}

function createTreeMaps<TBlock extends Block<BlockData>>(
  blocks: TBlock[],
): BlockTreeMaps<TBlock> {
  const byId = new Map<string, TBlock>();
  const childIdsByParentId = new Map<string, string[]>();

  for (const block of blocks) {
    if (byId.has(block.id)) {
      throw new Error(`Duplicate block id "${block.id}" found in block tree`);
    }

    byId.set(block.id, block);
  }

  for (const block of blocks) {
    if (!block.parentId) {
      continue;
    }

    if (block.parentId === block.id) {
      throw new Error(`Block "${block.id}" cannot reference itself as parent`);
    }

    if (!byId.has(block.parentId)) {
      throw new Error(
        `Block "${block.id}" references missing parent "${block.parentId}"`,
      );
    }

    const siblings = childIdsByParentId.get(block.parentId) ?? [];
    siblings.push(block.id);
    childIdsByParentId.set(block.parentId, siblings);
  }

  return {
    byId,
    childIdsByParentId,
  };
}

function detectCycles(
  childIdsByParentId: Map<string, string[]>,
  blockIds: string[],
): void {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (blockId: string): void => {
    if (visited.has(blockId)) {
      return;
    }

    if (visiting.has(blockId)) {
      throw new Error(`Cycle detected in block tree at "${blockId}"`);
    }

    visiting.add(blockId);
    const children = childIdsByParentId.get(blockId) ?? [];
    for (const childId of children) {
      visit(childId);
    }
    visiting.delete(blockId);
    visited.add(blockId);
  };

  for (const blockId of blockIds) {
    visit(blockId);
  }
}

export function validateBlockTree<TBlock extends Block<BlockData>>(
  blocks: TBlock[],
): void {
  const { childIdsByParentId, byId } = createTreeMaps(blocks);
  detectCycles(childIdsByParentId, Array.from(byId.keys()));
}

export function getChildBlocks<TBlock extends Block<BlockData>>(
  blocks: TBlock[],
  parentId: string,
): TBlock[] {
  validateBlockTree(blocks);
  return blocks.filter((block) => block.parentId === parentId);
}

export function getDescendantBlocks<TBlock extends Block<BlockData>>(
  blocks: TBlock[],
  rootId: string,
): TBlock[] {
  const { byId, childIdsByParentId } = createTreeMaps(blocks);
  if (!byId.has(rootId)) {
    throw new Error(`Cannot resolve descendants for missing block "${rootId}"`);
  }

  detectCycles(childIdsByParentId, Array.from(byId.keys()));

  const descendants: TBlock[] = [];
  const stack = [...(childIdsByParentId.get(rootId) ?? [])];

  while (stack.length > 0) {
    const blockId = stack.shift() as string;
    const block = byId.get(blockId);
    if (!block) {
      continue;
    }

    descendants.push(block);
    stack.unshift(...(childIdsByParentId.get(blockId) ?? []));
  }

  return descendants;
}

export function buildNestedBlockTree<TBlock extends Block<BlockData>>(
  blocks: TBlock[],
): NestedBlock<TBlock>[] {
  const { byId, childIdsByParentId } = createTreeMaps(blocks);
  detectCycles(childIdsByParentId, Array.from(byId.keys()));

  const buildNode = (blockId: string): NestedBlock<TBlock> => {
    const block = byId.get(blockId);
    if (!block) {
      throw new Error(`Missing block "${blockId}" while building nested tree`);
    }

    const children = (childIdsByParentId.get(blockId) ?? []).map(buildNode);
    return {
      ...block,
      children,
    };
  };

  const rootIds = blocks.filter((block) => !block.parentId).map((block) => block.id);
  return rootIds.map(buildNode);
}
