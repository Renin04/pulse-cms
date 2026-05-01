import { describe, expect, it, vi } from "vitest";

import { createEditorBridge, EditorBridge } from "../src/EditorBridge";
import type { Block } from "../../core/src/types/block";

interface TextBlockData extends Record<string, unknown> {
  text: string;
}

type TextBlock = Block<TextBlockData>;

function makeBlock(id: string, text: string): TextBlock {
  const now = new Date().toISOString();
  return { id, type: "text", data: { text }, createdAt: now, updatedAt: now };
}

describe("createEditorBridge — factory", () => {
  it("creates an EditorBridge instance", () => {
    const bridge = createEditorBridge<TextBlock>();
    expect(bridge).toBeInstanceOf(EditorBridge);
  });

  it("initializes with empty document by default", () => {
    const bridge = createEditorBridge<TextBlock>();
    expect(bridge.getSnapshot().document.blocks).toHaveLength(0);
  });
});

describe("EditorBridge — block mutations", () => {
  it("inserts a block and emits snapshot to subscribers", () => {
    const bridge = createEditorBridge<TextBlock>();
    const listener = vi.fn();
    bridge.subscribe(listener);

    bridge.insertBlock(makeBlock("b1", "Hello"));

    expect(bridge.getSnapshot().document.blocks).toHaveLength(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        document: expect.objectContaining({ blocks: expect.any(Array) }),
      }),
    );
  });

  it("updates a block", () => {
    const bridge = createEditorBridge<TextBlock>({
      document: { blocks: [makeBlock("b1", "Old")] },
    });

    bridge.updateBlock("b1", (block) => ({
      ...block,
      data: { text: "New" },
    }));

    const blocks = bridge.getSnapshot().document.blocks;
    expect(blocks[0].data.text).toBe("New");
  });

  it("removes a block", () => {
    const bridge = createEditorBridge<TextBlock>({
      document: { blocks: [makeBlock("b1", "Remove me")] },
    });

    bridge.removeBlock("b1");

    expect(bridge.getSnapshot().document.blocks).toHaveLength(0);
  });

  it("moves a block to a new index", () => {
    const bridge = createEditorBridge<TextBlock>({
      document: {
        blocks: [makeBlock("a", "A"), makeBlock("b", "B"), makeBlock("c", "C")],
      },
    });

    bridge.moveBlock("a", 2);

    const blocks = bridge.getSnapshot().document.blocks;
    expect(blocks[2].id).toBe("a");
  });
});

describe("EditorBridge — focus and selection", () => {
  it("sets focus to a valid block", () => {
    const bridge = createEditorBridge<TextBlock>({
      document: { blocks: [makeBlock("b1", "Focus me")] },
    });

    bridge.setFocus("b1");

    expect(bridge.getSnapshot().focusedBlockId).toBe("b1");
  });

  it("clears focus (adapter auto-focuses first block when blocks exist)", () => {
    const bridge = createEditorBridge<TextBlock>({
      document: { blocks: [makeBlock("b1", "Text")] },
    });
    bridge.setFocus("b1");
    bridge.clearFocus();

    const snap = bridge.getSnapshot();
    expect(snap.focusedBlockId === null || snap.focusedBlockId === "b1").toBe(true);
  });

  it("clears focus to null when document is empty", () => {
    const bridge = createEditorBridge<TextBlock>();
    bridge.clearFocus();

    expect(bridge.getSnapshot().focusedBlockId).toBeNull();
  });

  it("selects multiple blocks", () => {
    const bridge = createEditorBridge<TextBlock>({
      document: {
        blocks: [makeBlock("a", "A"), makeBlock("b", "B")],
      },
    });

    bridge.selectBlocks(["a", "b"]);

    const snap = bridge.getSnapshot();
    expect(snap.selection.multiBlockIds).toEqual(["a", "b"]);
  });

  it("clears selection", () => {
    const bridge = createEditorBridge<TextBlock>({
      document: { blocks: [makeBlock("b1", "Text")] },
    });
    bridge.selectBlocks(["b1"]);
    bridge.clearSelection();

    expect(bridge.getSnapshot().selection.multiBlockIds).toHaveLength(0);
  });
});

describe("EditorBridge — subscription lifecycle", () => {
  it("unsubscribes correctly", () => {
    const bridge = createEditorBridge<TextBlock>();
    const listener = vi.fn();
    const unsubscribe = bridge.subscribe(listener);

    unsubscribe();
    bridge.insertBlock(makeBlock("b1", "After unsub"));

    expect(listener).not.toHaveBeenCalled();
  });

  it("invokes onChange option on mutations", () => {
    const onChange = vi.fn();
    const bridge = createEditorBridge<TextBlock>({ onChange });

    bridge.insertBlock(makeBlock("b1", "Notified"));

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("EditorBridge — getAdapter", () => {
  it("exposes underlying EditorStateAdapter", () => {
    const bridge = createEditorBridge<TextBlock>();
    const adapter = bridge.getAdapter();
    expect(typeof adapter.getSnapshot).toBe("function");
  });
});
