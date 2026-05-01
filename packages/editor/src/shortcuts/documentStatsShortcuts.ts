import type { Block, BlockData } from "../../../core/src/types/block";
import type { ShortcutBinding } from "./ShortcutRegistry";

export const DOCUMENT_STATS_SHORTCUT_BINDINGS = {
  wordCount: {
    id: "shortcut.stats.wordCount",
    combo: "mod+shift+w",
    commandId: "editor.stats.wordCount",
    description: "Show word count",
  },
  documentStats: {
    id: "shortcut.stats.document",
    combo: "mod+shift+i",
    commandId: "editor.stats.document",
    description: "Show document statistics",
  },
} as const satisfies Record<string, ShortcutBinding>;

export function createDocumentStatsShortcutBindings<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): ShortcutBinding<TBlock>[] {
  return [
    DOCUMENT_STATS_SHORTCUT_BINDINGS.wordCount,
    DOCUMENT_STATS_SHORTCUT_BINDINGS.documentStats,
  ];
}
