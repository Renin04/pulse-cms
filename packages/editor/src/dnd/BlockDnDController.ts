import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorStateAdapter } from "../state/EditorStateAdapter";

export interface DropIndicator {
  index: number;
  beforeBlockId: string | null;
  afterBlockId: string | null;
}

export interface BlockDnDSnapshot {
  draggingBlockId: string | null;
  fromIndex: number;
  dropIndex: number;
  indicator: DropIndicator | null;
}

export interface BlockDnDControllerOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  state: EditorStateAdapter<TBlock>;
}

function buildDropIndicator<TBlock extends Block<BlockData>>(
  blocks: TBlock[],
  dropIndex: number,
): DropIndicator {
  const boundedDropIndex = Math.max(0, Math.min(dropIndex, blocks.length));
  const beforeBlock = blocks[boundedDropIndex] ?? null;
  const afterBlock = blocks[boundedDropIndex - 1] ?? null;

  return {
    index: boundedDropIndex,
    beforeBlockId: beforeBlock?.id ?? null,
    afterBlockId: afterBlock?.id ?? null,
  };
}

export class BlockDnDController<TBlock extends Block<BlockData> = Block<BlockData>> {
  private readonly state: EditorStateAdapter<TBlock>;
  private draggingBlockId: string | null = null;
  private fromIndex = -1;
  private dropIndex = -1;

  constructor(options: BlockDnDControllerOptions<TBlock>) {
    this.state = options.state;
  }

  startDrag(blockId: string): BlockDnDSnapshot {
    const blocks = this.state.getSnapshot().document.blocks;
    const fromIndex = blocks.findIndex((block) => block.id === blockId);

    if (fromIndex < 0) {
      throw new Error(`Cannot drag missing block "${blockId}"`);
    }

    this.draggingBlockId = blockId;
    this.fromIndex = fromIndex;
    this.dropIndex = fromIndex;

    return this.getSnapshot();
  }

  updateDropIndex(index: number): BlockDnDSnapshot {
    if (!this.draggingBlockId) {
      throw new Error("Cannot update drop index without active drag");
    }

    const blocks = this.state.getSnapshot().document.blocks;
    this.dropIndex = Math.max(0, Math.min(Math.trunc(index), blocks.length - 1));
    return this.getSnapshot();
  }

  cancel(): BlockDnDSnapshot {
    this.draggingBlockId = null;
    this.fromIndex = -1;
    this.dropIndex = -1;
    return this.getSnapshot();
  }

  drop(): BlockDnDSnapshot {
    if (!this.draggingBlockId) {
      throw new Error("Cannot drop without active drag");
    }

    const targetBlockId = this.draggingBlockId;
    const targetIndex = this.dropIndex;

    this.state.moveBlock(targetBlockId, targetIndex);
    this.cancel();
    return this.getSnapshot();
  }

  getSnapshot(): BlockDnDSnapshot {
    if (!this.draggingBlockId) {
      return {
        draggingBlockId: null,
        fromIndex: -1,
        dropIndex: -1,
        indicator: null,
      };
    }

    const blocks = this.state.getSnapshot().document.blocks;

    return {
      draggingBlockId: this.draggingBlockId,
      fromIndex: this.fromIndex,
      dropIndex: this.dropIndex,
      indicator: buildDropIndicator(blocks, this.dropIndex),
    };
  }
}

export function createBlockDnDController<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  options: BlockDnDControllerOptions<TBlock>,
): BlockDnDController<TBlock> {
  return new BlockDnDController(options);
}
