import { type DocumentSnapshot } from "../../../core/src/state/DocumentState";
import {
  createAutoStorageDriver,
  createDebouncedSaver,
  saveState,
  type StateStorageDriver,
} from "../../../core/src/state/persistence";
import type { CoreEventPayloadMap } from "../../../core/src/types/event";
import type { EventBus } from "../../../core/src/events/EventBus";
import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorStateAdapter } from "./EditorStateAdapter";

const DEFAULT_STORAGE_KEY = "pulse:editor:document";
const DEFAULT_AUTOSAVE_DEBOUNCE_MS = 600;

type SaveSource = "manual" | "autosave";

export type EditorSaveLifecycle = "idle" | "saving" | "error";

export interface EditorSaveStatus {
  lifecycle: EditorSaveLifecycle;
  autosaveEnabled: boolean;
  autosavePending: boolean;
  lastSavedAt?: string;
  lastSavedSource?: SaveSource;
  errorMessage?: string;
}

export interface EditorSaveControllerOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  state: EditorStateAdapter<TBlock>;
  storageKey?: string;
  storageDriver?: StateStorageDriver;
  autosave?: {
    enabled?: boolean;
    debounceMs?: number;
  };
  eventBus?: EventBus<CoreEventPayloadMap>;
}

export interface EditorSaveResult {
  documentId: string;
  savedAt: string;
  source: SaveSource;
}

function resolveRevision(metadata: { revision?: number }): number {
  return typeof metadata.revision === "number" ? metadata.revision : 0;
}

function resolveSavedRevision(metadata: { savedRevision?: number }): number {
  return typeof metadata.savedRevision === "number" ? metadata.savedRevision : 0;
}

function isDocumentDirty<TBlock extends Block<BlockData>>(
  snapshot: DocumentSnapshot<TBlock>,
): boolean {
  return resolveRevision(snapshot.metadata) > resolveSavedRevision(snapshot.metadata);
}

function buildSavedSnapshot<TBlock extends Block<BlockData>>(
  snapshot: DocumentSnapshot<TBlock>,
  savedAt: string,
): DocumentSnapshot<TBlock> {
  return {
    ...snapshot,
    metadata: {
      ...snapshot.metadata,
      updatedAt: savedAt,
      lastSavedAt: savedAt,
      savedRevision: resolveRevision(snapshot.metadata),
    },
  };
}

