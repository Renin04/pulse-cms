import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorCommandRegistry } from "../commands/CommandRegistry";
import {
  BLOCK_DELETE_COMMAND_ID,
  BLOCK_DUPLICATE_COMMAND_ID,
  BLOCK_MOVE_DOWN_COMMAND_ID,
  BLOCK_MOVE_UP_COMMAND_ID,
} from "../commands/blockActionCommands";
import {
  FORMAT_BOLD_COMMAND_ID,
  FORMAT_CODE_COMMAND_ID,
  INSERT_HEADING_COMMAND_ID,
  FORMAT_ITALIC_COMMAND_ID,
  FORMAT_LINK_COMMAND_ID,
} from "../commands/formattingCommands";
import type { EditorStateAdapter } from "../state/EditorStateAdapter";

export type EditorContextMenuKind = "block" | "selection" | "empty";

export interface ContextMenuItem {
  commandId: string;
  title: string;
  disabled: boolean;
}

export interface EditorContextMenuState {
  kind: EditorContextMenuKind;
  isOpen: boolean;
  anchorBlockId: string | null;
  items: ContextMenuItem[];
  activeIndex: number;
}

export interface EditorContextMenuOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  kind: EditorContextMenuKind;
  state: EditorStateAdapter<TBlock>;
  commandRegistry: EditorCommandRegistry<TBlock>;
  commandIds?: string[];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function defaultCommandIds(kind: EditorContextMenuKind): string[] {
  if (kind === "block") {
    return [
      BLOCK_DUPLICATE_COMMAND_ID,
      BLOCK_DELETE_COMMAND_ID,
      BLOCK_MOVE_UP_COMMAND_ID,
      BLOCK_MOVE_DOWN_COMMAND_ID,
    ];
  }

  if (kind === "empty") {
    return [INSERT_HEADING_COMMAND_ID, BLOCK_DUPLICATE_COMMAND_ID];
  }

  return [
    FORMAT_BOLD_COMMAND_ID,
    FORMAT_ITALIC_COMMAND_ID,
    FORMAT_LINK_COMMAND_ID,
    FORMAT_CODE_COMMAND_ID,
  ];
}

export class EditorContextMenu<TBlock extends Block<BlockData> = Block<BlockData>> {
  private readonly kind: EditorContextMenuKind;
  private readonly state: EditorStateAdapter<TBlock>;
  private readonly commandRegistry: EditorCommandRegistry<TBlock>;
  private readonly commandIds: string[];
  private isOpen = false;
  private anchorBlockId: string | null = null;
  private activeIndex = -1;

  constructor(options: EditorContextMenuOptions<TBlock>) {
    this.kind = options.kind;
    this.state = options.state;
    this.commandRegistry = options.commandRegistry;
    this.commandIds = options.commandIds ?? defaultCommandIds(options.kind);
  }

  openForBlock(blockId: string): EditorContextMenuState {
    if (this.kind !== "block") {
      throw new Error("openForBlock can only be used by block context menus");
    }

    this.state.setFocusedBlock(blockId);
    this.anchorBlockId = blockId;
    this.isOpen = true;
    this.activeIndex = 0;
    return this.getState();
  }

  openForSelection(): EditorContextMenuState {
    if (this.kind !== "selection") {
      throw new Error("openForSelection can only be used by selection context menus");
    }

    const snapshot = this.state.getSnapshot();
    if (!snapshot.selection.range) {
      this.close();
      return this.getState();
    }

    this.anchorBlockId = snapshot.selection.range.end.blockId;
    this.isOpen = true;
    this.activeIndex = 0;
    return this.getState();
  }

  openForEmptySpace(): EditorContextMenuState {
    if (this.kind !== "empty") {
      throw new Error("openForEmptySpace can only be used by empty context menus");
    }

    this.anchorBlockId = null;
    this.isOpen = true;
    this.activeIndex = 0;
    return this.getState();
  }

  close(): EditorContextMenuState {
    this.isOpen = false;
    this.anchorBlockId = null;
    this.activeIndex = -1;
    return this.getState();
  }

