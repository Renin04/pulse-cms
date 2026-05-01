import type { Block, BlockData } from "../../../core/src/types/block";
import type {
  EditorCommand,
  EditorCommandContext,
  EditorCommandRegistry,
} from "./CommandRegistry";

interface TextBlockData extends Record<string, unknown> {
  text?: string;
  marks?: Record<string, boolean>;
  align?: "left" | "center" | "right" | "justify";
}

export const ALIGN_LEFT_COMMAND_ID = "editor.align.left";
export const ALIGN_CENTER_COMMAND_ID = "editor.align.center";
export const ALIGN_RIGHT_COMMAND_ID = "editor.align.right";
export const ALIGN_JUSTIFY_COMMAND_ID = "editor.align.justify";

function resolveTargetBlockIds<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
): string[] {
  const snapshot = context.state.getSnapshot();

  if (snapshot.activeBlockIds.length > 0) {
    return [...snapshot.activeBlockIds];
  }

  if (snapshot.focusedBlockId) {
    return [snapshot.focusedBlockId];
  }

  return [];
}

function hasTextBlockSelection<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
): boolean {
  const snapshot = context.state.getSnapshot();
  const blockIds = resolveTargetBlockIds(context);
  const blocksById = new Map(snapshot.document.blocks.map((block) => [block.id, block] as const));

  return blockIds.some((blockId) => blocksById.get(blockId)?.type === "text");
}

function setAlignment<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
  align: "left" | "center" | "right" | "justify",
): void {
  const targetIds = resolveTargetBlockIds(context);
  const timestamp = new Date().toISOString();

  for (const blockId of targetIds) {
    context.state.updateBlock(blockId, (block) => {
      if (block.type !== "text") {
        return block;
      }

      const data = block.data as TextBlockData;

      return {
        ...block,
        data: {
          ...data,
          align,
        },
        updatedAt: timestamp,
      } as TBlock;
    });
  }
}

export function createAlignmentCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): EditorCommand<TBlock>[] {
  return [
    {
      id: ALIGN_LEFT_COMMAND_ID,
      title: "Align Left",
      description: "Align text to the left",
      category: "Formatting",
      menuPath: ["formatting", "alignment"],
      slashTrigger: "align left",
      aliases: ["left", "چپ"],
      keywords: ["text", "alignment", "position"],
      execute(context) {
        setAlignment(context, "left");
      },
      isAvailable: hasTextBlockSelection,
    },
    {
      id: ALIGN_CENTER_COMMAND_ID,
      title: "Align Center",
      description: "Center align text",
      category: "Formatting",
      menuPath: ["formatting", "alignment"],
      slashTrigger: "align center",
      aliases: ["center", "وسط"],
      keywords: ["text", "alignment", "position"],
      execute(context) {
        setAlignment(context, "center");
      },
      isAvailable: hasTextBlockSelection,
    },
    {
      id: ALIGN_RIGHT_COMMAND_ID,
      title: "Align Right",
      description: "Align text to the right",
      category: "Formatting",
      menuPath: ["formatting", "alignment"],
      slashTrigger: "align right",
      aliases: ["right", "راست"],
      keywords: ["text", "alignment", "position"],
      execute(context) {
        setAlignment(context, "right");
      },
      isAvailable: hasTextBlockSelection,
    },
    {
      id: ALIGN_JUSTIFY_COMMAND_ID,
      title: "Justify",
      description: "Justify text alignment",
      category: "Formatting",
      menuPath: ["formatting", "alignment"],
      slashTrigger: "justify",
      aliases: ["justify", "تراز"],
      keywords: ["text", "alignment", "position", "full"],
      execute(context) {
        setAlignment(context, "justify");
      },
      isAvailable: hasTextBlockSelection,
    },
  ];
}

export function registerAlignmentCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(registry: EditorCommandRegistry<TBlock>): EditorCommand<TBlock>[] {
  const commands = createAlignmentCommands<TBlock>();
  const registered: EditorCommand<TBlock>[] = [];

  for (const command of commands) {
    if (!registry.has(command.id)) {
      registry.register(command);
      registered.push(command);
    }
  }

  return registered;
}
