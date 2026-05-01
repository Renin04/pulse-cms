import { describe, expect, it } from "vitest";

import type { Block } from "../../core/src/types/block";
import {
  createCommandPalette,
  createCommandRegistry,
  createEditorStateAdapter,
  createInteractiveCreativeBlock,
  createInteractiveCreativeShortcutBindings,
  createShortcutRegistry,
  INSERT_CARD_BLOCK_COMMAND_ID,
  INSERT_CAROUSEL_BLOCK_COMMAND_ID,
  INSERT_GALLERY_BLOCK_COMMAND_ID,
  INSERT_MANGA_PANEL_BLOCK_COMMAND_ID,
  INSERT_POLL_BLOCK_COMMAND_ID,
  INSERT_QUIZ_BLOCK_COMMAND_ID,
  INSERT_SPEECH_BUBBLE_BLOCK_COMMAND_ID,
  INSERT_SURVEY_BLOCK_COMMAND_ID,
  mergeInteractiveCreativeBlockData,
  registerInteractiveCreativeBlockCommands,
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
      id: "interactive-creative-doc",
      blocks: [createTextBlock("seed", "seed")],
    },
  });
  const registry = createCommandRegistry<EditorBlock>();
  registerInteractiveCreativeBlockCommands(registry);

  return { state, registry };
}

describe("interactive/creative block commands", () => {
  it("exposes slash command entries for interactive and creative blocks", () => {
    const runtime = createRuntime();
    const palette = createCommandPalette({
      registry: runtime.registry,
    });

    const state = palette.openFromText("/man", 4, {
      state: runtime.state,
    });

    expect(state.isOpen).toBe(true);
    expect(state.results.map((result) => result.command.id)).toContain(
      INSERT_MANGA_PANEL_BLOCK_COMMAND_ID,
    );
    expect(palette.render()).toContain('data-command-palette="true"');
  });

  it("executes insert commands for all interactive/creative block types", async () => {
    const runtime = createRuntime();
    const insertions: Array<[string, string]> = [
      [INSERT_QUIZ_BLOCK_COMMAND_ID, "quiz"],
      [INSERT_POLL_BLOCK_COMMAND_ID, "poll"],
      [INSERT_SURVEY_BLOCK_COMMAND_ID, "survey"],
      [INSERT_MANGA_PANEL_BLOCK_COMMAND_ID, "manga-panel"],
      [INSERT_SPEECH_BUBBLE_BLOCK_COMMAND_ID, "speech-bubble"],
      [INSERT_CARD_BLOCK_COMMAND_ID, "card"],
      [INSERT_GALLERY_BLOCK_COMMAND_ID, "gallery"],
      [INSERT_CAROUSEL_BLOCK_COMMAND_ID, "carousel"],
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

describe("interactive/creative block validation helpers", () => {
  it("creates validated blocks and rejects invalid payloads", () => {
    const quizBlock = createInteractiveCreativeBlock("quiz", {
      data: {
        question: "Best trigger?",
        options: [
          { id: "q1", text: "/", isCorrect: true },
          { id: "q2", text: "\\\\", isCorrect: false },
        ],
        allowMultiple: false,
        randomizeOptions: false,
        showExplanations: true,
      },
    });

    expect(quizBlock.type).toBe("quiz");

    expect(() =>
      createInteractiveCreativeBlock("gallery", {
        data: {
          images: [
            {
              id: "g1",
              src: "javascript:alert(1)",
              alt: "x",
            },
          ],
        },
      }),
    ).toThrow("Unsupported gallery image URL protocol");
  });

  it("merges edits with schema validation for survey and carousel blocks", () => {
    const survey = mergeInteractiveCreativeBlockData(
      "survey",
      {
        title: "Feedback",
        questions: [
          {
            id: "s1",
            prompt: "Rate the editor",
            type: "rating",
            required: true,
            scaleMax: 5,
          },
        ],
      },
      {
        description: "Help us refine authoring",
      },
    );

    expect(survey.description).toBe("Help us refine authoring");

    expect(() =>
      mergeInteractiveCreativeBlockData(
        "carousel",
        {
          slides: [{ id: "c1", title: "Slide 1" }],
          autoplay: false,
          intervalMs: 5000,
          showIndicators: true,
        },
        {
          intervalMs: 250,
        },
      ),
    ).toThrow("Number must be greater than or equal to 1000");
  });
});

describe("interactive/creative shortcuts", () => {
  it("registers and dispatches interactive/creative shortcut bindings", async () => {
    const runtime = createRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry: runtime.registry,
      platform: "windows",
    });

    for (const binding of createInteractiveCreativeShortcutBindings<EditorBlock>()) {
      shortcuts.register(binding);
    }

    expect(shortcuts.getConflicts()).toHaveLength(0);

    const result = await shortcuts.dispatch(
      {
        key: "m",
        ctrlKey: true,
        shiftKey: true,
      },
      {
        state: runtime.state,
      },
    );

    expect(result.type).toBe("executed");
    expect(result.commandId).toBe(INSERT_MANGA_PANEL_BLOCK_COMMAND_ID);
    expect(
      runtime.state
        .getSnapshot()
        .document.blocks.some((block) => block.type === "manga-panel"),
    ).toBe(true);
  });
});
