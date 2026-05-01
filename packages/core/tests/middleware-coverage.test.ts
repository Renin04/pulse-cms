import { describe, expect, it, vi } from "vitest";

import {
  createEventLoggerMiddleware,
  runMiddlewareChain,
} from "../src/events/middleware";
import type { CoreEventPayloadMap, PulseEvent } from "../src/types/event";

function createEditorReadyEvent(): PulseEvent<
  "editor:ready",
  CoreEventPayloadMap["editor:ready"]
> {
  return {
    type: "editor:ready",
    payload: { editorId: "ed-coverage" },
    timestamp: "2026-04-01T00:00:00.000Z",
    defaultPrevented: false,
    preventDefault: vi.fn(),
  };
}

describe("middleware coverage", () => {
  it("covers off/filter/info branches in logger middleware", async () => {
    const logger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };
    const event = createEditorReadyEvent();

    const offMiddleware = createEventLoggerMiddleware({
      level: "off",
      logger,
    });
    const offNext = vi.fn(async () => {});
    await offMiddleware(event, offNext);
    expect(offNext).toHaveBeenCalledTimes(1);
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.debug).not.toHaveBeenCalled();

    const filteredMiddleware = createEventLoggerMiddleware({
      level: "info",
      logger,
      filter: () => false,
    });
    const filteredNext = vi.fn(async () => {});
    await filteredMiddleware(event, filteredNext);
    expect(filteredNext).toHaveBeenCalledTimes(1);
    expect(logger.info).not.toHaveBeenCalled();

    const infoMiddleware = createEventLoggerMiddleware({
      level: "info",
      logger,
      includeTimestamp: false,
      includePayload: true,
    });
    await infoMiddleware(event, async () => {});
    expect(logger.info).toHaveBeenCalledWith("[pulse:event] editor:ready started");
    expect(logger.info).toHaveBeenCalledWith("[pulse:event] editor:ready completed");

    const warnMiddleware = createEventLoggerMiddleware({
      level: "warn",
      logger,
    });
    await warnMiddleware(event, async () => {});
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it("covers direct middleware chain dispatch and next protection", async () => {
    const event = createEditorReadyEvent();
    const dispatch = vi.fn(async () => {});

    await runMiddlewareChain<CoreEventPayloadMap, "editor:ready">([], event, dispatch);
    expect(dispatch).toHaveBeenCalledTimes(1);

    await expect(
      runMiddlewareChain(
        [
          async (_evt, next) => {
            await next();
            await next();
          },
        ],
        event,
        async () => {},
      ),
    ).rejects.toThrow("next() called multiple times in middleware chain");
  });
});
