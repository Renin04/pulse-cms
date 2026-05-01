import { beforeEach, describe, expect, it } from "vitest";
import type { Block } from "@pulse/core";
import {
  RendererRegistry,
  PulseRenderer,
  renderBlock,
  renderDocument,
  escapeHtml,
} from "../src/index";

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: "block-1",
    type: "paragraph",
    data: { text: "Hello world" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("RendererRegistry", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
  });

  it("registers and retrieves a renderer", () => {
    const registry = RendererRegistry.getInstance();
    const fn = (block: Block) => `<p>${block.data["text"] as string}</p>`;
    registry.register("paragraph", fn);
    expect(registry.has("paragraph")).toBe(true);
    expect(registry.get("paragraph")).toBe(fn);
  });

  it("throws when registering the same type twice", () => {
    const registry = RendererRegistry.getInstance();
    registry.register("paragraph", () => "");
    expect(() => registry.register("paragraph", () => "")).toThrow(
      /already registered/,
    );
  });

  it("override replaces an existing renderer", () => {
    const registry = RendererRegistry.getInstance();
    registry.register("paragraph", () => "old");
    const newFn = () => "new";
    registry.override("paragraph", newFn);
    expect(registry.get("paragraph")).toBe(newFn);
  });

  it("override registers a new type if absent", () => {
    const registry = RendererRegistry.getInstance();
    registry.override("heading", () => "<h1/>");
    expect(registry.has("heading")).toBe(true);
  });

  it("unregister removes a renderer and returns true", () => {
    const registry = RendererRegistry.getInstance();
    registry.register("paragraph", () => "");
    expect(registry.unregister("paragraph")).toBe(true);
    expect(registry.has("paragraph")).toBe(false);
  });

  it("unregister returns false for unknown type", () => {
    const registry = RendererRegistry.getInstance();
    expect(registry.unregister("nonexistent")).toBe(false);
  });

  it("registeredTypes returns all registered type names", () => {
    const registry = RendererRegistry.getInstance();
    registry.register("paragraph", () => "");
    registry.register("heading", () => "");
    expect(registry.registeredTypes()).toEqual(
      expect.arrayContaining(["paragraph", "heading"]),
    );
  });

  it("throws when registering with an empty type string", () => {
    const registry = RendererRegistry.getInstance();
    expect(() => registry.register("", () => "")).toThrow();
  });

  it("getInstance returns the same singleton", () => {
    const a = RendererRegistry.getInstance();
    const b = RendererRegistry.getInstance();
    expect(a).toBe(b);
  });

  it("resetInstance creates a fresh registry", () => {
    const a = RendererRegistry.getInstance();
    a.register("paragraph", () => "");
    RendererRegistry.resetInstance();
    const b = RendererRegistry.getInstance();
    expect(b.has("paragraph")).toBe(false);
  });
});

describe("renderBlock", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
  });

  it("renders a block using the registered renderer", () => {
    RendererRegistry.getInstance().register(
      "paragraph",
      (block) => `<p>${block.data["text"] as string}</p>`,
    );
    const output = renderBlock(makeBlock());
    expect(output.html).toBe("<p>Hello world</p>");
    expect(output.blockId).toBe("block-1");
    expect(output.blockType).toBe("paragraph");
  });

  it("returns empty string for unknown block type by default", () => {
    const output = renderBlock(makeBlock({ type: "unknown-type" }));
    expect(output.html).toBe("");
  });

  it("uses string fallback for unknown block type", () => {
    const output = renderBlock(makeBlock({ type: "unknown-type" }), {
      unknownBlockFallback: "<!-- unknown block -->",
    });
    expect(output.html).toBe("<!-- unknown block -->");
  });

  it("uses function fallback for unknown block type", () => {
    const output = renderBlock(makeBlock({ type: "mystery" }), {
      unknownBlockFallback: (block) => `<!-- unknown: ${block.type} -->`,
    });
    expect(output.html).toBe("<!-- unknown: mystery -->");
  });

  it("passes RenderContext to the renderer function", () => {
    let capturedCtx: unknown;
    RendererRegistry.getInstance().register("paragraph", (_block, ctx) => {
      capturedCtx = ctx;
      return "";
    });
    renderBlock(makeBlock(), { ssr: true, theme: "dark" });
    expect(capturedCtx).toMatchObject({ isSSR: true, theme: "dark", depth: 0 });
  });
});

describe("renderDocument", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
  });

  it("renders multiple blocks and joins HTML", () => {
    RendererRegistry.getInstance().register(
      "paragraph",
      (block) => `<p>${block.data["text"] as string}</p>`,
    );
    const blocks: Block[] = [
      makeBlock({ id: "b1", data: { text: "First" } }),
      makeBlock({ id: "b2", data: { text: "Second" } }),
    ];
    const output = renderDocument(blocks);
    expect(output.html).toBe("<p>First</p>\n<p>Second</p>");
    expect(output.blocks).toHaveLength(2);
    expect(output.blocks[0].blockId).toBe("b1");
    expect(output.blocks[1].blockId).toBe("b2");
  });

  it("returns empty html for empty block array", () => {
    const output = renderDocument([]);
    expect(output.html).toBe("");
    expect(output.blocks).toHaveLength(0);
  });
});

describe("PulseRenderer", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
  });

  it("renders a block via instance method", () => {
    const renderer = new PulseRenderer();
    renderer.register("paragraph", (block) => `<p>${block.data["text"] as string}</p>`);
    const output = renderer.renderBlock(makeBlock());
    expect(output.html).toBe("<p>Hello world</p>");
  });

  it("override replaces renderer via instance method", () => {
    const renderer = new PulseRenderer();
    renderer.register("paragraph", () => "old");
    renderer.override("paragraph", () => "new");
    const output = renderer.renderBlock(makeBlock());
    expect(output.html).toBe("new");
  });

  it("renderDocument via instance method", () => {
    const renderer = new PulseRenderer({ unknownBlockFallback: "<!-- ? -->" });
    const blocks: Block[] = [makeBlock({ type: "unknown" })];
    const output = renderer.renderDocument(blocks);
    expect(output.html).toBe("<!-- ? -->");
  });

  it("register returns this for chaining", () => {
    const renderer = new PulseRenderer();
    const result = renderer.register("paragraph", () => "");
    expect(result).toBe(renderer);
  });
});

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("returns unchanged string when no special chars", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});
