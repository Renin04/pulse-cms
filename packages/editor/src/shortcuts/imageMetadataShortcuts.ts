import type { Block, BlockData } from "../../../core/src/types/block";
import type { ShortcutBinding } from "./ShortcutRegistry";

export const IMAGE_METADATA_SHORTCUT_BINDINGS = {
  editMetadata: {
    id: "shortcut.image.editMetadata",
    combo: "mod+shift+m",
    commandId: "editor.image.editMetadata",
    description: "Edit image metadata",
  },
  setAlt: {
    id: "shortcut.image.setAlt",
    combo: "mod+shift+a",
    commandId: "editor.image.setAlt",
    description: "Set image alt text",
  },
  validateMetadata: {
    id: "shortcut.image.validate",
    combo: "mod+shift+v",
    commandId: "editor.image.validateMetadata",
    description: "Validate image metadata",
  },
} as const satisfies Record<string, ShortcutBinding>;

export function createImageMetadataShortcutBindings<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): ShortcutBinding<TBlock>[] {
  return [
    IMAGE_METADATA_SHORTCUT_BINDINGS.editMetadata,
    IMAGE_METADATA_SHORTCUT_BINDINGS.setAlt,
    IMAGE_METADATA_SHORTCUT_BINDINGS.validateMetadata,
  ];
}
