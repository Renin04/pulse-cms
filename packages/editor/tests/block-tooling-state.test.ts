import { describe, expect, it } from "vitest";

import type { Block } from "../../core/src/types/block";
import {
  applyBlockTemplate,
  createBlockTemplate,
  createBlockTemplateRegistry,
  createEditorStateAdapter,
  createEditorStateSnapshotStore,
  searchBlocks,
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

describe("block templates", () => {
  it("registers templates and applies them into editor state", () => {
    const state = createEditorStateAdapter<EditorBlock>({
      document: {
        blocks: [createTextBlock("seed", "Seed")],
      },
    });

    const template = createBlockTemplate<EditorBlock>({
      id: "template.intro",
      title: "Intro",
      blocks: [
        createTextBlock("template-heading", "Heading"),
        createTextBlock("template-body", "Body"),
      ],
    });
    const registry = createBlockTemplateRegistry<EditorBlock>();
    registry.register(template);

    const inserted = applyBlockTemplate({
      state,
      template,
      index: 1,
    });

    expect(registry.list()).toHaveLength(1);
    expect(inserted).toHaveLength(2);
    expect(state.getSnapshot().document.blocks).toHaveLength(3);
  });
});

describe("block search", () => {
  it("returns ranked matches by type and content", () => {
    const state = createEditorStateAdapter<EditorBlock>({
      document: {
        blocks: [
          createTextBlock("b1", "Alpha command palette"),
          {
            ...createTextBlock("b2", "Data chart insights"),
            type: "chart",
            data: {
              title: "Quarterly chart",
            },
          },
        ],
      },
    });

    const queryByText = searchBlocks(state.getSnapshot(), "alpha");
    expect(queryByText).toHaveLength(1);
    expect(queryByText[0].block.id).toBe("b1");
    expect(queryByText[0].matchedIn).toBe("content");

    const queryByType = searchBlocks(state.getSnapshot(), "chart");
    expect(queryByType).toHaveLength(1);
    expect(queryByType[0].block.id).toBe("b2");
    expect(queryByType[0].matchedIn).toBe("type");
  });
});

describe("state snapshots", () => {
  it("captures and restores editor state snapshots", () => {
    const state = createEditorStateAdapter<EditorBlock>({
      document: {
        blocks: [createTextBlock("b1", "Initial")],
      },
    });

    const snapshots = createEditorStateSnapshotStore<EditorBlock>();
    const initial = snapshots.capture(state, "initial");

    state.updateBlock("b1", (block) => ({
      ...block,
      data: {
        ...block.data,
        text: "Updated",
      },
      updatedAt: new Date().toISOString(),
    }));

    expect(state.getSnapshot().document.blocks[0].data.text).toBe("Updated");

    const restored = snapshots.restore(initial.id, state);

    expect(restored.document.blocks[0].data.text).toBe("Initial");
    expect(snapshots.list()).toHaveLength(1);
  });
});
