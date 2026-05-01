import type { Block, BlockData } from "../types/block";
import { getDescendantBlocks, validateBlockTree } from "./blockTree";

export interface CloneBlockOptions {
  idGenerator?: (sourceId: string) => string;
  now?: string;
}

export interface CloneSubtreeOptions extends CloneBlockOptions {
  includeRoot?: boolean;
}

function cloneValue<TValue>(value: TValue): TValue {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as TValue;
}

function defaultIdGenerator(sourceId: string): string {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

  return `${sourceId}_clone_${randomPart}`;
}

export function cloneBlock<TBlock extends Block<BlockData>>(
  block: TBlock,
  options: CloneBlockOptions = {},
): TBlock {
  const now = options.now ?? new Date().toISOString();
  const nextId = (options.idGenerator ?? defaultIdGenerator)(block.id);

  return {
    ...cloneValue(block),
    id: nextId,
    createdAt: now,
    updatedAt: now,
  };
}

export function cloneBlockSubtree<TBlock extends Block<BlockData>>(
  blocks: TBlock[],
  rootId: string,
  options: CloneSubtreeOptions = {},
): TBlock[] {
  validateBlockTree(blocks);

  const root = blocks.find((block) => block.id === rootId);
  if (!root) {
    throw new Error(`Cannot clone missing root block "${rootId}"`);
  }

  const descendants = getDescendantBlocks(blocks, rootId);
  const subtree = options.includeRoot === false ? descendants : [root, ...descendants];

  const idGenerator = options.idGenerator ?? defaultIdGenerator;
  const now = options.now ?? new Date().toISOString();
  const nextIdBySourceId = new Map<string, string>();

  for (const block of subtree) {
    nextIdBySourceId.set(block.id, idGenerator(block.id));
  }

  return subtree.map((block) => {
    const nextId = nextIdBySourceId.get(block.id);
    if (!nextId) {
      throw new Error(`Missing clone id mapping for block "${block.id}"`);
    }

    const nextParentId =
      block.parentId && nextIdBySourceId.has(block.parentId)
        ? nextIdBySourceId.get(block.parentId) ?? null
        : null;

    return {
      ...cloneValue(block),
      id: nextId,
      parentId: nextParentId,
      createdAt: now,
      updatedAt: now,
    };
  });
}
