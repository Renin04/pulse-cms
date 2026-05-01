import { describe, expect, it } from "vitest";

import * as core from "../src/index";

describe("core index exports", () => {
  it("re-exports runtime modules used by consumers", () => {
    expect(typeof core.BlockRegistry).toBe("function");
    expect(typeof core.EventBus).toBe("function");
    expect(typeof core.DocumentState).toBe("function");
    expect(typeof core.SelectionState).toBe("function");
    expect(typeof core.HistoryState).toBe("function");
    expect(typeof core.PluginAPI).toBe("function");
    expect(typeof core.PluginManager).toBe("function");
    expect(typeof core.createInMemoryStorageDriver).toBe("function");
    expect(typeof core.createEventLoggerMiddleware).toBe("function");
  });
});
