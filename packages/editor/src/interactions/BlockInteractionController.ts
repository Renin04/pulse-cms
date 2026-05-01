export interface BlockInteractionSnapshot {
  hoveredBlockId: string | null;
  draggingBlockId: string | null;
  isDragging: boolean;
}

export class BlockInteractionController {
  private hoveredBlockId: string | null = null;
  private draggingBlockId: string | null = null;

  setHoveredBlock(blockId: string | null): BlockInteractionSnapshot {
    this.hoveredBlockId = blockId;
    return this.getSnapshot();
  }

  startDrag(blockId: string): BlockInteractionSnapshot {
    this.draggingBlockId = blockId;
    this.hoveredBlockId = blockId;
    return this.getSnapshot();
  }

  stopDrag(): BlockInteractionSnapshot {
    this.draggingBlockId = null;
    return this.getSnapshot();
  }

  clear(): BlockInteractionSnapshot {
    this.hoveredBlockId = null;
    this.draggingBlockId = null;
    return this.getSnapshot();
  }

  getSnapshot(): BlockInteractionSnapshot {
    return {
      hoveredBlockId: this.hoveredBlockId,
      draggingBlockId: this.draggingBlockId,
      isDragging: Boolean(this.draggingBlockId),
    };
  }
}

export function createBlockInteractionController(): BlockInteractionController {
  return new BlockInteractionController();
}
