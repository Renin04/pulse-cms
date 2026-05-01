import { describe, expect, it, vi } from "vitest";

import type { Block } from "../src/types/block";
import { cloneBlock, cloneBlockSubtree } from "../src/state/blockClone";
import { DocumentState } from "../src/state/DocumentState";
import { HistoryState } from "../src/state/HistoryState";
import {
  BLOCK_TRANSFER_VERSION,
  deserializeBlockTransferPayload,
} from "../src/state/blockTransfer";
import {
  buildNestedBlockTree,
  getChildBlocks as getTreeChildBlocks,
  getDescendantBlocks as getTreeDescendantBlocks,
  validateBlockTree,
} from "../src/state/blockTree";
import {
  createAutoStorageDriver,
  createDebouncedSaver,
  createInMemoryStorageDriver,
  loadState,
  saveState,
} from "../src/state/persistence";
import { SelectionState } from "../src/state/SelectionState";
import {
  selectBlockById,
  selectBlocksByType,
  selectCanRedo,
  selectCanUndo,
  selectDocumentRevision,
  selectDocumentTitle,
  selectHistorySize,
  selectIsDirty,
  selectLastSavedAt,
  selectSelectedBlockIds,
  selectSavedRevision,
} from "../src/state/selectors";

type TextBlockData = {
  text: string;
};

type TextBlock = Block<TextBlockData>;

