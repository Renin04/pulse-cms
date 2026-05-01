import { beforeEach, describe, expect, it } from "vitest";

import type { Block } from "../../core/src/types/block";
import {
  createCommandRegistry,
  createEditorStateAdapter,
  createShortcutRegistry,
  registerAlignmentCommands,
  registerFindReplaceCommands,
  registerDocumentStatsCommands,
  createAlignmentShortcutBindings,
  createFindReplaceShortcutBindings,
  createDocumentStatsShortcutBindings,
  ALIGN_LEFT_COMMAND_ID,
  ALIGN_CENTER_COMMAND_ID,
  ALIGN_RIGHT_COMMAND_ID,
  ALIGN_JUSTIFY_COMMAND_ID,
  FIND_COMMAND_ID,
  FIND_NEXT_COMMAND_ID,
  FIND_PREVIOUS_COMMAND_ID,
  REPLACE_COMMAND_ID,
  REPLACE_ALL_COMMAND_ID,
  CLOSE_FIND_COMMAND_ID,
  WORD_COUNT_COMMAND_ID,
  DOCUMENT_STATS_COMMAND_ID,
  getFindReplaceState,
  setFindReplaceState,
  resetFindReplaceState,
  calculateStats,
} from "../src";

interface TextBlockData extends Record<string, unknown> {
  text: string;
  marks: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    code: boolean;
  };
  align?: "left" | "center" | "right" | "justify";
}

type EditorBlock = Block<TextBlockData>;

