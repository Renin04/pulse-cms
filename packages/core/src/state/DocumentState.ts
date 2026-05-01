import type { Block, BlockData } from "../types/block";
import {
  cloneBlockSubtree,
  type CloneSubtreeOptions,
} from "./blockClone";
import {
  createBlockTransferPayload,
  deserializeBlockTransferPayload,
  serializeBlockTransferPayload,
} from "./blockTransfer";
import {
  getChildBlocks as getTreeChildBlocks,
  getDescendantBlocks as getTreeDescendantBlocks,
  validateBlockTree,
} from "./blockTree";

export interface DocumentMetadata {
  title?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
  revision?: number;
  savedRevision?: number;
  lastSavedAt?: string;
  [key: string]: unknown;
}

export interface DocumentSnapshot<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  id: string;
  blocks: TBlock[];
  metadata: DocumentMetadata;
}

export interface CreateDocumentOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  id?: string;
  blocks?: TBlock[];
  metadata?: Partial<DocumentMetadata>;
}

export interface ExportBlocksOptions {
  blockIds?: string[];
  exportedAt?: string;
}

export type ImportBlocksMode = "append" | "replace" | "insert";

export interface ImportBlocksOptions {
  mode?: ImportBlocksMode;
  index?: number;
}

export interface InsertClonedSubtreeOptions extends CloneSubtreeOptions {
  index?: number;
}

function cloneValue<TValue>(value: TValue): TValue {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as TValue;
}

function createDocumentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `doc_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

function createDefaultMetadata(
  metadata?: Partial<DocumentMetadata>,
): DocumentMetadata {
  const now = new Date().toISOString();
  const revision = metadata?.revision ?? 0;
  const savedRevision = metadata?.savedRevision ?? revision;

  return {
    createdAt: metadata?.createdAt ?? now,
    updatedAt: metadata?.updatedAt ?? now,
    revision,
    savedRevision,
    ...metadata,
  };
}

export class DocumentState<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  private snapshot: DocumentSnapshot<TBlock>;

  constructor(options: CreateDocumentOptions<TBlock> = {}) {
    this.snapshot = {
      id: options.id ?? createDocumentId(),
      blocks: cloneValue(options.blocks ?? []),
      metadata: createDefaultMetadata(options.metadata),
    };
    validateBlockTree(this.snapshot.blocks);
  }

  getSnapshot(): DocumentSnapshot<TBlock> {
    return cloneValue(this.snapshot);
  }

  replaceSnapshot(nextSnapshot: DocumentSnapshot<TBlock>): DocumentSnapshot<TBlock> {
    validateBlockTree(nextSnapshot.blocks);
    this.snapshot = cloneValue(nextSnapshot);
    this.touch();
    return this.getSnapshot();
  }

  getBlocks(): TBlock[] {
    return cloneValue(this.snapshot.blocks);
  }

  getBlockById(id: string): TBlock | undefined {
    const found = this.snapshot.blocks.find((block) => block.id === id);
    return found ? cloneValue(found) : undefined;
  }

  setBlocks(blocks: TBlock[]): DocumentSnapshot<TBlock> {
    validateBlockTree(blocks);
    this.snapshot = {
      ...this.snapshot,
      blocks: cloneValue(blocks),
    };
    this.touch();
    return this.getSnapshot();
  }

  insertBlock(
    block: TBlock,
    index: number = this.snapshot.blocks.length,
  ): DocumentSnapshot<TBlock> {
    const nextBlocks = [...this.snapshot.blocks];
    const boundedIndex = Math.max(0, Math.min(index, nextBlocks.length));
    nextBlocks.splice(boundedIndex, 0, cloneValue(block));
    validateBlockTree(nextBlocks);

    this.snapshot = {
      ...this.snapshot,
      blocks: nextBlocks,
    };
    this.touch();
    return this.getSnapshot();
  }

  updateBlock(
    blockId: string,
    updater: (block: TBlock) => TBlock,
  ): DocumentSnapshot<TBlock> {
    const blockIndex = this.snapshot.blocks.findIndex((block) => block.id === blockId);
    if (blockIndex < 0) {
      throw new Error(`Block with id "${blockId}" was not found`);
    }

    const currentBlock = this.snapshot.blocks[blockIndex];
    const nextBlock = cloneValue(updater(cloneValue(currentBlock)));
    const nextBlocks = [...this.snapshot.blocks];
    nextBlocks[blockIndex] = nextBlock;
    validateBlockTree(nextBlocks);

    this.snapshot = {
      ...this.snapshot,
      blocks: nextBlocks,
    };
    this.touch();
    return this.getSnapshot();
  }

  removeBlock(blockId: string): DocumentSnapshot<TBlock> {
    const currentBlock = this.snapshot.blocks.find((block) => block.id === blockId);
    if (!currentBlock) {
      return this.getSnapshot();
    }

    const descendantIds = getTreeDescendantBlocks(this.snapshot.blocks, blockId).map(
      (block) => block.id,
    );
    const removedIds = new Set([blockId, ...descendantIds]);
    const nextBlocks = this.snapshot.blocks.filter((block) => !removedIds.has(block.id));
    validateBlockTree(nextBlocks);

    this.snapshot = {
      ...this.snapshot,
      blocks: nextBlocks,
    };
    this.touch();
    return this.getSnapshot();
  }

  moveBlock(blockId: string, toIndex: number): DocumentSnapshot<TBlock> {
    const fromIndex = this.snapshot.blocks.findIndex((block) => block.id === blockId);
    if (fromIndex < 0) {
      throw new Error(`Block with id "${blockId}" was not found`);
    }

    const nextBlocks = [...this.snapshot.blocks];
    const [movedBlock] = nextBlocks.splice(fromIndex, 1);
    const boundedIndex = Math.max(0, Math.min(toIndex, nextBlocks.length));
    nextBlocks.splice(boundedIndex, 0, movedBlock);
    validateBlockTree(nextBlocks);

    this.snapshot = {
      ...this.snapshot,
      blocks: nextBlocks,
    };
    this.touch();
    return this.getSnapshot();
  }

  updateMetadata(metadata: Partial<DocumentMetadata>): DocumentSnapshot<TBlock> {
    this.snapshot = {
      ...this.snapshot,
      metadata: {
        ...this.snapshot.metadata,
        ...cloneValue(metadata),
      },
    };
    this.touch();
    return this.getSnapshot();
  }

  markSaved(savedAt: string = new Date().toISOString()): DocumentSnapshot<TBlock> {
    const revision = this.getRevision();
    this.snapshot = {
      ...this.snapshot,
      metadata: {
        ...this.snapshot.metadata,
        updatedAt: savedAt,
        lastSavedAt: savedAt,
        savedRevision: revision,
      },
    };
    return this.getSnapshot();
  }

  validateTree(): void {
    validateBlockTree(this.snapshot.blocks);
  }

  getChildBlocks(parentId: string): TBlock[] {
    const children = getTreeChildBlocks(this.snapshot.blocks, parentId);
    return cloneValue(children);
  }

  getDescendantBlocks(rootId: string): TBlock[] {
    const descendants = getTreeDescendantBlocks(this.snapshot.blocks, rootId);
    return cloneValue(descendants);
  }

  reparentBlock(
    blockId: string,
    parentId: string | null,
  ): DocumentSnapshot<TBlock> {
    if (blockId === parentId) {
      throw new Error(`Block "${blockId}" cannot be its own parent`);
    }

    const blockExists = this.snapshot.blocks.some((block) => block.id === blockId);
    if (!blockExists) {
      throw new Error(`Block with id "${blockId}" was not found`);
    }

    if (
      parentId &&
      !this.snapshot.blocks.some((block) => block.id === parentId)
    ) {
      throw new Error(`Cannot reparent block "${blockId}" to missing parent "${parentId}"`);
    }

    const nextBlocks = this.snapshot.blocks.map((block) =>
      block.id === blockId ? { ...block, parentId } : block,
    ) as TBlock[];
    validateBlockTree(nextBlocks);

    this.snapshot = {
      ...this.snapshot,
      blocks: nextBlocks,
    };
    this.touch();
    return this.getSnapshot();
  }

  cloneSubtree(
    rootId: string,
    options: CloneSubtreeOptions = {},
  ): TBlock[] {
    return cloneValue(cloneBlockSubtree(this.snapshot.blocks, rootId, options));
  }

  insertClonedSubtree(
    rootId: string,
    options: InsertClonedSubtreeOptions = {},
  ): DocumentSnapshot<TBlock> {
    const clonedBlocks = cloneBlockSubtree(this.snapshot.blocks, rootId, options);
    const boundedIndex = this.resolveInsertIndex(options.index);
    const nextBlocks = [...this.snapshot.blocks];
    nextBlocks.splice(boundedIndex, 0, ...clonedBlocks);

    this.snapshot = {
      ...this.snapshot,
      blocks: nextBlocks,
    };
    this.touch();
    return this.getSnapshot();
  }

  exportBlocks(options: ExportBlocksOptions = {}): string {
    const blocks = this.resolveBlocksForExport(options.blockIds);
    const payload = createBlockTransferPayload<TBlock>({
      blocks,
      sourceDocumentId: this.snapshot.id,
      exportedAt: options.exportedAt,
    });

    return serializeBlockTransferPayload(payload);
  }

  importBlocks(
    serialized: string,
    options: ImportBlocksOptions = {},
  ): DocumentSnapshot<TBlock> {
    const payload = deserializeBlockTransferPayload<TBlock>(serialized);
    const mode = options.mode ?? "append";
    const importedBlocks = cloneValue(payload.blocks);

    let nextBlocks: TBlock[];
    if (mode === "append") {
      nextBlocks = [...this.snapshot.blocks, ...importedBlocks];
    } else if (mode === "replace") {
      nextBlocks = importedBlocks;
    } else if (mode === "insert") {
      const boundedIndex = this.resolveInsertIndex(options.index);
      nextBlocks = [...this.snapshot.blocks];
      nextBlocks.splice(boundedIndex, 0, ...importedBlocks);
    } else {
      throw new Error(`Invalid import mode "${mode}"`);
    }
    validateBlockTree(nextBlocks);

    this.snapshot = {
      ...this.snapshot,
      blocks: nextBlocks,
    };
    this.touch();
    return this.getSnapshot();
  }

  serialize(): string {
    return JSON.stringify(this.snapshot);
  }

  static deserialize<TBlock extends Block<BlockData> = Block<BlockData>>(
    serialized: string,
  ): DocumentState<TBlock> {
    const parsed = JSON.parse(serialized) as DocumentSnapshot<TBlock>;

    if (!parsed.id || !Array.isArray(parsed.blocks) || !parsed.metadata) {
      throw new Error("Invalid serialized document snapshot");
    }

    return new DocumentState<TBlock>({
      id: parsed.id,
      blocks: parsed.blocks,
      metadata: parsed.metadata,
    });
  }

  private touch(): void {
    const nextRevision = this.getRevision() + 1;
    this.snapshot = {
      ...this.snapshot,
      metadata: {
        ...this.snapshot.metadata,
        updatedAt: new Date().toISOString(),
        revision: nextRevision,
      },
    };
  }

  private getRevision(): number {
    return typeof this.snapshot.metadata.revision === "number"
      ? this.snapshot.metadata.revision
      : 0;
  }

  private resolveBlocksForExport(blockIds?: string[]): TBlock[] {
    if (!blockIds) {
      return cloneValue(this.snapshot.blocks);
    }

    const blocksById = new Map(
      this.snapshot.blocks.map((block) => [block.id, block] as const),
    );
    const requestedBlockIds = new Set<string>();

    return blockIds.map((blockId) => {
      if (requestedBlockIds.has(blockId)) {
        throw new Error(`Duplicate block id "${blockId}" in export request`);
      }

      requestedBlockIds.add(blockId);

      const block = blocksById.get(blockId);
      if (!block) {
        throw new Error(`Cannot export missing block "${blockId}"`);
      }

      return cloneValue(block);
    });
  }

  private resolveInsertIndex(index?: number): number {
    if (index === undefined) {
      return this.snapshot.blocks.length;
    }

    if (!Number.isFinite(index)) {
      throw new Error('Import option "index" must be a finite number');
    }

    const bounded = Math.max(0, Math.min(Math.trunc(index), this.snapshot.blocks.length));
    return bounded;
  }
}
