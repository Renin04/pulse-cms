import { describe, expect, it } from "vitest";

import type { Block } from "../../core/src/types/block";
import {
  createCommandPalette,
  createCommandRegistry,
  createEditorStateAdapter,
  createPhase2ExpansionBlock,
  createPhase2ExpansionBlockShortcutBindings,
  createShortcutRegistry,
  INSERT_ACCORDION_BLOCK_COMMAND_ID,
  INSERT_ANNOTATED_IMAGE_BLOCK_COMMAND_ID,
  INSERT_BEFORE_AFTER_BLOCK_COMMAND_ID,
  INSERT_CHART_BLOCK_COMMAND_ID,
  INSERT_COMPARISON_BLOCK_COMMAND_ID,
  INSERT_DIAGRAM_BLOCK_COMMAND_ID,
  INSERT_FLASHCARD_BLOCK_COMMAND_ID,
  INSERT_HERO_SECTION_BLOCK_COMMAND_ID,
  INSERT_MAP_BLOCK_COMMAND_ID,
  INSERT_MATH_EQUATION_BLOCK_COMMAND_ID,
  INSERT_SPOILER_BLOCK_COMMAND_ID,
  INSERT_TABS_BLOCK_COMMAND_ID,
  INSERT_TIMELINE_BLOCK_COMMAND_ID,
  INSERT_TOGGLE_BLOCK_COMMAND_ID,
  mergePhase2ExpansionBlockData,
  registerPhase2ExpansionBlockCommands,
} from "../src";

type EditorBlock = Block<Record<string, unknown>>;

function createTextBlock(id: string, text: string): EditorBlock {
  const timestamp = new Date().toISOString();

  return {
    id,
    type: "text",
    data: { text },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createRuntime() {
  const state = createEditorStateAdapter<EditorBlock>({
    document: {
      id: "phase2-expansion-doc",
      blocks: [createTextBlock("seed", "seed")],
    },
  });
  const registry = createCommandRegistry<EditorBlock>();
  registerPhase2ExpansionBlockCommands(registry);

  return { state, registry };
}

describe("phase2 expansion block commands", () => {
  it("exposes slash command entries for expansion blocks", () => {
    const runtime = createRuntime();
    const palette = createCommandPalette({
      registry: runtime.registry,
    });

    const state = palette.openFromText("/fla", 4, {
      state: runtime.state,
    });

    expect(state.isOpen).toBe(true);
    expect(state.results.map((result) => result.command.id)).toContain(
      INSERT_FLASHCARD_BLOCK_COMMAND_ID,
    );
    expect(palette.render()).toContain('data-command-palette="true"');
  });

  it("executes insert commands for all expansion block types", async () => {
    const runtime = createRuntime();
    const insertions: Array<[string, string]> = [
      [INSERT_FLASHCARD_BLOCK_COMMAND_ID, "flashcard"],
      [INSERT_ACCORDION_BLOCK_COMMAND_ID, "accordion"],
      [INSERT_TABS_BLOCK_COMMAND_ID, "tabs"],
      [INSERT_TOGGLE_BLOCK_COMMAND_ID, "toggle"],
      [INSERT_SPOILER_BLOCK_COMMAND_ID, "spoiler"],
      [INSERT_CHART_BLOCK_COMMAND_ID, "chart"],
      [INSERT_MAP_BLOCK_COMMAND_ID, "map"],
      [INSERT_MATH_EQUATION_BLOCK_COMMAND_ID, "math-equation"],
      [INSERT_DIAGRAM_BLOCK_COMMAND_ID, "diagram"],
      [INSERT_TIMELINE_BLOCK_COMMAND_ID, "timeline"],
      [INSERT_COMPARISON_BLOCK_COMMAND_ID, "comparison"],
      [INSERT_BEFORE_AFTER_BLOCK_COMMAND_ID, "before-after"],
      [INSERT_HERO_SECTION_BLOCK_COMMAND_ID, "hero-section"],
      [INSERT_ANNOTATED_IMAGE_BLOCK_COMMAND_ID, "annotated-image"],
    ];

    for (const [commandId] of insertions) {
      await runtime.registry.execute(commandId, {
        state: runtime.state,
      });
    }

    const types = runtime.state.getSnapshot().document.blocks.map((block) => block.type);
    for (const [, expectedType] of insertions) {
      expect(types).toContain(expectedType);
    }
    expect(types).toHaveLength(1 + insertions.length);
  });
});

describe("phase2 expansion block validation helpers", () => {
  it("creates validated blocks and rejects invalid payloads", () => {
    const flashcardBlock = createPhase2ExpansionBlock("flashcard", {
      data: {
        title: "Study set",
        shuffle: false,
        cards: [
          {
            id: "fc-1",
            front: "What is Pulse?",
            back: "A modular block editor",
          },
        ],
      },
    });

    expect(flashcardBlock.type).toBe("flashcard");

    expect(() =>
      createPhase2ExpansionBlock("annotated-image", {
        data: {
          imageUrl: "javascript:alert(1)",
          alt: "bad",
          hotspots: [],
        },
      }),
    ).toThrow("Unsupported annotated image URL protocol");
  });

  it("merges edits with schema validation for tabs and before-after blocks", () => {
    const tabs = mergePhase2ExpansionBlockData(
      "tabs",
      {
        activeTabId: "tab-1",
        tabs: [
          { id: "tab-1", label: "One", content: "First" },
          { id: "tab-2", label: "Two", content: "Second" },
        ],
      },
      {
        activeTabId: "tab-2",
      },
    );

    expect(tabs.activeTabId).toBe("tab-2");

    expect(() =>
      mergePhase2ExpansionBlockData(
        "before-after",
        {
          beforeUrl: "https://example.com/before.jpg",
          afterUrl: "https://example.com/after.jpg",
          beforeLabel: "Before",
          afterLabel: "After",
          position: 50,
        },
        {
          position: 120,
        },
      ),
    ).toThrow("Number must be less than or equal to 100");
  });
});

describe("phase2 expansion shortcuts", () => {
  it("registers and dispatches expansion shortcut bindings", async () => {
    const runtime = createRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry: runtime.registry,
      platform: "windows",
    });

    for (const binding of createPhase2ExpansionBlockShortcutBindings<EditorBlock>()) {
      shortcuts.register(binding);
    }

    expect(shortcuts.getConflicts()).toHaveLength(0);

    const result = await shortcuts.dispatch(
      {
        key: "1",
        ctrlKey: true,
        altKey: true,
        shiftKey: true,
      },
      {
        state: runtime.state,
      },
    );

    expect(result.type).toBe("executed");
    expect(result.commandId).toBe(INSERT_FLASHCARD_BLOCK_COMMAND_ID);
    expect(
      runtime.state
        .getSnapshot()
        .document.blocks.some((block) => block.type === "flashcard"),
    ).toBe(true);
  });
});