export class EditorSaveController<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  private readonly state: EditorStateAdapter<TBlock>;
  private readonly storageDriver: StateStorageDriver;
  private readonly storageKey: string;
  private readonly eventBus?: EventBus<CoreEventPayloadMap>;
  private readonly autosaveEnabled: boolean;
  private readonly debouncedAutosave: ReturnType<
    typeof createDebouncedSaver<DocumentSnapshot<TBlock>>
  >;
  private readonly autosaveDebounceMs: number;
  private autosaveToken = 0;
  private autosaveSavePromise: Promise<void> | null = null;
  private readonly unsubscribeFromState?: () => void;
  private status: EditorSaveStatus;

  constructor(options: EditorSaveControllerOptions<TBlock>) {
    this.state = options.state;
    this.storageDriver = options.storageDriver ?? createAutoStorageDriver();
    this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
    this.eventBus = options.eventBus;
    this.autosaveEnabled = options.autosave?.enabled ?? true;
    this.autosaveDebounceMs = Math.max(
      0,
      options.autosave?.debounceMs ?? DEFAULT_AUTOSAVE_DEBOUNCE_MS,
    );
    this.debouncedAutosave = createDebouncedSaver<DocumentSnapshot<TBlock>>(
      this.storageDriver,
      this.storageKey,
      {
        debounceMs: this.autosaveDebounceMs,
      },
    );
    this.status = {
      lifecycle: "idle",
      autosaveEnabled: this.autosaveEnabled,
      autosavePending: false,
      lastSavedAt:
        typeof this.state.getSnapshot().document.metadata.lastSavedAt === "string"
          ? this.state.getSnapshot().document.metadata.lastSavedAt
          : undefined,
    };

    this.unsubscribeFromState = this.state.subscribe((snapshot, reason) => {
      if (!this.autosaveEnabled || reason !== "document") {
        return;
      }

      if (!isDocumentDirty(snapshot.document)) {
        this.status = {
          ...this.status,
          lifecycle: "idle",
          autosavePending: false,
          errorMessage: undefined,
        };
        return;
      }

      this.queueAutosave(snapshot.document);
    });
  }

  getStatus(): EditorSaveStatus {
    return { ...this.status };
  }

  async saveNow(): Promise<EditorSaveResult> {
    await this.flushAutosave();

    const snapshot = this.state.getSnapshot().document;
    const savedAt = new Date().toISOString();
    const persistedSnapshot = buildSavedSnapshot(snapshot, savedAt);

    this.autosaveToken += 1;
    this.debouncedAutosave.cancel();
    this.status = {
      ...this.status,
      lifecycle: "saving",
      autosavePending: false,
      errorMessage: undefined,
    };

    try {
      await saveState(this.storageDriver, this.storageKey, persistedSnapshot);
      this.state.markDocumentSaved(savedAt);
      await this.emitSavedEvent(snapshot.id, savedAt);

      this.status = {
        ...this.status,
        lifecycle: "idle",
        autosavePending: false,
        lastSavedAt: savedAt,
        lastSavedSource: "manual",
        errorMessage: undefined,
      };

      return {
        documentId: snapshot.id,
        savedAt,
        source: "manual",
      };
    } catch (error) {
      this.status = {
        ...this.status,
        lifecycle: "error",
        autosavePending: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
      throw error;
    }
  }

  async flushAutosave(): Promise<void> {
    await this.debouncedAutosave.flush();

    if (this.autosaveSavePromise) {
      await this.autosaveSavePromise;
    }
  }

  cancelAutosave(): void {
    this.autosaveToken += 1;
    this.debouncedAutosave.cancel();
    this.status = {
      ...this.status,
      autosavePending: false,
      lifecycle: "idle",
      errorMessage: undefined,
    };
  }

  dispose(): void {
    this.cancelAutosave();
    this.unsubscribeFromState?.();
  }

  private queueAutosave(documentSnapshot: DocumentSnapshot<TBlock>): void {
    const saveToken = ++this.autosaveToken;
    const savedAt = new Date().toISOString();
    const persistedSnapshot = buildSavedSnapshot(documentSnapshot, savedAt);

    this.status = {
      ...this.status,
      lifecycle: "saving",
      autosavePending: true,
      errorMessage: undefined,
    };

    const savePromise = this.debouncedAutosave
      .save(persistedSnapshot)
      .then(async () => {
        if (saveToken !== this.autosaveToken) {
          return;
        }

        this.state.markDocumentSaved(savedAt);
        await this.emitSavedEvent(documentSnapshot.id, savedAt);

        this.status = {
          ...this.status,
          lifecycle: "idle",
          autosavePending: false,
          lastSavedAt: savedAt,
          lastSavedSource: "autosave",
          errorMessage: undefined,
        };
      })
      .catch((error) => {
        if (saveToken !== this.autosaveToken) {
          return;
        }

        this.status = {
          ...this.status,
          lifecycle: "error",
          autosavePending: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        };
      });

    this.autosaveSavePromise = savePromise.finally(() => {
      if (this.autosaveSavePromise === savePromise) {
        this.autosaveSavePromise = null;
      }
    });
  }

  private async emitSavedEvent(documentId: string, savedAt: string): Promise<void> {
    if (!this.eventBus) {
      return;
    }

    await this.eventBus.emit("content:saved", {
      documentId,
      savedAt,
    });
  }
}

export function createEditorSaveController<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  options: EditorSaveControllerOptions<TBlock>,
): EditorSaveController<TBlock> {
  return new EditorSaveController(options);
}
