import { describe, expect, it, vi } from "vitest";
import type { Block } from "@pulse/core";
import {
  BookmarkStore,
  buildShareActions,
  buildTocTree,
  calculateReadingProgress,
  collectProgressSignals,
  createBookmark,
  deserializeBookmarks,
  estimateReadTimeFromBlocks,
  estimateReadTimeFromText,
  estimateRemainingReadMinutes,
  executeShareAction,
  generateToc,
  renderTocHtml,
  resolveShareChannels,
  restoreBookmark,
  serializeBookmarks,
  sortBookmarks,
  updateBookmark,
} from "../src/index";

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

describe("toc generation", () => {
  it("generates TOC items from heading blocks", () => {
    const blocks: Block[] = [
      makeBlock({
        id: "h1",
        type: "heading",
        data: { text: "Introduction", level: 1 },
      }),
      makeBlock({
        id: "h2",
        type: "heading",
        data: { text: "Getting Started", level: 2 },
      }),
    ];

    const toc = generateToc(blocks);

    expect(toc).toHaveLength(2);
    expect(toc[0]).toMatchObject({
      id: "introduction",
      level: 1,
      blockId: "h1",
    });
    expect(toc[1]).toMatchObject({
      id: "getting-started",
      level: 2,
      blockId: "h2",
    });
  });

  it("creates unique ids for repeated headings", () => {
    const blocks: Block[] = [
      makeBlock({
        id: "a",
        type: "heading",
        data: { text: "Section", level: 2 },
      }),
      makeBlock({
        id: "b",
        type: "heading",
        data: { text: "Section", level: 2 },
      }),
    ];

    const toc = generateToc(blocks);

    expect(toc[0]?.id).toBe("section");
    expect(toc[1]?.id).toBe("section-2");
  });

  it("respects level filters and maxItems", () => {
    const blocks: Block[] = [
      makeBlock({ type: "heading", data: { text: "L1", level: 1 } }),
      makeBlock({ type: "heading", data: { text: "L2", level: 2 } }),
      makeBlock({ type: "heading", data: { text: "L3", level: 3 } }),
      makeBlock({ type: "heading", data: { text: "L4", level: 4 } }),
    ];

    const toc = generateToc(blocks, {
      minLevel: 2,
      maxLevel: 3,
      maxItems: 2,
    });

    expect(toc.map((item) => item.text)).toEqual(["L2", "L3"]);
  });

  it("builds TOC tree by heading depth", () => {
    const flat = [
      { id: "h1", text: "A", level: 1, blockId: "1", order: 0 },
      { id: "h2", text: "B", level: 2, blockId: "2", order: 1 },
      { id: "h3", text: "C", level: 3, blockId: "3", order: 2 },
      { id: "h2-2", text: "D", level: 2, blockId: "4", order: 3 },
    ];

    const tree = buildTocTree(flat);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.children).toHaveLength(2);
    expect(tree[0]?.children[0]?.children).toHaveLength(1);
  });

  it("renders TOC HTML with nav/list structure", () => {
    const toc = generateToc([
      makeBlock({ type: "heading", data: { text: "Overview", level: 2 } }),
    ]);

    const html = renderTocHtml(toc);

    expect(html).toContain('class="pulse-toc"');
    expect(html).toContain('href="#overview"');
    expect(html).toContain('data-pulse-toc="true"');
  });

  it("renders empty TOC marker for no items", () => {
    const html = renderTocHtml([]);

    expect(html).toContain('data-pulse-toc-empty="true"');
  });
});

