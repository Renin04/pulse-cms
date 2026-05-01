import { describe, expect, it, vi } from "vitest";
import type { Block } from "@pulse/core";
import {
  auditRender,
  renderWithBoundaries,
  withErrorBoundary,
} from "../src/index";

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: "b1",
    type: "paragraph",
    data: { text: "Hello" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("withErrorBoundary", () => {
  it("returns block html when render does not throw", () => {
    const block = makeBlock();

    const html = withErrorBoundary(block, () => "<p>ok</p>");

    expect(html).toBe("<p>ok</p>");
  });

  it("returns default fallback when render throws", () => {
    const block = makeBlock({ id: "broken-1", type: "quiz" });

    const html = withErrorBoundary(block, () => {
      throw new Error("renderer blew up");
    });

    expect(html).toContain('class="pulse-error-boundary');
    expect(html).toContain('data-pulse-error-block="broken-1"');
    expect(html).not.toContain("renderer blew up");
  });

  it("exposes details when exposeDetails is true", () => {
    const block = makeBlock({ id: "broken-2", type: "widget" });

    const html = withErrorBoundary(
      block,
      () => {
        throw new TypeError("invalid widget payload");
      },
      { exposeDetails: true },
    );

    expect(html).toContain("invalid widget payload");
    expect(html).toContain("widget");
    expect(html).toContain("pulse-error-boundary--critical");
  });

  it("uses custom fallback renderer when provided", () => {
    const block = makeBlock({ id: "custom-fallback" });

    const html = withErrorBoundary(
      block,
      () => {
        throw "bad";
      },
      {
        fallbackRenderer: (err) =>
          `<div data-kind="custom">${err.blockId}:${err.severity}</div>`,
      },
    );

    expect(html).toBe('<div data-kind="custom">custom-fallback:warning</div>');
  });

  it("calls onError callback with captured metadata", () => {
    const onError = vi.fn();
    const block = makeBlock({ id: "tracked", type: "interactive" });

    withErrorBoundary(
      block,
      () => {
        throw new RangeError("out of bounds");
      },
      { onError },
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toMatchObject({
      blockId: "tracked",
      blockType: "interactive",
      severity: "critical",
      message: "out of bounds",
    });
  });
});

describe("renderWithBoundaries", () => {
  it("continues rendering after individual block errors", () => {
    const blocks = [
      makeBlock({ id: "a", type: "paragraph" }),
      makeBlock({ id: "b", type: "broken" }),
      makeBlock({ id: "c", type: "heading" }),
    ];

    const results = renderWithBoundaries(blocks, (block) => {
      if (block.id === "b") {
        throw new Error("block b failed");
      }
      return `<div id="${block.id}">${block.type}</div>`;
    });

    expect(results).toHaveLength(3);
    expect(results[0]).toContain('id="a"');
    expect(results[1]).toContain("pulse-error-boundary");
    expect(results[2]).toContain('id="c"');
  });
});

describe("auditRender", () => {
  it("collects errors while still returning fallback results", () => {
    const blocks = [
      makeBlock({ id: "ok" }),
      makeBlock({ id: "bad" }),
    ];

    const report = auditRender(blocks, (block) => {
      if (block.id === "bad") {
        throw new Error("boom");
      }
      return `<p>${block.id}</p>`;
    });

    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]?.blockId).toBe("bad");
    expect(report.results).toHaveLength(2);
    expect(report.results[0]).toBe("<p>ok</p>");
    expect(report.results[1]).toContain("pulse-error-boundary");
  });
});
