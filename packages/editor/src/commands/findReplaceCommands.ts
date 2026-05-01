import type { Block, BlockData } from "../../../core/src/types/block";
import type {
  EditorCommand,
  EditorCommandContext,
  EditorCommandRegistry,
} from "./CommandRegistry";

interface TextBlockData extends Record<string, unknown> {
  text?: string;
}

export const FIND_COMMAND_ID = "editor.find.open";
export const FIND_NEXT_COMMAND_ID = "editor.find.next";
export const FIND_PREVIOUS_COMMAND_ID = "editor.find.previous";
export const REPLACE_COMMAND_ID = "editor.replace.one";
export const REPLACE_ALL_COMMAND_ID = "editor.replace.all";
export const CLOSE_FIND_COMMAND_ID = "editor.find.close";

export interface FindReplaceState {
  query: string;
  replaceText: string;
  caseSensitive: boolean;
  currentMatchIndex: number;
  totalMatches: number;
  isOpen: boolean;
  lastFocusedBlockId?: string;
}

let globalFindState: FindReplaceState = {
  query: "",
  replaceText: "",
  caseSensitive: false,
  currentMatchIndex: 0,
  totalMatches: 0,
  isOpen: false,
};

export function getFindReplaceState(): FindReplaceState {
  return { ...globalFindState };
}

export function setFindReplaceState(state: Partial<FindReplaceState>): void {
  globalFindState = { ...globalFindState, ...state };
}

export function resetFindReplaceState(): void {
  globalFindState = {
    query: "",
    replaceText: "",
    caseSensitive: false,
    currentMatchIndex: 0,
    totalMatches: 0,
    isOpen: false,
  };
}

function findAllMatches(
  blocks: Block<BlockData>[],
  query: string,
  caseSensitive: boolean,
): Array<{ blockId: string; index: number; length: number }> {
  if (!query) return [];

  const matches: Array<{ blockId: string; index: number; length: number }> = [];

  for (const block of blocks) {
    if (block.type !== "text") continue;

    const data = block.data as TextBlockData;
    const text = data.text ?? "";

    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchQuery = caseSensitive ? query : query.toLowerCase();

    let index = searchText.indexOf(searchQuery);
    while (index !== -1) {
      matches.push({ blockId: block.id, index, length: searchQuery.length });
      index = searchText.indexOf(searchQuery, index + 1);
    }
  }

  return matches;
}

function updateMatchCount<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
): void {
  const snapshot = context.state.getSnapshot();
  const matches = findAllMatches(
    snapshot.document.blocks,
    globalFindState.query,
    globalFindState.caseSensitive,
  );
  globalFindState.totalMatches = matches.length;
  if (globalFindState.currentMatchIndex >= matches.length) {
    globalFindState.currentMatchIndex = matches.length > 0 ? 0 : 0;
  }
}

