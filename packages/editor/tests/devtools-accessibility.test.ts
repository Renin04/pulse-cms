import { describe, expect, it } from "vitest";

import { EventBus } from "../../core/src/events/EventBus";
import type { CoreEventPayloadMap } from "../../core/src/types/event";
import type { Block } from "../../core/src/types/block";
import {
  createBlockActionMenu,
  createBlockContextMenu,
  createBlockInspector,
  createBlockInteractionController,
  createCommandPalette,
  createCommandRegistry,
  createEditorStateAdapter,
  createEditorRoot,
  createEventLoggerPanel,
  createFixedToolbar,
  createFloatingToolbar,
  registerBlockActionCommands,
  registerFormattingCommands,
} from "../src";

interface GenericBlockData extends Record<string, unknown> {
  text: string;
  marks?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    code?: boolean;
  };
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

describe("dev tooling surfaces", () => {
  it("renders block inspector metadata for the focused block", () => {
    const state = createEditorStateAdapter<EditorBlock>({
      document: {
        blocks: [createTextBlock("b1", "One"), createTextBlock("b2", "Two")],
      },
    });
    state.setFocusedBlock("b2");

    const inspector = createBlockInspector({ state });
    const snapshot = inspector.getSnapshot();

    expect(snapshot.focusedBlockId).toBe("b2");
    expect(snapshot.inspectedBlock?.data.text).toBe("Two");

    const html = inspector.render();
    expect(html).toContain('data-block-inspector="true"');
    expect(html).toContain('role="region"');
    expect(html).toContain("Block inspector");
    expect(html).toContain("Focused: b2");
  });

  it("records state + event-bus events and supports filtering", async () => {
    const state = createEditorStateAdapter<EditorBlock>({
      document: {
        id: "event-doc",
        blocks: [createTextBlock("b1", "Seed")],
      },
    });
    const eventBus = new EventBus<CoreEventPayloadMap>();

    const logger = createEventLoggerPanel({
      state,
      eventBus,
      maxEntries: 20,
    });

    state.updateBlock("b1", (block) => ({
      ...block,
      data: {
        ...block.data,
        text: "Updated",
      },
      updatedAt: new Date().toISOString(),
    }));

    await eventBus.emit("content:saved", {
      documentId: "event-doc",
      savedAt: "2026-04-02T00:00:00.000Z",
    });

    const allEntries = logger.getEntries();
    expect(allEntries.some((entry) => entry.type === "state:document")).toBe(true);
    expect(allEntries.some((entry) => entry.type === "content:saved")).toBe(true);

    logger.setFilter({ types: ["content:saved"] });
    const filtered = logger.getEntries();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].source).toBe("event-bus");

    const html = logger.render();
    expect(html).toContain('data-event-logger="true"');
    expect(html).toContain("Showing 1 of");

    logger.dispose();
  });
});

describe("accessibility baseline", () => {
  it("renders editor root with region semantics and labelled listbox", () => {
    const state = createEditorStateAdapter<EditorBlock>({
      document: {
        blocks: [createTextBlock("b1", "Alpha"), createTextBlock("b2", "Beta")],
      },
    });
    const root = createEditorRoot({
      state,
      id: "a11y-editor",
    });

    const html = root.render();
    expect(html).toContain('data-pulse-editor-root="true"');
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Pulse editor a11y-editor"');
    expect(html).toContain('role="listbox"');
    expect(html).toContain('role="option"');
  });

  it("renders command palette with dialog semantics and breadcrumb navigation", () => {
    const state = createEditorStateAdapter<EditorBlock>({
      document: {
        blocks: [createTextBlock("seed", "Seed")],
      },
    });
    const registry = createCommandRegistry<EditorBlock>({
      commands: [
        {
          id: "insert.video",
          title: "Insert video",
          category: "Media",
          menuPath: ["insert", "media"],
          execute() {},
        },
      ],
    });
    const palette = createCommandPalette({ registry });

    palette.openFromText("/insert/media", 13, { state });
    const html = palette.render();

    expect(html).toContain('data-command-palette="true"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Command palette"');
    expect(html).toContain('aria-label="Command path"');
  });

  it("renders menus/toolbars with explicit ARIA roles", () => {
    const state = createEditorStateAdapter<EditorBlock>({
      document: {
        blocks: [createTextBlock("b1", "One")],
      },
    });
    const registry = createCommandRegistry<EditorBlock>();
    registerFormattingCommands(registry);
    registerBlockActionCommands(registry);

    const blockContextMenu = createBlockContextMenu({
      state,
      commandRegistry: registry,
    });
    blockContextMenu.openForBlock("b1");
    expect(blockContextMenu.render()).toContain('role="menu"');
    expect(blockContextMenu.render()).toContain('role="menuitem"');

    const interactions = createBlockInteractionController();
    const blockActionMenu = createBlockActionMenu({
      state,
      commandRegistry: registry,
      interactions,
    });
    blockActionMenu.hover("b1");
    expect(blockActionMenu.render()).toContain('role="menu"');

    state.setSelectionRange({
      start: { blockId: "b1", offset: 0 },
      end: { blockId: "b1", offset: 2 },
    });
    const toolbar = createFloatingToolbar({
      state,
      commandRegistry: registry,
    });
    expect(toolbar.render()).toContain('role="toolbar"');

    const fixedToolbar = createFixedToolbar({
      commandRegistry: registry,
      groups: [
        {
          id: "inline",
          title: "Inline",
          commandIds: ["editor.format.bold", "editor.format.italic"],
        },
      ],
    });
    expect(fixedToolbar.render({ state })).toContain('role="toolbar"');
  });
});
