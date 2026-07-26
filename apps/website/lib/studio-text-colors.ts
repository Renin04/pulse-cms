import { normalizeInlineHexColor } from '@pulse/blocks'

/* ─── Per-article text color defaults ──────────────────────────────────────
 * Article-level defaults for the inline ==highlight== and {color:}…{/color}
 * marks (features #3/#4). Kept OUTSIDE block data (block zod schemas are
 * strict) and persisted per article in localStorage — same side-map pattern
 * as studio-outline.ts. Absent fields mean "fall back to the website token"
 * (--pulse-mark-color / --pulse-text-color in globals.css).
 *
 * The rendered marks read CSS variables, so changing these defaults re-themes
 * every default-colored mark in the article without touching stored markdown:
 *   .pulse-mark     → var(--mark-color, var(--pulse-article-mark-color, …))
 *   .pulse-colored  → var(--text-color, var(--pulse-article-text-color, …))
 * ─────────────────────────────────────────────────────────────────────────── */

export interface TextColorsStore {
  version: 1
  /** Default ==highlight== background (hex). */
  highlightColor?: string
  /** Default {color:}…{/color} text color (hex). */
  textColor?: string
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export const TEXT_COLORS_STORAGE_PREFIX = 'pulse-text-colors-'

/** CSS custom properties set on the article/preview container. */
export const ARTICLE_MARK_COLOR_VAR = '--pulse-article-mark-color'
export const ARTICLE_TEXT_COLOR_VAR = '--pulse-article-text-color'

export function textColorsStorageKey(entryId: string): string {
  return `${TEXT_COLORS_STORAGE_PREFIX}${entryId}`
}

export function createEmptyTextColorsStore(): TextColorsStore {
  return { version: 1 }
}

function defaultStorage(): StorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

/**
 * Loads the per-article text color store. Defensive: any malformed payload
 * (or invalid hex values) falls back to an empty store instead of throwing.
 */
export function loadTextColorsStore(entryId: string, storage?: StorageLike | null): TextColorsStore {
  const store = createEmptyTextColorsStore()
  const target = storage === undefined ? defaultStorage() : storage
  if (!target) return store
  try {
    const raw = target.getItem(textColorsStorageKey(entryId))
    if (!raw) return store
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return store
    const obj = parsed as Record<string, unknown>
    const highlightColor = normalizeInlineHexColor(typeof obj.highlightColor === 'string' ? obj.highlightColor : undefined)
    const textColor = normalizeInlineHexColor(typeof obj.textColor === 'string' ? obj.textColor : undefined)
    if (highlightColor) store.highlightColor = highlightColor
    if (textColor) store.textColor = textColor
    return store
  } catch {
    return store
  }
}

export function saveTextColorsStore(entryId: string, store: TextColorsStore, storage?: StorageLike | null): void {
  const target = storage === undefined ? defaultStorage() : storage
  if (!target) return
  target.setItem(textColorsStorageKey(entryId), JSON.stringify(store))
}

/**
 * Patches the defaults (immutable). Empty/undefined values clear the override,
 * reverting that mark to the website-level token default.
 */
export function setTextColors(
  store: TextColorsStore,
  patch: { highlightColor?: string; textColor?: string },
): TextColorsStore {
  const next: TextColorsStore = { ...store }
  if (patch.highlightColor !== undefined) {
    const value = normalizeInlineHexColor(patch.highlightColor)
    if (value) next.highlightColor = value
    else delete next.highlightColor
  }
  if (patch.textColor !== undefined) {
    const value = normalizeInlineHexColor(patch.textColor)
    if (value) next.textColor = value
    else delete next.textColor
  }
  return next
}

/**
 * Resolves the store to the CSS variables applied on rendered containers
 * (.studio-rendered article, studio canvas column). Empty store → no vars.
 */
export function textColorsToCssVars(store: TextColorsStore): Record<string, string> {
  const vars: Record<string, string> = {}
  if (store.highlightColor) vars[ARTICLE_MARK_COLOR_VAR] = store.highlightColor
  if (store.textColor) vars[ARTICLE_TEXT_COLOR_VAR] = store.textColor
  return vars
}
