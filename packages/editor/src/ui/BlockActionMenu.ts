import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorCommandRegistry } from "../commands/CommandRegistry";
import {
  BLOCK_DELETE_COMMAND_ID,
  BLOCK_DUPLICATE_COMMAND_ID,
  BLOCK_MOVE_DOWN_COMMAND_ID,
  BLOCK_MOVE_UP_COMMAND_ID,
} from "../commands/blockActionCommands";
import type { BlockInteractionController } from "../interactions/BlockInteractionController";
import type { EditorStateAdapter } from "../state/EditorStateAdapter";

export interface BlockActionMenuOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  state: EditorStateAdapter<TBlock>;
  commandRegistry: EditorCommandRegistry<TBlock>;
  interactions: BlockInteractionController;
  commandIds?: string[];
}

export interface BlockActionMenuState {
  visible: boolean;
  blockId: string | null;
  isDragging: boolean;
  dragHandleVisible: boolean;
  commandIds: string[];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export class BlockActionMenu<TBlock extends Block<BlockData> = Block<BlockData>> {
  private readonly state: EditorStateAdapter<TBlock>;
  private readonly commandRegistry: EditorCommandRegistry<TBlock>;
  private readonly interactions: BlockInteractionController;
  private readonly commandIds: string[];

  constructor(options: BlockActionMenuOptions<TBlock>) {
    this.state = options.state;
    this.commandRegistry = options.commandRegistry;
    this.interactions = options.interactions;
    this.commandIds =
      options.commandIds ??
      [
        BLOCK_DUPLICATE_COMMAND_ID,
        BLOCK_DELETE_COMMAND_ID,
        BLOCK_MOVE_UP_COMMAND_ID,
        BLOCK_MOVE_DOWN_COMMAND_ID,
      ];
  }

  getState(): BlockActionMenuState {
    const interactionSnapshot = this.interactions.getSnapshot();

    return {
      visible: Boolean(interactionSnapshot.hoveredBlockId),
      blockId: interactionSnapshot.hoveredBlockId,
      isDragging: interactionSnapshot.isDragging,
      dragHandleVisible: Boolean(interactionSnapshot.hoveredBlockId),
      commandIds: [...this.commandIds],
    };
  }

  hover(blockId: string | null): BlockActionMenuState {
    this.interactions.setHoveredBlock(blockId);
    if (blockId) {
      this.state.setFocusedBlock(blockId);
    }

    return this.getState();
  }

  startDrag(blockId: string): BlockActionMenuState {
    this.interactions.startDrag(blockId);
    this.state.setFocusedBlock(blockId);
    return this.getState();
  }

  endDrag(): BlockActionMenuState {
    this.interactions.stopDrag();
    return this.getState();
  }

  async execute(commandId: string): Promise<void> {
    const current = this.getState();
    if (!current.blockId) {
      throw new Error("Cannot execute block action without a hovered block");
    }

    this.state.setFocusedBlock(current.blockId);
    await this.commandRegistry.execute(commandId, {
      state: this.state,
    });
  }

  render(): string {
    const snapshot = this.getState();
    if (!snapshot.visible || !snapshot.blockId) {
      return "";
    }

    const buttons = snapshot.commandIds
      .map((commandId) => {
        const command = this.commandRegistry.get(commandId);
        if (!command) {
          return "";
        }

        return [
          `<button class="pulse-editor__block-action-button" data-command-id="${escapeHtml(commandId)}" role="menuitem">`,
          escapeHtml(command.title),
          "</button>",
        ].join("");
      })
      .join("");

    return [
      '<div class="pulse-editor__block-action-menu" data-block-action-menu="true"',
      ` data-block-id="${escapeHtml(snapshot.blockId)}"`,
      ` data-dragging="${String(snapshot.isDragging)}"`,
      ` data-drag-handle-visible="${String(snapshot.dragHandleVisible)}"`,
      ' role="menu"',
      ' aria-label="Block actions">',
      `<button class="pulse-editor__block-drag-handle" data-drag-handle="true" data-block-id="${escapeHtml(
        snapshot.blockId,
      )}" aria-label="Drag block" role="menuitem">Drag</button>`,
      buttons,
      "</div>",
    ].join("");
  }
}

export function createBlockActionMenu<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(options: BlockActionMenuOptions<TBlock>): BlockActionMenu<TBlock> {
  return new BlockActionMenu(options);
}
