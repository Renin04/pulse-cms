import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorCommand, EditorCommandRegistry } from "./CommandRegistry";

export const BLOCK_DUPLICATE_COMMAND_ID = "editor.block.duplicate";
export const BLOCK_DELETE_COMMAND_ID = "editor.block.delete";
export const BLOCK_MOVE_UP_COMMAND_ID = "editor.block.moveUp";
export const BLOCK_MOVE_DOWN_COMMAND_ID = "editor.block.moveDown";

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

function getFocusedBlockId<TBlock extends Block<BlockData>>(
  stateSnapshot: {
    focusedBlockId: string | null;
    activeBlockIds: string[];
    document: { blocks: TBlock[] };
  },
): string | null {
  if (stateSnapshot.focusedBlockId) {
    return stateSnapshot.focusedBlockId;
  }

  if (stateSnapshot.activeBlockIds.length > 0) {
    return stateSnapshot.activeBlockIds[0];
  }

  return null;
}

export function createBlockActionCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): EditorCommand<TBlock>[] {
  return [
    {
      id: BLOCK_DUPLICATE_COMMAND_ID,
      title: "Duplicate block",
      category: "Block",
      menuPath: ["block", "actions"],
      slashTrigger: "duplicate-block",
      aliases: ["clone-block"],
      keywords: ["copy", "repeat"],
      execute(context) {
        const snapshot = context.state.getSnapshot();
        const blockId = getFocusedBlockId(snapshot);
        if (!blockId) {
          return;
        }

        const blockIndex = snapshot.document.blocks.findIndex((block) => block.id === blockId);
        if (blockIndex < 0) {
          return;
        }

        const sourceBlock = snapshot.document.blocks[blockIndex];
        const timestamp = new Date().toISOString();
        const clonedBlock = {
          ...cloneValue(sourceBlock),
          id: createGeneratedId(sourceBlock.type),
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        context.state.insertBlock(clonedBlock as TBlock, blockIndex + 1);
      },
      isAvailable(context) {
        const snapshot = context.state.getSnapshot();
        return Boolean(getFocusedBlockId(snapshot));
      },
    },
    {
      id: BLOCK_DELETE_COMMAND_ID,
      title: "Delete block",
      category: "Block",
      menuPath: ["block", "actions"],
      slashTrigger: "delete-block",
      aliases: ["remove-block"],
      keywords: ["trash", "discard"],
      execute(context) {
        const snapshot = context.state.getSnapshot();
        const blockId = getFocusedBlockId(snapshot);
        if (!blockId) {
          return;
        }

        context.state.removeBlock(blockId);
      },
      isAvailable(context) {
        const snapshot = context.state.getSnapshot();
        return Boolean(getFocusedBlockId(snapshot));
      },
    },
    {
      id: BLOCK_MOVE_UP_COMMAND_ID,
      title: "Move block up",
      category: "Block",
      menuPath: ["block", "actions"],
      slashTrigger: "move-block-up",
      aliases: ["shift-up"],
      keywords: ["reorder", "position"],
      execute(context) {
        const snapshot = context.state.getSnapshot();
        const blockId = getFocusedBlockId(snapshot);
        if (!blockId) {
          return;
        }

        const blockIndex = snapshot.document.blocks.findIndex((block) => block.id === blockId);
        if (blockIndex <= 0) {
          return;
        }

        context.state.moveBlock(blockId, blockIndex - 1);
      },
      isAvailable(context) {
        const snapshot = context.state.getSnapshot();
        const blockId = getFocusedBlockId(snapshot);
        if (!blockId) {
          return false;
        }

        return snapshot.document.blocks.findIndex((block) => block.id === blockId) > 0;
      },
    },
    {
      id: BLOCK_MOVE_DOWN_COMMAND_ID,
      title: "Move block down",
      category: "Block",
      menuPath: ["block", "actions"],
      slashTrigger: "move-block-down",
      aliases: ["shift-down"],
      keywords: ["reorder", "position"],
      execute(context) {
        const snapshot = context.state.getSnapshot();
        const blockId = getFocusedBlockId(snapshot);
        if (!blockId) {
          return;
        }

        const blockIndex = snapshot.document.blocks.findIndex((block) => block.id === blockId);
        if (blockIndex < 0 || blockIndex >= snapshot.document.blocks.length - 1) {
          return;
        }

        context.state.moveBlock(blockId, blockIndex + 1);
      },
      isAvailable(context) {
        const snapshot = context.state.getSnapshot();
        const blockId = getFocusedBlockId(snapshot);
        if (!blockId) {
          return false;
        }

        const blockIndex = snapshot.document.blocks.findIndex((block) => block.id === blockId);
        return blockIndex >= 0 && blockIndex < snapshot.document.blocks.length - 1;
      },
    },
  ];
}

export function registerBlockActionCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(registry: EditorCommandRegistry<TBlock>): EditorCommand<TBlock>[] {
  const commands = createBlockActionCommands<TBlock>();
  const registered: EditorCommand<TBlock>[] = [];

  for (const command of commands) {
    if (!registry.has(command.id)) {
      registry.register(command);
      registered.push(command);
    }
  }

  return registered;
}