function createTextBlock(
  id: string,
  text: string,
  parentId?: string | null,
): TextBlock {
  const timestamp = new Date().toISOString();

  return {
    id,
    parentId: parentId ?? null,
    type: "text",
    data: { text },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("DocumentState", () => {
  it("creates document snapshots and preserves metadata", () => {
    const state = new DocumentState<TextBlock>({
      metadata: { title: "Pulse Doc" },
      blocks: [createTextBlock("b1", "hello")],
    });

    const snapshot = state.getSnapshot();
    expect(snapshot.id.length).toBeGreaterThan(0);
    expect(snapshot.metadata.title).toBe("Pulse Doc");
    expect(snapshot.blocks).toHaveLength(1);
  });

  it("inserts, updates, moves, and removes blocks", () => {
    const state = new DocumentState<TextBlock>({
      blocks: [createTextBlock("b1", "one"), createTextBlock("b2", "two")],
    });

    state.insertBlock(createTextBlock("b3", "three"), 1);
    expect(state.getBlocks().map((block) => block.id)).toEqual(["b1", "b3", "b2"]);

    state.updateBlock("b3", (block) => ({
      ...block,
      data: { text: "three-updated" },
      updatedAt: new Date().toISOString(),
    }));
    expect(state.getBlockById("b3")?.data.text).toBe("three-updated");

    state.moveBlock("b3", 0);
    expect(state.getBlocks().map((block) => block.id)).toEqual(["b3", "b1", "b2"]);

    state.removeBlock("b1");
    expect(state.getBlocks().map((block) => block.id)).toEqual(["b3", "b2"]);
  });

  it("serializes and deserializes document snapshots", () => {
    const state = new DocumentState<TextBlock>({
      id: "doc-1",
      metadata: { title: "Serialized" },
      blocks: [createTextBlock("b1", "hello")],
    });

    const serialized = state.serialize();
    const restored = DocumentState.deserialize<TextBlock>(serialized);
    expect(restored.getSnapshot()).toEqual(state.getSnapshot());
  });

  it("exports blocks to transfer payloads and imports them across modes", () => {
    const source = new DocumentState<TextBlock>({
      id: "source-doc",
      blocks: [
        createTextBlock("b1", "one"),
        createTextBlock("b2", "two"),
        createTextBlock("b3", "three"),
      ],
    });

    const exported = source.exportBlocks({
      blockIds: ["b2", "b3"],
      exportedAt: "2026-04-01T12:00:00.000Z",
    });
    const payload = deserializeBlockTransferPayload<TextBlock>(exported);
    expect(payload.version).toBe(BLOCK_TRANSFER_VERSION);
    expect(payload.sourceDocumentId).toBe("source-doc");
    expect(payload.exportedAt).toBe("2026-04-01T12:00:00.000Z");
    expect(payload.blocks.map((block) => block.id)).toEqual(["b2", "b3"]);

    const appendTarget = new DocumentState<TextBlock>({
      blocks: [createTextBlock("a1", "alpha")],
    });
    appendTarget.importBlocks(exported);
    expect(appendTarget.getBlocks().map((block) => block.id)).toEqual([
      "a1",
      "b2",
      "b3",
    ]);

    const replaceTarget = new DocumentState<TextBlock>({
      blocks: [createTextBlock("r1", "remove-me")],
    });
    replaceTarget.importBlocks(exported, { mode: "replace" });
    expect(replaceTarget.getBlocks().map((block) => block.id)).toEqual([
      "b2",
      "b3",
    ]);

    const insertTarget = new DocumentState<TextBlock>({
      blocks: [createTextBlock("i1", "first"), createTextBlock("i2", "second")],
    });
    insertTarget.importBlocks(exported, { mode: "insert", index: 1 });
    expect(insertTarget.getBlocks().map((block) => block.id)).toEqual([
      "i1",
      "b2",
      "b3",
      "i2",
    ]);
  });

  it("rejects exporting unknown or duplicate block identifiers", () => {
    const state = new DocumentState<TextBlock>({
      blocks: [createTextBlock("b1", "one")],
    });

    expect(() => state.exportBlocks({ blockIds: ["missing"] })).toThrow(
      'Cannot export missing block "missing"',
    );
    expect(() => state.exportBlocks({ blockIds: ["b1", "b1"] })).toThrow(
      'Duplicate block id "b1" in export request',
    );
  });

  it("rejects malformed block transfer payloads", () => {
    const state = new DocumentState<TextBlock>();
    const unsupportedVersion = JSON.stringify({
      version: 99,
      exportedAt: "2026-04-01T12:00:00.000Z",
      blocks: [],
    });
    const invalidTimestamp = JSON.stringify({
      version: BLOCK_TRANSFER_VERSION,
      exportedAt: "not-an-iso-timestamp",
      blocks: [],
    });

    expect(() => state.importBlocks(unsupportedVersion)).toThrow(
      "Unsupported block transfer payload version: 99",
    );
    expect(() => state.importBlocks(invalidTimestamp)).toThrow(
      'Invalid block transfer payload: "exportedAt" must be an ISO timestamp',
    );
  });

  it("supports nested parent-child traversal and reparenting", () => {
    const state = new DocumentState<TextBlock>({
      blocks: [
        createTextBlock("root", "root"),
        createTextBlock("child-a", "child-a", "root"),
        createTextBlock("child-b", "child-b", "root"),
        createTextBlock("grandchild", "grandchild", "child-a"),
      ],
    });

    expect(state.getChildBlocks("root").map((block) => block.id)).toEqual([
      "child-a",
      "child-b",
    ]);
    expect(state.getDescendantBlocks("root").map((block) => block.id)).toEqual([
      "child-a",
      "grandchild",
      "child-b",
    ]);

    state.reparentBlock("grandchild", "child-b");
    expect(state.getChildBlocks("child-b").map((block) => block.id)).toEqual([
      "grandchild",
    ]);
    expect(state.getChildBlocks("child-a")).toHaveLength(0);
  });

  it("removes descendant blocks when deleting a parent block", () => {
    const state = new DocumentState<TextBlock>({
      blocks: [
        createTextBlock("root", "root"),
        createTextBlock("child", "child", "root"),
        createTextBlock("leaf", "leaf", "child"),
      ],
    });

    state.removeBlock("root");
    expect(state.getBlocks()).toHaveLength(0);
  });

  it("tracks revision metadata and marks snapshots as saved", () => {
    const state = new DocumentState<TextBlock>({
      blocks: [createTextBlock("b1", "one")],
    });

    const initial = state.getSnapshot();
    expect(initial.metadata.revision).toBe(0);
    expect(initial.metadata.savedRevision).toBe(0);

    state.insertBlock(createTextBlock("b2", "two"));
    const dirty = state.getSnapshot();
    expect(dirty.metadata.revision).toBe(1);
    expect(dirty.metadata.savedRevision).toBe(0);

    state.markSaved("2026-04-01T00:00:00.000Z");
    const saved = state.getSnapshot();
    expect(saved.metadata.lastSavedAt).toBe("2026-04-01T00:00:00.000Z");
    expect(saved.metadata.savedRevision).toBe(saved.metadata.revision);
  });
});

describe("block tree utilities", () => {
  it("validates trees and detects missing parents or cycles", () => {
    expect(() =>
      validateBlockTree([
        createTextBlock("root", "root"),
        createTextBlock("child", "child", "missing-parent"),
      ]),
    ).toThrow('references missing parent "missing-parent"');

    expect(() =>
      validateBlockTree([
        createTextBlock("a", "a", "b"),
        createTextBlock("b", "b", "a"),
      ]),
    ).toThrow('Cycle detected in block tree at "a"');
  });

  it("builds nested trees and supports traversal helpers", () => {
    const blocks = [
      createTextBlock("root", "root"),
      createTextBlock("child", "child", "root"),
      createTextBlock("leaf", "leaf", "child"),
    ];

    const nested = buildNestedBlockTree(blocks);
    expect(nested).toHaveLength(1);
    expect(nested[0]?.id).toBe("root");
    expect(nested[0]?.children[0]?.id).toBe("child");
    expect(nested[0]?.children[0]?.children[0]?.id).toBe("leaf");

    expect(getTreeChildBlocks(blocks, "root").map((block) => block.id)).toEqual([
      "child",
    ]);
    expect(getTreeDescendantBlocks(blocks, "root").map((block) => block.id)).toEqual([
      "child",
      "leaf",
    ]);
  });
});

describe("block cloning utilities", () => {
  it("clones a single block with a regenerated id", () => {
    const source = createTextBlock("source", "value");
    const cloned = cloneBlock(source, {
      idGenerator: (sourceId) => `${sourceId}-copy`,
      now: "2026-04-01T00:00:00.000Z",
    });

    expect(cloned.id).toBe("source-copy");
    expect(cloned.parentId).toBeNull();
    expect(cloned.createdAt).toBe("2026-04-01T00:00:00.000Z");
    expect(cloned.data).toEqual(source.data);
    expect(cloned).not.toBe(source);
  });

  it("clones nested subtree blocks and remaps parent ids", () => {
    const blocks = [
      createTextBlock("root", "root"),
      createTextBlock("child-a", "child-a", "root"),
      createTextBlock("child-b", "child-b", "root"),
      createTextBlock("leaf", "leaf", "child-a"),
      createTextBlock("outside", "outside"),
    ];

    const cloned = cloneBlockSubtree(blocks, "root", {
      idGenerator: (sourceId) => `${sourceId}-clone`,
      now: "2026-04-01T00:00:00.000Z",
    });

    expect(cloned.map((block) => block.id)).toEqual([
      "root-clone",
      "child-a-clone",
      "leaf-clone",
      "child-b-clone",
    ]);
    expect(cloned.find((block) => block.id === "root-clone")?.parentId).toBeNull();
    expect(cloned.find((block) => block.id === "child-a-clone")?.parentId).toBe(
      "root-clone",
    );
    expect(cloned.find((block) => block.id === "leaf-clone")?.parentId).toBe(
      "child-a-clone",
    );
  });
});

describe("SelectionState", () => {
  it("tracks cursor and range selection", () => {
    const state = new SelectionState();

    state.setCursor("b1", 3);
    expect(state.getSnapshot().cursor).toEqual({ blockId: "b1", offset: 3 });
    expect(state.isCollapsed()).toBe(true);

    state.setRange({
      start: { blockId: "b1", offset: 1 },
      end: { blockId: "b2", offset: 5 },
    });
    expect(state.getSnapshot().range).toEqual({
      start: { blockId: "b1", offset: 1 },
      end: { blockId: "b2", offset: 5 },
    });
    expect(state.isCollapsed()).toBe(false);
  });

  it("supports multi-block selection and clear reasons", () => {
    const state = new SelectionState();
    state.selectBlocks(["b1", "b2", "b2"]);
    expect(state.getSnapshot().multiBlockIds).toEqual(["b1", "b2"]);

    state.clear("command");
    const snapshot = state.getSnapshot();
    expect(snapshot.multiBlockIds).toEqual([]);
    expect(snapshot.lastClearReason).toBe("command");
  });

  it("serializes and deserializes selection state", () => {
    const state = new SelectionState();
    state.setRange({
      start: { blockId: "b1", offset: 0 },
      end: { blockId: "b1", offset: 7 },
    });

    const serialized = state.serialize();
    const restored = SelectionState.deserialize(serialized);
    expect(restored.getSnapshot()).toEqual(state.getSnapshot());
  });
});

describe("HistoryState", () => {
  it("supports push, undo, and redo", () => {
    const history = new HistoryState<number>(0, { limit: 5 });
    history.push(1);
    history.push(2);

    expect(history.getPresent()).toBe(2);
    expect(history.canUndo()).toBe(true);

    history.undo();
    expect(history.getPresent()).toBe(1);

    history.redo();
    expect(history.getPresent()).toBe(2);
  });

  it("enforces the configured history limit", () => {
    const history = new HistoryState<number>(0, { limit: 3 });
    history.push(1);
    history.push(2);
    history.push(3);
    history.push(4);

    expect(history.getSnapshot().past).toEqual([1, 2, 3]);
  });

  it("compresses duplicate consecutive states", () => {
    const history = new HistoryState<{ value: number }>({ value: 0 }, { limit: 5 });

    history.push({ value: 1 });
    history.push({ value: 1 });
    history.push({ value: 2 });

    expect(history.getSnapshot().past).toEqual([{ value: 0 }, { value: 1 }]);
  });

  it("serializes and deserializes history state", () => {
    const history = new HistoryState<number>(0);
    history.push(1);
    history.push(2);

    const restored = HistoryState.deserialize<number>(history.serialize());
    expect(restored.getSnapshot()).toEqual(history.getSnapshot());
  });
});

describe("state persistence", () => {
  it("saves and loads state through the storage driver", async () => {
    const driver = createInMemoryStorageDriver();
    await saveState(driver, "doc:1", { id: "doc-1", blocks: 2 });

    const loaded = await loadState<{ id: string; blocks: number }>(driver, "doc:1");
    expect(loaded).toEqual({ id: "doc-1", blocks: 2 });
  });

  it("uses in-memory driver when indexedDB is unavailable", async () => {
    const indexedDbReference = globalThis.indexedDB;
    vi.stubGlobal("indexedDB", undefined);

    const driver = createAutoStorageDriver();
    await driver.set("key", "value");
    await expect(driver.get("key")).resolves.toBe("value");

    vi.stubGlobal("indexedDB", indexedDbReference);
  });

  it("debounces persistence writes and keeps latest state", async () => {
    vi.useFakeTimers();
    const driver = createInMemoryStorageDriver();
    const saver = createDebouncedSaver(driver, "doc:debounced", { debounceMs: 50 });

    const firstSave = saver.save({ value: 1 });
    const secondSave = saver.save({ value: 2 });

    await vi.advanceTimersByTimeAsync(50);
    await Promise.all([firstSave, secondSave]);

    const loaded = await loadState<{ value: number }>(driver, "doc:debounced");
    expect(loaded).toEqual({ value: 2 });

    vi.useRealTimers();
  });
});

describe("state selectors", () => {
  it("selects document and history details", () => {
    const documentState = new DocumentState<TextBlock>({
      metadata: { title: "Selector Test" },
      blocks: [createTextBlock("b1", "hello"), createTextBlock("b2", "world")],
    });
    documentState.markSaved("2026-04-01T00:00:00.000Z");
    documentState.updateBlock("b2", (block) => ({
      ...block,
      data: { text: "world-updated" },
      updatedAt: new Date().toISOString(),
    }));
    const selectionState = new SelectionState();
    selectionState.selectBlocks(["b1", "b2"]);
    const historyState = new HistoryState(documentState.getSnapshot());
    const nextSnapshot = documentState.getSnapshot();
    nextSnapshot.metadata = {
      ...nextSnapshot.metadata,
      updatedAt: new Date().toISOString(),
      revision: 2,
    };
    historyState.push(nextSnapshot);

    const state = {
      document: documentState.getSnapshot(),
      selection: selectionState.getSnapshot(),
      history: historyState.getSnapshot(),
    };

    expect(selectDocumentTitle(state)).toBe("Selector Test");
    expect(selectBlockById(state, "b2")?.data.text).toBe("world-updated");
    expect(selectBlocksByType(state, "text")).toHaveLength(2);
    expect(selectSelectedBlockIds(state)).toEqual(["b1", "b2"]);
    expect(selectCanUndo(state)).toBe(true);
    expect(selectCanRedo(state)).toBe(false);
    expect(selectHistorySize(state)).toBe(2);
    expect(selectDocumentRevision(state)).toBeGreaterThan(selectSavedRevision(state));
    expect(selectIsDirty(state)).toBe(true);
    expect(selectLastSavedAt(state)).toBe("2026-04-01T00:00:00.000Z");
  });
});

describe("state performance", () => {
  it("keeps average document updates below 5ms", () => {
    const state = new DocumentState<TextBlock>({
      blocks: [createTextBlock("bench", "value-0")],
    });
    const iterations = 1000;

    const startedAt = performance.now();
    for (let index = 0; index < iterations; index += 1) {
      state.updateBlock("bench", (block) => ({
        ...block,
        data: { text: `value-${index}` },
        updatedAt: new Date().toISOString(),
      }));
    }
    const averageDuration = (performance.now() - startedAt) / iterations;

    expect(averageDuration).toBeLessThan(5);
  });
});
