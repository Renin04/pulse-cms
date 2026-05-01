import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorCommandContext } from "../commands/CommandRegistry";
import type { ShortcutBinding } from "./ShortcutRegistry";

export const DEFAULT_SHORTCUT_BINDINGS = {
  toggleBold: {
    id: "shortcut.format.bold",
    combo: "mod+b",
    commandId: "editor.format.bold",
    description: "Toggle bold formatting",
  },
  toggleItalic: {
    id: "shortcut.format.italic",
    combo: "mod+i",
    commandId: "editor.format.italic",
    description: "Toggle italic formatting",
  },
  toggleLink: {
    id: "shortcut.format.link",
    combo: "mod+k",
    commandId: "editor.format.link",
    description: "Insert link block",
  },
  toggleCode: {
    id: "shortcut.format.code",
    combo: "mod+shift+c",
    commandId: "editor.format.code",
    description: "Toggle code formatting",
  },
  insertHeading: {
    id: "shortcut.block.heading",
    combo: "mod+alt+1",
    commandId: "editor.block.heading",
    description: "Convert focused block to heading",
  },
  saveDocument: {
    id: "shortcut.document.save",
    combo: "mod+s",
    commandId: "editor.document.save",
    description: "Save document",
  },
} as const satisfies Record<string, ShortcutBinding>;

export function createDefaultShortcutBindings<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  options: {
    canSave?: (context: EditorCommandContext<TBlock>) => boolean;
  } = {},
): ShortcutBinding<TBlock>[] {
  const bindings: ShortcutBinding<TBlock>[] = [
    DEFAULT_SHORTCUT_BINDINGS.toggleBold,
    DEFAULT_SHORTCUT_BINDINGS.toggleItalic,
    DEFAULT_SHORTCUT_BINDINGS.toggleLink,
    DEFAULT_SHORTCUT_BINDINGS.toggleCode,
    DEFAULT_SHORTCUT_BINDINGS.insertHeading,
    {
      ...DEFAULT_SHORTCUT_BINDINGS.saveDocument,
      when: options.canSave,
    },
  ];

  return bindings;
}
