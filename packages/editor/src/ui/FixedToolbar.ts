import type { Block, BlockData } from "../../../core/src/types/block";
import type {
  EditorCommandContext,
  EditorCommandRegistry,
} from "../commands/CommandRegistry";

export interface FixedToolbarGroup {
  id: string;
  title: string;
  commandIds: string[];
}

export interface FixedToolbarButton {
  commandId: string;
  title: string;
  disabled: boolean;
}

export interface FixedToolbarState {
  visible: boolean;
  groups: Array<{
    id: string;
    title: string;
    buttons: FixedToolbarButton[];
  }>;
  overflowButtons: FixedToolbarButton[];
  compact: boolean;
}

export interface FixedToolbarOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  commandRegistry: EditorCommandRegistry<TBlock>;
  groups: FixedToolbarGroup[];
  compactBreakpoint?: number;
  maxButtonsPerRow?: number;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export class FixedToolbar<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  private readonly commandRegistry: EditorCommandRegistry<TBlock>;
  private readonly groups: FixedToolbarGroup[];
  private readonly compactBreakpoint: number;
  private readonly maxButtonsPerRow: number;

  constructor(options: FixedToolbarOptions<TBlock>) {
    this.commandRegistry = options.commandRegistry;
    this.groups = options.groups;
    this.compactBreakpoint = options.compactBreakpoint ?? 768;
    this.maxButtonsPerRow = options.maxButtonsPerRow ?? 7;
  }

  getState(
    context: EditorCommandContext<TBlock>,
    viewportWidth: number = Number.MAX_SAFE_INTEGER,
  ): FixedToolbarState {
    const compact = viewportWidth <= this.compactBreakpoint;
    const normalizedGroups = this.groups.map((group) => {
      const buttons = group.commandIds
        .map((commandId) => {
          const command = this.commandRegistry.get(commandId);
          if (!command) {
            return null;
          }

          return {
            commandId,
            title: command.title,
            disabled: command.isAvailable ? !command.isAvailable(context) : false,
          };
        })
        .filter(Boolean) as FixedToolbarButton[];

      return {
        id: group.id,
        title: group.title,
        buttons,
      };
    });

    if (!compact) {
      return {
        visible: true,
        groups: normalizedGroups,
        overflowButtons: [],
        compact,
      };
    }

    const overflowButtons: FixedToolbarButton[] = [];
    const compactGroups = normalizedGroups.map((group) => {
      const visibleButtons = group.buttons.slice(0, this.maxButtonsPerRow);
      const hiddenButtons = group.buttons.slice(this.maxButtonsPerRow);
      overflowButtons.push(...hiddenButtons);

      return {
        ...group,
        buttons: visibleButtons,
      };
    });

    return {
      visible: true,
      groups: compactGroups,
      overflowButtons,
      compact,
    };
  }

  async execute(
    commandId: string,
    context: EditorCommandContext<TBlock>,
  ): Promise<void> {
    await this.commandRegistry.execute(commandId, context);
  }

  render(
    context: EditorCommandContext<TBlock>,
    viewportWidth: number = Number.MAX_SAFE_INTEGER,
  ): string {
    const state = this.getState(context, viewportWidth);
    if (!state.visible) {
      return "";
    }

    const groupsMarkup = state.groups
      .map((group) => {
        const buttonsMarkup = group.buttons
          .map((button) => {
            return [
              `<button class="pulse-editor__fixed-toolbar-button${button.disabled ? " is-disabled" : ""}"`,
              ` data-command-id="${escapeHtml(button.commandId)}"`,
              ` data-disabled="${String(button.disabled)}"`,
              ` aria-label="${escapeHtml(button.title)}">`,
              escapeHtml(button.title),
              "</button>",
            ].join("");
          })
          .join("");

        return [
          `<section class="pulse-editor__fixed-toolbar-group" data-toolbar-group-id="${escapeHtml(
            group.id,
          )}">`,
          `<header class="pulse-editor__fixed-toolbar-group-title">${escapeHtml(group.title)}</header>`,
          `<div class="pulse-editor__fixed-toolbar-group-buttons">${buttonsMarkup}</div>`,
          "</section>",
        ].join("");
      })
      .join("");

    const overflowMarkup =
      state.overflowButtons.length > 0
        ? [
            '<div class="pulse-editor__fixed-toolbar-overflow" data-toolbar-overflow="true">',
            state.overflowButtons
              .map((button) => {
                return `<span class="pulse-editor__fixed-toolbar-overflow-item" data-command-id="${escapeHtml(
                  button.commandId,
                )}">${escapeHtml(button.title)}</span>`;
              })
              .join(""),
            "</div>",
          ].join("")
        : "";

    return [
      '<div class="pulse-editor__fixed-toolbar" data-fixed-toolbar="true"',
      ` data-compact="${String(state.compact)}"`,
      ' role="toolbar"',
      ' aria-label="Editor fixed toolbar">',
      groupsMarkup,
      overflowMarkup,
      "</div>",
    ].join("");
  }
}

export function createFixedToolbar<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(options: FixedToolbarOptions<TBlock>): FixedToolbar<TBlock> {
  return new FixedToolbar(options);
}
