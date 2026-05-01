export type SelectionClearReason = "blur" | "command" | "programmatic";

export interface SelectionPoint {
  blockId: string;
  offset: number;
}

export interface SelectionRange {
  start: SelectionPoint;
  end: SelectionPoint;
}

export interface SelectionSnapshot {
  cursor: SelectionPoint | null;
  range: SelectionRange | null;
  multiBlockIds: string[];
  lastClearReason: SelectionClearReason | null;
}

function cloneValue<TValue>(value: TValue): TValue {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as TValue;
}

function normalizeOffset(offset: number): number {
  if (!Number.isFinite(offset)) {
    throw new Error("Selection offset must be a finite number");
  }

  return Math.max(0, Math.floor(offset));
}

export class SelectionState {
  private snapshot: SelectionSnapshot = {
    cursor: null,
    range: null,
    multiBlockIds: [],
    lastClearReason: null,
  };

  getSnapshot(): SelectionSnapshot {
    return cloneValue(this.snapshot);
  }

  setCursor(blockId: string, offset: number): SelectionSnapshot {
    this.snapshot = {
      cursor: {
        blockId,
        offset: normalizeOffset(offset),
      },
      range: null,
      multiBlockIds: [blockId],
      lastClearReason: null,
    };

    return this.getSnapshot();
  }

  setRange(range: SelectionRange): SelectionSnapshot {
    this.snapshot = {
      cursor: cloneValue(range.end),
      range: {
        start: {
          blockId: range.start.blockId,
          offset: normalizeOffset(range.start.offset),
        },
        end: {
          blockId: range.end.blockId,
          offset: normalizeOffset(range.end.offset),
        },
      },
      multiBlockIds: Array.from(
        new Set([range.start.blockId, range.end.blockId]),
      ),
      lastClearReason: null,
    };

    return this.getSnapshot();
  }

  selectBlocks(blockIds: string[]): SelectionSnapshot {
    const nextBlockIds = Array.from(new Set(blockIds.filter(Boolean)));

    this.snapshot = {
      cursor:
        nextBlockIds.length > 0
          ? {
              blockId: nextBlockIds[0],
              offset: 0,
            }
          : null,
      range: null,
      multiBlockIds: nextBlockIds,
      lastClearReason: null,
    };

    return this.getSnapshot();
  }

  clear(reason: SelectionClearReason = "programmatic"): SelectionSnapshot {
    this.snapshot = {
      cursor: null,
      range: null,
      multiBlockIds: [],
      lastClearReason: reason,
    };

    return this.getSnapshot();
  }

  isCollapsed(): boolean {
    if (!this.snapshot.range) {
      return true;
    }

    const { start, end } = this.snapshot.range;
    return start.blockId === end.blockId && start.offset === end.offset;
  }

  serialize(): string {
    return JSON.stringify(this.snapshot);
  }

  static deserialize(serialized: string): SelectionState {
    const parsed = JSON.parse(serialized) as SelectionSnapshot;
    const state = new SelectionState();

    if (
      !parsed ||
      !Array.isArray(parsed.multiBlockIds) ||
      !("cursor" in parsed) ||
      !("range" in parsed)
    ) {
      throw new Error("Invalid serialized selection snapshot");
    }

    state.snapshot = cloneValue(parsed);
    return state;
  }
}
