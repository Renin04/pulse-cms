import { describe, expect, it } from "vitest";

import type { Block } from "../../core/src/types/block";
import {
  createCommandRegistry,
  createDefaultShortcutBindings,
  createFixedToolbar,
  createFloatingToolbar,
  createShortcutRegistry,
  createEditorStateAdapter,
  normalizeShortcutCombo,
  registerFormattingCommands,
  type EditorCommand,
} from "../src";

interface GenericBlockData extends Record<string, unknown> {
  text?: string;
  marks?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    code?: boolean;
  };
  level?: number;
  url?: string;
  openInNewTab?: boolean;
}

type EditorBlock = Block<GenericBlockData>;

function createTextBlock(id: string, text: string): EditorBlock {
  const timestamp = new Date().toISOString();

  return {
    id,
    type: "text",
    data: {
      text,
      marks: {
        bold: false,
        italic: false,
        underline: false,
        code: false,
      },
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createEditorRuntime() {
  const state = createEditorStateAdapter<EditorBlock>({
    document: {
      id: "shortcut-doc",
      blocks: [createTextBlock("b1", "Pulse")],
    },
  });
  const commandRegistry = createCommandRegistry<EditorBlock>();
  registerFormattingCommands(commandRegistry);

  return { state, commandRegistry };
}

describe("shortcut registry", () => {
  it("normalizes mod shortcuts by platform", () => {
    const windowsShortcut = normalizeShortcutCombo("mod+b", "windows");
    expect(windowsShortcut.ctrlKey).toBe(true);
    expect(windowsShortcut.metaKey).toBe(false);

    const macShortcut = normalizeShortcutCombo("mod+b", "mac");
    expect(macShortcut.ctrlKey).toBe(false);
    expect(macShortcut.metaKey).toBe(true);
  });

  it("dispatches shortcuts through the command registry", async () => {
    const executedCommandIds: string[] = [];
    const commandRegistry = createCommandRegistry<EditorBlock>({
      commands: [
        {
          id: "editor.test.command",
          title: "Test command",
          execute() {
            executedCommandIds.push("editor.test.command");
          },
        },
      ],
    });

    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
      bindings: [
        {
          id: "shortcut.test.command",
          combo: "mod+b",
          commandId: "editor.test.command",
        },
      ],
    });

    const runtime = createEditorRuntime();
    const result = await shortcuts.dispatch(
      {
        key: "b",
        ctrlKey: true,
      },
      {
        state: runtime.state,
      },
    );

    expect(result.type).toBe("executed");
    expect(result.commandId).toBe("editor.test.command");
    expect(executedCommandIds).toEqual(["editor.test.command"]);
  });

  it("detects and reports shortcut conflicts", async () => {
    const commandRegistry = createCommandRegistry<EditorBlock>({
      commands: [
        {
          id: "editor.test.one",
          title: "Test one",
          execute() {},
        },
        {
          id: "editor.test.two",
          title: "Test two",
          execute() {},
        },
      ],
    });

    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry,
      platform: "windows",
      bindings: [
        {
          id: "shortcut.one",
          combo: "mod+k",
          commandId: "editor.test.one",
        },
        {
          id: "shortcut.two",
          combo: "ctrl+k",
          commandId: "editor.test.two",
        },
      ],
    });

    const conflicts = shortcuts.getConflicts();
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].bindings.map((binding) => binding.commandId)).toEqual([
      "editor.test.one",
      "editor.test.two",
    ]);

    const runtime = createEditorRuntime();
    const dispatchResult = await shortcuts.dispatch(
      {
        key: "k",
        ctrlKey: true,
      },
      {
        state: runtime.state,
      },
    );

    expect(dispatchResult.type).toBe("conflict");
    expect(dispatchResult.conflicts).toHaveLength(1);
  });

  it("registers default shortcuts without conflicts and executes formatting", async () => {
    const runtime = createEditorRuntime();

    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry: runtime.commandRegistry,
      platform: "windows",
    });

    const defaultBindings = createDefaultShortcutBindings<EditorBlock>();
    for (const binding of defaultBindings) {
      shortcuts.register(binding);
    }

    expect(shortcuts.getConflicts()).toHaveLength(0);

    await shortcuts.dispatch(
      {
        key: "b",
        ctrlKey: true,
      },
      {
        state: runtime.state,
      },
    );

    await shortcuts.dispatch(
      {
        key: "c",
        ctrlKey: true,
        shiftKey: true,
      },
      {
        state: runtime.state,
      },
    );

    const block = runtime.state.getSnapshot().document.blocks[0];
    expect(block.data.marks?.bold).toBe(true);
    expect(block.data.marks?.code).toBe(true);
  });

  it("supports custom shortcut registration and help entries", async () => {
    const runtime = createEditorRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry: runtime.commandRegistry,
      platform: "windows",
    });

    shortcuts.registerCustomBinding({
      id: "custom.shortcut.bold.alt",
      combo: "alt+b",
      commandId: "editor.format.bold",
      description: "Custom bold alternative",
    });

    const help = shortcuts.getShortcutHelp();
    expect(help.some((entry) => entry.id === "custom.shortcut.bold.alt")).toBe(true);
    expect(help.find((entry) => entry.id === "custom.shortcut.bold.alt")?.source).toBe(
      "custom",
    );

    const dispatchResult = await shortcuts.dispatch(
      {
        key: "b",
        altKey: true,
      },
      {
        state: runtime.state,
      },
    );

    expect(dispatchResult.type).toBe("executed");
    expect(runtime.state.getSnapshot().document.blocks[0].data.marks?.bold).toBe(true);
  });

  it("supports two-step chord shortcuts", async () => {
    const runtime = createEditorRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry: runtime.commandRegistry,
      platform: "windows",
    });

    shortcuts.register({
      id: "custom.shortcut.chord.heading",
      combo: "g h",
      commandId: "editor.block.heading",
      description: "Go to heading transform",
    });

    const firstStroke = await shortcuts.dispatch(
      {
        key: "g",
      },
      {
        state: runtime.state,
      },
    );
    expect(firstStroke.type).toBe("pending");
    expect(firstStroke.pending?.waitingFor).toEqual(["h"]);

    const secondStroke = await shortcuts.dispatch(
      {
        key: "h",
      },
      {
        state: runtime.state,
      },
    );
    expect(secondStroke.type).toBe("executed");

    const block = runtime.state.getSnapshot().document.blocks[0];
    expect(block.type).toBe("heading");
  });
});

