export interface HistorySnapshot<TState> {
  past: TState[];
  present: TState;
  future: TState[];
  limit: number;
}

export interface HistoryStateOptions<TState> {
  limit?: number;
  areEqual?: (left: TState, right: TState) => boolean;
}

export interface PushStateOptions {
  compress?: boolean;
}

function cloneValue<TValue>(value: TValue): TValue {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as TValue;
}

function defaultAreEqual<TState>(left: TState, right: TState): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

export class HistoryState<TState> {
  private past: TState[] = [];
  private present: TState;
  private future: TState[] = [];
  private readonly limit: number;
  private readonly areEqual: (left: TState, right: TState) => boolean;

  constructor(initialState: TState, options: HistoryStateOptions<TState> = {}) {
    this.present = cloneValue(initialState);
    this.limit = Math.max(1, options.limit ?? 50);
    this.areEqual = options.areEqual ?? defaultAreEqual;
  }

  getSnapshot(): HistorySnapshot<TState> {
    return {
      past: cloneValue(this.past),
      present: cloneValue(this.present),
      future: cloneValue(this.future),
      limit: this.limit,
    };
  }

  getPresent(): TState {
    return cloneValue(this.present);
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  push(nextState: TState, options: PushStateOptions = {}): HistorySnapshot<TState> {
    const next = cloneValue(nextState);
    if (this.areEqual(this.present, next)) {
      return this.getSnapshot();
    }

    const nextPast = [...this.past, cloneValue(this.present)];
    this.past =
      options.compress === false
        ? this.applyLimit(nextPast)
        : this.applyLimit(this.compressStack(nextPast));

    this.present = next;
    this.future = [];

    return this.getSnapshot();
  }

  undo(): HistorySnapshot<TState> {
    if (!this.canUndo()) {
      return this.getSnapshot();
    }

    const previous = this.past[this.past.length - 1];
    this.past = this.past.slice(0, -1);
    this.future = [cloneValue(this.present), ...this.future];
    this.present = cloneValue(previous);

    return this.getSnapshot();
  }

  redo(): HistorySnapshot<TState> {
    if (!this.canRedo()) {
      return this.getSnapshot();
    }

    const next = this.future[0];
    this.future = this.future.slice(1);
    this.past = this.applyLimit([...this.past, cloneValue(this.present)]);
    this.present = cloneValue(next);

    return this.getSnapshot();
  }

  reset(initialState: TState): HistorySnapshot<TState> {
    this.past = [];
    this.future = [];
    this.present = cloneValue(initialState);
    return this.getSnapshot();
  }

  compact(): HistorySnapshot<TState> {
    this.past = this.applyLimit(this.compressStack(this.past));
    this.future = this.compressStack(this.future);
    return this.getSnapshot();
  }

  serialize(): string {
    return JSON.stringify(this.getSnapshot());
  }

  static deserialize<TState>(
    serialized: string,
    options: HistoryStateOptions<TState> = {},
  ): HistoryState<TState> {
    const parsed = JSON.parse(serialized) as HistorySnapshot<TState>;

    if (
      !parsed ||
      !("present" in parsed) ||
      !Array.isArray(parsed.past) ||
      !Array.isArray(parsed.future)
    ) {
      throw new Error("Invalid serialized history snapshot");
    }

    const state = new HistoryState<TState>(parsed.present, {
      ...options,
      limit: options.limit ?? parsed.limit,
    });

    state.past = cloneValue(parsed.past);
    state.future = cloneValue(parsed.future);
    state.compact();
    return state;
  }

  private applyLimit(stack: TState[]): TState[] {
    if (stack.length <= this.limit) {
      return stack;
    }

    return stack.slice(stack.length - this.limit);
  }

  private compressStack(stack: TState[]): TState[] {
    const compressed: TState[] = [];

    for (const item of stack) {
      const previous = compressed[compressed.length - 1];
      if (previous && this.areEqual(previous, item)) {
        continue;
      }

      compressed.push(cloneValue(item));
    }

    return compressed;
  }
}
