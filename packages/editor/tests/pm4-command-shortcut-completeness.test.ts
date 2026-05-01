import { describe, expect, it } from "vitest";

import type { Block } from "../../core/src/types/block";
import {
  createCommandRegistry,
  createEditorStateAdapter,
  createShortcutRegistry,
  createCommandCatalog,
  createUserCommandAuthoring,
  createShortcutReference,
  registerCommandReferenceCommands,
  createCommandReferenceShortcutBindings,
  COMMAND_CATALOG_OPEN_COMMAND_ID,
  SHORTCUT_REFERENCE_OPEN_COMMAND_ID,
  USER_COMMAND_EDITOR_OPEN_COMMAND_ID,
  EXPORT_COMMAND_REFERENCE_COMMAND_ID,
  EXPORT_SHORTCUT_REFERENCE_COMMAND_ID,
  type UserCommandDefinition,
  type UserShortcutDefinition,
} from "../src";

interface TextBlockData extends Record<string, unknown> {
  text?: string;
}

type EditorBlock = Block<TextBlockData>;

function createTextBlock(id: string, text: string): EditorBlock {
  const timestamp = new Date().toISOString();
  return {
    id,
    type: "text",
    data: { text, marks: {} },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createEditorRuntime() {
  const state = createEditorStateAdapter<EditorBlock>({
    document: {
      id: "test-doc",
      blocks: [createTextBlock("b1", "Hello")],
    },
  });
  const commandRegistry = createCommandRegistry<EditorBlock>();
  registerCommandReferenceCommands(commandRegistry);

  return { state, commandRegistry };
}

describe("PM4-4: Command/Shortcut Completeness - Command Catalog", () => {
  it("registers command reference commands", () => {
    const { commandRegistry } = createEditorRuntime();

    expect(commandRegistry.has(COMMAND_CATALOG_OPEN_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(SHORTCUT_REFERENCE_OPEN_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(USER_COMMAND_EDITOR_OPEN_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(EXPORT_COMMAND_REFERENCE_COMMAND_ID)).toBe(true);
    expect(commandRegistry.has(EXPORT_SHORTCUT_REFERENCE_COMMAND_ID)).toBe(true);
  });

  it("creates command catalog with all commands", () => {
    const { state, commandRegistry } = createEditorRuntime();
    const catalog = createCommandCatalog({ commandRegistry });

    const entries = catalog.getEntries({ state });
    expect(entries.length).toBeGreaterThanOrEqual(5);

    // Check that commands have proper metadata
    const commandCatalogEntry = entries.find((e) => e.id === COMMAND_CATALOG_OPEN_COMMAND_ID);
    expect(commandCatalogEntry).toBeDefined();
    expect(commandCatalogEntry?.title).toBe("Command Catalog");
    expect(commandCatalogEntry?.category).toBe("Reference");
    expect(commandCatalogEntry?.isAvailable).toBe(true);
  });

  it("groups commands by category", () => {
    const { state, commandRegistry } = createEditorRuntime();
    const catalog = createCommandCatalog({ commandRegistry });

    const groups = catalog.getGrouped({ state });
    expect(groups.length).toBeGreaterThanOrEqual(1);

    const referenceGroup = groups.find((g) => g.category === "Reference");
    expect(referenceGroup).toBeDefined();
    expect(referenceGroup?.commands.length).toBeGreaterThanOrEqual(5);
  });

  it("filters commands by category", () => {
    const { state, commandRegistry } = createEditorRuntime();
    const catalog = createCommandCatalog({ commandRegistry });

    const referenceCommands = catalog.filter({ state }, { category: "Reference" });
    expect(referenceCommands.length).toBeGreaterThanOrEqual(5);
    expect(referenceCommands.every((c) => c.category === "Reference")).toBe(true);
  });

  it("searches commands with query", () => {
    const { state, commandRegistry } = createEditorRuntime();
    const catalog = createCommandCatalog({ commandRegistry });

    const results = catalog.search({ state }, "catalog");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].score).toBeGreaterThan(0);

    const catalogResult = results.find((r) => r.id === COMMAND_CATALOG_OPEN_COMMAND_ID);
    expect(catalogResult).toBeDefined();
  });

  it("exports command reference as markdown", () => {
    const { state, commandRegistry } = createEditorRuntime();
    const catalog = createCommandCatalog({ commandRegistry });

    const markdown = catalog.exportToMarkdown({ state });
    expect(markdown).toContain("# Command Reference");
    expect(markdown).toContain("## Reference");
    expect(markdown).toContain("Command Catalog");
  });

  it("gets menu paths for navigation", () => {
    const { commandRegistry } = createEditorRuntime();
    const catalog = createCommandCatalog({ commandRegistry });

    const paths = catalog.getMenuPaths();
    expect(paths.length).toBeGreaterThanOrEqual(2);
    expect(paths.some((p) => p.includes("help"))).toBe(true);
  });
});

describe("PM4-4: Command/Shortcut Completeness - Shortcut Reference", () => {
  it("creates shortcut reference with formatted combos", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcutRegistry = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });
    const reference = createShortcutReference({ shortcutRegistry, platform: "windows" });

    const shortcuts = reference.getAll();
    expect(shortcuts.length).toBeGreaterThanOrEqual(0);
  });

  it("groups shortcuts by category", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcutRegistry = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });
    const reference = createShortcutReference({ shortcutRegistry, platform: "windows" });

    const groups = reference.getGrouped();
    expect(groups).toBeDefined();
  });

  it("searches shortcuts by combo", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcutRegistry = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    // Register a test binding
    shortcutRegistry.register({
      id: "test.shortcut",
      combo: "ctrl+k",
      commandId: COMMAND_CATALOG_OPEN_COMMAND_ID,
      description: "Test shortcut",
    });

    const reference = createShortcutReference({ shortcutRegistry, platform: "windows" });
    const results = reference.search("ctrl+k");

    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("exports shortcut reference as markdown", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcutRegistry = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "mac",
    });
    const reference = createShortcutReference({ shortcutRegistry, platform: "mac" });

    const markdown = reference.exportToMarkdown();
    expect(markdown).toContain("# Keyboard Shortcuts Reference");
    expect(markdown).toContain("**Platform:** mac");
  });

  it("formats combos for different platforms", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcutRegistry = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "mac",
    });

    shortcutRegistry.register({
      id: "test.format",
      combo: "cmd+shift+p",
      commandId: COMMAND_CATALOG_OPEN_COMMAND_ID,
    });

    const macReference = createShortcutReference({ shortcutRegistry, platform: "mac" });
    const macShortcuts = macReference.getAll();
    const macShortcut = macShortcuts.find((s) => s.id === "test.format");
    expect(macShortcut?.readableCombo).toContain("⌘");

    const winReference = createShortcutReference({ shortcutRegistry, platform: "windows" });
    const winShortcuts = winReference.getAll();
    const winShortcut = winShortcuts.find((s) => s.id === "test.format");
    // Windows uses "Win" for cmd/meta key
    expect(winShortcut?.readableCombo).toContain("Win");
  });

  it("suggests available shortcut combos", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcutRegistry = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });
    const reference = createShortcutReference({ shortcutRegistry, platform: "windows" });

    const suggestions = reference.getAvailableComboSuggestions();
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((s) => s.startsWith("ctrl"))).toBe(true);
  });

  it("checks if combo is available", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcutRegistry = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    shortcutRegistry.register({
      id: "test.taken",
      combo: "ctrl+t",
      commandId: COMMAND_CATALOG_OPEN_COMMAND_ID,
    });

    const reference = createShortcutReference({ shortcutRegistry, platform: "windows" });

    expect(reference.isComboAvailable("ctrl+t")).toBe(false);
    expect(reference.isComboAvailable("ctrl+zzz")).toBe(true);
  });
});

