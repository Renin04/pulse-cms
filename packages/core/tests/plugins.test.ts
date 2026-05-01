import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { MarkdownPlugin } from "../src/plugins/examples/MarkdownPlugin";
import { SlashCommandsPlugin } from "../src/plugins/examples/SlashCommandsPlugin";
import { PluginManager } from "../src/plugins/PluginManager";
import type { Plugin } from "../src/types/plugin";

describe("PluginManager", () => {
  it("installs, enables, disables, and uninstalls plugins", async () => {
    const onInstall = vi.fn();
    const onEnable = vi.fn();
    const onDisable = vi.fn();
    const onUninstall = vi.fn();

    const plugin: Plugin = {
      name: "pulse-plugin-lifecycle",
      version: "1.0.0",
      onInstall,
      onEnable,
      onDisable,
      onUninstall,
    };

    const manager = new PluginManager();

    await manager.install(plugin);
    expect(manager.has(plugin.name)).toBe(true);
    expect(manager.isEnabled(plugin.name)).toBe(false);
    expect(onInstall).toHaveBeenCalledTimes(1);

    await manager.enable(plugin.name);
    expect(manager.isEnabled(plugin.name)).toBe(true);
    expect(onEnable).toHaveBeenCalledTimes(1);

    await manager.disable(plugin.name);
    expect(manager.isEnabled(plugin.name)).toBe(false);
    expect(onDisable).toHaveBeenCalledTimes(1);

    await manager.uninstall(plugin.name);
    expect(manager.has(plugin.name)).toBe(false);
    expect(onUninstall).toHaveBeenCalledTimes(1);
  });

  it("validates plugin configuration using zod schema", async () => {
    const plugin: Plugin<{ enabled: boolean; maxItems: number }> = {
      name: "pulse-plugin-config",
      version: "1.0.0",
      configSchema: z
        .object({
          enabled: z.boolean(),
          maxItems: z.number().int().min(1),
        })
        .strict(),
      defaultConfig: {
        enabled: true,
        maxItems: 3,
      },
    };

    const manager = new PluginManager();

    await manager.install(plugin, {
      config: {
        maxItems: 10,
      },
    });

    expect(manager.getPlugin(plugin.name)?.config).toEqual({
      enabled: true,
      maxItems: 10,
    });

    await expect(
      manager.install(
        {
          ...plugin,
          name: "pulse-plugin-config-invalid",
        },
        {
          config: {
            maxItems: 0,
          },
        },
      ),
    ).rejects.toThrow();
  });

  it("resolves plugin dependencies before enabling", async () => {
    const order: string[] = [];

    const basePlugin: Plugin = {
      name: "pulse-plugin-base",
      version: "1.0.0",
      onEnable() {
        order.push("base");
      },
    };

    const parserPlugin: Plugin = {
      name: "pulse-plugin-parser",
      version: "1.0.0",
      dependencies: ["pulse-plugin-base"],
      onEnable() {
        order.push("parser");
      },
    };

    const rendererPlugin: Plugin = {
      name: "pulse-plugin-renderer",
      version: "1.0.0",
      dependencies: ["pulse-plugin-parser"],
      onEnable() {
        order.push("renderer");
      },
    };

    const manager = new PluginManager();
    await manager.install(rendererPlugin);
    await manager.install(parserPlugin);
    await manager.install(basePlugin);

    await manager.enable("pulse-plugin-renderer");

    expect(order).toEqual(["base", "parser", "renderer"]);
    expect(manager.isEnabled("pulse-plugin-base")).toBe(true);
    expect(manager.isEnabled("pulse-plugin-parser")).toBe(true);
    expect(manager.isEnabled("pulse-plugin-renderer")).toBe(true);
  });

  it("throws for missing plugin dependencies", async () => {
    const plugin: Plugin = {
      name: "pulse-plugin-needs-missing",
      version: "1.0.0",
      dependencies: ["pulse-plugin-missing"],
    };

    const manager = new PluginManager();
    await manager.install(plugin);

    await expect(manager.enable(plugin.name)).rejects.toThrow(
      "depends on missing plugin",
    );
  });

  it("throws for circular dependencies", async () => {
    const pluginA: Plugin = {
      name: "pulse-plugin-a",
      version: "1.0.0",
      dependencies: ["pulse-plugin-b"],
    };

    const pluginB: Plugin = {
      name: "pulse-plugin-b",
      version: "1.0.0",
      dependencies: ["pulse-plugin-a"],
    };

    const manager = new PluginManager();
    await manager.install(pluginA);
    await manager.install(pluginB);

    await expect(manager.enable(pluginA.name)).rejects.toThrow(
      "Circular plugin dependency",
    );
  });

  it("supports plugin event hooks through PluginAPI", async () => {
    const calls: string[] = [];

    const plugin: Plugin = {
      name: "pulse-plugin-hooks",
      version: "1.0.0",
      onEnable(api) {
        api.onBlockCreate((payload) => {
          calls.push(`create:${payload.blockId}`);
        });
        api.onSelectionChange((payload) => {
          calls.push(`selection:${payload.blockId}`);
        });
        api.onContentChange((payload) => {
          calls.push(`content:${payload.source}`);
        });
      },
    };

    const manager = new PluginManager();
    await manager.install(plugin);
    await manager.enable(plugin.name);

    await manager.emit("block:created", {
      blockId: "b1",
      blockType: "text",
    });
    await manager.emit("selection:changed", {
      blockId: "b1",
      startOffset: 0,
      endOffset: 2,
    });
    await manager.emit("content:changed", {
      source: "user",
      blockCount: 1,
    });

    expect(calls).toEqual(["create:b1", "selection:b1", "content:user"]);
  });

  it("isolates plugin listener errors", async () => {
    let healthyCalls = 0;

    const unstablePlugin: Plugin = {
      name: "pulse-plugin-unstable",
      version: "1.0.0",
      onEnable(api) {
        api.onBlockUpdate(() => {
          throw new Error("listener boom");
        });
      },
    };

    const healthyPlugin: Plugin = {
      name: "pulse-plugin-healthy",
      version: "1.0.0",
      onEnable(api) {
        api.onBlockUpdate(() => {
          healthyCalls += 1;
        });
      },
    };

    const manager = new PluginManager();
    await manager.install(unstablePlugin);
    await manager.install(healthyPlugin);
    await manager.enable(unstablePlugin.name);
    await manager.enable(healthyPlugin.name);

    await expect(
      manager.emit("block:updated", {
        blockId: "b1",
        blockType: "text",
        changedFields: ["text"],
      }),
    ).resolves.toBeUndefined();

    expect(healthyCalls).toBe(1);

    const errors = manager.getPluginErrors("pulse-plugin-unstable");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.phase).toBe("listener:block:updated");
    expect(errors[0]?.message).toBe("listener boom");
  });

  it("keeps editor flow alive when lifecycle hooks throw", async () => {
    const plugin: Plugin = {
      name: "pulse-plugin-lifecycle-error",
      version: "1.0.0",
      onEnable() {
        throw new Error("enable failed");
      },
    };

    const manager = new PluginManager();
    await manager.install(plugin);

    const enabled = await manager.enable(plugin.name);
    expect(enabled).toBe(false);
    expect(manager.isEnabled(plugin.name)).toBe(false);

    const errors = manager.getPluginErrors(plugin.name);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.phase).toBe("enable");
    expect(errors[0]?.message).toBe("enable failed");
  });

  it("removes plugin subscriptions when disabled", async () => {
    let calls = 0;

    const plugin: Plugin = {
      name: "pulse-plugin-disable-cleanup",
      version: "1.0.0",
      onEnable(api) {
        api.onBlockDelete(() => {
          calls += 1;
        });
      },
    };

    const manager = new PluginManager();
    await manager.install(plugin);
    await manager.enable(plugin.name);

    await manager.emit("block:deleted", {
      blockId: "b1",
      blockType: "text",
    });

    await manager.disable(plugin.name);

    await manager.emit("block:deleted", {
      blockId: "b1",
      blockType: "text",
    });

    expect(calls).toBe(1);
  });

  it("exposes example plugins that can be installed and enabled", async () => {
    const manager = new PluginManager();

    await manager.install(MarkdownPlugin);
    await manager.install(SlashCommandsPlugin);

    await manager.enable(MarkdownPlugin.name);
    await manager.enable(SlashCommandsPlugin.name);

    expect(manager.isEnabled(MarkdownPlugin.name)).toBe(true);
    expect(manager.isEnabled(SlashCommandsPlugin.name)).toBe(true);

    expect(manager.getPlugin(MarkdownPlugin.name)?.config).toEqual({
      autoDetectHeadings: true,
      maxHeadingDepth: 6,
    });

    expect(manager.getPlugin(SlashCommandsPlugin.name)?.config).toEqual({
      triggerCharacter: "/",
      suggestOnSelection: true,
    });
  });

  it("keeps average plugin initialization below 10ms", async () => {
    const manager = new PluginManager();
    const iterations = 250;

    const startedAt = performance.now();
    for (let index = 0; index < iterations; index += 1) {
      const name = `pulse-plugin-bench-${index}`;
      await manager.install({
        name,
        version: "1.0.0",
      });
      await manager.enable(name);
    }
    const averageDuration = (performance.now() - startedAt) / iterations;

    expect(averageDuration).toBeLessThan(10);
  });
});