describe("read-time and reading progress", () => {
  it("estimates read time from plain text", () => {
    const estimate = estimateReadTimeFromText(
      "one two three four five six seven eight nine ten",
      { wordsPerMinute: 5, minimumMinutes: 1 },
    );

    expect(estimate.words).toBe(10);
    expect(estimate.minutes).toBe(2);
    expect(estimate.wordsPerMinute).toBe(5);
  });

  it("estimates read time from mixed-content blocks", () => {
    const blocks: Block[] = [
      makeBlock({
        type: "heading",
        data: { text: "Welcome to Pulse", level: 2 },
      }),
      makeBlock({
        type: "paragraph",
        data: { text: "This is a short paragraph for testing read time." },
      }),
      makeBlock({
        type: "image",
        data: { alt: "Architecture diagram", caption: "System overview" },
      }),
    ];

    const estimate = estimateReadTimeFromBlocks(blocks, {
      wordsPerMinute: 120,
    });

    expect(estimate.words).toBeGreaterThan(10);
    expect(estimate.minutes).toBeGreaterThanOrEqual(1);
  });

  it("calculates reading progress from viewport metrics", () => {
    const progress = calculateReadingProgress({
      scrollY: 500,
      viewportHeight: 1000,
      documentHeight: 3000,
    });

    expect(progress).toBe(0.25);
  });

  it("estimates remaining read minutes", () => {
    expect(estimateRemainingReadMinutes(10, 0.6)).toBe(4);
    expect(estimateRemainingReadMinutes(10, 1)).toBe(0);
  });

  it("interoperates with progress signal collector", () => {
    const first = collectProgressSignals(
      { progress: 0, lastEmittedMs: -1, reachedMilestones: [] },
      {
        scrollY: 0,
        viewportHeight: 1000,
        documentHeight: 5000,
        timestampMs: 0,
      },
      { throttleMs: 100, milestones: [0.25, 0.5] },
    );

    const second = collectProgressSignals(
      first.state,
      {
        scrollY: 2500,
        viewportHeight: 1000,
        documentHeight: 5000,
        timestampMs: 120,
      },
      { throttleMs: 100, milestones: [0.25, 0.5] },
    );

    expect(first.signals.some((signal) => signal.type === "update")).toBe(true);
    expect(second.signals.some((signal) => signal.type === "milestone")).toBe(
      true,
    );
  });
});

describe("bookmark model and restoration", () => {
  it("creates bookmark with normalized fields", () => {
    const bookmark = createBookmark({
      id: "bm_1",
      label: "  Intro  ",
      blockId: "block-1",
      scrollProgress: 1.5,
      timestamp: "2026-04-05T10:00:00.000Z",
    });

    expect(bookmark.label).toBe("Intro");
    expect(bookmark.scrollProgress).toBe(1);
    expect(bookmark.createdAt).toBe("2026-04-05T10:00:00.000Z");
  });

  it("updates bookmark fields and keeps immutable createdAt", () => {
    const original = createBookmark({
      id: "bm_2",
      label: "Section",
      blockId: "block-2",
      scrollProgress: 0.2,
      timestamp: "2026-04-05T10:00:00.000Z",
    });

    const updated = updateBookmark(original, {
      label: "Section Updated",
      scrollProgress: 0.8,
      timestamp: "2026-04-05T10:05:00.000Z",
    });

    expect(updated.createdAt).toBe(original.createdAt);
    expect(updated.updatedAt).toBe("2026-04-05T10:05:00.000Z");
    expect(updated.scrollProgress).toBe(0.8);
  });

  it("sorts bookmarks by updatedAt descending", () => {
    const sorted = sortBookmarks([
      createBookmark({
        id: "a",
        label: "A",
        blockId: "a",
        scrollProgress: 0.1,
        timestamp: "2026-04-05T10:00:00.000Z",
      }),
      createBookmark({
        id: "b",
        label: "B",
        blockId: "b",
        scrollProgress: 0.2,
        timestamp: "2026-04-05T11:00:00.000Z",
      }),
    ]);

    expect(sorted[0]?.id).toBe("b");
    expect(sorted[1]?.id).toBe("a");
  });

  it("restores bookmark target anchor", () => {
    const bookmark = createBookmark({
      id: "restore",
      label: "Restore",
      blockId: "block-restore",
      scrollProgress: 0.42,
    });

    const target = restoreBookmark(bookmark);

    expect(target).toEqual({
      blockId: "block-restore",
      scrollProgress: 0.42,
      anchor: "#block-restore",
    });
  });

  it("serializes and deserializes bookmarks deterministically", () => {
    const bookmarks = [
      createBookmark({
        id: "one",
        label: "One",
        blockId: "b1",
        scrollProgress: 0.1,
        timestamp: "2026-04-05T09:00:00.000Z",
      }),
      createBookmark({
        id: "two",
        label: "Two",
        blockId: "b2",
        scrollProgress: 0.2,
        timestamp: "2026-04-05T10:00:00.000Z",
      }),
    ];

    const serialized = serializeBookmarks(bookmarks);
    const parsed = deserializeBookmarks(serialized);

    expect(parsed.map((bookmark) => bookmark.id)).toEqual(["two", "one"]);
  });

  it("manages bookmark lifecycle in BookmarkStore", () => {
    const store = new BookmarkStore();

    const added = store.add({
      id: "store-1",
      label: "Store",
      blockId: "blk",
      scrollProgress: 0.3,
      timestamp: "2026-04-05T10:00:00.000Z",
    });
    const updated = store.update("store-1", {
      label: "Store Updated",
      timestamp: "2026-04-05T10:10:00.000Z",
    });

    expect(store.get("store-1")?.label).toBe("Store Updated");
    expect(updated?.updatedAt).toBe("2026-04-05T10:10:00.000Z");

    const exported = store.export();
    store.clear();
    expect(store.list()).toHaveLength(0);

    store.import(exported);
    expect(store.list()).toHaveLength(1);
    expect(store.remove(added.id)).toBe(true);
  });
});

