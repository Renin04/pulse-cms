import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BLOCK_EVENTS,
  CONTENT_EVENTS,
  CORE_EVENTS,
  EDITOR_EVENTS,
  SELECTION_EVENTS,
  isCoreEventType,
} from "../src/events/coreEvents";
import { EventBus } from "../src/events/EventBus";
import { createEventLoggerMiddleware } from "../src/events/middleware";
import type { CoreEventPayloadMap } from "../src/types/event";

describe("coreEvents", () => {
  it("contains all expected core event names", () => {
    expect(BLOCK_EVENTS).toEqual([
      "block:created",
      "block:updated",
      "block:deleted",
      "block:moved",
    ]);
    expect(SELECTION_EVENTS).toEqual(["selection:changed", "selection:cleared"]);
    expect(CONTENT_EVENTS).toEqual(["content:changed", "content:saved"]);
    expect(EDITOR_EVENTS).toEqual([
      "editor:ready",
      "editor:destroyed",
      "editor:focus",
      "editor:blur",
    ]);
    expect(CORE_EVENTS).toHaveLength(12);
  });

  it("validates core event names with type guard", () => {
    expect(isCoreEventType("content:saved")).toBe(true);
    expect(isCoreEventType("unknown:event")).toBe(false);
  });
});

describe("EventBus", () => {
  let eventBus: EventBus<CoreEventPayloadMap>;

  beforeEach(() => {
    eventBus = new EventBus<CoreEventPayloadMap>();
  });

  it("dispatches listeners by priority and registration order", async () => {
    const calls: string[] = [];

    eventBus.on(
      "content:changed",
      () => {
        calls.push("low");
      },
      { priority: 1 },
    );
    eventBus.on(
      "content:changed",
      () => {
        calls.push("high-1");
      },
      { priority: 10 },
    );
    eventBus.on(
      "content:changed",
      () => {
        calls.push("high-2");
      },
      { priority: 10 },
    );

    await eventBus.emit("content:changed", { source: "user", blockCount: 1 });

    expect(calls).toEqual(["high-1", "high-2", "low"]);
  });

  it("supports once listeners", async () => {
    const listener = vi.fn();
    eventBus.once("editor:ready", listener);

    await eventBus.emit("editor:ready", { editorId: "ed-1" });
    await eventBus.emit("editor:ready", { editorId: "ed-1" });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("removes listeners using off()", async () => {
    const listener = vi.fn();
    eventBus.on("editor:focus", listener);

    const removed = eventBus.off("editor:focus", listener);
    await eventBus.emit("editor:focus", { editorId: "ed-1" });

    expect(removed).toBe(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it("tracks listener counts and clears listeners", () => {
    const listener = vi.fn();
    eventBus.on("editor:focus", listener);
    eventBus.on("editor:blur", listener);

    expect(eventBus.listenerCount()).toBe(2);
    expect(eventBus.listenerCount("editor:focus")).toBe(1);

    eventBus.clear("editor:focus");
    expect(eventBus.listenerCount()).toBe(1);

    eventBus.clear();
    expect(eventBus.listenerCount()).toBe(0);
  });

  it("supports event cancellation with preventDefault()", async () => {
    const calls: string[] = [];

    eventBus.on(
      "content:changed",
      (event) => {
        calls.push("first");
        event.preventDefault();
      },
      { priority: 5 },
    );
    eventBus.on("content:changed", () => {
      calls.push("second");
    });

    const emittedEvent = await eventBus.emit("content:changed", {
      source: "user",
      blockCount: 2,
    });

    expect(calls).toEqual(["first"]);
    expect(emittedEvent.defaultPrevented).toBe(true);
  });

  it("runs middleware in the correct order around listeners", async () => {
    const calls: string[] = [];

    eventBus.use(async (_, next) => {
      calls.push("mw-1-before");
      await next();
      calls.push("mw-1-after");
    });
    eventBus.use(async (_, next) => {
      calls.push("mw-2-before");
      await next();
      calls.push("mw-2-after");
    });
    eventBus.on("editor:ready", () => {
      calls.push("listener");
    });

    await eventBus.emit("editor:ready", { editorId: "ed-2" });

    expect(calls).toEqual([
      "mw-1-before",
      "mw-2-before",
      "listener",
      "mw-2-after",
      "mw-1-after",
    ]);
  });

  it("supports middleware short-circuit", async () => {
    const listener = vi.fn();
    eventBus.use(async () => {});
    eventBus.on("editor:destroyed", listener);

    await eventBus.emit("editor:destroyed", { editorId: "ed-1" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("throws when middleware calls next() multiple times", async () => {
    eventBus.use(async (_, next) => {
      await next();
      await next();
    });

    await expect(
      eventBus.emit("editor:blur", { editorId: "ed-1" }),
    ).rejects.toThrow("next() called multiple times in middleware chain");
  });

  it("removes middleware with unsubscribe function", async () => {
    const calls: string[] = [];
    const unsubscribe = eventBus.use(async (_, next) => {
      calls.push("middleware");
      await next();
    });

    unsubscribe();
    eventBus.on("editor:focus", () => {
      calls.push("listener");
    });

    await eventBus.emit("editor:focus", { editorId: "ed-1" });

    expect(calls).toEqual(["listener"]);
  });

  it("supports async listeners and middleware", async () => {
    const calls: string[] = [];

    eventBus.use(async (_, next) => {
      calls.push("mw-before");
      await Promise.resolve();
      await next();
      calls.push("mw-after");
    });
    eventBus.on("content:saved", async () => {
      await Promise.resolve();
      calls.push("listener");
    });

    const event = await eventBus.emit("content:saved", {
      documentId: "doc-1",
      savedAt: new Date().toISOString(),
    });

    expect(calls).toEqual(["mw-before", "listener", "mw-after"]);
    expect(event.type).toBe("content:saved");
    expect(typeof event.timestamp).toBe("string");
  });

  it("logs events through logger middleware with debug payload tracing", async () => {
    const logger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };
    eventBus.use(
      createEventLoggerMiddleware({
        level: "debug",
        logger,
      }),
    );
    eventBus.on("editor:ready", () => {});

    await eventBus.emit("editor:ready", { editorId: "ed-log" });

    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining("[pulse:event] editor:ready started"),
      { editorId: "ed-log" },
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("[pulse:event] editor:ready completed"),
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("logs errors from failed event handlers", async () => {
    const logger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };
    eventBus.use(
      createEventLoggerMiddleware({
        level: "error",
        logger,
      }),
    );
    eventBus.on("editor:ready", () => {
      throw new Error("listener failure");
    });

    await expect(
      eventBus.emit("editor:ready", { editorId: "ed-error" }),
    ).rejects.toThrow("listener failure");
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0]?.[0]).toContain(
      "[pulse:event] editor:ready failed",
    );
  });

  it("cleans listeners and middleware on destroy()", async () => {
    const listener = vi.fn();
    eventBus.use(async (_, next) => {
      await next();
    });
    eventBus.on("editor:ready", listener);

    eventBus.destroy();
    await eventBus.emit("editor:ready", { editorId: "ed-1" });

    expect(eventBus.listenerCount()).toBe(0);
    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps average event dispatch overhead below 1ms", async () => {
    const iterations = 2000;
    eventBus.on("editor:focus", () => {});

    const startedAt = performance.now();
    for (let index = 0; index < iterations; index += 1) {
      await eventBus.emit("editor:focus", { editorId: "bench-editor" });
    }
    const totalDuration = performance.now() - startedAt;
    const averageDuration = totalDuration / iterations;

    expect(averageDuration).toBeLessThan(1);
  });
});
