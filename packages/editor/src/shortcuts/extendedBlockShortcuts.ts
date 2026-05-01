import type { Block, BlockData } from "../../../core/src/types/block";
import {
  INSERT_ALERT_BLOCK_COMMAND_ID,
  INSERT_AUDIO_BLOCK_COMMAND_ID,
  INSERT_CALLOUT_BLOCK_COMMAND_ID,
  INSERT_EMBED_BLOCK_COMMAND_ID,
  INSERT_FILE_BLOCK_COMMAND_ID,
  INSERT_TABLE_BLOCK_COMMAND_ID,
  INSERT_VIDEO_BLOCK_COMMAND_ID,
} from "../commands/extendedBlockCommands";
import type { ShortcutBinding } from "./ShortcutRegistry";

export const EXTENDED_BLOCK_SHORTCUT_BINDINGS = {
  insertVideo: {
    id: "shortcut.block.video",
    combo: "mod+alt+2",
    commandId: INSERT_VIDEO_BLOCK_COMMAND_ID,
    description: "Insert video block",
  },
  insertAudio: {
    id: "shortcut.block.audio",
    combo: "mod+alt+3",
    commandId: INSERT_AUDIO_BLOCK_COMMAND_ID,
    description: "Insert audio block",
  },
  insertFile: {
    id: "shortcut.block.file",
    combo: "mod+alt+4",
    commandId: INSERT_FILE_BLOCK_COMMAND_ID,
    description: "Insert file block",
  },
  insertTable: {
    id: "shortcut.block.table",
    combo: "mod+alt+5",
    commandId: INSERT_TABLE_BLOCK_COMMAND_ID,
    description: "Insert table block",
  },
  insertEmbed: {
    id: "shortcut.block.embed",
    combo: "mod+alt+6",
    commandId: INSERT_EMBED_BLOCK_COMMAND_ID,
    description: "Insert embed block",
  },
  insertCallout: {
    id: "shortcut.block.callout",
    combo: "mod+alt+7",
    commandId: INSERT_CALLOUT_BLOCK_COMMAND_ID,
    description: "Insert callout block",
  },
  insertAlert: {
    id: "shortcut.block.alert",
    combo: "mod+alt+8",
    commandId: INSERT_ALERT_BLOCK_COMMAND_ID,
    description: "Insert alert block",
  },
} as const satisfies Record<string, ShortcutBinding>;

export function createExtendedBlockShortcutBindings<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): ShortcutBinding<TBlock>[] {
  return [
    EXTENDED_BLOCK_SHORTCUT_BINDINGS.insertVideo,
    EXTENDED_BLOCK_SHORTCUT_BINDINGS.insertAudio,
    EXTENDED_BLOCK_SHORTCUT_BINDINGS.insertFile,
    EXTENDED_BLOCK_SHORTCUT_BINDINGS.insertTable,
    EXTENDED_BLOCK_SHORTCUT_BINDINGS.insertEmbed,
    EXTENDED_BLOCK_SHORTCUT_BINDINGS.insertCallout,
    EXTENDED_BLOCK_SHORTCUT_BINDINGS.insertAlert,
  ];
}
