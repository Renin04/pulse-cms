import { describe, expect, it, vi } from "vitest";

import { EventBus } from "../src/events/EventBus";
import { PluginAPI } from "../src/plugins/PluginAPI";
import { PluginManager } from "../src/plugins/PluginManager";
import type { CoreEventPayloadMap } from "../src/types/event";
import type { Plugin } from "../src/types/plugin";

describe("PluginAPI coverage", () => {
  it("manages config, subscriptions, and listener error reporting", async () => {
    const eventBus = new EventBus<CoreEventPayloadMap>();
    const reportError = vi.fn();
    let config = { enabled: true, prefix: "init" };

    const api = new PluginAPI({
      pluginName: "pulse-plugin-api-coverage",
      eventBus,
      getConfig: () => config,
      setConfig: (nextConfig) => {
        config = nextConfig;
      },
      onError: reportError,
    });

    expect(api.getName()).toBe("pulse-plugin-api-coverage");
    expect(api.getConfig()).toEqual({ enabled: true, prefix: "init" });
    expect(api.setConfig({ enabled: false, prefix: "set" })).toEqual({
      enabled: false,
      prefix: "set",
    });
    expect(api.patchConfig({ prefix: "patched" })).toEqual({
      enabled: false,
      prefix: "patched",
    });

    const createdBlocks: string[] = [];
    const removeCreate = api.onBlockCreate((payload) => {
      createdBlocks.push(payload.blockId);
    });
    const removeUpdate = api.onBlockUpdate(() => {
      throw "listener string failure";
    });
    expect(api.getSubscriptionCount()).toBe(2);

    await eventBus.emit("block:created", {
      blockId: "b-api",
      blockType: "text",
    });
    await eventBus.emit("block:updated", {
      blockId: "b-api",
      blockType: "text",
      changedFields: ["data"],
    });

    expect(createdBlocks).toEqual(["b-api"]);
    expect(reportError).toHaveBeenCalledWith(
      "listener:block:updated",
      "listener string failure",
    );

    removeCreate();
    removeUpdate();
    expect(api.getSubscriptionCount()).toBe(0);

    api.onBlockDelete(() => {});
    api.onSelectionChange(() => {});
    api.onContentChange(() => {});
    expect(api.getSubscriptionCount()).toBe(3);
    api.dispose();
    expect(api.getSubscriptionCount()).toBe(0);
  });

  it("captures event emission failures without rejecting", async () => {
    const eventBus = new EventBus<CoreEventPayloadMap>();
    const reportError = vi.fn();
    const api = new PluginAPI({
      pluginName: "pulse-plugin-emit-coverage",
      eventBus,
      getConfig: () => ({}),
      setConfig: () => {},
      onError: reportError,
    });

    eventBus.on("content:changed", () => {
      throw new Error("emit failure");
    });
    await expect(
      api.emit("content:changed", {
        source: "plugin",
        blockCount: 1,
      }),
    ).resolves.toBeUndefined();

    expect(reportError).toHaveBeenCalledWith(
      "emit:content:changed",
      expect.any(Error),
    );
  });
});

describe("PluginManager coverage", () => {
  it("covers duplicate installs, missing records, sort helpers, and dependent uninstall guards", async () => {
    const manager = new PluginManager();

    const alphaPlugin: Plugin = {
      name: "pulse-plugin-alpha",
      version: "1.0.0",
    };
    const betaPlugin: Plugin = {
      name: "pulse-plugin-beta",
      version: "1.0.0",
      dependencies: ["pulse-plugin-alpha"],
    };

    await manager.install(betaPlugin);
    await manager.install(alphaPlugin, { enabled: true });
    await expect(manager.install(alphaPlugin)).rejects.toThrow(
      'Plugin "pulse-plugin-alpha" is already installed',
    );
    await expect(manager.enable("missing-plugin")).rejects.toThrow(
      'Plugin "missing-plugin" is not installed',
    );
    await expect(manager.disable("missing-plugin")).rejects.toThrow(
      'Plugin "missing-plugin" is not installed',
    );

    expect(await manager.disable(betaPlugin.name)).toBe(false);
    await manager.enable(betaPlugin.name);
    expect(manager.getEnabledPlugins().map((plugin) => plugin.name)).toEqual([
      "pulse-plugin-alpha",
      "pulse-plugin-beta",
    ]);
    expect(manager.getPlugins().map((plugin) => plugin.name)).toEqual([
      "pulse-plugin-alpha",
      "pulse-plugin-beta",
    ]);
    expect(manager.getPlugin("missing-plugin")).toBeUndefined();

    await expect(manager.uninstall(alphaPlugin.name)).rejects.toThrow(
      `Cannot uninstall plugin "${alphaPlugin.name}" because it is required by: ${betaPlugin.name}`,
    );
    await manager.uninstall(betaPlugin.name);
    await manager.uninstall(alphaPlugin.name);
    expect(await manager.uninstall("missing-plugin")).toBe(false);
  });

  it("covers configuration edge cases, error normalization, and error clearing", async () => {
    const onError = vi.fn();
    const manager = new PluginManager({ onError });

    const invalidConfigPlugin: Plugin = {
      name: "pulse-plugin-invalid-config",
      version: "1.0.0",
      onInstall: (api) => {
        api.setConfig("bad-config" as unknown as Record<string, unknown>);
      },
    };
    await manager.install(invalidConfigPlugin);
    const installErrors = manager.getPluginErrors("pulse-plugin-invalid-config");
    expect(installErrors).toHaveLength(1);
    expect(installErrors[0]?.phase).toBe("install");
    expect(installErrors[0]?.message).toContain("configuration must be a plain object");

    const lifecycleFailurePlugin: Plugin = {
      name: "pulse-plugin-string-error",
      version: "1.0.0",
      onEnable: () => {
        throw "string lifecycle failure";
      },
    };
    await manager.install(lifecycleFailurePlugin);
    expect(await manager.enable(lifecycleFailurePlugin.name)).toBe(false);

    const pluginErrors = manager.getPluginErrors(lifecycleFailurePlugin.name);
    expect(pluginErrors).toHaveLength(1);
    expect(pluginErrors[0]?.message).toBe("string lifecycle failure");
    expect(onError).toHaveBeenCalledTimes(2);

    manager.clearErrors(lifecycleFailurePlugin.name);
    expect(manager.getPluginErrors(lifecycleFailurePlugin.name)).toHaveLength(0);
    manager.clearErrors();
    expect(manager.getPluginErrors()).toHaveLength(0);
  });

  it("covers structuredClone fallback when returning installed config snapshots", async () => {
    const previousStructuredClone = globalThis.structuredClone;
    try {
      vi.stubGlobal("structuredClone", undefined);
      const manager = new PluginManager();

      await manager.install({
        name: "pulse-plugin-clone-fallback",
        version: "1.0.0",
        defaultConfig: {
          nested: {
            count: 1,
          },
        },
      });

      const installed = manager.getPlugin<{ nested: { count: number } }>(
        "pulse-plugin-clone-fallback",
      );
      expect(installed?.config.nested.count).toBe(1);

      if (installed) {
        installed.config.nested.count = 999;
      }
      const reloaded = manager.getPlugin<{ nested: { count: number } }>(
        "pulse-plugin-clone-fallback",
      );
      expect(reloaded?.config.nested.count).toBe(1);
    } finally {
      vi.stubGlobal("structuredClone", previousStructuredClone);
    }
  });
});
