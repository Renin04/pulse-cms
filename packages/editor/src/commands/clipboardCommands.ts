import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorCommand, EditorCommandContext, EditorCommandRegistry } from "./CommandRegistry";

export const COPY_BLOCKS_COMMAND_ID = "editor.clipboard.copyBlocks";
export const PASTE_BLOCKS_COMMAND_ID = "editor.clipboard.pasteBlocks";

function hasClipboard<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
): boolean {
  return Boolean(context.clipboard);
}

export function createClipboardCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): EditorCommand<TBlock>[] {
  return [
    {
      id: COPY_BLOCKS_COMMAND_ID,
      title: "Copy blocks",
      description: "Copy selected blocks to the clipboard payload format",
      category: "Clipboard",
      menuPath: ["clipboard"],
      slashTrigger: "copy-blocks",
      aliases: ["copy-selection"],
      keywords: ["duplicate", "transfer"],
      isAvailable: hasClipboard,
      async execute(context) {
        if (!context.clipboard) {
          return;
        }

        await context.clipboard.copySelectedBlocks();
      },
    },
    {
      id: PASTE_BLOCKS_COMMAND_ID,
      title: "Paste blocks",
      description: "Paste copied blocks from clipboard payload format",
      category: "Clipboard",
      menuPath: ["clipboard"],
      slashTrigger: "paste-blocks",
      aliases: ["paste-selection"],
      keywords: ["insert", "transfer"],
      isAvailable: hasClipboard,
      async execute(context) {
        if (!context.clipboard) {
          return;
        }

        await context.clipboard.pasteBlocks({
          mode: "insert",
        });
      },
    },
  ];
}

export function registerClipboardCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(registry: EditorCommandRegistry<TBlock>): EditorCommand<TBlock>[] {
  const commands = createClipboardCommands<TBlock>();
  const registered: EditorCommand<TBlock>[] = [];

  for (const command of commands) {
    if (!registry.has(command.id)) {
      registry.register(command);
      registered.push(command);
    }
  }

  return registered;
}