function createTextBlock(
  id: string,
  text: string,
  align: "left" | "center" | "right" | "justify" = "left",
): EditorBlock {
  const timestamp = new Date().toISOString();

  return {
    id,
    type: "text",
    data: {
      text,
      marks: {
        bold: false,
        italic: false,
        underline: false,
        code: false,
      },
      align,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createEditorRuntime(initialBlocks: EditorBlock[] = [createTextBlock("b1", "Hello World")]) {
  const state = createEditorStateAdapter<EditorBlock>({
    document: {
      id: "test-doc",
      blocks: initialBlocks,
    },
  });
  const commandRegistry = createCommandRegistry<EditorBlock>();
  registerAlignmentCommands(commandRegistry);
  registerFindReplaceCommands(commandRegistry);
  registerDocumentStatsCommands(commandRegistry);

  return { state, commandRegistry };
}

describe("PM4-2: Rich Text Parity Core - Alignment", () => {
  it("registers all alignment commands", () => {
    const { commandRegistry } = createEditorRuntime();

    expect(commandRegistry.has(ALIGN_LEFT_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(ALIGN_CENTER_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(ALIGN_RIGHT_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(ALIGN_JUSTIFY_COMMAND_ID)).toBe(true);
  });

  it("executes alignment commands on focused text block", async () => {
    const { state, commandRegistry } = createEditorRuntime();

    // Default alignment is left
    let block = state.getSnapshot().document.blocks[0];
    expect(block.data.align).toBe("left");

    // Center align
    await commandRegistry.execute(ALIGN_CENTER_COMMAND_ID, { state });
    block = state.getSnapshot().document.blocks[0];
    expect(block.data.align).toBe("center");

    // Right align
    await commandRegistry.execute(ALIGN_RIGHT_COMMAND_ID, { state });
    block = state.getSnapshot().document.blocks[0];
    expect(block.data.align).toBe("right");

    // Justify
    await commandRegistry.execute(ALIGN_JUSTIFY_COMMAND_ID, { state });
    block = state.getSnapshot().document.blocks[0];
    expect(block.data.align).toBe("justify");

    // Back to left
    await commandRegistry.execute(ALIGN_LEFT_COMMAND_ID, { state });
    block = state.getSnapshot().document.blocks[0];
    expect(block.data.align).toBe("left");
  });

  it("applies alignment to multiple selected blocks", async () => {
    const blocks = [
      createTextBlock("b1", "First paragraph"),
      createTextBlock("b2", "Second paragraph"),
    ];
    const { state, commandRegistry } = createEditorRuntime(blocks);

    // Select multiple blocks
    state.selectBlocks(["b1", "b2"]);

    await commandRegistry.execute(ALIGN_CENTER_COMMAND_ID, { state });

    const updatedBlocks = state.getSnapshot().document.blocks;
    expect(updatedBlocks[0].data.align).toBe("center");
    expect(updatedBlocks[1].data.align).toBe("center");
  });

  it("alignment commands are available only for text blocks", async () => {
    const { state, commandRegistry } = createEditorRuntime();

    const context = { state };
    const alignLeftCmd = commandRegistry.get(ALIGN_LEFT_COMMAND_ID)!;

    // Available when text block is focused
    expect(alignLeftCmd.isAvailable?.(context)).toBe(true);

    // Not available when no block is focused (create empty state)
    const emptyState = createEditorStateAdapter<EditorBlock>({
      document: { id: "empty", blocks: [] },
    });
    expect(alignLeftCmd.isAvailable?.({ state: emptyState })).toBe(false);
  });

  it("registers alignment shortcuts without conflicts", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    const bindings = createAlignmentShortcutBindings<EditorBlock>();
    for (const binding of bindings) {
      shortcuts.register(binding);
    }

    expect(shortcuts.getConflicts()).toHaveLength(0);
  });

  it("executes alignment via shortcuts", async () => {
    const { state, commandRegistry } = createEditorRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    const bindings = createAlignmentShortcutBindings<EditorBlock>();
    for (const binding of bindings) {
      shortcuts.register(binding);
    }

    // Ctrl+Shift+E for center
    await shortcuts.dispatch({ key: "e", ctrlKey: true, shiftKey: true }, { state });

    const block = state.getSnapshot().document.blocks[0];
    expect(block.data.align).toBe("center");
  });
});

describe("PM4-2: Rich Text Parity Core - Find/Replace", () => {
  beforeEach(() => {
    resetFindReplaceState();
  });

  it("registers all find/replace commands", () => {
    const { commandRegistry } = createEditorRuntime();

    expect(commandRegistry.has(FIND_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(FIND_NEXT_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(FIND_PREVIOUS_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(REPLACE_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(REPLACE_ALL_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(CLOSE_FIND_COMMAND_ID)).toBe(true);
  });

  it("opens find panel and updates state", async () => {
    const { state, commandRegistry } = createEditorRuntime();

    expect(getFindReplaceState().isOpen).toBe(false);

    await commandRegistry.execute(FIND_COMMAND_ID, { state });

    expect(getFindReplaceState().isOpen).toBe(true);
  });

  it("finds matches across text blocks", async () => {
    const blocks = [
      createTextBlock("b1", "Hello world"),
      createTextBlock("b2", "Hello again"),
    ];
    const { state, commandRegistry } = createEditorRuntime(blocks);

    setFindReplaceState({ query: "Hello", isOpen: true });
    await commandRegistry.execute(FIND_COMMAND_ID, { state });

    // Should have 2 matches
    expect(getFindReplaceState().totalMatches).toBe(2);
  });

  it("navigates between matches with next/previous", async () => {
    const blocks = [
      createTextBlock("b1", "First"),
      createTextBlock("b2", "Second"),
      createTextBlock("b3", "Third"),
    ];
    const { state, commandRegistry } = createEditorRuntime(blocks);

    setFindReplaceState({ query: "i", isOpen: true, totalMatches: 3, currentMatchIndex: 0 });

    await commandRegistry.execute(FIND_NEXT_COMMAND_ID, { state });
    expect(getFindReplaceState().currentMatchIndex).toBe(1);

    await commandRegistry.execute(FIND_NEXT_COMMAND_ID, { state });
    expect(getFindReplaceState().currentMatchIndex).toBe(2);

    await commandRegistry.execute(FIND_NEXT_COMMAND_ID, { state });
    expect(getFindReplaceState().currentMatchIndex).toBe(0); // Wrap around

    await commandRegistry.execute(FIND_PREVIOUS_COMMAND_ID, { state });
    expect(getFindReplaceState().currentMatchIndex).toBe(2); // Wrap backwards
  });

  it("replaces single match", async () => {
    const { state, commandRegistry } = createEditorRuntime([createTextBlock("b1", "Hello world")]);

    setFindReplaceState({
      query: "world",
      replaceText: "universe",
      isOpen: true,
      totalMatches: 1,
      currentMatchIndex: 0,
    });

    await commandRegistry.execute(REPLACE_COMMAND_ID, { state });

    const block = state.getSnapshot().document.blocks[0];
    expect(block.data.text).toBe("Hello universe");
  });

  it("replaces all matches", async () => {
    const blocks = [
      createTextBlock("b1", "Hello world"),
      createTextBlock("b2", "Goodbye world"),
    ];
    const { state, commandRegistry } = createEditorRuntime(blocks);

    setFindReplaceState({
      query: "world",
      replaceText: "universe",
      isOpen: true,
      totalMatches: 2,
    });

    await commandRegistry.execute(REPLACE_ALL_COMMAND_ID, { state });

    const updatedBlocks = state.getSnapshot().document.blocks;
    expect(updatedBlocks[0].data.text).toBe("Hello universe");
    expect(updatedBlocks[1].data.text).toBe("Goodbye universe");
  });

  it("closes find panel", async () => {
    const { state, commandRegistry } = createEditorRuntime();

    setFindReplaceState({ isOpen: true });
    await commandRegistry.execute(CLOSE_FIND_COMMAND_ID, { state });

    expect(getFindReplaceState().isOpen).toBe(false);
  });

  it("registers find/replace shortcuts without conflicts", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    const bindings = createFindReplaceShortcutBindings<EditorBlock>();
    for (const binding of bindings) {
      shortcuts.register(binding);
    }

    // Check no conflicts with basic bindings
    expect(shortcuts.getConflicts()).toHaveLength(0);
  });

  it("opens find with Ctrl+F shortcut", async () => {
    const { state, commandRegistry } = createEditorRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    const bindings = createFindReplaceShortcutBindings<EditorBlock>();
    for (const binding of bindings) {
      shortcuts.register(binding);
    }

    expect(getFindReplaceState().isOpen).toBe(false);

    await shortcuts.dispatch({ key: "f", ctrlKey: true }, { state });

    expect(getFindReplaceState().isOpen).toBe(true);
  });
});

describe("PM4-2: Rich Text Parity Core - Document Stats", () => {
  it("registers word count and document stats commands", () => {
    const { commandRegistry } = createEditorRuntime();

    expect(commandRegistry.has(WORD_COUNT_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(DOCUMENT_STATS_COMMAND_ID)).toBe(true);
  });

  it("calculates document stats correctly", async () => {
    const blocks = [
      createTextBlock("b1", "Hello world"), // 2 words, 11 chars
      createTextBlock("b2", "Second paragraph here"), // 3 words, 21 chars
    ];
    const { state } = createEditorRuntime(blocks);

    const stats = calculateStats({ state });

    expect(stats.wordCount).toBe(5);
    expect(stats.charCountWithSpaces).toBe(32); // 11 + 21
    expect(stats.paragraphCount).toBe(2);
    expect(stats.blockCount).toBe(2);
  });

  it("counts words with Unicode support", async () => {
    const blocks = [
      createTextBlock("b1", "Hello جهان 123 test"),
    ];
    const { state } = createEditorRuntime(blocks);

    const stats = calculateStats({ state });

    // Should count: Hello, جهان, 123, test = 4 words
    expect(stats.wordCount).toBe(4);
  });

  it("ignores empty text blocks in stats", async () => {
    const blocks = [
      createTextBlock("b1", "Hello world"),
      createTextBlock("b2", ""),
    ];
    const { state } = createEditorRuntime(blocks);

    const stats = calculateStats({ state });

    expect(stats.wordCount).toBe(2);
    expect(stats.paragraphCount).toBe(2); // Still counts as paragraph
  });

  it("registers document stats shortcuts without conflicts", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    const bindings = createDocumentStatsShortcutBindings<EditorBlock>();
    for (const binding of bindings) {
      shortcuts.register(binding);
    }

    expect(shortcuts.getConflicts()).toHaveLength(0);
  });

  it("executes word count via shortcut", async () => {
    const { state, commandRegistry } = createEditorRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    const bindings = createDocumentStatsShortcutBindings<EditorBlock>();
    for (const binding of bindings) {
      shortcuts.register(binding);
    }

    // Ctrl+Shift+W for word count
    const result = await shortcuts.dispatch(
      { key: "w", ctrlKey: true, shiftKey: true },
      { state },
    );

    expect(result.type).toBe("executed");
    expect(result.commandId).toBe(WORD_COUNT_COMMAND_ID);
    expect(commandRegistry.has(WORD_COUNT_COMMAND_ID)).toBe(true);
  });
});

describe("PM4-2: Integration - All parity features work together", () => {
  beforeEach(() => {
    resetFindReplaceState();
  });

  it("can register all PM4-2 commands and shortcuts without conflicts", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    // Register all PM4-2 shortcuts
    const alignmentBindings = createAlignmentShortcutBindings<EditorBlock>();
    const findReplaceBindings = createFindReplaceShortcutBindings<EditorBlock>();
    const statsBindings = createDocumentStatsShortcutBindings<EditorBlock>();

    for (const binding of alignmentBindings) {
      shortcuts.register(binding);
    }
    for (const binding of findReplaceBindings) {
      shortcuts.register(binding);
    }
    for (const binding of statsBindings) {
      shortcuts.register(binding);
    }

    // Verify no conflicts
    const conflicts = shortcuts.getConflicts();
    expect(conflicts).toHaveLength(0);

    // Verify all commands are registered
    const expectedCommands = [
      ALIGN_LEFT_COMMAND_ID,
      ALIGN_CENTER_COMMAND_ID,
      ALIGN_RIGHT_COMMAND_ID,
      ALIGN_JUSTIFY_COMMAND_ID,
      FIND_COMMAND_ID,
      FIND_NEXT_COMMAND_ID,
      FIND_PREVIOUS_COMMAND_ID,
      REPLACE_COMMAND_ID,
      REPLACE_ALL_COMMAND_ID,
      CLOSE_FIND_COMMAND_ID,
      WORD_COUNT_COMMAND_ID,
      DOCUMENT_STATS_COMMAND_ID,
    ];

    for (const cmdId of expectedCommands) {
      expect(commandRegistry.has(cmdId)).toBe(true);
    }
  });

  it("commands have proper metadata for discoverability", () => {
    const { commandRegistry } = createEditorRuntime();

    const alignCenterCmd = commandRegistry.get(ALIGN_CENTER_COMMAND_ID)!;
    expect(alignCenterCmd.title).toBe("Align Center");
    expect(alignCenterCmd.category).toBe("Formatting");
    expect(alignCenterCmd.menuPath).toEqual(["formatting", "alignment"]);
    expect(alignCenterCmd.slashTrigger).toBeDefined();

    const findCmd = commandRegistry.get(FIND_COMMAND_ID)!;
    expect(findCmd.title).toBe("Find");
    expect(findCmd.category).toBe("Editing");
    expect(findCmd.slashTrigger).toBeDefined();

    const wordCountCmd = commandRegistry.get(WORD_COUNT_COMMAND_ID)!;
    expect(wordCountCmd.title).toBe("Word Count");
    expect(wordCountCmd.category).toBe("Document");
    expect(wordCountCmd.slashTrigger).toBeDefined();
  });
});
