import { describe, expect, it, vi } from "vitest";

import type { Block } from "../src/types/block";
import { cloneBlock, cloneBlockSubtree } from "../src/state/blockClone";
import {
  BLOCK_TRANSFER_VERSION,
  createBlockTransferPayload,
  deserializeBlockTransferPayload,
  serializeBlockTransferPayload,
} from "../src/state/blockTransfer";
import {
  DocumentState,
  type ImportBlocksMode,
} from "../src/state/DocumentState";
import { HistoryState } from "../src/state/HistoryState";
import {
  createAutoStorageDriver,
  createDebouncedSaver,
  createInMemoryStorageDriver,
  createIndexedDbStorageDriver,
  loadState,
  saveState,
  type StateStorageDriver,
} from "../src/state/persistence";
import { SelectionState } from "../src/state/SelectionState";
import {
  selectBlocks,
  selectDocument,
  selectDocumentRevision,
  selectIsDirty,
  selectLastSavedAt,
  selectSavedRevision,
  selectSelectedBlockIds,
} from "../src/state/selectors";

type TextBlock = Block<{ text: string }>;
type IndexedDbOperation = "get" | "put" | "delete" | "clear";

interface IndexedDbMockOptions {
  existingStores?: string[];
  initialValues?: Record<string, unknown>;
  openError?: Error;
  requestErrorByOperation?: Partial<Record<IndexedDbOperation, Error | null>>;
  transactionError?: Error | null;
}

