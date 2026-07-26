/* ─── Studio block multi-select — pure selection math (bug #157) ───
   Kept free of React/DOM so the canvas chrome can share it with tests.
   All functions treat `orderedIds` as the block ids in document order
   and never mutate their inputs. */

/**
 * Inclusive range between `anchorId` and `targetId`, returned in document
 * order regardless of click direction. Falls back to the target alone when
 * the anchor is unknown (e.g. shift-click before any block was activated),
 * and to an empty list when the target itself is not in the document.
 */
export function rangeSelection(orderedIds: readonly string[], anchorId: string | null, targetId: string): string[] {
  const targetIndex = orderedIds.indexOf(targetId);
  if (targetIndex === -1) return [];
  const anchorIndex = anchorId ? orderedIds.indexOf(anchorId) : -1;
  if (anchorIndex === -1) return [targetId];
  const from = Math.min(anchorIndex, targetIndex);
  const to = Math.max(anchorIndex, targetIndex);
  return orderedIds.slice(from, to + 1);
}

/** Toggles `id` in the selection, preserving the existing order. */
export function toggleSelection(selectedIds: readonly string[], id: string): string[] {
  return selectedIds.includes(id)
    ? selectedIds.filter((existing) => existing !== id)
    : [...selectedIds, id];
}

/**
 * Drops selected ids that no longer exist in the document (e.g. after a
 * deletion or an undo). Returns the SAME array reference when nothing
 * changed so React state updates can bail out.
 */
export function pruneSelection(selectedIds: readonly string[], existingIds: readonly string[]): string[] {
  const existing = new Set(existingIds);
  const next = selectedIds.filter((id) => existing.has(id));
  return next.length === selectedIds.length ? [...selectedIds] : next;
}

/** Orders a selection set back into document order for index-safe bulk ops. */
export function orderSelection(orderedIds: readonly string[], selectedIds: ReadonlySet<string>): string[] {
  return orderedIds.filter((id) => selectedIds.has(id));
}
