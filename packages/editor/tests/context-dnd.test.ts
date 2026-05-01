import { describe, expect, it } from "vitest";

import type { Block } from "../../core/src/types/block";
import {
  createBlockActionMenu,
  createBlockContextMenu,
  createBlockDnDController,
  createEmptySpaceContextMenu,
  createBlockInteractionController,
  createCommandRegistry,
  createEditorStateAdapter,
  createSelectionContextMenu,
  deleteSelectedBlocks,
  duplicateSelectedBlocks,
  registerBlockActionCommands,
  registerFormattingCommands,
  selectBlockRange,
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

function createState() {
  return createEditorStateAdapter<EditorBlock>({
    document: {
      blocks: [
        createTextBlock("b1", "One"),
        createTextBlock("b2", "Two"),
        createTextBlock("b3", "Three"),
      ],
    },
  });
}

describe("context menus and block actions", () => {
  it("executes block context menu actions for duplicate and delete", async () => {
    const state = createState();
    const registry = createCommandRegistry<EditorBlock>();
    registerBlockActionCommands(registry);

    const menu = createBlockContextMenu({
      state,
      commandRegistry: registry,
    });

    const openState = menu.openForBlock("b2");
    expect(openState.isOpen).toBe(true);
    expect(menu.render()).toContain('data-context-menu-kind="block"');

    await menu.execute("editor.block.duplicate");

    const afterDuplicate = state.getSnapshot().document.blocks;
    expect(afterDuplicate).toHaveLength(4);
    expect(afterDuplicate[1].id).toBe("b2");
    expect(afterDuplicate[2].type).toBe("text");

    menu.openForBlock("b1");
    await menu.execute("editor.block.delete");

    const afterDeleteIds = state.getSnapshot().document.blocks.map((block) => block.id);
    expect(afterDeleteIds).not.toContain("b1");
  });

  it("executes selection context formatting actions", async () => {
    const state = createState();
    const registry = createCommandRegistry<EditorBlock>();
    registerFormattingCommands(registry);

    state.setSelectionRange({
      start: { blockId: "b2", offset: 0 },
      end: { blockId: "b2", offset: 3 },
    });

    const menu = createSelectionContextMenu({
      state,
      commandRegistry: registry,
    });

    const openState = menu.openForSelection();
    expect(openState.isOpen).toBe(true);
    expect(openState.items.some((item) => item.commandId === "editor.format.bold")).toBe(
      true,
    );

    await menu.execute("editor.format.bold");

    const updatedBlock = state.getSnapshot().document.blocks.find((block) => block.id === "b2");
    expect(updatedBlock?.data.marks?.bold).toBe(true);
    expect(menu.getState().isOpen).toBe(false);
  });

  it("opens empty-space context menu and supports keyboard execution", async () => {
    const state = createState();
    const registry = createCommandRegistry<EditorBlock>();
    registerFormattingCommands(registry);

    registry.register({
      id: "editor.insert.placeholder",
      title: "Insert placeholder",
      category: "Insert",
      execute(commandContext) {
        commandContext.state.insertBlock(createTextBlock("placeholder", "Placeholder"));
      },
    });

    const menu = createEmptySpaceContextMenu({
      state,
      commandRegistry: registry,
      commandIds: ["editor.insert.placeholder", "editor.format.bold"],
    });

    const openState = menu.openForEmptySpace();
    expect(openState.kind).toBe("empty");
    expect(openState.anchorBlockId).toBeNull();
    expect(openState.activeIndex).toBe(0);

    await menu.handleKey("ArrowDown");
    expect(menu.getState().activeIndex).toBe(1);

    await menu.handleKey("ArrowUp");
    expect(menu.getState().activeIndex).toBe(0);

    const executeResult = await menu.handleKey("Enter");
    expect(executeResult).toBe("executed");

    const ids = state.getSnapshot().document.blocks.map((block) => block.id);
    expect(ids).toContain("placeholder");
  });
});

describe("block action affordances and dnd", () => {
  it("tracks hover and drag affordances in block action menu", async () => {
    const state = createState();
    const registry = createCommandRegistry<EditorBlock>();
    registerBlockActionCommands(registry);

    const interactions = createBlockInteractionController();
    const actionMenu = createBlockActionMenu({
      state,
      commandRegistry: registry,
      interactions,
    });

    const hoverState = actionMenu.hover("b2");
    expect(hoverState.visible).toBe(true);
    expect(hoverState.blockId).toBe("b2");
    expect(hoverState.dragHandleVisible).toBe(true);

    const draggingState = actionMenu.startDrag("b2");
    expect(draggingState.isDragging).toBe(true);
    expect(actionMenu.render()).toContain('data-block-action-menu="true"');
    expect(actionMenu.render()).toContain('data-drag-handle="true"');

    await actionMenu.execute("editor.block.moveUp");

    const reorderedIds = state.getSnapshot().document.blocks.map((block) => block.id);
    expect(reorderedIds.slice(0, 2)).toEqual(["b2", "b1"]);

    const endState = actionMenu.endDrag();
    expect(endState.isDragging).toBe(false);
  });

  it("reorders blocks via drag and drop controller with drop indicator", () => {
    const state = createState();
    const dnd = createBlockDnDController({
      state,
    });

    dnd.startDrag("b3");
    const updated = dnd.updateDropIndex(0);

    expect(updated.indicator?.index).toBe(0);
    expect(updated.indicator?.beforeBlockId).toBe("b1");

    dnd.drop();

    const ids = state.getSnapshot().document.blocks.map((block) => block.id);
    expect(ids).toEqual(["b3", "b1", "b2"]);
  });
});

describe("multi-select operations", () => {
  it("supports range selection with batch duplicate and delete", () => {
    const state = createState();

    const rangeIds = selectBlockRange(state, "b1", "b3");
    expect(rangeIds).toEqual(["b1", "b2", "b3"]);

    const duplicatedIds = duplicateSelectedBlocks(state);
    expect(duplicatedIds).toHaveLength(3);
    expect(state.getSnapshot().document.blocks).toHaveLength(6);

    const deletedIds = deleteSelectedBlocks(state);
    expect(deletedIds).toEqual(duplicatedIds);

    const finalIds = state.getSnapshot().document.blocks.map((block) => block.id);
    expect(finalIds).toEqual(["b1", "b2", "b3"]);
  });
});
