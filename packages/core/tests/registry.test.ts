import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { BlockRegistry } from "../src/registry/BlockRegistry";
import type { BlockDefinition } from "../src/types/block";

type ParagraphData = {
  text: string;
  align: "left" | "center" | "right";
};

function createParagraphDefinition(
  hooks?: BlockDefinition<ParagraphData>["hooks"],
): BlockDefinition<ParagraphData> {
  return {
    type: "paragraph",
    name: "Paragraph",
    schema: z.object({
      text: z.string(),
      align: z.enum(["left", "center", "right"]),
    }),
    defaultData: {
      text: "",
      align: "left",
    },
    hooks,
  };
}

describe("BlockRegistry", () => {
  beforeEach(() => {
    BlockRegistry.resetInstance();
    vi.unstubAllGlobals();
  });

  it("registers and returns a block definition", () => {
    const registry = BlockRegistry.getInstance();
    const definition = createParagraphDefinition();

    registry.register(definition);

    expect(registry.has("paragraph")).toBe(true);
    expect(registry.getDefinition("paragraph")).toEqual(definition);
    expect(registry.getDefinitions()).toHaveLength(1);
  });

  it("throws when registering duplicate block types", () => {
    const registry = BlockRegistry.getInstance();
    const definition = createParagraphDefinition();

    registry.register(definition);

    expect(() => registry.register(definition)).toThrow(
      'Block type "paragraph" is already registered',
    );
  });

  it("creates and retrieves blocks by id and type", async () => {
    const registry = BlockRegistry.getInstance();
    registry.register(createParagraphDefinition());

    const created = await registry.createBlock<ParagraphData>("paragraph", {
      text: "Hello Pulse",
    });

    expect(created.data.text).toBe("Hello Pulse");
    expect(created.data.align).toBe("left");
    expect(registry.getBlockById(created.id)).toEqual(created);
    expect(registry.getBlocksByType("paragraph")).toEqual([created]);
  });

  it("updates block data with schema validation", async () => {
    const registry = BlockRegistry.getInstance();
    registry.register(createParagraphDefinition());

    const created = await registry.createBlock<ParagraphData>("paragraph");
    const updated = await registry.updateBlock<ParagraphData>(created.id, {
      text: "Updated",
      align: "center",
    });

    expect(updated.data.text).toBe("Updated");
    expect(updated.data.align).toBe("center");
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.updatedAt).getTime(),
    );
  });

  it("executes lifecycle hooks in order", async () => {
    const lifecycleOrder: string[] = [];
    const hooks = {
      onCreate: vi.fn(() => {
        lifecycleOrder.push("create");
      }),
      onUpdate: vi.fn(() => {
        lifecycleOrder.push("update");
      }),
      onDestroy: vi.fn(() => {
        lifecycleOrder.push("destroy");
      }),
    };

    const registry = BlockRegistry.getInstance();
    registry.register(createParagraphDefinition(hooks));

    const created = await registry.createBlock<ParagraphData>("paragraph");
    await registry.updateBlock<ParagraphData>(created.id, { text: "Changed" });
    await registry.destroyBlock(created.id);

    expect(lifecycleOrder).toEqual(["create", "update", "destroy"]);
    expect(hooks.onCreate).toHaveBeenCalledTimes(1);
    expect(hooks.onUpdate).toHaveBeenCalledTimes(1);
    expect(hooks.onDestroy).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid block definitions and data", async () => {
    const registry = BlockRegistry.getInstance();

    expect(() =>
      registry.register({
        type: "invalid",
        name: "",
        defaultData: {},
      } as unknown as BlockDefinition),
    ).toThrow();

    registry.register(createParagraphDefinition());
    await expect(
      registry.createBlock<ParagraphData>("paragraph", {
        text: 123,
      } as unknown as Partial<ParagraphData>),
    ).rejects.toThrow();

    const created = await registry.createBlock<ParagraphData>("paragraph");
    await expect(
      registry.updateBlock<ParagraphData>(created.id, {
        align: "bottom",
      } as unknown as Partial<ParagraphData>),
    ).rejects.toThrow();
  });

  it("unregisters a type and removes blocks for that type", async () => {
    const registry = BlockRegistry.getInstance();
    registry.register(createParagraphDefinition());

    const created = await registry.createBlock<ParagraphData>("paragraph");
    const removed = registry.unregister("paragraph");

    expect(removed).toBe(true);
    expect(registry.has("paragraph")).toBe(false);
    expect(registry.getBlockById(created.id)).toBeUndefined();
  });

  it("returns false when unregistering an unknown type", () => {
    const registry = BlockRegistry.getInstance();
    expect(registry.unregister("unknown")).toBe(false);
  });

  it("throws when creating a block for an unregistered type", async () => {
    const registry = BlockRegistry.getInstance();
    await expect(registry.createBlock("unknown")).rejects.toThrow(
      'Block type "unknown" is not registered',
    );
  });

  it("throws when updating a missing block id", async () => {
    const registry = BlockRegistry.getInstance();
    registry.register(createParagraphDefinition());

    await expect(
      registry.updateBlock<ParagraphData>("missing-id", { text: "Nope" }),
    ).rejects.toThrow('Block with id "missing-id" is not registered');
  });

  it("returns false when destroying a missing block id", async () => {
    const registry = BlockRegistry.getInstance();
    expect(await registry.destroyBlock("missing-id")).toBe(false);
  });

  it("clears all registered definitions and blocks", async () => {
    const registry = BlockRegistry.getInstance();
    registry.register(createParagraphDefinition());
    const block = await registry.createBlock("paragraph");

    registry.clear();

    expect(registry.getDefinitions()).toHaveLength(0);
    expect(registry.getBlockById(block.id)).toBeUndefined();
  });

  it("supports function-based defaultData", async () => {
    const registry = BlockRegistry.getInstance();
    registry.register({
      type: "quote",
      name: "Quote",
      schema: z.object({ text: z.string(), author: z.string() }),
      defaultData: () => ({ text: "hello", author: "anon" }),
    });

    const created = await registry.createBlock<{ text: string; author: string }>(
      "quote",
    );

    expect(created.data).toEqual({ text: "hello", author: "anon" });
  });

  it("accepts non-plain object override data when schema allows it", async () => {
    type AnyData = Record<string, unknown>;
    const registry = BlockRegistry.getInstance();
    registry.register({
      type: "any-block",
      name: "Any Block",
      schema: z.any() as unknown as BlockDefinition<AnyData>["schema"],
      defaultData: { value: "start" },
    });

    const created = await registry.createBlock<AnyData>("any-block");
    const nullPrototypeData = Object.create(null) as AnyData;
    nullPrototypeData.value = "changed";
    const updated = await registry.updateBlock<AnyData>(
      created.id,
      nullPrototypeData,
    );

    expect(updated.data).toEqual(nullPrototypeData);
  });

  it("falls back when structuredClone is unavailable", async () => {
    type QuoteData = { text: string; author: string };
    const registry = BlockRegistry.getInstance();
    const structuredCloneRef = globalThis.structuredClone;
    vi.stubGlobal("structuredClone", undefined);

    registry.register({
      type: "quote",
      name: "Quote",
      schema: z.object({ text: z.string(), author: z.string() }),
      defaultData: { text: "hello", author: "anon" },
    });

    const created = await registry.createBlock<QuoteData>("quote");
    expect(created.data).toEqual({ text: "hello", author: "anon" });

    vi.stubGlobal("structuredClone", structuredCloneRef);
  });

  it("falls back to timestamp id when crypto.randomUUID is unavailable", async () => {
    const registry = BlockRegistry.getInstance();
    vi.stubGlobal("crypto", {});
    registry.register(createParagraphDefinition());

    const created = await registry.createBlock<ParagraphData>("paragraph");
    expect(created.id.startsWith("block_")).toBe(true);
  });
});
