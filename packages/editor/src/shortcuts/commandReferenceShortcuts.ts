import type { Block, BlockData } from "../../../core/src/types/block";
import type { ShortcutBinding } from "./ShortcutRegistry";

export const COMMAND_REFERENCE_SHORTCUT_BINDINGS = {
  openCommandCatalog: {
    id: "shortcut.reference.commandCatalog",
    combo: "mod+shift+p",
    commandId: "editor.reference.commandCatalog",
    description: "Open command catalog",
  },
  openShortcutReference: {
    id: "shortcut.reference.shortcutHelp",
    combo: "mod+?",
    commandId: "editor.reference.shortcutHelp",
    description: "Open keyboard shortcuts reference",
  },
  openUserCommandEditor: {
    id: "shortcut.reference.userCommands",
    combo: "mod+shift+u",
    commandId: "editor.reference.userCommands",
    description: "Open user command editor",
  },
} as const satisfies Record<string, ShortcutBinding>;

export function createCommandReferenceShortcutBindings<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): ShortcutBinding<TBlock>[] {
  return [
    COMMAND_REFERENCE_SHORTCUT_BINDINGS.openCommandCatalog,
    COMMAND_REFERENCE_SHORTCUT_BINDINGS.openShortcutReference,
    COMMAND_REFERENCE_SHORTCUT_BINDINGS.openUserCommandEditor,
  ];
}
