import type { Block, BlockData } from "../../../core/src/types/block";
import type { ShortcutBinding } from "./ShortcutRegistry";
import { getFindReplaceState } from "../commands/findReplaceCommands";

export const FIND_REPLACE_SHORTCUT_BINDINGS = {
  find: {
    id: "shortcut.find.open",
    combo: "mod+f",
    commandId: "editor.find.open",
    description: "Open find panel",
  },
  findNext: {
    id: "shortcut.find.next",
    combo: "mod+g",
    commandId: "editor.find.next",
    description: "Find next match",
  },
  findPrevious: {
    id: "shortcut.find.previous",
    combo: "mod+shift+g",
    commandId: "editor.find.previous",
    description: "Find previous match",
  },
  replace: {
    id: "shortcut.replace.open",
    combo: "mod+h",
    commandId: "editor.replace.one",
    description: "Open replace panel",
  },
  closeFind: {
    id: "shortcut.find.close",
    combo: "escape",
    commandId: "editor.find.close",
    description: "Close find panel",
  },
} as const satisfies Record<string, ShortcutBinding>;

export function createFindReplaceShortcutBindings<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): ShortcutBinding<TBlock>[] {
  return [
    FIND_REPLACE_SHORTCUT_BINDINGS.find,
    {
      ...FIND_REPLACE_SHORTCUT_BINDINGS.findNext,
      when: () => getFindReplaceState().isOpen,
    },
    {
      ...FIND_REPLACE_SHORTCUT_BINDINGS.findPrevious,
      when: () => getFindReplaceState().isOpen,
    },
    {
      ...FIND_REPLACE_SHORTCUT_BINDINGS.replace,
      when: () => getFindReplaceState().isOpen,
    },
    {
      ...FIND_REPLACE_SHORTCUT_BINDINGS.closeFind,
      when: () => getFindReplaceState().isOpen,
    },
  ];
}
