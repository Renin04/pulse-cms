import { describe, expect, it, vi } from "vitest";

import { EventBus } from "../../core/src/events/EventBus";
import type { DocumentSnapshot } from "../../core/src/state/DocumentState";
import {
  createInMemoryStorageDriver,
  loadState,
} from "../../core/src/state/persistence";
import type { CoreEventPayloadMap } from "../../core/src/types/event";
import type { Block } from "../../core/src/types/block";
import {
  createCommandRegistry,
  createEditorSaveController,
  createEditorStateAdapter,
  registerFormattingCommands,
  SAVE_DOCUMENT_COMMAND_ID,
} from "../src";

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

describe("save workflows", () => {
  it("persists manual saves and emits content:saved events", async () => {
    const storageDriver = createInMemoryStorageDriver();
    const eventBus = new EventBus<CoreEventPayloadMap>();
    const savedEvents: CoreEventPayloadMap["content:saved"][] = [];
    const state = createEditorStateAdapter<TextBlock>({
      document: {
        id: "save-doc",
        blocks: [createTextBlock("b1", "Draft")],
      },
    });

    state.updateBlock("b1", (block) => ({
      ...block,
      data: {
        ...block.data,
        text: "Draft updated",
      },
      updatedAt: new Date().toISOString(),
    }));

    eventBus.on("content:saved", (event) => {
      savedEvents.push(event.payload);
    });

    const controller = createEditorSaveController({
      state,
      storageDriver,
      storageKey: "save-doc-key",
      autosave: { enabled: false },
      eventBus,
    });

    const result = await controller.saveNow();

    expect(result.source).toBe("manual");
    expect(result.documentId).toBe("save-doc");
    expect(savedEvents).toHaveLength(1);
    expect(savedEvents[0]).toEqual({
      documentId: "save-doc",
      savedAt: result.savedAt,
    });

    const metadata = state.getSnapshot().document.metadata;
    expect(metadata.savedRevision).toBe(metadata.revision);
    expect(metadata.lastSavedAt).toBe(result.savedAt);

    const persisted = await loadState<DocumentSnapshot<TextBlock>>(
      storageDriver,
      "save-doc-key",
    );
    expect(persisted).not.toBeNull();
    expect(persisted?.metadata.savedRevision).toBe(persisted?.metadata.revision);
    expect(persisted?.metadata.lastSavedAt).toBe(result.savedAt);
  });

  it("queues autosave on dirty document mutations and can flush", async () => {
    vi.useFakeTimers();

    try {
      const storageDriver = createInMemoryStorageDriver();
      const state = createEditorStateAdapter<TextBlock>({
        document: {
          id: "autosave-doc",
          blocks: [createTextBlock("b1", "Seed")],
        },
      });

      const controller = createEditorSaveController({
        state,
        storageDriver,
        storageKey: "autosave-doc-key",
        autosave: {
          enabled: true,
          debounceMs: 200,
        },
      });

      state.updateBlock("b1", (block) => ({
        ...block,
        data: {
          ...block.data,
          text: "Autosaved value",
        },
        updatedAt: new Date().toISOString(),
      }));

      expect(controller.getStatus().autosavePending).toBe(true);
      await vi.advanceTimersByTimeAsync(210);
      await controller.flushAutosave();

      const status = controller.getStatus();
      expect(status.lifecycle).toBe("idle");
      expect(status.autosavePending).toBe(false);
      expect(status.lastSavedSource).toBe("autosave");
      expect(status.lastSavedAt).toBeDefined();

      const metadata = state.getSnapshot().document.metadata;
      expect(metadata.savedRevision).toBe(metadata.revision);

      const persisted = await loadState<DocumentSnapshot<TextBlock>>(
        storageDriver,
        "autosave-doc-key",
      );
      expect(persisted).not.toBeNull();
      expect(persisted?.metadata.savedRevision).toBe(persisted?.metadata.revision);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not queue autosave on selection-only changes", async () => {
    vi.useFakeTimers();

    try {
      const storageDriver = createInMemoryStorageDriver();
      const state = createEditorStateAdapter<TextBlock>({
        document: {
          id: "selection-doc",
          blocks: [createTextBlock("b1", "Seed")],
        },
      });

      const controller = createEditorSaveController({
        state,
        storageDriver,
        storageKey: "selection-doc-key",
        autosave: {
          enabled: true,
          debounceMs: 100,
        },
      });

      state.setSelectionRange({
        start: { blockId: "b1", offset: 0 },
        end: { blockId: "b1", offset: 4 },
      });

      await vi.advanceTimersByTimeAsync(120);
      await controller.flushAutosave();

      expect(controller.getStatus().autosavePending).toBe(false);
      const persisted = await loadState<DocumentSnapshot<TextBlock>>(
        storageDriver,
        "selection-doc-key",
      );
      expect(persisted).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("allows save command execution to delegate to save controller", async () => {
    const storageDriver = createInMemoryStorageDriver();
    const state = createEditorStateAdapter<TextBlock>({
      document: {
        id: "save-command-doc",
        blocks: [createTextBlock("b1", "Seed")],
      },
    });
    const controller = createEditorSaveController({
      state,
      storageDriver,
      storageKey: "save-command-doc-key",
      autosave: { enabled: false },
    });
    const registry = createCommandRegistry<TextBlock>();
    registerFormattingCommands(registry);

    let saveDelegationCount = 0;
    await registry.execute(SAVE_DOCUMENT_COMMAND_ID, {
      state,
      onSaveDocument: async () => {
        saveDelegationCount += 1;
        await controller.saveNow();
      },
    });

    expect(saveDelegationCount).toBe(1);
    const persisted = await loadState<DocumentSnapshot<TextBlock>>(
      storageDriver,
      "save-command-doc-key",
    );
    expect(persisted).not.toBeNull();
    expect(persisted?.id).toBe("save-command-doc");
  });
});
