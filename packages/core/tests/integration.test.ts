import { describe, expect, it } from "vitest";

import { EventBus } from "../src/events/EventBus";
import { PluginManager } from "../src/plugins/PluginManager";
import { DocumentState } from "../src/state/DocumentState";
import {
  createInMemoryStorageDriver,
  loadState,
  saveState,
} from "../src/state/persistence";
import type { Block } from "../src/types/block";
import type { CoreEventPayloadMap } from "../src/types/event";
import type { Plugin } from "../src/types/plugin";

type TextBlockData = {
  text: string;
};

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

describe("core integrations", () => {
  it("integrates event bus block events with document state updates", async () => {
    const eventBus = new EventBus<CoreEventPayloadMap>();
    const state = new DocumentState<TextBlock>({
      blocks: [createTextBlock("seed", "seed")],
    });

    eventBus.on("block:created", (event) => {
      state.insertBlock(
        createTextBlock(event.payload.blockId, `created:${event.payload.blockType}`),
      );
    });

    eventBus.on("block:updated", (event) => {
      state.updateBlock(event.payload.blockId, (block) => ({
        ...block,
        data: { text: `updated:${event.payload.changedFields.join(",")}` },
        updatedAt: new Date().toISOString(),
      }));
    });

    eventBus.on("block:moved", (event) => {
      state.moveBlock(event.payload.blockId, event.payload.toIndex);
    });

    eventBus.on("block:deleted", (event) => {
      state.removeBlock(event.payload.blockId);
    });

    await eventBus.emit("block:created", { blockId: "b1", blockType: "text" });
    await eventBus.emit("block:updated", {
      blockId: "b1",
      blockType: "text",
      changedFields: ["text"],
    });
    await eventBus.emit("block:moved", {
      blockId: "b1",
      fromIndex: 1,
      toIndex: 0,
    });
    await eventBus.emit("block:deleted", { blockId: "seed", blockType: "text" });

    expect(state.getBlocks().map((block) => block.id)).toEqual(["b1"]);
    expect(state.getBlockById("b1")?.data.text).toBe("updated:text");
  });

  it("integrates plugin listeners with event flow and content updates", async () => {
    const manager = new PluginManager();
    const state = new DocumentState<TextBlock>();
    const contentChangeCounts: number[] = [];

    manager.getEventBus().on("content:changed", (event) => {
      contentChangeCounts.push(event.payload.blockCount);
    });

    const autoInsertPlugin: Plugin<{ prefix: string }> = {
      name: "pulse-plugin-auto-insert",
      version: "1.0.0",
      defaultConfig: { prefix: "plugin" },
      onEnable(api) {
        api.onBlockCreate(async (payload) => {
          const prefix = api.getConfig().prefix;
          state.insertBlock(
            createTextBlock(payload.blockId, `${prefix}:${payload.blockType}`),
          );

          await api.emit("content:changed", {
            source: "plugin",
            blockCount: state.getBlocks().length,
          });
        });
      },
    };

    await manager.install(autoInsertPlugin, {
      enabled: true,
      config: { prefix: "inserted" },
    });

    await manager.emit("block:created", {
      blockId: "p1",
      blockType: "text",
    });

    expect(state.getBlocks()).toHaveLength(1);
    expect(state.getBlockById("p1")?.data.text).toBe("inserted:text");
    expect(contentChangeCounts).toEqual([1]);
  });

  it("persists and restores document snapshots through the storage driver", async () => {
    const driver = createInMemoryStorageDriver();
    const sourceState = new DocumentState<TextBlock>({
      id: "doc-integration",
      metadata: {
        title: "Integration",
      },
      blocks: [createTextBlock("b1", "hello"), createTextBlock("b2", "world")],
    });

    await saveState(driver, "doc:integration", sourceState.getSnapshot());
    const restoredSnapshot = await loadState<
      ReturnType<DocumentState<TextBlock>["getSnapshot"]>
    >(driver, "doc:integration");

    expect(restoredSnapshot).not.toBeNull();

    const restoredState = new DocumentState<TextBlock>();
    restoredState.replaceSnapshot(restoredSnapshot!);

    const sourceSnapshot = sourceState.getSnapshot();
    const restored = restoredState.getSnapshot();

    expect(restored.id).toBe(sourceSnapshot.id);
    expect(restored.blocks).toEqual(sourceSnapshot.blocks);
    expect(restored.metadata.title).toBe("Integration");
    expect(Date.parse(restored.metadata.updatedAt)).toBeGreaterThanOrEqual(
      Date.parse(sourceSnapshot.metadata.updatedAt),
    );
  });
});
