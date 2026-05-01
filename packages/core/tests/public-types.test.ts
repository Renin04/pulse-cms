import { describe, expect, it } from "vitest";

import type {
  Block,
  BlockData,
  BlockDefinition,
  BlockConfig,
  BlockLifecycleHooks,
  BlockEventType,
  CoreEventType,
  PulseEvent,
  CoreEventPayloadMap,
  Plugin,
  PluginConfig,
  DocumentSnapshot,
  SelectionSnapshot,
  CoreStateSnapshot,
  HistorySnapshot,
} from "../src";

describe("public types barrel — @pulse/core", () => {
  it("Block type is structurally correct", () => {
    const block: Block<{ text: string }> = {
      id: "b1",
      type: "text",
      data: { text: "hello" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(block.id).toBe("b1");
    expect(block.data.text).toBe("hello");
  });

  it("BlockDefinition type carries schema and hooks", () => {
    const config: BlockConfig = { category: "basic", isVoid: false };
    const hooks: BlockLifecycleHooks<{ text: string }> = {
      onCreate(block) {
        expect(block.type).toBe("text");
      },
    };
    expect(config.category).toBe("basic");
    expect(typeof hooks.onCreate).toBe("function");
  });

  it("CoreEventType union covers block/selection/content/editor namespaces", () => {
    const blockCreated: BlockEventType = "block:created";
    const editorReady: CoreEventType = "editor:ready";
    expect(blockCreated).toBe("block:created");
    expect(editorReady).toBe("editor:ready");
  });

  it("PulseEvent carries type, payload and defaultPrevented flag", () => {
    const event: PulseEvent<"block:created", CoreEventPayloadMap["block:created"]> = {
      type: "block:created",
      payload: { blockId: "b1", blockType: "text" },
      timestamp: new Date().toISOString(),
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
    };
    event.preventDefault();
    expect(event.defaultPrevented).toBe(true);
  });

  it("Plugin type has name, version and optional lifecycle hooks", () => {
    const plugin: Plugin<PluginConfig> = {
      name: "test-plugin",
      version: "1.0.0",
    };
    expect(plugin.name).toBe("test-plugin");
    expect(plugin.onEnable).toBeUndefined();
  });

  it("DocumentSnapshot carries id, blocks array and metadata", () => {
    const snapshot: DocumentSnapshot<Block<BlockData>> = {
      id: "doc1",
      blocks: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
    expect(snapshot.id).toBe("doc1");
    expect(Array.isArray(snapshot.blocks)).toBe(true);
  });

  it("SelectionSnapshot has cursor, range and multiBlockIds", () => {
    const snap: SelectionSnapshot = {
      cursor: null,
      range: null,
      multiBlockIds: [],
      lastClearReason: null,
    };
    expect(snap.multiBlockIds).toEqual([]);
  });

  it("HistorySnapshot wraps past/present/future arrays", () => {
    const snap: HistorySnapshot<string> = {
      past: ["a"],
      present: "b",
      future: ["c"],
      limit: 50,
    };
    expect(snap.present).toBe("b");
  });

  it("CoreStateSnapshot composes document + selection + history", () => {
    const now = new Date().toISOString();
    const docSnap: DocumentSnapshot = {
      id: "d1",
      blocks: [],
      metadata: { createdAt: now, updatedAt: now },
    };
    const selSnap: SelectionSnapshot = {
      cursor: null,
      range: null,
      multiBlockIds: [],
      lastClearReason: null,
    };
    const histSnap: HistorySnapshot<DocumentSnapshot> = {
      past: [],
      present: docSnap,
      future: [],
      limit: 50,
    };
    const state: CoreStateSnapshot = {
      document: docSnap,
      selection: selSnap,
      history: histSnap,
    };
    expect(state.document.id).toBe("d1");
  });

  it("BlockDefinition type is fully constructible", async () => {
    const { z } = await import("zod").then((m) => m);
    const schema = z.object({ text: z.string() });
    const definition: BlockDefinition<{ text: string }> = {
      type: "text",
      name: "Text",
      schema,
      defaultData: { text: "" },
    };
    expect(definition.type).toBe("text");
  });
});
