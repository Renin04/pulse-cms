import { describe, expect, it } from 'vitest'
import type { Block, BlockData } from '@pulse/core'
import {
  countCollapsed,
  createEmptyOutlineStore,
  defaultBlockDescription,
  defaultBlockName,
  getBlockPrimaryText,
  loadOutlineStore,
  outlineStorageKey,
  pruneOutlineStore,
  resolveOutlineEntry,
  saveOutlineStore,
  setAllCollapsed,
  setBlockMeta,
  stripMarkdown,
  summarizeBlock,
  truncateAtWord,
  type OutlineDisplayMaps,
  type OutlineStore,
} from './studio-outline'

function createStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem(key: string) {
      return store.get(key) ?? null
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

function makeBlock(id: string, type: string, data: Record<string, unknown>): Block<BlockData> {
  const now = new Date().toISOString()
  return { id, type, data, createdAt: now, updatedAt: now }
}

const MAPS: OutlineDisplayMaps = {
  labels: { text: 'Paragraph', heading: 'Heading', quiz: 'Quiz' },
  descriptions: { text: 'Plain text with formatting', heading: 'Section heading in 6 levels' },
}

describe('stripMarkdown', () => {
  it('removes inline links but keeps their text', () => {
    expect(stripMarkdown('Read the [Pulse docs](https://example.com) now')).toBe('Read the Pulse docs now')
  })

  it('removes reference links with attribute blocks', () => {
    expect(stripMarkdown('See [ref](https://x.com){text="1" style="numeric"} here')).toBe('See ref here')
  })

  it('removes emphasis and code ticks', () => {
    expect(stripMarkdown('**bold** _italic_ `code` ~~strike~~')).toBe('bold italic code strike')
  })

  it('removes highlight and color span syntax', () => {
    expect(stripMarkdown('==marked== and ==#ff0080:custom==')).toBe('marked and custom')
    expect(stripMarkdown('{color:#166534}green{/color} and {color:}default{/color}')).toBe('green and default')
  })

  it('collapses whitespace and trims', () => {
    expect(stripMarkdown('  hello\n\n   world  ')).toBe('hello world')
  })
})

describe('truncateAtWord', () => {
  it('returns the text unchanged when short enough', () => {
    expect(truncateAtWord('short text', 60)).toBe('short text')
  })

  it('truncates at a word boundary with an ellipsis', () => {
    const long = 'word '.repeat(30).trim()
    const out = truncateAtWord(long, 60)
    expect(out.endsWith('…')).toBe(true)
    expect(out.length).toBeLessThanOrEqual(61)
    expect(out.slice(0, -1).endsWith(' ')).toBe(false)
  })
})

describe('getBlockPrimaryText', () => {
  it('prefers the text field', () => {
    expect(getBlockPrimaryText(makeBlock('b1', 'text', { text: 'Hello world' }))).toBe('Hello world')
  })

  it('reads quiz questions', () => {
    expect(getBlockPrimaryText(makeBlock('b2', 'quiz', { question: 'What is Pulse?' }))).toBe('What is Pulse?')
  })

  it('joins list items', () => {
    expect(getBlockPrimaryText(makeBlock('b3', 'list', { items: ['one', 'two', 3] }))).toBe('one two')
  })

  it('returns empty string when there is no text content', () => {
    expect(getBlockPrimaryText(makeBlock('b4', 'horizontal-rule', {}))).toBe('')
  })
})

describe('summarizeBlock', () => {
  it('strips markdown and truncates to 60 chars', () => {
    const text = `**${'lorem ipsum '.repeat(12)}**`
    const out = summarizeBlock(makeBlock('b1', 'text', { text }))
    expect(out.length).toBeLessThanOrEqual(61)
    expect(out).not.toContain('*')
    expect(out.endsWith('…')).toBe(true)
  })

  it('returns empty string for contentless blocks', () => {
    expect(summarizeBlock(makeBlock('b1', 'horizontal-rule', {}))).toBe('')
  })
})

describe('defaults & resolveOutlineEntry', () => {
  it('defaults the name to the block type label', () => {
    const block = makeBlock('b1', 'text', { text: 'hello' })
    expect(defaultBlockName(block, MAPS)).toBe('Paragraph')
    expect(defaultBlockName(makeBlock('b2', 'mystery', {}), MAPS)).toBe('mystery')
  })

  it('defaults the description to the auto summary, falling back to the static description', () => {
    expect(defaultBlockDescription(makeBlock('b1', 'text', { text: 'Some real content' }), MAPS)).toBe('Some real content')
    expect(defaultBlockDescription(makeBlock('b2', 'text', { text: '' }), MAPS)).toBe('Plain text with formatting')
  })

  it('resolves custom overrides over defaults', () => {
    const block = makeBlock('b1', 'heading', { text: 'Intro', level: 1 })
    const store = setBlockMeta(createEmptyOutlineStore(), 'b1', { name: 'Opening', description: 'Kicks things off' })
    const resolved = resolveOutlineEntry(store, block, MAPS)
    expect(resolved).toMatchObject({
      blockId: 'b1',
      name: 'Opening',
      description: 'Kicks things off',
      collapsed: false,
      hasCustomName: true,
      hasCustomDescription: true,
    })
  })
})

describe('setBlockMeta', () => {
  it('sets and clears overrides immutably', () => {
    const empty = createEmptyOutlineStore()
    const named = setBlockMeta(empty, 'b1', { name: 'Custom' })
    expect(named.blocks.b1?.name).toBe('Custom')
    expect(empty.blocks.b1).toBeUndefined()

    const cleared = setBlockMeta(named, 'b1', { name: '' })
    expect(cleared.blocks.b1).toBeUndefined()
  })

  it('keeps other fields when patching one field', () => {
    let store = setBlockMeta(createEmptyOutlineStore(), 'b1', { name: 'Keep me' })
    store = setBlockMeta(store, 'b1', { collapsed: true })
    expect(store.blocks.b1).toEqual({ name: 'Keep me', collapsed: true })

    store = setBlockMeta(store, 'b1', { collapsed: false })
    expect(store.blocks.b1).toEqual({ name: 'Keep me' })
  })
})

describe('setAllCollapsed / countCollapsed / pruneOutlineStore', () => {
  it('collapses and expands every listed block', () => {
    let store = createEmptyOutlineStore()
    store = setAllCollapsed(store, ['a', 'b', 'c'], true)
    expect(countCollapsed(store)).toBe(3)

    store = setAllCollapsed(store, ['a', 'b', 'c'], false)
    expect(countCollapsed(store)).toBe(0)
    expect(Object.keys(store.blocks)).toHaveLength(0)
  })

  it('drops meta for blocks that no longer exist', () => {
    let store = setBlockMeta(createEmptyOutlineStore(), 'gone', { name: 'Stale' })
    store = setBlockMeta(store, 'kept', { name: 'Fresh' })
    const pruned = pruneOutlineStore(store, ['kept'])
    expect(Object.keys(pruned.blocks)).toEqual(['kept'])
  })

  it('returns the same object when there is nothing to prune', () => {
    const store = setBlockMeta(createEmptyOutlineStore(), 'kept', { name: 'Fresh' })
    expect(pruneOutlineStore(store, ['kept'])).toBe(store)
  })
})

describe('storage round-trip', () => {
  it('persists and reloads the store per entry id', () => {
    const storage = createStorage()
    let store = createEmptyOutlineStore()
    store = { ...store, collapsibleMode: true, collapsibleSubMode: 'verbose' }
    store = setBlockMeta(store, 'b1', { name: 'Named', description: 'Described', collapsed: true })

    saveOutlineStore('entry-1', store, storage)
    const loaded = loadOutlineStore('entry-1', storage)

    expect(loaded.collapsibleMode).toBe(true)
    expect(loaded.collapsibleSubMode).toBe('verbose')
    expect(loaded.blocks.b1).toEqual({ name: 'Named', description: 'Described', collapsed: true })
  })

  it('isolates entries by id', () => {
    const storage = createStorage()
    saveOutlineStore('entry-1', setBlockMeta(createEmptyOutlineStore(), 'b1', { name: 'A' }), storage)
    expect(loadOutlineStore('entry-2', storage).blocks).toEqual({})
  })

  it('falls back to an empty store on malformed payloads', () => {
    const storage = createStorage({ [outlineStorageKey('bad')]: '{not json' })
    expect(loadOutlineStore('bad', storage)).toEqual(createEmptyOutlineStore())

    const wrongShape = createStorage({ [outlineStorageKey('bad2')]: JSON.stringify(['array']) })
    expect(loadOutlineStore('bad2', wrongShape)).toEqual(createEmptyOutlineStore())
  })

  it('drops invalid block entries and coerces the sub-mode', () => {
    const storage = createStorage({
      [outlineStorageKey('e')]: JSON.stringify({
        collapsibleMode: 1,
        collapsibleSubMode: 'weird',
        blocks: {
          ok: { name: 'Fine', description: 42, collapsed: 'yes' },
          nope: 'garbage',
          empty: { name: '   ' },
        },
      }),
    })
    const loaded = loadOutlineStore('e', storage)
    expect(loaded.collapsibleMode).toBe(false)
    expect(loaded.collapsibleSubMode).toBe('simple')
    expect(loaded.blocks).toEqual({ ok: { name: 'Fine' } })
  })

  it('returns an empty store without storage', () => {
    const store: OutlineStore = loadOutlineStore('anything', null)
    expect(store).toEqual(createEmptyOutlineStore())
  })
})
