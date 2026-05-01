import type { Block, BlockData } from "../../../core/src/types/block";
import type {
  EditorCommand,
  EditorCommandContext,
  EditorCommandRegistry,
} from "./CommandRegistry";

interface TextBlockMarks {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  code: boolean;
}

interface TextBlockData extends Record<string, unknown> {
  text?: string;
  marks?: Partial<TextBlockMarks>;
}

interface HeadingBlockData extends Record<string, unknown> {
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  anchorId?: string;
}

export const FORMAT_BOLD_COMMAND_ID = "editor.format.bold";
export const FORMAT_ITALIC_COMMAND_ID = "editor.format.italic";
export const FORMAT_LINK_COMMAND_ID = "editor.format.link";
export const FORMAT_CODE_COMMAND_ID = "editor.format.code";
export const INSERT_HEADING_COMMAND_ID = "editor.block.heading";
export const SAVE_DOCUMENT_COMMAND_ID = "editor.document.save";

function createGeneratedId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function normalizeMarks(data: TextBlockData): TextBlockMarks {
  return {
    bold: Boolean(data.marks?.bold),
    italic: Boolean(data.marks?.italic),
    underline: Boolean(data.marks?.underline),
    code: Boolean(data.marks?.code),
  };
}

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

function getFocusedBlock<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
): TBlock | undefined {
  const snapshot = context.state.getSnapshot();
  if (!snapshot.focusedBlockId) {
    return undefined;
  }

  return snapshot.document.blocks.find((block) => block.id === snapshot.focusedBlockId);
}

function hasTextBlockSelection<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
): boolean {
  const snapshot = context.state.getSnapshot();
  const blockIds = resolveTargetBlockIds(context);
  const blocksById = new Map(snapshot.document.blocks.map((block) => [block.id, block] as const));

  return blockIds.some((blockId) => blocksById.get(blockId)?.type === "text");
}

function toggleMark<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
  mark: keyof TextBlockMarks,
): void {
  const targetIds = resolveTargetBlockIds(context);

  for (const blockId of targetIds) {
    context.state.updateBlock(blockId, (block) => {
      if (block.type !== "text") {
        return block;
      }

      const data = block.data as TextBlockData;
      const marks = normalizeMarks(data);

      return {
        ...block,
        data: {
          ...data,
          marks: {
            ...marks,
            [mark]: !marks[mark],
          },
        },
        updatedAt: new Date().toISOString(),
      } as TBlock;
    });
  }
}

function executeLinkInsert<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
): void {
  const snapshot = context.state.getSnapshot();
  const focusedBlock = getFocusedBlock(context);
  const focusedIndex = focusedBlock
    ? snapshot.document.blocks.findIndex((block) => block.id === focusedBlock.id)
    : -1;
  const timestamp = new Date().toISOString();

  const defaultText =
    focusedBlock && typeof focusedBlock.data.text === "string"
      ? focusedBlock.data.text
      : "New link";

  const linkBlock: Block<Record<string, unknown>> = {
    id: createGeneratedId("link"),
    type: "link",
    data: {
      text: defaultText,
      url: "https://example.com",
      openInNewTab: false,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  context.state.insertBlock(linkBlock as TBlock, focusedIndex >= 0 ? focusedIndex + 1 : undefined);
}

function executeHeadingToggle<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
): void {
  const focusedBlock = getFocusedBlock(context);
  const timestamp = new Date().toISOString();

  if (focusedBlock && focusedBlock.type === "text") {
    const data = focusedBlock.data as TextBlockData;
    const headingData: HeadingBlockData = {
      text: typeof data.text === "string" ? data.text : "Heading",
      level: 1,
    };

    context.state.updateBlock(focusedBlock.id, (block) => ({
      ...block,
      type: "heading",
      data: headingData,
      updatedAt: timestamp,
    } as TBlock));
    return;
  }

  const headingBlock: Block<HeadingBlockData> = {
    id: createGeneratedId("heading"),
    type: "heading",
    data: {
      text: "Heading",
      level: 1,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  context.state.insertBlock(headingBlock as unknown as TBlock);
}

async function executeSaveDocument<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
): Promise<void> {
  if (context.onSaveDocument) {
    await context.onSaveDocument(context);
    return;
  }

  context.state.markDocumentSaved();
}

export function createFormattingCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): EditorCommand<TBlock>[] {
  return [
    {
      id: FORMAT_BOLD_COMMAND_ID,
      title: "Bold",
      description: "Toggle bold mark on selected text block",
      category: "Formatting",
      menuPath: ["formatting", "inline"],
      slashTrigger: "bold",
      aliases: ["strong", "بولد"],
      keywords: ["text", "style"],
      execute(context) {
        toggleMark(context, "bold");
      },
      isAvailable: hasTextBlockSelection,
    },
    {
      id: FORMAT_ITALIC_COMMAND_ID,
      title: "Italic",
      description: "Toggle italic mark on selected text block",
      category: "Formatting",
      menuPath: ["formatting", "inline"],
      slashTrigger: "italic",
      aliases: ["emphasis", "ایتالیک"],
      keywords: ["text", "style"],
      execute(context) {
        toggleMark(context, "italic");
      },
      isAvailable: hasTextBlockSelection,
    },
    {
      id: FORMAT_LINK_COMMAND_ID,
      title: "Link",
      description: "Insert a link block after focused block",
      category: "Formatting",
      menuPath: ["formatting", "inline"],
      slashTrigger: "link",
      aliases: ["url", "لینک"],
      keywords: ["anchor", "hyperlink"],
      execute(context) {
        executeLinkInsert(context);
      },
    },
    {
      id: FORMAT_CODE_COMMAND_ID,
      title: "Code",
      description: "Toggle code mark on selected text block",
      category: "Formatting",
      menuPath: ["formatting", "inline"],
      slashTrigger: "code",
      aliases: ["inline-code", "کد"],
      keywords: ["monospace", "syntax"],
      execute(context) {
        toggleMark(context, "code");
      },
      isAvailable: hasTextBlockSelection,
    },
    {
      id: INSERT_HEADING_COMMAND_ID,
      title: "Heading",
      description: "Convert focused text block to heading",
      category: "Insert",
      menuPath: ["insert", "text"],
      slashTrigger: "heading",
      aliases: ["title", "تیتر"],
      keywords: ["h1", "section"],
      execute(context) {
        executeHeadingToggle(context);
      },
    },
    {
      id: SAVE_DOCUMENT_COMMAND_ID,
      title: "Save",
      description: "Mark document as saved",
      category: "Document",
      menuPath: ["document"],
      slashTrigger: "save",
      aliases: ["persist", "ذخیره"],
      keywords: ["store", "commit"],
      async execute(context) {
        await executeSaveDocument(context);
      },
    },
  ];
}

export function registerFormattingCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(registry: EditorCommandRegistry<TBlock>): EditorCommand<TBlock>[] {
  const commands = createFormattingCommands<TBlock>();
  const registered: EditorCommand<TBlock>[] = [];

  for (const command of commands) {
    if (!registry.has(command.id)) {
      registry.register(command);
      registered.push(command);
    }
  }

  return registered;
}