describe("formatting and floating toolbar", () => {
  it("executes heading/link/save formatting commands", async () => {
    const runtime = createEditorRuntime();

    await runtime.commandRegistry.execute(
      "editor.block.heading",
      { state: runtime.state },
    );

    const headingBlock = runtime.state.getSnapshot().document.blocks[0];
    expect(headingBlock.type).toBe("heading");
    expect(headingBlock.data.level).toBe(1);

    await runtime.commandRegistry.execute(
      "editor.format.link",
      { state: runtime.state },
    );

    const afterLinkBlocks = runtime.state.getSnapshot().document.blocks;
    expect(afterLinkBlocks).toHaveLength(2);
    expect(afterLinkBlocks[1].type).toBe("link");

    await runtime.commandRegistry.execute(
      "editor.document.save",
      { state: runtime.state },
    );

    const metadata = runtime.state.getSnapshot().document.metadata;
    expect(metadata.lastSavedAt).toBeDefined();
    expect(metadata.savedRevision).toBe(metadata.revision);
  });

  it("shows floating toolbar for expanded selections and executes commands", async () => {
    const runtime = createEditorRuntime();
    const toolbar = createFloatingToolbar({
      state: runtime.state,
      commandRegistry: runtime.commandRegistry,
    });

    expect(toolbar.getState().visible).toBe(false);

    runtime.state.setSelectionRange({
      start: { blockId: "b1", offset: 0 },
      end: { blockId: "b1", offset: 4 },
    });

    const visibleState = toolbar.getState();
    expect(visibleState.visible).toBe(true);
    expect(visibleState.anchorBlockId).toBe("b1");
    expect(toolbar.render()).toContain('data-floating-toolbar="true"');

    await toolbar.execute("editor.format.italic", {
      state: runtime.state,
    });

    const block = runtime.state.getSnapshot().document.blocks[0];
    expect(block.data.marks?.italic).toBe(true);

    runtime.state.clearSelection("programmatic");
    expect(toolbar.getState().visible).toBe(false);
    expect(toolbar.render()).toBe("");
  });

  it("supports save shortcut availability via conditional default binding", async () => {
    const runtime = createEditorRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry: runtime.commandRegistry,
      platform: "windows",
    });

    const bindings = createDefaultShortcutBindings<EditorBlock>({
      canSave: (context) => context.state.getSnapshot().document.blocks.length > 0,
    });

    for (const binding of bindings) {
      shortcuts.register(binding);
    }

    const saveResult = await shortcuts.dispatch(
      {
        key: "s",
        ctrlKey: true,
      },
      { state: runtime.state },
    );

    expect(saveResult.type).toBe("executed");

    const emptyRuntimeState = createEditorStateAdapter<EditorBlock>({
      document: {
        blocks: [],
      },
    });

    const blockedResult = await shortcuts.dispatch(
      {
        key: "s",
        ctrlKey: true,
      },
      { state: emptyRuntimeState },
    );

    expect(blockedResult.type).toBe("none");
  });

  it("renders fixed toolbar groups with responsive overflow and executes actions", async () => {
    const runtime = createEditorRuntime();
    const toolbar = createFixedToolbar({
      commandRegistry: runtime.commandRegistry,
      groups: [
        {
          id: "inline",
          title: "Inline",
          commandIds: [
            "editor.format.bold",
            "editor.format.italic",
            "editor.format.link",
            "editor.format.code",
          ],
        },
      ],
      compactBreakpoint: 700,
      maxButtonsPerRow: 2,
    });

    const wideState = toolbar.getState({ state: runtime.state }, 1200);
    expect(wideState.compact).toBe(false);
    expect(wideState.overflowButtons).toHaveLength(0);

    const compactState = toolbar.getState({ state: runtime.state }, 600);
    expect(compactState.compact).toBe(true);
    expect(compactState.overflowButtons.length).toBe(2);
    expect(toolbar.render({ state: runtime.state }, 600)).toContain('data-toolbar-overflow="true"');

    await toolbar.execute("editor.format.bold", { state: runtime.state });
    const block = runtime.state.getSnapshot().document.blocks[0];
    expect(block.data.marks?.bold).toBe(true);
  });
});

// Keep a tiny smoke check for command typing contract used by shortcut bindings.
describe("shortcut binding command contract", () => {
  it("accepts command metadata with ids referenced by defaults", () => {
    const commands: EditorCommand<EditorBlock>[] = [
      {
        id: "editor.format.bold",
        title: "Bold",
        execute() {},
      },
      {
        id: "editor.document.save",
        title: "Save",
        execute() {},
      },
    ];

    expect(commands.map((command) => command.id)).toEqual([
      "editor.format.bold",
      "editor.document.save",
    ]);
  });
});
