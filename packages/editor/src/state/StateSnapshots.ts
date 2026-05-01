import type { Block, BlockData } from "../../../core/src/types/block";
import type { SelectionSnapshot } from "../../../core/src/state/SelectionState";
import type { EditorStateSnapshot } from "../types";
import type { EditorStateAdapter } from "./EditorStateAdapter";

function cloneValue<TValue>(value: TValue): TValue {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as TValue;
}

function createGeneratedId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function restoreSelection(
  state: EditorStateAdapter,
  snapshot: SelectionSnapshot,
): void {
  if (snapshot.range) {
    state.setSelectionRange(snapshot.range);
    return;
  }

  if (snapshot.multiBlockIds.length > 0) {
    state.selectBlocks(snapshot.multiBlockIds);
    return;
  }

  if (snapshot.cursor) {
    state.setFocusedBlock(snapshot.cursor.blockId, snapshot.cursor.offset);
    return;
  }

  state.clearSelection("programmatic");
}

export interface CapturedStateSnapshot<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  id: string;
  label: string;
  createdAt: string;
  snapshot: EditorStateSnapshot<TBlock>;
}

export class EditorStateSnapshotStore<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  private readonly snapshots = new Map<string, CapturedStateSnapshot<TBlock>>();

  capture(state: EditorStateAdapter<TBlock>, label: string = "Snapshot"): CapturedStateSnapshot<TBlock> {
    const entry: CapturedStateSnapshot<TBlock> = {
      id: createGeneratedId("state-snapshot"),
      label,
      createdAt: new Date().toISOString(),
      snapshot: cloneValue(state.getSnapshot()),
    };

    this.snapshots.set(entry.id, entry);
    return cloneValue(entry);
  }

  list(): CapturedStateSnapshot<TBlock>[] {
    return Array.from(this.snapshots.values())
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map((entry) => cloneValue(entry));
  }

  get(snapshotId: string): CapturedStateSnapshot<TBlock> | undefined {
    const entry = this.snapshots.get(snapshotId);
    return entry ? cloneValue(entry) : undefined;
  }

  remove(snapshotId: string): boolean {
    return this.snapshots.delete(snapshotId);
  }

  clear(): void {
    this.snapshots.clear();
  }

  restore(snapshotId: string, state: EditorStateAdapter<TBlock>): EditorStateSnapshot<TBlock> {
    const entry = this.snapshots.get(snapshotId);
    if (!entry) {
      throw new Error(`State snapshot "${snapshotId}" was not found`);
    }

    state.getDocumentState().replaceSnapshot(entry.snapshot.document);
    restoreSelection(state as unknown as EditorStateAdapter, entry.snapshot.selection);

    return state.getSnapshot();
  }
}

export function createEditorStateSnapshotStore<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): EditorStateSnapshotStore<TBlock> {
  return new EditorStateSnapshotStore<TBlock>();
}