function createTextBlock(id: string, text: string, parentId?: string | null): TextBlock {
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

function createIndexedDbMock(options: IndexedDbMockOptions = {}): {
  indexedDb: IDBFactory;
  openCalls: number;
  createdStores: string[];
} {
  let openCalls = 0;
  const createdStores: string[] = [];
  const storeNames = new Set(options.existingStores ?? []);
  const values = new Map<string, unknown>(Object.entries(options.initialValues ?? {}));

  const executeRequest = <TValue>(
    operation: IndexedDbOperation,
    request: {
      result?: TValue;
      error?: Error | null;
      onsuccess?: (() => void) | null;
      onerror?: (() => void) | null;
    },
    action: () => TValue,
  ): void => {
    setTimeout(() => {
      const forcedError = options.requestErrorByOperation?.[operation];
      if (forcedError !== undefined) {
        request.error = forcedError;
        request.onerror?.();
        return;
      }

      request.result = action();
      request.onsuccess?.();
    }, 0);
  };

  const store = {
    get: (key: string) => {
      const request: {
        result?: unknown;
        error?: Error | null;
        onsuccess?: (() => void) | null;
        onerror?: (() => void) | null;
      } = {};
      executeRequest("get", request, () => values.get(key) ?? null);
      return request as unknown as IDBRequest<unknown>;
    },
    put: (value: unknown, key: string) => {
      const request: {
        result?: unknown;
        error?: Error | null;
        onsuccess?: (() => void) | null;
        onerror?: (() => void) | null;
      } = {};
      executeRequest("put", request, () => {
        values.set(key, value);
        return value;
      });
      return request as unknown as IDBRequest<unknown>;
    },
    delete: (key: string) => {
      const request: {
        result?: unknown;
        error?: Error | null;
        onsuccess?: (() => void) | null;
        onerror?: (() => void) | null;
      } = {};
      executeRequest("delete", request, () => {
        values.delete(key);
        return undefined;
      });
      return request as unknown as IDBRequest<unknown>;
    },
    clear: () => {
      const request: {
        result?: unknown;
        error?: Error | null;
        onsuccess?: (() => void) | null;
        onerror?: (() => void) | null;
      } = {};
      executeRequest("clear", request, () => {
        values.clear();
        return undefined;
      });
      return request as unknown as IDBRequest<unknown>;
    },
  } as IDBObjectStore;

  const database = {
    objectStoreNames: {
      contains: (name: string) => storeNames.has(name),
    },
    createObjectStore: (name: string) => {
      storeNames.add(name);
      createdStores.push(name);
      return store;
    },
    transaction: (storeName: string) => {
      void storeName;
      const transaction: {
        error?: Error | null;
        onerror?: (() => void) | null;
        objectStore: (_name: string) => IDBObjectStore;
      } = {
        objectStore: () => store,
      };

      if (options.transactionError !== undefined) {
        queueMicrotask(() => {
          transaction.error = options.transactionError;
          transaction.onerror?.();
        });
      }

      return transaction as unknown as IDBTransaction;
    },
  } as unknown as IDBDatabase;

  const indexedDb = {
    open: () => {
      openCalls += 1;
      const request: {
        result?: IDBDatabase;
        error?: Error | null;
        onsuccess?: (() => void) | null;
        onerror?: (() => void) | null;
        onupgradeneeded?: (() => void) | null;
      } = {
        result: database,
      };

      queueMicrotask(() => {
        if (options.openError) {
          request.error = options.openError;
          request.onerror?.();
          return;
        }

        request.onupgradeneeded?.();
        request.onsuccess?.();
      });

      return request as unknown as IDBOpenDBRequest;
    },
  } as unknown as IDBFactory;

  return {
    indexedDb,
    get openCalls() {
      return openCalls;
    },
    createdStores,
  };
}

describe("DocumentState coverage", () => {
  it("covers snapshot replacement, tree validation, and import edge cases", () => {
    const timestamp = "2026-04-01T00:00:00.000Z";
    const state = new DocumentState<TextBlock>({
      id: "doc-a",
      blocks: [createTextBlock("a", "alpha")],
      metadata: {
        createdAt: timestamp,
        updatedAt: timestamp,
        revision: 2,
        savedRevision: 1,
      },
    });

    const replacedSnapshot = state.replaceSnapshot({
      id: "doc-b",
      blocks: [createTextBlock("root", "root"), createTextBlock("child", "child", "root")],
      metadata: {
        createdAt: timestamp,
        updatedAt: timestamp,
        revision: 7,
        savedRevision: 6,
      },
    });
    expect(replacedSnapshot.metadata.revision).toBe(8);
    state.validateTree();

    const mutableSnapshot = state.getSnapshot();
    mutableSnapshot.blocks[0]!.data.text = "mutated-outside";
    expect(state.getBlockById("root")?.data.text).toBe("root");

    const revisionBeforeRemove = state.getSnapshot().metadata.revision;
    state.removeBlock("missing");
    expect(state.getSnapshot().metadata.revision).toBe(revisionBeforeRemove);

    expect(() => state.updateBlock("missing", (block) => block)).toThrow(
      'Block with id "missing" was not found',
    );
    expect(() => state.moveBlock("missing", 1)).toThrow(
      'Block with id "missing" was not found',
    );
    expect(() => state.reparentBlock("root", "root")).toThrow(
      'Block "root" cannot be its own parent',
    );
    expect(() => state.reparentBlock("missing", null)).toThrow(
      'Block with id "missing" was not found',
    );
    expect(() => state.reparentBlock("root", "missing-parent")).toThrow(
      'Cannot reparent block "root" to missing parent "missing-parent"',
    );
    expect(() => state.reparentBlock("root", "child")).toThrow("Cycle detected");

    const exported = state.exportBlocks();
    const target = new DocumentState<TextBlock>({
      blocks: [createTextBlock("existing", "existing")],
    });
    target.importBlocks(exported, { mode: "insert", index: -999 });
    expect(target.getBlocks()[0]?.id).toBe("root");

    const endInsertTarget = new DocumentState<TextBlock>();
    endInsertTarget.importBlocks(exported, { mode: "insert", index: 999.8 });
    expect(endInsertTarget.getBlocks().at(-1)?.id).toBe("child");

    expect(() =>
      target.importBlocks(exported, { mode: "insert", index: Number.POSITIVE_INFINITY }),
    ).toThrow('Import option "index" must be a finite number');
    expect(() =>
      target.importBlocks(exported, { mode: "invalid" as ImportBlocksMode }),
    ).toThrow('Invalid import mode "invalid"');
    expect(() => DocumentState.deserialize<TextBlock>('{"id":"broken"}')).toThrow(
      "Invalid serialized document snapshot",
    );
  });

  it("covers subtree cloning branches and structuredClone fallback paths", () => {
    const state = new DocumentState<TextBlock>({
      blocks: [
        createTextBlock("root", "root"),
        createTextBlock("child", "child", "root"),
        createTextBlock("leaf", "leaf", "child"),
      ],
    });
    const clonedWithoutRoot = state.cloneSubtree("root", {
      includeRoot: false,
      idGenerator: (sourceId) => `${sourceId}-copy`,
      now: "2026-04-01T01:00:00.000Z",
    });
    expect(clonedWithoutRoot.map((block) => block.id)).toEqual([
      "child-copy",
      "leaf-copy",
    ]);
    expect(clonedWithoutRoot[0]?.parentId).toBeNull();

    const inserted = state.insertClonedSubtree("root", {
      index: 0,
      idGenerator: (sourceId) => `${sourceId}-duplicate`,
      now: "2026-04-01T01:00:00.000Z",
    });
    expect(inserted.blocks[0]?.id).toBe("root-duplicate");

    expect(() => cloneBlockSubtree(state.getBlocks(), "missing-root")).toThrow(
      'Cannot clone missing root block "missing-root"',
    );
    expect(() =>
      cloneBlockSubtree(state.getBlocks(), "root", {
        idGenerator: () => undefined as unknown as string,
      }),
    ).toThrow("Missing clone id mapping");

    const previousStructuredClone = globalThis.structuredClone;
    try {
      vi.stubGlobal("structuredClone", undefined);
      const clonedBlock = cloneBlock(createTextBlock("fallback", "value"), {
        idGenerator: (sourceId) => `${sourceId}-clone`,
        now: "2026-04-01T02:00:00.000Z",
      });
      expect(clonedBlock.id).toBe("fallback-clone");
      expect(clonedBlock.data.text).toBe("value");
    } finally {
      vi.stubGlobal("structuredClone", previousStructuredClone);
    }

    const previousCrypto = globalThis.crypto;
    try {
      vi.stubGlobal("crypto", {
        randomUUID: () => "fixed-uuid",
      });
      const defaultGeneratedClone = cloneBlock(createTextBlock("default", "id"));
      expect(defaultGeneratedClone.id).toBe("default_clone_fixed-uuid");
    } finally {
      vi.stubGlobal("crypto", previousCrypto);
    }
  });
});

describe("Persistence coverage", () => {
  it("covers indexedDB driver success path and auto driver selection", async () => {
    const indexedDbReference = globalThis.indexedDB;
    const indexedDbMock = createIndexedDbMock({
      existingStores: [],
      initialValues: { raw: 123 },
    });

    try {
      vi.stubGlobal("indexedDB", indexedDbMock.indexedDb);
      const driver = createIndexedDbStorageDriver({ storeName: "documents" });

      expect(await driver.get("raw")).toBeNull();
      await driver.set("k1", "v1");
      expect(await driver.get("k1")).toBe("v1");
      await driver.remove("k1");
      expect(await driver.get("k1")).toBeNull();
      await driver.set("k2", "v2");
      await driver.clear();
      expect(await driver.get("k2")).toBeNull();

      const autoDriver = createAutoStorageDriver({ storeName: "documents" });
      await autoDriver.set("auto", "selected");
      await expect(autoDriver.get("auto")).resolves.toBe("selected");

      expect(indexedDbMock.createdStores).toContain("documents");
      expect(indexedDbMock.openCalls).toBe(2);
    } finally {
      vi.stubGlobal("indexedDB", indexedDbReference);
    }
  });

  it("covers indexedDB error branches and fallback messages", async () => {
    const indexedDbReference = globalThis.indexedDB;

    try {
      vi.stubGlobal(
        "indexedDB",
        createIndexedDbMock({
          openError: new Error("open failure"),
        }).indexedDb,
      );
      const openFailDriver = createIndexedDbStorageDriver();
      await expect(openFailDriver.get("x")).rejects.toThrow("open failure");

      vi.stubGlobal(
        "indexedDB",
        createIndexedDbMock({
          requestErrorByOperation: { put: new Error("put failure"), get: null },
        }).indexedDb,
      );
      const requestFailDriver = createIndexedDbStorageDriver();
      await expect(requestFailDriver.set("x", "1")).rejects.toThrow("put failure");
      await expect(requestFailDriver.get("x")).rejects.toThrow(
        "IndexedDB operation failed",
      );

      vi.stubGlobal(
        "indexedDB",
        createIndexedDbMock({
          transactionError: null,
        }).indexedDb,
      );
      const transactionFailDriver = createIndexedDbStorageDriver();
      await expect(transactionFailDriver.get("x")).rejects.toThrow(
        "IndexedDB transaction failed",
      );
    } finally {
      vi.stubGlobal("indexedDB", indexedDbReference);
    }
  });

  it("covers serializer hooks and debounced saver flush/cancel/error flows", async () => {
    const driver = createInMemoryStorageDriver();

    await saveState(
      driver,
      "doc:serialized",
      { id: "doc-1" },
      {
        serialize: (state) => `S:${state.id}`,
      },
    );
    const restored = await loadState<{ raw: string }>(driver, "doc:serialized", {
      deserialize: (serialized) => ({ raw: serialized }),
    });
    expect(restored).toEqual({ raw: "S:doc-1" });
    await expect(loadState(driver, "doc:missing")).resolves.toBeNull();

    vi.useFakeTimers();
    try {
      const saver = createDebouncedSaver(driver, "doc:debounced", { debounceMs: -5 });
      const savePromise = saver.save({ id: "flush-first" });
      await saver.flush();
      await savePromise;
      expect(await loadState<{ id: string }>(driver, "doc:debounced")).toEqual({
        id: "flush-first",
      });

      void saver.save({ id: "cancelled" });
      saver.cancel();
      await vi.advanceTimersByTimeAsync(1);
      expect(await loadState<{ id: string }>(driver, "doc:debounced")).toEqual({
        id: "flush-first",
      });

      const failingDriver: StateStorageDriver = {
        get: async () => null,
        set: async () => {
          throw new Error("save failure");
        },
        remove: async () => {},
        clear: async () => {},
      };
      const failingSaver = createDebouncedSaver(failingDriver, "doc:failure", {
        debounceMs: 1,
      });
      const rejectedSave = failingSaver.save({ id: "boom" });
      await expect(failingSaver.flush()).rejects.toThrow("save failure");
      await expect(rejectedSave).rejects.toThrow("save failure");
      await expect(failingSaver.flush()).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Selector coverage", () => {
  it("covers selectDocument/selectBlocks and all selection fallbacks", () => {
    const documentState = new DocumentState<TextBlock>({
      metadata: { title: "Selectors" },
      blocks: [createTextBlock("b1", "one"), createTextBlock("b2", "two")],
    });
    const selectionState = new SelectionState();
    const historyState = new HistoryState(documentState.getSnapshot());

    const makeState = () => ({
      document: documentState.getSnapshot(),
      selection: selectionState.getSnapshot(),
      history: historyState.getSnapshot(),
    });

    selectionState.selectBlocks(["b1", "b2"]);
    const multiState = makeState();
    expect(selectDocument(multiState)).toBe(multiState.document);
    expect(selectBlocks(multiState)).toBe(multiState.document.blocks);
    expect(selectSelectedBlockIds(multiState)).toEqual(["b1", "b2"]);

    selectionState.clear();
    expect(selectSelectedBlockIds(makeState())).toEqual([]);

    const rangeOnlyState = {
      ...makeState(),
      selection: {
        cursor: null,
        range: {
          start: { blockId: "b1", offset: 0 },
          end: { blockId: "b2", offset: 1 },
        },
        multiBlockIds: [],
        lastClearReason: null,
      },
    };
    expect(selectSelectedBlockIds(rangeOnlyState)).toEqual(["b1", "b2"]);

    const cursorOnlyState = {
      ...makeState(),
      selection: {
        cursor: { blockId: "b2", offset: 2 },
        range: null,
        multiBlockIds: [],
        lastClearReason: null,
      },
    };
    expect(selectSelectedBlockIds(cursorOnlyState)).toEqual(["b2"]);

    const invalidMetadataState = {
      ...makeState(),
      document: {
        ...makeState().document,
        metadata: {
          ...makeState().document.metadata,
          revision: "x",
          savedRevision: null,
          lastSavedAt: 123,
        },
      },
    } as unknown as Parameters<typeof selectDocumentRevision>[0];
    expect(selectDocumentRevision(invalidMetadataState)).toBe(0);
    expect(selectSavedRevision(invalidMetadataState)).toBe(0);
    expect(selectIsDirty(invalidMetadataState)).toBe(false);
    expect(selectLastSavedAt(invalidMetadataState)).toBeUndefined();
  });
});

describe("HistoryState coverage", () => {
  it("covers guard rails for undo/redo, reset/compact, and deserialize errors", () => {
    const history = new HistoryState<{ value: number }>({ value: 0 }, { limit: 0 });
    const initialSnapshot = history.getSnapshot();
    expect(initialSnapshot.limit).toBe(1);

    expect(history.undo()).toEqual(initialSnapshot);
    expect(history.redo()).toEqual(initialSnapshot);

    history.push({ value: 1 }, { compress: false });
    history.push({ value: 2 }, { compress: false });
    history.undo();
    history.compact();
    history.reset({ value: 9 });

    expect(history.getSnapshot().past).toEqual([]);
    expect(history.getSnapshot().future).toEqual([]);
    expect(history.getPresent()).toEqual({ value: 9 });
    expect(() => HistoryState.deserialize('{"past":[]}')).toThrow(
      "Invalid serialized history snapshot",
    );
  });

  it("covers equality fallback paths when JSON serialization throws", () => {
    const circularA: { id: string; self?: unknown } = { id: "a" };
    circularA.self = circularA;
    const circularB: { id: string; self?: unknown } = { id: "b" };
    circularB.self = circularB;

    const history = new HistoryState(circularA);
    expect(() => history.push(circularB)).not.toThrow();
    expect(history.canUndo()).toBe(true);
  });
});

describe("SelectionState coverage", () => {
  it("covers offset normalization, empty selections, and deserialize validation", () => {
    const selection = new SelectionState();

    selection.setCursor("block-a", 3.9);
    expect(selection.getSnapshot().cursor).toEqual({ blockId: "block-a", offset: 3 });

    selection.setRange({
      start: { blockId: "block-a", offset: -4 },
      end: { blockId: "block-a", offset: 2.7 },
    });
    expect(selection.getSnapshot().range).toEqual({
      start: { blockId: "block-a", offset: 0 },
      end: { blockId: "block-a", offset: 2 },
    });
    expect(selection.isCollapsed()).toBe(false);

    selection.selectBlocks(["", "block-b", "block-b"]);
    expect(selection.getSnapshot().multiBlockIds).toEqual(["block-b"]);
    selection.selectBlocks([]);
    expect(selection.getSnapshot().cursor).toBeNull();

    expect(() => selection.setCursor("block-a", Number.POSITIVE_INFINITY)).toThrow(
      "Selection offset must be a finite number",
    );
    expect(() => SelectionState.deserialize('{"cursor":null}')).toThrow(
      "Invalid serialized selection snapshot",
    );
  });
});

describe("block transfer coverage", () => {
  it("covers payload creation/serialization and validation branches", () => {
    const payload = createBlockTransferPayload<TextBlock>({
      blocks: [createTextBlock("t1", "one")],
      exportedAt: "2026-04-01T00:00:00.000Z",
    });
    expect(payload.version).toBe(BLOCK_TRANSFER_VERSION);
    expect(payload.sourceDocumentId).toBeUndefined();

    const serialized = serializeBlockTransferPayload(payload);
    const restored = deserializeBlockTransferPayload<TextBlock>(serialized);
    expect(restored.blocks[0]?.id).toBe("t1");

    expect(() => deserializeBlockTransferPayload("1")).toThrow(
      "Invalid block transfer payload",
    );
    expect(() =>
      deserializeBlockTransferPayload(
        JSON.stringify({
          version: BLOCK_TRANSFER_VERSION,
          exportedAt: "2026-04-01T00:00:00.000Z",
          blocks: {},
        }),
      ),
    ).toThrow('"blocks" must be an array');
    expect(() =>
      deserializeBlockTransferPayload(
        JSON.stringify({
          version: BLOCK_TRANSFER_VERSION,
          exportedAt: "2026-04-01T00:00:00.000Z",
          sourceDocumentId: 42,
          blocks: [],
        }),
      ),
    ).toThrow('"sourceDocumentId" must be a string');
  });
});