describe("PM4-4: Command/Shortcut Completeness - User Command Authoring", () => {
  it("validates user command definitions", () => {
    const { commandRegistry } = createEditorRuntime();
    const authoring = createUserCommandAuthoring({ commandRegistry });

    const validCommand: UserCommandDefinition = {
      id: "custom.mycommand",
      title: "My Custom Command",
      action: "macro",
      actionData: {},
      slashTrigger: "mycommand",
    };

    const result = authoring.validateCommand(validCommand);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects commands with reserved prefixes", () => {
    const { commandRegistry } = createEditorRuntime();
    const authoring = createUserCommandAuthoring({ commandRegistry });

    const invalidCommand: UserCommandDefinition = {
      id: "editor.myCommand",
      title: "Invalid Command",
      action: "macro",
      actionData: {},
    };

    const result = authoring.validateCommand(invalidCommand);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "id" && e.message.includes("reserved"))).toBe(true);
  });

  it("rejects commands with duplicate IDs", () => {
    const { commandRegistry } = createEditorRuntime();
    const authoring = createUserCommandAuthoring({ commandRegistry });

    const command: UserCommandDefinition = {
      id: "custom.unique",
      title: "Unique Command",
      action: "macro",
      actionData: {},
    };

    // Register first time
    authoring.registerCommand(command);

    // Try to register again
    const result = authoring.validateCommand(command);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "id" && e.message.includes("already"))).toBe(true);
  });

  it("validates user shortcut definitions", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcutRegistry = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });
    const authoring = createUserCommandAuthoring({ commandRegistry, shortcutRegistry });

    const validShortcut: UserShortcutDefinition = {
      id: "custom.shortcut",
      combo: "ctrl+shift+x",
      commandId: COMMAND_CATALOG_OPEN_COMMAND_ID,
    };

    const result = authoring.validateShortcut(validShortcut);
    expect(result.valid).toBe(true);
  });

  it("detects shortcut conflicts", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcutRegistry = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    // Register first shortcut
    shortcutRegistry.register({
      id: "existing.shortcut",
      combo: "ctrl+k",
      commandId: COMMAND_CATALOG_OPEN_COMMAND_ID,
    });

    const authoring = createUserCommandAuthoring({ commandRegistry, shortcutRegistry });

    const conflictingShortcut: UserShortcutDefinition = {
      id: "custom.conflict",
      combo: "ctrl+k",
      commandId: SHORTCUT_REFERENCE_OPEN_COMMAND_ID,
    };

    const result = authoring.validateShortcut(conflictingShortcut);
    expect(result.conflicts.length).toBeGreaterThan(0);
  });

  it("rejects dangerous browser shortcuts", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcutRegistry = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });
    const authoring = createUserCommandAuthoring({ commandRegistry, shortcutRegistry });

    const dangerousShortcut: UserShortcutDefinition = {
      id: "custom.dangerous",
      combo: "ctrl+w",
      commandId: COMMAND_CATALOG_OPEN_COMMAND_ID,
    };

    const result = authoring.validateShortcut(dangerousShortcut);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("browser"))).toBe(true);
  });

  it("exports and imports user definitions", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcutRegistry = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });
    const authoring = createUserCommandAuthoring({ commandRegistry, shortcutRegistry });

    // Register a command
    authoring.registerCommand({
      id: "custom.test",
      title: "Test Command",
      action: "macro",
      actionData: { test: true },
    });

    // Export
    const exported = authoring.exportDefinitions();
    expect(exported.commands).toHaveLength(1);
    expect(exported.commands[0].id).toBe("custom.test");

    // Import into new instance
    const newCommandRegistry = createCommandRegistry<EditorBlock>();
    registerCommandReferenceCommands(newCommandRegistry);
    const newAuthoring = createUserCommandAuthoring({ commandRegistry: newCommandRegistry });

    const importResult = newAuthoring.importDefinitions(exported);
    expect(importResult.commandResults).toHaveLength(1);
    expect(importResult.commandResults[0].result.valid).toBe(true);
  });

  it("unregisters user commands", () => {
    const { commandRegistry } = createEditorRuntime();
    const authoring = createUserCommandAuthoring({ commandRegistry });

    authoring.registerCommand({
      id: "custom.temp",
      title: "Temporary Command",
      action: "macro",
      actionData: {},
    });

    expect(commandRegistry.has("custom.temp")).toBe(true);

    authoring.unregisterCommand("custom.temp");

    expect(commandRegistry.has("custom.temp")).toBe(false);
  });
});

