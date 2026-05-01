import type { Block, BlockData } from "../../../core/src/types/block";
import type {
  EditorCommand,
  EditorCommandContext,
  EditorCommandRegistry,
} from "./CommandRegistry";

interface TextBlockData extends Record<string, unknown> {
  text?: string;
}

export const WORD_COUNT_COMMAND_ID = "editor.stats.wordCount";
export const DOCUMENT_STATS_COMMAND_ID = "editor.stats.document";

export interface DocumentStats {
  wordCount: number;
  charCount: number;
  charCountWithSpaces: number;
  paragraphCount: number;
  blockCount: number;
}

function countWords(text: string): number {
  // Match word characters including Unicode letters
  const matches = text.match(/[\p{L}\p{N}]+/gu);
  return matches?.length ?? 0;
}

function calculateStats<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
): DocumentStats {
  const snapshot = context.state.getSnapshot();
  const blocks = snapshot.document.blocks;

  let wordCount = 0;
  let charCount = 0;
  let charCountWithSpaces = 0;
  let paragraphCount = 0;

  for (const block of blocks) {
    if (block.type === "text") {
      const data = block.data as TextBlockData;
      const text = data.text ?? "";

      wordCount += countWords(text);
      charCountWithSpaces += text.length;
      charCount += text.replace(/\s/g, "").length;
      paragraphCount += 1;
    } else if (block.type === "heading") {
      const data = block.data as { text?: string };
      const text = data.text ?? "";

      wordCount += countWords(text);
      charCountWithSpaces += text.length;
      charCount += text.replace(/\s/g, "").length;
    }
  }

  return {
    wordCount,
    charCount,
    charCountWithSpaces,
    paragraphCount,
    blockCount: blocks.length,
  };
}

export function formatStats(stats: DocumentStats): string {
  return [
    `Words: ${stats.wordCount.toLocaleString()}`,
    `Characters: ${stats.charCount.toLocaleString()}`,
    `Characters (with spaces): ${stats.charCountWithSpaces.toLocaleString()}`,
    `Paragraphs: ${stats.paragraphCount.toLocaleString()}`,
    `Blocks: ${stats.blockCount.toLocaleString()}`,
  ].join("\n");
}

export function createDocumentStatsCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): EditorCommand<TBlock>[] {
  return [
    {
      id: WORD_COUNT_COMMAND_ID,
      title: "Word Count",
      description: "Show word and character count for the document",
      category: "Document",
      menuPath: ["document", "stats"],
      slashTrigger: "word count",
      aliases: ["count", "statistics", "آمار", "تعداد کلمات"],
      keywords: ["words", "characters", "stats", "metrics"],
      execute(context) {
        const stats = calculateStats(context);
        const formatted = formatStats(stats);

        // Dispatch event for UI to show stats
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pulse:stats:show", {
              detail: { stats, formatted },
            }),
          );
        }
      },
    },
    {
      id: DOCUMENT_STATS_COMMAND_ID,
      title: "Document Statistics",
      description: "Show complete document statistics",
      category: "Document",
      menuPath: ["document", "stats"],
      slashTrigger: "document stats",
      aliases: ["stats", "info", "اطلاعات"],
      keywords: ["document", "statistics", "metrics", "summary"],
      execute(context) {
        const stats = calculateStats(context);
        const formatted = formatStats(stats);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pulse:stats:show", {
              detail: { stats, formatted },
            }),
          );
        }
      },
    },
  ];
}

export function registerDocumentStatsCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(registry: EditorCommandRegistry<TBlock>): EditorCommand<TBlock>[] {
  const commands = createDocumentStatsCommands<TBlock>();
  const registered: EditorCommand<TBlock>[] = [];

  for (const command of commands) {
    if (!registry.has(command.id)) {
      registry.register(command);
      registered.push(command);
    }
  }

  return registered;
}

// Re-export for convenience
export { calculateStats };
