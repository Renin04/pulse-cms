import type { Block, BlockData } from "../../../core/src/types/block";
import type { ShortcutBinding } from "./ShortcutRegistry";

export const ALIGNMENT_SHORTCUT_BINDINGS = {
  alignLeft: {
    id: "shortcut.align.left",
    combo: "mod+shift+l",
    commandId: "editor.align.left",
    description: "Align text to the left",
  },
  alignCenter: {
    id: "shortcut.align.center",
    combo: "mod+shift+e",
    commandId: "editor.align.center",
    description: "Center align text",
  },
  alignRight: {
    id: "shortcut.align.right",
    combo: "mod+shift+r",
    commandId: "editor.align.right",
    description: "Align text to the right",
  },
  alignJustify: {
    id: "shortcut.align.justify",
    combo: "mod+shift+j",
    commandId: "editor.align.justify",
    description: "Justify text alignment",
  },
} as const satisfies Record<string, ShortcutBinding>;

export function createAlignmentShortcutBindings<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): ShortcutBinding<TBlock>[] {
  return [
    ALIGNMENT_SHORTCUT_BINDINGS.alignLeft,
    ALIGNMENT_SHORTCUT_BINDINGS.alignCenter,
    ALIGNMENT_SHORTCUT_BINDINGS.alignRight,
    ALIGNMENT_SHORTCUT_BINDINGS.alignJustify,
  ];
}
