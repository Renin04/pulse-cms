import { describe, expect, it, vi } from "vitest";

import {
  createVanillaEditor,
  VanillaEditorAPI,
  BlockRegistry,
} from "../src";
import type { Block } from "../src";

interface TextBlockData extends Record<string, unknown> {
  text: string;
}

type TextBlock = Block<TextBlockData>;

function makeBlock(id: string, text: string): TextBlock {
  const now = new Date().toISOString();
  return { id, type: "text", data: { text }, createdAt: now, updatedAt: now };
}

describe("createVanillaEditor — factory", () => {
  it("creates a VanillaEditorAPI instance", () => {
    BlockRegistry.resetInstance();
    const editor = createVanillaEditor<TextBlock>();
    expect(editor).toBeInstanceOf(VanillaEditorAPI);
  });

  it("initializes with supplied blocks", () => {
    BlockRegistry.resetInstance();
    const editor = createVanillaEditor<TextBlock>({
      initialBlocks: [makeBlock("b1", "Hello")],
    });
    expect(editor.getBlocks()).toHaveLength(1);
    expect(editor.getBlocks()[0].data.text).toBe("Hello");
  });
});

describe("VanillaEditorAPI — block operations", () => {
  it("inserts a block and fires block:created event", () => {
    BlockRegistry.resetInstance();
    const editor = createVanillaEditor<TextBlock>();
    const handler = vi.fn();
    editor.on("block:created", handler);

    editor.insertBlock(makeBlock("b1", "World"));

    expect(editor.getBlocks()).toHaveLength(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ blockId: "b1", blockType: "text" }),
    );
  });

  it("updates a block and fires block:updated event", () => {
    BlockRegistry.resetInstance();
    const editor = createVanillaEditor<TextBlock>({
      initialBlocks: [makeBlock("b1", "Old")],
    });
    const handler = vi.fn();
    editor.on("block:updated", handler);

    editor.updateBlock("b1", (block) => ({
      ...block,
      data: { text: "New" },
    }));

    expect(editor.getBlockById("b1")?.data.text).toBe("New");
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ blockId: "b1" }),
    );
  });

  it("removes a block and fires block:deleted event", () => {
    BlockRegistry.resetInstance();
    const editor = createVanillaEditor<TextBlock>({
      initialBlocks: [makeBlock("b1", "Gone")],
    });
    const handler = vi.fn();
    editor.on("block:deleted", handler);

    editor.removeBlock("b1");

    expect(editor.getBlocks()).toHaveLength(0);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ blockId: "b1" }),
    );
  });

  it("moves a block and fires block:moved event", () => {
    BlockRegistry.resetInstance();
    const editor = createVanillaEditor<TextBlock>({
      initialBlocks: [makeBlock("a", "A"), makeBlock("b", "B"), makeBlock("c", "C")],
    });
    const handler = vi.fn();
    editor.on("block:moved", handler);

    editor.moveBlock("a", 2);

    expect(editor.getBlocks()[2].id).toBe("a");
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ blockId: "a", fromIndex: 0, toIndex: 2 }),
    );
  });
});

describe("VanillaEditorAPI — undo / redo", () => {
  it("undoes an insert", () => {
    BlockRegistry.resetInstance();
    const editor = createVanillaEditor<TextBlock>();

    editor.insertBlock(makeBlock("b1", "First"));
    expect(editor.getBlocks()).toHaveLength(1);

    const snap = editor.undo();
    expect(snap.document.blocks).toHaveLength(0);
    expect(snap.canUndo).toBe(false);
    expect(snap.canRedo).toBe(true);
  });

  it("redoes after undo", () => {
    BlockRegistry.resetInstance();
    const editor = createVanillaEditor<TextBlock>();

    editor.insertBlock(makeBlock("b1", "First"));
    editor.undo();
    const snap = editor.redo();

    expect(snap.document.blocks).toHaveLength(1);
    expect(snap.canRedo).toBe(false);
  });
});

describe("VanillaEditorAPI — selection", () => {
  it("sets cursor and fires selection:changed", () => {
    BlockRegistry.resetInstance();
    const editor = createVanillaEditor<TextBlock>({
      initialBlocks: [makeBlock("b1", "Text")],
    });
    const handler = vi.fn();
    editor.on("selection:changed", handler);

    const snap = editor.setCursor("b1", 3);

    expect(snap.cursor?.blockId).toBe("b1");
    expect(snap.cursor?.offset).toBe(3);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ blockId: "b1", startOffset: 3 }),
    );
  });

  it("clears selection and fires selection:cleared", () => {
    BlockRegistry.resetInstance();
    const editor = createVanillaEditor<TextBlock>({
      initialBlocks: [makeBlock("b1", "Text")],
    });
    editor.setCursor("b1", 0);
    const handler = vi.fn();
    editor.on("selection:cleared", handler);

    const snap = editor.clearSelection();

    expect(snap.cursor).toBeNull();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "programmatic" }),
    );
  });
});

describe("VanillaEditorAPI — onChange callback", () => {
  it("invokes onChange on block mutation", () => {
    BlockRegistry.resetInstance();
    const onChange = vi.fn();
    const editor = createVanillaEditor<TextBlock>({ onChange });

    editor.insertBlock(makeBlock("b1", "Hello"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String) }),
    );
  });
});

describe("VanillaEditorAPI — getSnapshot", () => {
  it("returns full snapshot with canUndo/canRedo flags", () => {
    BlockRegistry.resetInstance();
    const editor = createVanillaEditor<TextBlock>();

    const initial = editor.getSnapshot();
    expect(initial.canUndo).toBe(false);
    expect(initial.canRedo).toBe(false);

    editor.insertBlock(makeBlock("b1", "A"));
    const after = editor.getSnapshot();
    expect(after.canUndo).toBe(true);
  });
});
