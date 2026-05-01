import type { Block, BlockData } from "../../../core/src/types/block";
import {
  type EditorCommandContext,
  type EditorCommandRegistry,
} from "../commands/CommandRegistry";
import {
  FORMAT_BOLD_COMMAND_ID,
  FORMAT_CODE_COMMAND_ID,
  FORMAT_ITALIC_COMMAND_ID,
  FORMAT_LINK_COMMAND_ID,
} from "../commands/formattingCommands";
import type { EditorStateAdapter } from "../state/EditorStateAdapter";

export interface FloatingToolbarButton<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  commandId: string;
  title: string;
  disabled: boolean;
  command: ReturnType<EditorCommandRegistry<TBlock>["get"]>;
}

export interface FloatingToolbarState<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  visible: boolean;
  anchorBlockId: string | null;
  buttons: FloatingToolbarButton<TBlock>[];
}

export interface FloatingToolbarOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
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

function hasExpandedRange(range: {
  start: { blockId: string; offset: number };
  end: { blockId: string; offset: number };
}): boolean {
  return range.start.blockId !== range.end.blockId || range.start.offset !== range.end.offset;
}

export class FloatingToolbar<TBlock extends Block<BlockData> = Block<BlockData>> {
  private readonly state: EditorStateAdapter<TBlock>;
  private readonly commandRegistry: EditorCommandRegistry<TBlock>;
  private readonly commandIds: string[];

  constructor(options: FloatingToolbarOptions<TBlock>) {
    this.state = options.state;
    this.commandRegistry = options.commandRegistry;
    this.commandIds =
      options.commandIds ??
      [
        FORMAT_BOLD_COMMAND_ID,
        FORMAT_ITALIC_COMMAND_ID,
        FORMAT_LINK_COMMAND_ID,
        FORMAT_CODE_COMMAND_ID,
      ];
  }

  getState(context?: EditorCommandContext<TBlock>): FloatingToolbarState<TBlock> {
    const snapshot = this.state.getSnapshot();
    const range = snapshot.selection.range;
    const visible = Boolean(
      range && hasExpandedRange(range),
    );

    const toolbarContext: EditorCommandContext<TBlock> = context ?? { state: this.state };

    const buttons = this.commandIds
      .map((commandId) => {
        const command = this.commandRegistry.get(commandId);
        if (!command) {
          return null;
        }

        const disabled = command.isAvailable ? !command.isAvailable(toolbarContext) : false;

        return {
          commandId,
          title: command.title,
          disabled,
          command,
        };
      })
      .filter(Boolean) as FloatingToolbarButton<TBlock>[];

    return {
      visible,
      anchorBlockId: range?.end.blockId ?? null,
      buttons,
    };
  }

  async execute(
    commandId: string,
    context: EditorCommandContext<TBlock> = { state: this.state },
  ): Promise<void> {
    await this.commandRegistry.execute(commandId, context);
  }

  render(context?: EditorCommandContext<TBlock>): string {
    const state = this.getState(context);
    if (!state.visible) {
      return "";
    }

    const buttons = state.buttons
      .map((button) => {
        return [
          `<button class="pulse-editor__floating-toolbar-button${button.disabled ? " is-disabled" : ""}"`,
          ` data-command-id="${escapeHtml(button.commandId)}"`,
          ` data-disabled="${String(button.disabled)}"`,
          ` aria-label="${escapeHtml(button.title)}">`,
          escapeHtml(button.title),
          "</button>",
        ].join("");
      })
      .join("");

    return [
      '<div class="pulse-editor__floating-toolbar" data-floating-toolbar="true"',
      ` data-anchor-block-id="${escapeHtml(state.anchorBlockId ?? "")}"`,
      ' role="toolbar"',
      ' aria-label="Formatting toolbar">',
      buttons,
      "</div>",
    ].join("");
  }
}

export function createFloatingToolbar<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(options: FloatingToolbarOptions<TBlock>): FloatingToolbar<TBlock> {
  return new FloatingToolbar(options);
}
