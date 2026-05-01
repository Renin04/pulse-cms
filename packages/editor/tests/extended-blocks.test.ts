import { describe, expect, it } from "vitest";

import type { Block } from "../../core/src/types/block";
import {
  createCommandPalette,
  createCommandRegistry,
  createEditorStateAdapter,
  createExtendedBlock,
  createExtendedBlockShortcutBindings,
  createShortcutRegistry,
  INSERT_ALERT_BLOCK_COMMAND_ID,
  INSERT_AUDIO_BLOCK_COMMAND_ID,
  INSERT_CALLOUT_BLOCK_COMMAND_ID,
  INSERT_EMBED_BLOCK_COMMAND_ID,
  INSERT_FILE_BLOCK_COMMAND_ID,
  INSERT_TABLE_BLOCK_COMMAND_ID,
  INSERT_VIDEO_BLOCK_COMMAND_ID,
  mergeExtendedBlockData,
  registerExtendedBlockCommands,
} from "../src";

type EditorBlock = Block<Record<string, unknown>>;

function createTextBlock(id: string, text: string): EditorBlock {
  const timestamp = new Date().toISOString();

  return {
    id,
    type: "text",
    data: {
      text,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createRuntime() {
  const state = createEditorStateAdapter<EditorBlock>({
    document: {
      id: "extended-block-doc",
      blocks: [createTextBlock("seed", "seed")],
    },
  });
  const registry = createCommandRegistry<EditorBlock>();
  registerExtendedBlockCommands(registry);

  return {
    state,
    registry,
  };
}

describe("extended block commands", () => {
  it("registers slash command entries for the extended block wave", () => {
    const runtime = createRuntime();
    const palette = createCommandPalette({
      registry: runtime.registry,
    });

    const state = palette.openFromText("/cal", 4, {
      state: runtime.state,
    });

    expect(state.isOpen).toBe(true);
    expect(state.results.map((result) => result.command.id)).toContain(
      INSERT_CALLOUT_BLOCK_COMMAND_ID,
    );
    expect(palette.render()).toContain('data-command-palette="true"');
  });

  it("executes insert commands for every new block type", async () => {
    const runtime = createRuntime();
    const insertions: Array<[string, string]> = [
      [INSERT_VIDEO_BLOCK_COMMAND_ID, "video"],
      [INSERT_AUDIO_BLOCK_COMMAND_ID, "audio"],
      [INSERT_FILE_BLOCK_COMMAND_ID, "file"],
      [INSERT_TABLE_BLOCK_COMMAND_ID, "table"],
      [INSERT_EMBED_BLOCK_COMMAND_ID, "embed"],
      [INSERT_CALLOUT_BLOCK_COMMAND_ID, "callout"],
      [INSERT_ALERT_BLOCK_COMMAND_ID, "alert"],
    ];

    for (const [commandId] of insertions) {
      await runtime.registry.execute(commandId, {
        state: runtime.state,
      });
    }

    const insertedTypes = runtime.state
      .getSnapshot()
      .document.blocks.map((block) => block.type);

    for (const [, blockType] of insertions) {
      expect(insertedTypes).toContain(blockType);
    }
    expect(insertedTypes).toHaveLength(1 + insertions.length);
  });
});

describe("extended block validation helpers", () => {
  it("creates validated blocks and rejects invalid payloads", () => {
    const videoBlock = createExtendedBlock("video", {
      data: {
        url: "https://cdn.example.com/video.mp4",
        provider: "html5",
        title: "Demo",
        startAtSeconds: 6,
      },
    });

    expect(videoBlock.type).toBe("video");
    expect(videoBlock.data.startAtSeconds).toBe(6);

    expect(() =>
      createExtendedBlock("embed", {
        data: {
          url: "javascript:alert(1)",
        },
      }),
    ).toThrow("Unsupported embed URL protocol");
  });

  it("merges edits with schema validation for callout and alert blocks", () => {
    const callout = mergeExtendedBlockData(
      "callout",
      {
        variant: "info",
        title: "Heads up",
        body: "Initial copy",
      },
      {
        variant: "warning",
      },
    );

    expect(callout.variant).toBe("warning");

    expect(() =>
      mergeExtendedBlockData(
        "alert",
        {
          severity: "info",
          message: "Read this",
          dismissible: false,
          isDismissed: false,
        },
        {
          isDismissed: true,
        },
      ),
    ).toThrow("Alert cannot be dismissed");
  });
});

describe("extended block shortcuts", () => {
  it("registers and dispatches extended block shortcut bindings", async () => {
    const runtime = createRuntime();
    const shortcuts = createShortcutRegistry<EditorBlock>({
      commandRegistry: runtime.registry,
      platform: "windows",
    });

    for (const binding of createExtendedBlockShortcutBindings<EditorBlock>()) {
      shortcuts.register(binding);
    }

    expect(shortcuts.getConflicts()).toHaveLength(0);

    const result = await shortcuts.dispatch(
      {
        key: "7",
        ctrlKey: true,
        altKey: true,
      },
      {
        state: runtime.state,
      },
    );

    expect(result.type).toBe("executed");
    expect(result.commandId).toBe(INSERT_CALLOUT_BLOCK_COMMAND_ID);
    expect(
      runtime.state
        .getSnapshot()
        .document.blocks.some((block) => block.type === "callout"),
    ).toBe(true);
  });
});
