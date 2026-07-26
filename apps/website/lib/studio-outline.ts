import type { Block, BlockData } from '@pulse/core'

/* ─── Types ─── */

export type CollapsibleSubMode = 'simple' | 'verbose'

/**
 * User-controlled metadata for a single block, kept OUTSIDE the block data
 * (block zod schemas are strict) and persisted per article in localStorage.
 * Absent fields mean "fall back to the computed default".
 */
export interface OutlineBlockMeta {
  name?: string
  description?: string
  collapsed?: boolean
}

export interface OutlineStore {
  version: 1
  collapsibleMode: boolean
  collapsibleSubMode: CollapsibleSubMode
  blocks: Record<string, OutlineBlockMeta>
}

export interface OutlineDisplayMaps {
  labels: Record<string, string>
  descriptions: Record<string, string>
}

export interface ResolvedOutlineEntry {
  blockId: string
  name: string
  description: string
  collapsed: boolean
  hasCustomName: boolean
  hasCustomDescription: boolean
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/* ─── Storage ─── */

export const OUTLINE_STORAGE_PREFIX = 'pulse-outline-'

export function outlineStorageKey(entryId: string): string {
  return `${OUTLINE_STORAGE_PREFIX}${entryId}`
}

export function createEmptyOutlineStore(): OutlineStore {
  return { version: 1, collapsibleMode: false, collapsibleSubMode: 'simple', blocks: {} }
}

function defaultStorage(): StorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

/**
 * Loads the per-article outline store. Defensive: any malformed payload
 * (or legacy shape) falls back to an empty store instead of throwing.
 */
export function loadOutlineStore(entryId: string, storage?: StorageLike | null): OutlineStore {
  const store = createEmptyOutlineStore()
  const target = storage === undefined ? defaultStorage() : storage
  if (!target) return store
  try {
    const raw = target.getItem(outlineStorageKey(entryId))
    if (!raw) return store
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return store
    const obj = parsed as Record<string, unknown>
    store.collapsibleMode = obj.collapsibleMode === true
    store.collapsibleSubMode = obj.collapsibleSubMode === 'verbose' ? 'verbose' : 'simple'
    if (typeof obj.blocks === 'object' && obj.blocks !== null) {
      for (const [blockId, metaRaw] of Object.entries(obj.blocks as Record<string, unknown>)) {
        if (typeof metaRaw !== 'object' || metaRaw === null) continue
        const m = metaRaw as Record<string, unknown>
        const meta: OutlineBlockMeta = {}
        if (typeof m.name === 'string' && m.name.trim()) meta.name = m.name
        if (typeof m.description === 'string' && m.description.trim()) meta.description = m.description
        if (m.collapsed === true) meta.collapsed = true
        if (Object.keys(meta).length > 0) store.blocks[blockId] = meta
      }
    }
    return store
  } catch {
    return store
  }
}

export function saveOutlineStore(entryId: string, outline: OutlineStore, storage?: StorageLike | null): void {
  const target = storage === undefined ? defaultStorage() : storage
  if (!target) return
  target.setItem(outlineStorageKey(entryId), JSON.stringify(outline))
}

/* ─── Text extraction & summaries ─── */

/**
 * Ordered list of block-data fields that best represent a block's content.
 * The first non-empty string wins.
 */
const PRIMARY_TEXT_KEYS = [
  'text',
  'question',
  'quote',
  'body',
  'message',
  'title',
  'label',
  'caption',
  'description',
  'name',
  'alt',
  'code',
  'url',
] as const

const PRIMARY_ARRAY_KEYS = ['items', 'columns'] as const

export function getBlockPrimaryText(block: Block<BlockData>): string {
  const data = block.data as Record<string, unknown>
  for (const key of PRIMARY_TEXT_KEYS) {
    const value = data[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  for (const key of PRIMARY_ARRAY_KEYS) {
    const value = data[key]
    if (Array.isArray(value)) {
      const joined = value.filter((item): item is string => typeof item === 'string').join(' ')
      if (joined.trim()) return joined
    }
  }
  return ''
}

/** Strips the markdown inline syntax the studio editor produces (links, refs, emphasis, code ticks, ==marks==, {color:} spans). */
export function stripMarkdown(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)(\{[^}]*\})?/g, '$1')
    .replace(/\{color:#[0-9a-fA-F]{3,8}\}|\{color:\}|\{\/color\}/g, '')
    .replace(/==#[0-9a-fA-F]{3,8}:/g, '')
    .replace(/[*_~`=]+/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const slice = text.slice(0, maxLength)
  const lastSpace = slice.lastIndexOf(' ')
  const cut = lastSpace > maxLength * 0.5 ? slice.slice(0, lastSpace) : slice
  return `${cut.trimEnd()}…`
}

export const OUTLINE_SUMMARY_LENGTH = 60

export function summarizeBlock(block: Block<BlockData>, maxLength: number = OUTLINE_SUMMARY_LENGTH): string {
  const raw = getBlockPrimaryText(block)
  if (!raw) return ''
  return truncateAtWord(stripMarkdown(raw), maxLength)
}

/* ─── Defaults & resolution ─── */

export function defaultBlockName(block: Block<BlockData>, maps: OutlineDisplayMaps): string {
  return maps.labels[block.type] ?? block.type
}

export function defaultBlockDescription(block: Block<BlockData>, maps: OutlineDisplayMaps): string {
  return summarizeBlock(block) || maps.descriptions[block.type] || ''
}

export function resolveOutlineEntry(
  store: OutlineStore,
  block: Block<BlockData>,
  maps: OutlineDisplayMaps,
): ResolvedOutlineEntry {
  const meta = store.blocks[block.id]
  return {
    blockId: block.id,
    name: meta?.name ?? defaultBlockName(block, maps),
    description: meta?.description ?? defaultBlockDescription(block, maps),
    collapsed: meta?.collapsed === true,
    hasCustomName: typeof meta?.name === 'string',
    hasCustomDescription: typeof meta?.description === 'string',
  }
}

/* ─── Store updates (immutable) ─── */

/**
 * Patches one block's meta. Empty strings clear the override (reverting to
 * the computed default); blocks with no overrides left are removed from the map.
 */
export function setBlockMeta(store: OutlineStore, blockId: string, patch: OutlineBlockMeta): OutlineStore {
  const current = store.blocks[blockId] ?? {}
  const next: OutlineBlockMeta = { ...current }
  if (patch.name !== undefined) {
    const value = patch.name.trim()
    if (value) next.name = value
    else delete next.name
  }
  if (patch.description !== undefined) {
    const value = patch.description.trim()
    if (value) next.description = value
    else delete next.description
  }
  if (patch.collapsed !== undefined) {
    if (patch.collapsed) next.collapsed = true
    else delete next.collapsed
  }
  const blocks = { ...store.blocks }
  if (Object.keys(next).length > 0) blocks[blockId] = next
  else delete blocks[blockId]
  return { ...store, blocks }
}

export function setAllCollapsed(store: OutlineStore, blockIds: string[], collapsed: boolean): OutlineStore {
  let next = store
  for (const id of blockIds) {
    next = setBlockMeta(next, id, { collapsed })
  }
  return next
}

/** Drops meta for blocks that no longer exist. Returns the same object when nothing changed. */
export function pruneOutlineStore(store: OutlineStore, validBlockIds: string[]): OutlineStore {
  const valid = new Set(validBlockIds)
  const stale = Object.keys(store.blocks).filter((id) => !valid.has(id))
  if (stale.length === 0) return store
  const blocks = { ...store.blocks }
  for (const id of stale) delete blocks[id]
  return { ...store, blocks }
}

export function countCollapsed(store: OutlineStore): number {
  return Object.values(store.blocks).filter((m) => m.collapsed === true).length
}
