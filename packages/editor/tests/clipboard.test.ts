import { describe, expect, it } from "vitest";

import type { Block } from "../../core/src/types/block";
import {
  COPY_BLOCKS_COMMAND_ID,
  PASTE_BLOCKS_COMMAND_ID,
  createCommandRegistry,
  createEditorClipboardController,
  createEditorStateAdapter,
  createInMemoryClipboardDriver,
  registerClipboardCommands,
} from "../src";

interface TextBlockData extends Record<string, unknown> {
  text: string;
}

type TextBlock = Block<TextBlockData>;

function createTextBlock(id: string, text: string): TextBlock {
  const timestamp = new Date().toISOString();

  return {
    id,
    type: "text",
    data: { text },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("editor clipboard workflows", () => {
  it("copies selected blocks and pastes remapped blocks in insert mode", async () => {
    const state = createEditorStateAdapter<TextBlock>({
      document: {
        id: "clipboard-doc",
        blocks: [
          createTextBlock("b1", "Alpha"),
          createTextBlock("b2", "Beta"),
          createTextBlock("b3", "Gamma"),
        ],
      },
    });
    const controller = createEditorClipboardController({
      state,
    });

    state.setSelectionRange({
      start: { blockId: "b1", offset: 0 },
      end: { blockId: "b2", offset: 4 },
    });

    const copyResult = await controller.copySelectedBlocks();
    expect(copyResult.copied).toBe(true);
    expect(copyResult.blockIds).toEqual(["b1", "b2"]);
    expect(copyResult.serialized).toContain('"sourceDocumentId":"clipboard-doc"');

    const pasteResult = await controller.pasteBlocks();
    expect(pasteResult.pasted).toBe(true);
    expect(pasteResult.mode).toBe("insert");
    expect(pasteResult.blockIds).toHaveLength(2);
    expect(pasteResult.blockIds.some((blockId) => blockId === "b1")).toBe(false);
    expect(pasteResult.blockIds.some((blockId) => blockId === "b2")).toBe(false);

    const blocks = state.getSnapshot().document.blocks;
    expect(blocks).toHaveLength(5);
    expect(blocks.map((block) => block.id).slice(0, 2)).toEqual(["b1", "b2"]);
    expect(blocks[2]?.data.text).toBe("Alpha");
    expect(blocks[3]?.data.text).toBe("Beta");
    expect(blocks[4]?.id).toBe("b3");
  });

  it("supports sharing copied payloads between controllers and replace-mode paste", async () => {
    const driver = createInMemoryClipboardDriver();
    const sourceState = createEditorStateAdapter<TextBlock>({
      document: {
        blocks: [createTextBlock("s1", "One"), createTextBlock("s2", "Two")],
      },
    });
    const sourceClipboard = createEditorClipboardController({
      state: sourceState,
      driver,
    });

    sourceState.selectBlocks(["s1", "s2"]);
    await sourceClipboard.copySelectedBlocks();

    const targetState = createEditorStateAdapter<TextBlock>({
      document: {
        blocks: [createTextBlock("t1", "Existing")],
      },
    });
    const targetClipboard = createEditorClipboardController({
      state: targetState,
      driver,
    });

    const pasteResult = await targetClipboard.pasteBlocks({
      mode: "replace",
    });

    expect(pasteResult.mode).toBe("replace");
    expect(targetState.getSnapshot().document.blocks).toHaveLength(2);
    expect(targetState.getSnapshot().document.blocks.map((block) => block.data.text)).toEqual([
      "One",
      "Two",
    ]);
  });

  it("returns a no-op copy result when no block can be resolved", async () => {
    const state = createEditorStateAdapter<TextBlock>({
      document: {
        blocks: [],
      },
    });
    const controller = createEditorClipboardController({
      state,
    });

    const result = await controller.copySelectedBlocks();
    expect(result).toEqual({
      copied: false,
      blockIds: [],
      serialized: null,
    });
  });

  it("throws for malformed clipboard payloads", async () => {
    const state = createEditorStateAdapter<TextBlock>({
      document: {
        blocks: [createTextBlock("b1", "Seed")],
      },
    });
    const driver = createInMemoryClipboardDriver("not-json");
    const controller = createEditorClipboardController({
      state,
      driver,
    });

    await expect(controller.pasteBlocks()).rejects.toThrow();
  });

  it("registers clipboard commands and executes them through context", async () => {
    const state = createEditorStateAdapter<TextBlock>({
      document: {
        blocks: [createTextBlock("b1", "One"), createTextBlock("b2", "Two")],
      },
    });
    const clipboard = createEditorClipboardController({
      state,
    });
    const registry = createCommandRegistry<TextBlock>();
    registerClipboardCommands(registry);

    state.selectBlocks(["b1", "b2"]);

    await registry.execute(COPY_BLOCKS_COMMAND_ID, {
      state,
      clipboard,
    });
    const pasteResult = await registry.execute(PASTE_BLOCKS_COMMAND_ID, {
      state,
      clipboard,
    });

    expect(pasteResult.id).toBe(PASTE_BLOCKS_COMMAND_ID);
    expect(state.getSnapshot().document.blocks).toHaveLength(4);
  });
});