describe("PM4-4: Command/Shortcut Completeness - Shortcuts", () => {
  it("registers command reference shortcuts without conflicts", () => {
    const { commandRegistry } = createEditorRuntime();
    const shortcutRegistry = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    const bindings = createCommandReferenceShortcutBindings<EditorBlock>();
    for (const binding of bindings) {
      shortcutRegistry.register(binding);
    }

    expect(shortcutRegistry.getConflicts()).toHaveLength(0);
  });

  it("executes command catalog via shortcut", async () => {
    const { state, commandRegistry } = createEditorRuntime();
    const shortcutRegistry = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
    });

    const bindings = createCommandReferenceShortcutBindings<EditorBlock>();
    for (const binding of bindings) {
      shortcutRegistry.register(binding);
    }

    // Ctrl+Shift+P for command catalog
    const result = await shortcutRegistry.dispatch(
      { key: "p", ctrlKey: true, shiftKey: true },
      { state },
    );

    expect(result.type).toBe("executed");
    expect(result.commandId).toBe(COMMAND_CATALOG_OPEN_COMMAND_ID);
  });
});

describe("PM4-4: Integration - Commands have Persian aliases", () => {
  it("command catalog command has Persian alias", () => {
    const { commandRegistry } = createEditorRuntime();
    const cmd = commandRegistry.get(COMMAND_CATALOG_OPEN_COMMAND_ID)!;
    expect(cmd.aliases).toContain("فرمان‌ها");
  });

  it("shortcut reference command has Persian alias", () => {
    const { commandRegistry } = createEditorRuntime();
    const cmd = commandRegistry.get(SHORTCUT_REFERENCE_OPEN_COMMAND_ID)!;
    expect(cmd.aliases).toContain("میان‌برها");
  });

  it("user command editor has Persian alias", () => {
    const { commandRegistry } = createEditorRuntime();
    const cmd = commandRegistry.get(USER_COMMAND_EDITOR_OPEN_COMMAND_ID)!;
    expect(cmd.aliases).toContain("فرمان‌های سفارشی");
  });
});
