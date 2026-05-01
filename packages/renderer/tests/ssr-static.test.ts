import { beforeEach, describe, expect, it } from "vitest";
import type { Block } from "@pulse/core";
import {
  RendererRegistry,
  renderBlockSSR,
  renderDocumentSSR,
  buildSSRContext,
  isBrowserEnvironment,
  assertSSRSafe,
  renderToStaticHtml,
  extractMetadata,
  stripHtml,
} from "../src/index";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: "b1",
    type: "paragraph",
    data: { text: "Hello world" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// isBrowserEnvironment
// ---------------------------------------------------------------------------

describe("isBrowserEnvironment", () => {
  it("returns false in Node.js (no window/document)", () => {
    expect(isBrowserEnvironment()).toBe(false);
  });

  it("returns true when window and document are present on globalThis", () => {
    const g = globalThis as Record<string, unknown>;
    g["window"] = {};
    g["document"] = {};
    expect(isBrowserEnvironment()).toBe(true);
    delete g["window"];
    delete g["document"];
  });
});

// ---------------------------------------------------------------------------
// assertSSRSafe
// ---------------------------------------------------------------------------

describe("assertSSRSafe", () => {
  it("does not throw in Node.js environment", () => {
    expect(() => assertSSRSafe()).not.toThrow();
  });

  it("throws when browser globals are present", () => {
    const g = globalThis as Record<string, unknown>;
    g["window"] = {};
    g["document"] = {};
    expect(() => assertSSRSafe("myFn")).toThrow(/myFn/);
    expect(() => assertSSRSafe()).toThrow(/SSR/);
    delete g["window"];
    delete g["document"];
  });
});

// ---------------------------------------------------------------------------
// buildSSRContext
// ---------------------------------------------------------------------------

describe("buildSSRContext", () => {
  it("always sets isSSR = true", () => {
    const ctx = buildSSRContext();
    expect(ctx.isSSR).toBe(true);
  });

  it("defaults depth to 0", () => {
    expect(buildSSRContext().depth).toBe(0);
  });

  it("accepts depth and theme overrides", () => {
    const ctx = buildSSRContext({ depth: 2, theme: "dark" });
    expect(ctx.depth).toBe(2);
    expect(ctx.theme).toBe("dark");
    expect(ctx.isSSR).toBe(true);
  });

  it("ignores isSSR override — always true", () => {
    const ctx = buildSSRContext({ isSSR: false } as never);
    expect(ctx.isSSR).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// renderBlockSSR
// ---------------------------------------------------------------------------

describe("renderBlockSSR", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
  });

  it("renders a registered block type", () => {
    RendererRegistry.getInstance().register("paragraph", (block) => {
      const data = block.data as { text: string };
      return `<p>${data.text}</p>`;
    });
    const block = makeBlock();
    const output = renderBlockSSR(block);
    expect(output.html).toBe("<p>Hello world</p>");
    expect(output.blockId).toBe("b1");
    expect(output.blockType).toBe("paragraph");
  });

  it("returns empty string for unknown type with no fallback", () => {
    const block = makeBlock({ type: "unknown-xyz" });
    const output = renderBlockSSR(block);
    expect(output.html).toBe("");
  });

  it("uses string fallback for unknown type", () => {
    const block = makeBlock({ type: "unknown-xyz" });
    const output = renderBlockSSR(block, {
      unknownBlockFallback: "<div>unknown</div>",
    });
    expect(output.html).toBe("<div>unknown</div>");
  });

  it("uses function fallback for unknown type", () => {
    const block = makeBlock({ type: "mystery", id: "m1" });
    const output = renderBlockSSR(block, {
      unknownBlockFallback: (b) => `<!-- unknown: ${b.type} -->`,
    });
    expect(output.html).toBe("<!-- unknown: mystery -->");
  });

  it("passes isSSR=true in context to renderer", () => {
    let capturedCtx: { isSSR: boolean } | null = null;
    RendererRegistry.getInstance().register("paragraph", (_block, ctx) => {
      capturedCtx = ctx;
      return "";
    });
    renderBlockSSR(makeBlock());
    expect(capturedCtx).not.toBeNull();
    expect(capturedCtx!.isSSR).toBe(true);
  });

  it("passes theme from config to context", () => {
    let capturedTheme: string | undefined;
    RendererRegistry.getInstance().register("paragraph", (_block, ctx) => {
      capturedTheme = ctx.theme;
      return "";
    });
    renderBlockSSR(makeBlock(), { theme: "dark" });
    expect(capturedTheme).toBe("dark");
  });

  it("context override depth is respected", () => {
    let capturedDepth = -1;
    RendererRegistry.getInstance().register("paragraph", (_block, ctx) => {
      capturedDepth = ctx.depth;
      return "";
    });
    renderBlockSSR(makeBlock(), {}, { depth: 3 });
    expect(capturedDepth).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// renderDocumentSSR
// ---------------------------------------------------------------------------

describe("renderDocumentSSR", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
  });

  it("renders multiple blocks and joins with newline", () => {
    RendererRegistry.getInstance().register("paragraph", (block) => {
      const data = block.data as { text: string };
      return `<p>${data.text}</p>`;
    });
    const blocks: Block[] = [
      makeBlock({ id: "b1", data: { text: "First" } }),
      makeBlock({ id: "b2", data: { text: "Second" } }),
    ];
    const output = renderDocumentSSR(blocks);
    expect(output.html).toBe("<p>First</p>\n<p>Second</p>");
    expect(output.blocks).toHaveLength(2);
    expect(output.blocks[0].blockId).toBe("b1");
    expect(output.blocks[1].blockId).toBe("b2");
  });

  it("returns empty html for empty block array", () => {
    const output = renderDocumentSSR([]);
    expect(output.html).toBe("");
    expect(output.blocks).toHaveLength(0);
  });

  it("output is deterministic for identical input", () => {
    RendererRegistry.getInstance().register("paragraph", (block) => {
      const data = block.data as { text: string };
      return `<p>${data.text}</p>`;
    });
    const blocks = [makeBlock({ id: "b1", data: { text: "Stable" } })];
    const out1 = renderDocumentSSR(blocks);
    const out2 = renderDocumentSSR(blocks);
    expect(out1.html).toBe(out2.html);
  });

  it("does not access window or document globals", () => {
    RendererRegistry.getInstance().register("paragraph", () => "<p/>");
    // Verify renderDocumentSSR completes without throwing — no browser globals accessed
    renderDocumentSSR([makeBlock()]);
    expect(isBrowserEnvironment()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// extractMetadata
// ---------------------------------------------------------------------------

describe("extractMetadata", () => {
  it("returns null title and excerpt for empty document", () => {
    const meta = extractMetadata([]);
    expect(meta.title).toBeNull();
    expect(meta.excerpt).toBeNull();
    expect(meta.wordCount).toBe(0);
    expect(meta.headings).toHaveLength(0);
    expect(meta.images).toHaveLength(0);
    expect(meta.readingTimeMinutes).toBe(1);
  });

  it("extracts title from first heading block", () => {
    const blocks: Block[] = [
      makeBlock({ type: "heading", data: { text: "My Title" } }),
    ];
    const meta = extractMetadata(blocks);
    expect(meta.title).toBe("My Title");
    expect(meta.headings).toEqual(["My Title"]);
  });

  it("extracts excerpt from first paragraph block", () => {
    const blocks: Block[] = [
      makeBlock({ type: "paragraph", data: { text: "Short excerpt text." } }),
    ];
    const meta = extractMetadata(blocks);
    expect(meta.excerpt).toBe("Short excerpt text.");
  });

  it("truncates excerpt at 30 words with ellipsis", () => {
    const longText = Array.from({ length: 40 }, (_, i) => `word${i}`).join(" ");
    const blocks: Block[] = [
      makeBlock({ type: "paragraph", data: { text: longText } }),
    ];
    const meta = extractMetadata(blocks);
    expect(meta.excerpt).toMatch(/…$/);
    expect(meta.excerpt!.split(" ")).toHaveLength(30); // 30 words, last word has "…" appended
  });

  it("collects all heading texts in order", () => {
    const blocks: Block[] = [
      makeBlock({ id: "h1", type: "heading", data: { text: "Chapter 1" } }),
      makeBlock({ id: "p1", type: "paragraph", data: { text: "Some text." } }),
      makeBlock({ id: "h2", type: "heading", data: { text: "Chapter 2" } }),
    ];
    const meta = extractMetadata(blocks);
    expect(meta.headings).toEqual(["Chapter 1", "Chapter 2"]);
  });

  it("collects image src URLs", () => {
    const blocks: Block[] = [
      makeBlock({ type: "image", data: { src: "https://example.com/img.png", alt: "img" } }),
      makeBlock({ type: "image", data: { src: "https://example.com/img2.png", alt: "img2" } }),
    ];
    const meta = extractMetadata(blocks);
    expect(meta.images).toEqual([
      "https://example.com/img.png",
      "https://example.com/img2.png",
    ]);
  });

  it("counts words across paragraph blocks", () => {
    const blocks: Block[] = [
      makeBlock({ type: "paragraph", data: { text: "one two three" } }),
      makeBlock({ type: "paragraph", data: { text: "four five" } }),
    ];
    const meta = extractMetadata(blocks);
    expect(meta.wordCount).toBe(5);
  });

  it("calculates reading time as at least 1 minute", () => {
    const meta = extractMetadata([makeBlock({ type: "paragraph", data: { text: "hi" } })]);
    expect(meta.readingTimeMinutes).toBe(1);
  });

  it("calculates reading time for long documents", () => {
    const words = Array.from({ length: 600 }, () => "word").join(" ");
    const blocks: Block[] = [makeBlock({ type: "paragraph", data: { text: words } })];
    const meta = extractMetadata(blocks);
    expect(meta.readingTimeMinutes).toBe(3);
  });

  it("title is null when no heading block exists", () => {
    const blocks: Block[] = [
      makeBlock({ type: "paragraph", data: { text: "Just a paragraph." } }),
    ];
    expect(extractMetadata(blocks).title).toBeNull();
  });

  it("excerpt is null when no paragraph block exists", () => {
    const blocks: Block[] = [
      makeBlock({ type: "heading", data: { text: "Only a heading" } }),
    ];
    expect(extractMetadata(blocks).excerpt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// renderToStaticHtml
// ---------------------------------------------------------------------------

describe("renderToStaticHtml", () => {
  beforeEach(() => {
    RendererRegistry.resetInstance();
  });

  it("returns html, blocks, and metadata", () => {
    RendererRegistry.getInstance().register("paragraph", (block) => {
      const data = block.data as { text: string };
      return `<p>${data.text}</p>`;
    });
    const blocks: Block[] = [
      makeBlock({ type: "paragraph", data: { text: "Hello static world." } }),
    ];
    const output = renderToStaticHtml(blocks);
    expect(output.html).toBe("<p>Hello static world.</p>");
    expect(output.blocks).toHaveLength(1);
    expect(output.metadata.excerpt).toBe("Hello static world.");
  });

  it("output is stable for identical input (deterministic)", () => {
    RendererRegistry.getInstance().register("paragraph", (block) => {
      const data = block.data as { text: string };
      return `<p>${data.text}</p>`;
    });
    const blocks = [makeBlock({ data: { text: "Stable" } })];
    const out1 = renderToStaticHtml(blocks);
    const out2 = renderToStaticHtml(blocks);
    expect(out1.html).toBe(out2.html);
    expect(out1.metadata).toEqual(out2.metadata);
  });

  it("metadata title comes from heading block", () => {
    RendererRegistry.getInstance().register("heading", () => "<h1>Title</h1>");
    RendererRegistry.getInstance().register("paragraph", () => "<p>body</p>");
    const blocks: Block[] = [
      makeBlock({ type: "heading", data: { text: "My Post Title" } }),
      makeBlock({ type: "paragraph", data: { text: "Body text here." } }),
    ];
    const output = renderToStaticHtml(blocks);
    expect(output.metadata.title).toBe("My Post Title");
    expect(output.metadata.excerpt).toBe("Body text here.");
  });

  it("handles empty block array gracefully", () => {
    const output = renderToStaticHtml([]);
    expect(output.html).toBe("");
    expect(output.blocks).toHaveLength(0);
    expect(output.metadata.title).toBeNull();
    expect(output.metadata.wordCount).toBe(0);
  });

  it("passes ssr:true in config to renderDocumentSSR", () => {
    let capturedIsSSR = false;
    RendererRegistry.getInstance().register("paragraph", (_block, ctx) => {
      capturedIsSSR = ctx.isSSR;
      return "";
    });
    renderToStaticHtml([makeBlock()]);
    expect(capturedIsSSR).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// stripHtml
// ---------------------------------------------------------------------------

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("collapses multiple spaces", () => {
    expect(stripHtml("<p>  a   b  </p>")).toBe("a b");
  });

  it("returns empty string for empty input", () => {
    expect(stripHtml("")).toBe("");
  });

  it("returns plain text unchanged", () => {
    expect(stripHtml("plain text")).toBe("plain text");
  });
});
