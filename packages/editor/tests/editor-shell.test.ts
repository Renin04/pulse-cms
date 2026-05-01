import { describe, expect, it } from "vitest";

import { DocumentState } from "../../core/src/state/DocumentState";
import { SelectionState } from "../../core/src/state/SelectionState";
import type { Block } from "../../core/src/types/block";
import {
  createEditorRoot,
  createEditorStateAdapter,
  FOCUS_NEXT_BLOCK_COMMAND_ID,
  FOCUS_PREVIOUS_BLOCK_COMMAND_ID,
  focusNextBlockCommand,
  focusPreviousBlockCommand,
} from "../src";
import {
  createEditorPlaygroundFixture,
  renderEditorPlaygroundHtml,
} from "../../../apps/playground/editor-shell-playground";

interface TextBlockData extends Record<string, unknown> {
  text: string;
}

type TextBlock = Block<TextBlockData>;

function createTextBlock(id: string, text: string): TextBlock {
  const timestamp = new Date().toISOString();

  return {
    id,
    type: "text",
    data: { text },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("@pulse/editor package scaffold", () => {
  it("creates state adapter snapshots from document seeds", () => {
    const state = createEditorStateAdapter<TextBlock>({
      document: {
        id: "doc-editor",
        blocks: [createTextBlock("b1", "First"), createTextBlock("b2", "Second")],
      },
    });

    const snapshot = state.getSnapshot();

    expect(snapshot.document.id).toBe("doc-editor");
    expect(snapshot.document.blocks).toHaveLength(2);
    expect(snapshot.focusedBlockId).toBe("b1");
    expect(snapshot.selection.cursor?.blockId).toBe("b1");
  });

  it("renders block list and tracks focused block in editor root", () => {
    const state = createEditorStateAdapter<TextBlock>({
      document: {
        blocks: [createTextBlock("b1", "Alpha"), createTextBlock("b2", "Beta")],
      },
    });
    const editor = createEditorRoot({ state, id: "editor-shell" });

    const initialHtml = editor.render();
    expect(initialHtml).toContain('data-editor-id="editor-shell"');
    expect(initialHtml).toContain('data-block-id="b1"');
    expect(initialHtml).toContain('data-focused="true"');

    focusNextBlockCommand(editor);

    const nextHtml = editor.render();
    expect(nextHtml).toContain('data-focused-block-id="b2"');
    expect(nextHtml).toContain('data-block-id="b2"');
    expect(nextHtml).toContain('tabindex="0"');
  });

  it("wires DocumentState and SelectionState into the editor runtime", () => {
    const documentState = new DocumentState<TextBlock>({
      id: "wired-doc",
      blocks: [createTextBlock("b1", "One"), createTextBlock("b2", "Two")],
    });
    const selectionState = new SelectionState();

    const state = createEditorStateAdapter<TextBlock>({
      documentState,
      selectionState,
    });
    const editor = createEditorRoot({ state });

    selectionState.setCursor("b2", 3);

    const focusedSnapshot = state.getSnapshot();
    expect(focusedSnapshot.focusedBlockId).toBe("b2");

    editor.updateBlock("b2", (block) => ({
      ...block,
      data: {
        ...block.data,
        text: "Two updated",
      },
      updatedAt: new Date().toISOString(),
    }));

    expect(documentState.getBlockById("b2")?.data.text).toBe("Two updated");
    expect(selectionState.getSnapshot().cursor?.blockId).toBe("b2");

    state.removeBlock("b2");
    expect(state.getSnapshot().focusedBlockId).toBe("b1");
  });

  it("exposes focus commands for next/previous navigation", () => {
    const state = createEditorStateAdapter<TextBlock>({
      document: {
        blocks: [createTextBlock("b1", "A"), createTextBlock("b2", "B")],
      },
    });
    const editor = createEditorRoot({ state });

    expect(FOCUS_NEXT_BLOCK_COMMAND_ID).toBe("editor.focusNextBlock");
    expect(FOCUS_PREVIOUS_BLOCK_COMMAND_ID).toBe("editor.focusPreviousBlock");

    focusNextBlockCommand(editor);
    expect(state.getSnapshot().focusedBlockId).toBe("b2");

    focusPreviousBlockCommand(editor);
    expect(state.getSnapshot().focusedBlockId).toBe("b1");
  });

  it("integrates editor shell into the local playground fixture", () => {
    const fixture = createEditorPlaygroundFixture();
    const html = renderEditorPlaygroundHtml();

    expect(fixture.editor.getSnapshot().document.blocks).toHaveLength(2);
    expect(fixture.blockInspector.getSnapshot().focusedBlockId).toBe("playground-b2");
    expect(fixture.eventLogger.getEntries().length).toBeGreaterThan(0);
    expect(html).toContain("Pulse editor shell playground");
    expect(html).toContain('data-pulse-editor-root="true"');
    expect(html).toContain("playground-b1");
    expect(html).toContain('data-block-inspector="true"');
    expect(html).toContain('data-event-logger="true"');
  });

  it("renders empty, loading, and error surface states", () => {
    const state = createEditorStateAdapter<TextBlock>({
      document: {
        blocks: [],
      },
    });
    const editor = createEditorRoot({
      state,
      emptyStateLabel: "Create your first block",
      loadingStateLabel: "Hydrating editor...",
      errorStateLabel: "Editor load failed",
    });

    const emptyMarkup = editor.render();
    expect(emptyMarkup).toContain('data-editor-empty="true"');
    expect(emptyMarkup).toContain("Create your first block");

    editor.setLoading();
    const loadingMarkup = editor.render();
    expect(loadingMarkup).toContain('data-editor-loading="true"');
    expect(loadingMarkup).toContain("Hydrating editor...");

    editor.setError();
    const errorMarkup = editor.render();
    expect(errorMarkup).toContain('data-editor-error="true"');
    expect(errorMarkup).toContain("Editor load failed");

    editor.setReady();
    expect(editor.getSurfaceState().status).toBe("ready");
  });
});