  getState(): EditorContextMenuState {
    const context = { state: this.state };

    const items = this.commandIds
      .map((commandId) => {
        const command = this.commandRegistry.get(commandId);
        if (!command) {
          return null;
        }

        const disabled = command.isAvailable ? !command.isAvailable(context) : false;
        return {
          commandId,
          title: command.title,
          disabled,
        };
      })
      .filter(Boolean) as ContextMenuItem[];

    return {
      kind: this.kind,
      isOpen: this.isOpen,
      anchorBlockId: this.anchorBlockId,
      items,
      activeIndex: this.clampActiveIndex(items.length),
    };
  }

  async execute(commandId: string): Promise<void> {
    if (!this.isOpen) {
      throw new Error("Cannot execute context menu command while menu is closed");
    }

    await this.commandRegistry.execute(commandId, {
      state: this.state,
    });

    this.close();
  }

  async handleKey(key: string): Promise<"none" | "closed" | "executed"> {
    if (!this.isOpen) {
      return "none";
    }

    const normalizedKey = key.trim().toLowerCase();
    const items = this.getState().items;

    if (normalizedKey === "arrowdown") {
      this.activeIndex = this.wrapIndex(this.activeIndex + 1, items.length);
      return "none";
    }

    if (normalizedKey === "arrowup") {
      this.activeIndex = this.wrapIndex(this.activeIndex - 1, items.length);
      return "none";
    }

    if (normalizedKey === "home") {
      this.activeIndex = items.length > 0 ? 0 : -1;
      return "none";
    }

    if (normalizedKey === "end") {
      this.activeIndex = items.length > 0 ? items.length - 1 : -1;
      return "none";
    }

    if (normalizedKey === "escape") {
      this.close();
      return "closed";
    }

    if (normalizedKey === "enter") {
      const active = items[this.clampActiveIndex(items.length)];
      if (!active || active.disabled) {
        return "none";
      }

      await this.execute(active.commandId);
      return "executed";
    }

    return "none";
  }

  render(): string {
    const state = this.getState();
    if (!state.isOpen) {
      return "";
    }

    const itemsMarkup = state.items
      .map((item, index) => {
        return [
              `<button class="pulse-editor__context-menu-item${item.disabled ? " is-disabled" : ""}"`,
              ` data-command-id="${escapeHtml(item.commandId)}"`,
              ` data-active="${String(index === state.activeIndex)}"`,
              ` data-disabled="${String(item.disabled)}"`,
              ` role="menuitem"`,
              ` aria-disabled="${String(item.disabled)}"`,
              ` aria-selected="${String(index === state.activeIndex)}">`,
              escapeHtml(item.title),
              "</button>",
            ].join("");
          })
      .join("");

    return [
      `<div class="pulse-editor__context-menu" data-context-menu-kind="${this.kind}"`,
      ` data-anchor-block-id="${escapeHtml(state.anchorBlockId ?? "")}"`,
      ` role="menu"`,
      ` aria-label="${escapeHtml(`${this.kind} context menu`)}">`,
      itemsMarkup,
      "</div>",
    ].join("");
  }

  private wrapIndex(index: number, size: number): number {
    if (size <= 0) {
      return -1;
    }

    if (index < 0) {
      return size - 1;
    }

    if (index >= size) {
      return 0;
    }

    return index;
  }

  private clampActiveIndex(size: number): number {
    if (size <= 0) {
      return -1;
    }

    if (this.activeIndex < 0) {
      this.activeIndex = 0;
      return this.activeIndex;
    }

    if (this.activeIndex >= size) {
      this.activeIndex = size - 1;
    }

    return this.activeIndex;
  }
}

export function createBlockContextMenu<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  options: Omit<EditorContextMenuOptions<TBlock>, "kind" | "commandIds"> & {
    commandIds?: string[];
  },
): EditorContextMenu<TBlock> {
  return new EditorContextMenu({
    ...options,
    kind: "block",
    commandIds: options.commandIds,
  });
}

export function createSelectionContextMenu<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  options: Omit<EditorContextMenuOptions<TBlock>, "kind" | "commandIds"> & {
    commandIds?: string[];
  },
): EditorContextMenu<TBlock> {
  return new EditorContextMenu({
    ...options,
    kind: "selection",
    commandIds: options.commandIds,
  });
}

export function createEmptySpaceContextMenu<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  options: Omit<EditorContextMenuOptions<TBlock>, "kind" | "commandIds"> & {
    commandIds?: string[];
  },
): EditorContextMenu<TBlock> {
  return new EditorContextMenu({
    ...options,
    kind: "empty",
    commandIds: options.commandIds,
  });
}