export function createFindReplaceCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): EditorCommand<TBlock>[] {
  return [
    {
      id: FIND_COMMAND_ID,
      title: "Find",
      description: "Open find panel to search in document",
      category: "Editing",
      menuPath: ["edit", "find"],
      slashTrigger: "find",
      aliases: ["search", "جستجو"],
      keywords: ["text", "search", "locate"],
      execute(context) {
        globalFindState.isOpen = true;
        const snapshot = context.state.getSnapshot();
        if (snapshot.focusedBlockId) {
          globalFindState.lastFocusedBlockId = snapshot.focusedBlockId;
        }
        updateMatchCount(context);

        // Dispatch custom event for UI to show find panel
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pulse:find:open", {
              detail: { state: getFindReplaceState() },
            }),
          );
        }
      },
    },
    {
      id: FIND_NEXT_COMMAND_ID,
      title: "Find Next",
      description: "Jump to next search result",
      category: "Editing",
      menuPath: ["edit", "find"],
      slashTrigger: "find next",
      aliases: ["next", "بعدی"],
      keywords: ["search", "navigate", "forward"],
      execute() {
        if (!globalFindState.isOpen || globalFindState.totalMatches === 0) {
          return;
        }
        globalFindState.currentMatchIndex =
          (globalFindState.currentMatchIndex + 1) % globalFindState.totalMatches;

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pulse:find:navigate", {
              detail: { state: getFindReplaceState() },
            }),
          );
        }
      },
      isAvailable: () => globalFindState.isOpen && globalFindState.totalMatches > 0,
    },
    {
      id: FIND_PREVIOUS_COMMAND_ID,
      title: "Find Previous",
      description: "Jump to previous search result",
      category: "Editing",
      menuPath: ["edit", "find"],
      slashTrigger: "find previous",
      aliases: ["previous", "قبلی"],
      keywords: ["search", "navigate", "back"],
      execute() {
        if (!globalFindState.isOpen || globalFindState.totalMatches === 0) {
          return;
        }
        globalFindState.currentMatchIndex =
          (globalFindState.currentMatchIndex - 1 + globalFindState.totalMatches) %
          globalFindState.totalMatches;

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pulse:find:navigate", {
              detail: { state: getFindReplaceState() },
            }),
          );
        }
      },
      isAvailable: () => globalFindState.isOpen && globalFindState.totalMatches > 0,
    },
    {
      id: REPLACE_COMMAND_ID,
      title: "Replace",
      description: "Replace current match with replacement text",
      category: "Editing",
      menuPath: ["edit", "find"],
      slashTrigger: "replace",
      aliases: ["swap", "جایگزین"],
      keywords: ["search", "change", "substitute"],
      execute(context) {
        if (!globalFindState.isOpen || !globalFindState.query) {
          return;
        }

        const snapshot = context.state.getSnapshot();
        const matches = findAllMatches(
          snapshot.document.blocks,
          globalFindState.query,
          globalFindState.caseSensitive,
        );

        if (matches.length === 0 || globalFindState.currentMatchIndex >= matches.length) {
          return;
        }

        const match = matches[globalFindState.currentMatchIndex];
        const block = snapshot.document.blocks.find((b) => b.id === match.blockId);

        if (!block || block.type !== "text") {
          return;
        }

        const data = block.data as TextBlockData;
        const text = data.text ?? "";
        const newText = text.substring(0, match.index) + globalFindState.replaceText + text.substring(match.index + match.length);

        context.state.updateBlock(block.id, (b) => ({
          ...b,
          data: { ...data, text: newText },
          updatedAt: new Date().toISOString(),
        }) as TBlock);

        // Update match count after replacement
        updateMatchCount(context);

        // Move to next match (which is now at the same index due to text shift)
        if (globalFindState.currentMatchIndex >= globalFindState.totalMatches) {
          globalFindState.currentMatchIndex = 0;
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pulse:find:replace", {
              detail: { state: getFindReplaceState() },
            }),
          );
        }
      },
      isAvailable: () => globalFindState.isOpen && globalFindState.totalMatches > 0,
    },
    {
      id: REPLACE_ALL_COMMAND_ID,
      title: "Replace All",
      description: "Replace all matches with replacement text",
      category: "Editing",
      menuPath: ["edit", "find"],
      slashTrigger: "replace all",
      aliases: ["replace everything", "جایگزین همه"],
      keywords: ["search", "change", "all", "bulk"],
      execute(context) {
        if (!globalFindState.isOpen || !globalFindState.query) {
          return;
        }

        const snapshot = context.state.getSnapshot();
        const blocks = [...snapshot.document.blocks];

        // Process blocks from end to start to maintain indices
        for (let i = blocks.length - 1; i >= 0; i--) {
          const block = blocks[i];
          if (block.type !== "text") continue;

          const data = block.data as TextBlockData;
          const text = data.text ?? "";

          const searchText = globalFindState.caseSensitive ? text : text.toLowerCase();
          const searchQuery = globalFindState.caseSensitive
            ? globalFindState.query
            : globalFindState.query.toLowerCase();

          let newText = text;
          let offset = 0;
          let index = searchText.indexOf(searchQuery);

          while (index !== -1) {
            newText =
              newText.substring(0, index + offset) +
              globalFindState.replaceText +
              newText.substring(index + offset + searchQuery.length);
            offset += globalFindState.replaceText.length - searchQuery.length;
            index = searchText.indexOf(searchQuery, index + 1);
          }

          if (newText !== text) {
            context.state.updateBlock(block.id, (b) => ({
              ...b,
              data: { ...data, text: newText },
              updatedAt: new Date().toISOString(),
            }) as TBlock);
          }
        }

        updateMatchCount(context);
        globalFindState.currentMatchIndex = 0;

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pulse:find:replaceAll", {
              detail: { state: getFindReplaceState() },
            }),
          );
        }
      },
      isAvailable: () => globalFindState.isOpen && globalFindState.totalMatches > 0,
    },
    {
      id: CLOSE_FIND_COMMAND_ID,
      title: "Close Find",
      description: "Close find panel",
      category: "Editing",
      menuPath: ["edit", "find"],
      slashTrigger: "close find",
      aliases: ["exit find", "بستن جستجو"],
      keywords: ["search", "close", "exit"],
      execute() {
        globalFindState.isOpen = false;

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pulse:find:close", {
              detail: { state: getFindReplaceState() },
            }),
          );
        }
      },
      isAvailable: () => globalFindState.isOpen,
    },
  ];
}

export function registerFindReplaceCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(registry: EditorCommandRegistry<TBlock>): EditorCommand<TBlock>[] {
  const commands = createFindReplaceCommands<TBlock>();
  const registered: EditorCommand<TBlock>[] = [];

  for (const command of commands) {
    if (!registry.has(command.id)) {
      registry.register(command);
      registered.push(command);
    }
  }

  return registered;
}
