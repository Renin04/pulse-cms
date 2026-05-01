const DEFAULT_DB_NAME = "pulse_state";
const DEFAULT_STORE_NAME = "documents";
const DEFAULT_DB_VERSION = 1;

export interface StateStorageDriver {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface IndexedDbDriverOptions {
  dbName?: string;
  storeName?: string;
  version?: number;
}

export interface PersistStateOptions<TState> {
  serialize?: (state: TState) => string;
  deserialize?: (serialized: string) => TState;
  debounceMs?: number;
}

type ResolveFn = () => void;
type RejectFn = (reason?: unknown) => void;

function getIndexedDb(): IDBFactory {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in the current environment");
  }

  return indexedDB;
}

function openDatabase(options: Required<IndexedDbDriverOptions>): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = getIndexedDb().open(options.dbName, options.version);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(options.storeName)) {
        database.createObjectStore(options.storeName);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });
}

async function withStore<TValue>(
  database: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<TValue>,
): Promise<TValue> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = action(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB operation failed"));
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  });
}

class IndexedDbStorageDriver implements StateStorageDriver {
  private readonly options: Required<IndexedDbDriverOptions>;
  private databasePromise: Promise<IDBDatabase> | null = null;

  constructor(options: IndexedDbDriverOptions = {}) {
    this.options = {
      dbName: options.dbName ?? DEFAULT_DB_NAME,
      storeName: options.storeName ?? DEFAULT_STORE_NAME,
      version: options.version ?? DEFAULT_DB_VERSION,
    };
  }

  async get(key: string): Promise<string | null> {
    const database = await this.getDatabase();
    const value = await withStore(database, this.options.storeName, "readonly", (store) =>
      store.get(key),
    );

    if (typeof value === "string") {
      return value;
    }

    return null;
  }

  async set(key: string, value: string): Promise<void> {
    const database = await this.getDatabase();
    await withStore(database, this.options.storeName, "readwrite", (store) =>
      store.put(value, key),
    );
  }

  async remove(key: string): Promise<void> {
    const database = await this.getDatabase();
    await withStore(database, this.options.storeName, "readwrite", (store) =>
      store.delete(key),
    );
  }

  async clear(): Promise<void> {
    const database = await this.getDatabase();
    await withStore(database, this.options.storeName, "readwrite", (store) =>
      store.clear(),
    );
  }

  private getDatabase(): Promise<IDBDatabase> {
    if (!this.databasePromise) {
      this.databasePromise = openDatabase(this.options);
    }

    return this.databasePromise;
  }
}

class InMemoryStorageDriver implements StateStorageDriver {
  private readonly values = new Map<string, string>();

  constructor(initialValues: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(initialValues)) {
      this.values.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.values.delete(key);
  }

  async clear(): Promise<void> {
    this.values.clear();
  }
}

export function createIndexedDbStorageDriver(
  options: IndexedDbDriverOptions = {},
): StateStorageDriver {
  return new IndexedDbStorageDriver(options);
}

export function createInMemoryStorageDriver(
  initialValues: Record<string, string> = {},
): StateStorageDriver {
  return new InMemoryStorageDriver(initialValues);
}

export function createAutoStorageDriver(
  options: IndexedDbDriverOptions = {},
): StateStorageDriver {
  if (typeof indexedDB !== "undefined") {
    return createIndexedDbStorageDriver(options);
  }

  return createInMemoryStorageDriver();
}

export async function saveState<TState>(
  driver: StateStorageDriver,
  key: string,
  state: TState,
  options: PersistStateOptions<TState> = {},
): Promise<void> {
  const serialize = options.serialize ?? JSON.stringify;
  await driver.set(key, serialize(state));
}

export async function loadState<TState>(
  driver: StateStorageDriver,
  key: string,
  options: PersistStateOptions<TState> = {},
): Promise<TState | null> {
  const deserialize = options.deserialize ?? ((value: string) => JSON.parse(value) as TState);
  const value = await driver.get(key);

  if (value === null) {
    return null;
  }

  return deserialize(value);
}

export function createDebouncedSaver<TState>(
  driver: StateStorageDriver,
  key: string,
  options: PersistStateOptions<TState> = {},
): {
  save: (state: TState) => Promise<void>;
  flush: () => Promise<void>;
  cancel: () => void;
} {
  const debounceMs = Math.max(0, options.debounceMs ?? 200);
  let timeoutRef: ReturnType<typeof setTimeout> | null = null;
  let nextState: TState | null = null;
  let pendingResolvers: ResolveFn[] = [];
  let pendingRejecters: RejectFn[] = [];

  const flush = async (): Promise<void> => {
    if (timeoutRef) {
      clearTimeout(timeoutRef);
      timeoutRef = null;
    }

    if (nextState === null) {
      return;
    }

    const stateToPersist = nextState;
    nextState = null;

    const resolvers = pendingResolvers;
    const rejecters = pendingRejecters;
    pendingResolvers = [];
    pendingRejecters = [];

    try {
      await saveState(driver, key, stateToPersist, options);
      for (const resolve of resolvers) {
        resolve();
      }
    } catch (error) {
      for (const reject of rejecters) {
        reject(error);
      }
      throw error;
    }
  };

  const save = async (state: TState): Promise<void> => {
    nextState = state;

    return new Promise((resolve, reject) => {
      pendingResolvers.push(resolve);
      pendingRejecters.push(reject);

      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }

      timeoutRef = setTimeout(() => {
        void flush().catch(() => {
          // Rejections are forwarded to pending save promises.
        });
      }, debounceMs);
    });
  };

  const cancel = (): void => {
    if (timeoutRef) {
      clearTimeout(timeoutRef);
      timeoutRef = null;
    }

    nextState = null;
    pendingResolvers = [];
    pendingRejecters = [];
  };

  return {
    save,
    flush,
    cancel,
  };
}
