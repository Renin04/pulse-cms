export interface Bookmark {
  id: string;
  label: string;
  blockId: string;
  createdAt: string;
  updatedAt: string;
  scrollProgress: number;
  notes?: string;
}

export interface BookmarkInput {
  id?: string;
  label: string;
  blockId: string;
  scrollProgress: number;
  notes?: string;
  timestamp?: string;
}

export interface BookmarkUpdate {
  label?: string;
  blockId?: string;
  scrollProgress?: number;
  notes?: string;
  timestamp?: string;
}

export interface BookmarkRestoreTarget {
  blockId: string;
  scrollProgress: number;
  anchor: string;
}

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  if (progress < 0) return 0;
  if (progress > 1) return 1;
  return Number(progress.toFixed(4));
}

function normalizeTimestamp(value: string | undefined): string {
  if (value && value.trim().length > 0) {
    return value;
  }
  return new Date().toISOString();
}

function sanitizeLabel(label: string): string {
  const normalized = label.replace(/\s+/g, " ").trim();
  return normalized || "Bookmark";
}

function sanitizeId(value: string | undefined): string {
  if (value && value.trim().length > 0) {
    return value.trim();
  }

  return `bm_${Math.random().toString(36).slice(2, 10)}`;
}

export function createBookmark(input: BookmarkInput): Bookmark {
  const timestamp = normalizeTimestamp(input.timestamp);

  return {
    id: sanitizeId(input.id),
    label: sanitizeLabel(input.label),
    blockId: input.blockId,
    createdAt: timestamp,
    updatedAt: timestamp,
    scrollProgress: clampProgress(input.scrollProgress),
    notes: input.notes,
  };
}

export function updateBookmark(
  bookmark: Bookmark,
  patch: BookmarkUpdate,
): Bookmark {
  const updatedAt = normalizeTimestamp(patch.timestamp);

  return {
    ...bookmark,
    label:
      patch.label !== undefined
        ? sanitizeLabel(patch.label)
        : bookmark.label,
    blockId: patch.blockId ?? bookmark.blockId,
    scrollProgress:
      patch.scrollProgress !== undefined
        ? clampProgress(patch.scrollProgress)
        : bookmark.scrollProgress,
    notes: patch.notes !== undefined ? patch.notes : bookmark.notes,
    updatedAt,
  };
}

export function sortBookmarks(bookmarks: Bookmark[]): Bookmark[] {
  return [...bookmarks].sort((left, right) => {
    if (left.updatedAt === right.updatedAt) {
      return left.id.localeCompare(right.id);
    }
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export function restoreBookmark(bookmark: Bookmark): BookmarkRestoreTarget {
  return {
    blockId: bookmark.blockId,
    scrollProgress: clampProgress(bookmark.scrollProgress),
    anchor: `#${bookmark.blockId}`,
  };
}

export function serializeBookmarks(bookmarks: Bookmark[]): string {
  return JSON.stringify(sortBookmarks(bookmarks));
}

export function deserializeBookmarks(serialized: string): Bookmark[] {
  if (!serialized.trim()) return [];

  const parsed = JSON.parse(serialized) as unknown;
  if (!Array.isArray(parsed)) return [];

  const bookmarks: Bookmark[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;

    const record = item as Record<string, unknown>;
    if (
      typeof record["id"] !== "string" ||
      typeof record["label"] !== "string" ||
      typeof record["blockId"] !== "string" ||
      typeof record["createdAt"] !== "string" ||
      typeof record["updatedAt"] !== "string" ||
      typeof record["scrollProgress"] !== "number"
    ) {
      continue;
    }

    bookmarks.push({
      id: record["id"],
      label: sanitizeLabel(record["label"]),
      blockId: record["blockId"],
      createdAt: record["createdAt"],
      updatedAt: record["updatedAt"],
      scrollProgress: clampProgress(record["scrollProgress"]),
      notes: typeof record["notes"] === "string" ? record["notes"] : undefined,
    });
  }

  return sortBookmarks(bookmarks);
}

export class BookmarkStore {
  private readonly bookmarks = new Map<string, Bookmark>();

  add(input: BookmarkInput): Bookmark {
    const bookmark = createBookmark(input);
    this.bookmarks.set(bookmark.id, bookmark);
    return bookmark;
  }

  update(id: string, patch: BookmarkUpdate): Bookmark | null {
    const current = this.bookmarks.get(id);
    if (!current) return null;

    const next = updateBookmark(current, patch);
    this.bookmarks.set(id, next);
    return next;
  }

  remove(id: string): boolean {
    return this.bookmarks.delete(id);
  }

  get(id: string): Bookmark | null {
    return this.bookmarks.get(id) ?? null;
  }

  list(): Bookmark[] {
    return sortBookmarks(Array.from(this.bookmarks.values()));
  }

  clear(): void {
    this.bookmarks.clear();
  }

  export(): string {
    return serializeBookmarks(this.list());
  }

  import(serialized: string): Bookmark[] {
    const parsed = deserializeBookmarks(serialized);
    this.bookmarks.clear();

    for (const bookmark of parsed) {
      this.bookmarks.set(bookmark.id, bookmark);
    }

    return this.list();
  }
}