describe("share action abstraction", () => {
  it("resolves default channels with clipboard fallback", () => {
    const channels = resolveShareChannels();

    expect(channels).toContain("clipboard");
    expect(channels[0]).toBe("native");
  });

  it("builds share actions with provider URLs", () => {
    const actions = buildShareActions(
      {
        url: "https://pulse.dev/post",
        title: "Pulse Post",
        text: "Check this out",
        tags: ["pulse", "blog"],
      },
      {
        channels: ["twitter", "linkedin", "email"],
        includeClipboardFallback: false,
      },
    );

    expect(actions).toHaveLength(3);
    expect(actions[0]?.url).toContain("twitter.com/intent/tweet");
    expect(actions[1]?.url).toContain("linkedin.com/sharing");
    expect(actions[2]?.url).toContain("mailto:");
  });

  it("executes URL share actions through openUrl hook", async () => {
    const openUrl = vi.fn();
    const [action] = buildShareActions(
      { url: "https://pulse.dev" },
      { channels: ["facebook"], includeClipboardFallback: false },
    );

    const result = await executeShareAction(
      action!,
      { url: "https://pulse.dev" },
      { openUrl },
    );

    expect(result.ok).toBe(true);
    expect(openUrl).toHaveBeenCalledTimes(1);
    expect(result.target).toContain("facebook.com/sharer");
  });

  it("executes clipboard and native share actions", async () => {
    const copyText = vi.fn();
    const nativeShare = vi.fn();

    const actions = buildShareActions(
      { url: "https://pulse.dev" },
      {
        channels: ["native", "clipboard"],
      },
    );

    const nativeAction = actions.find((action) => action.channel === "native");
    const clipboardAction = actions.find(
      (action) => action.channel === "clipboard",
    );

    const nativeResult = await executeShareAction(
      nativeAction!,
      { url: "https://pulse.dev" },
      { nativeShare },
    );

    const clipboardResult = await executeShareAction(
      clipboardAction!,
      { url: "https://pulse.dev" },
      { copyText },
    );

    expect(nativeResult.ok).toBe(true);
    expect(clipboardResult.ok).toBe(true);
    expect(nativeShare).toHaveBeenCalledTimes(1);
    expect(copyText).toHaveBeenCalledWith("https://pulse.dev");
  });

  it("returns non-ok for malformed url action", async () => {
    const result = await executeShareAction(
      {
        channel: "twitter",
        label: "Broken",
        method: "url",
      },
      {
        url: "https://pulse.dev",
      },
    );

    expect(result.ok).toBe(false);
  });
});
