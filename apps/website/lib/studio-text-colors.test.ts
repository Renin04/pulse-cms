import { describe, expect, it } from 'vitest'

import {
  ARTICLE_MARK_COLOR_VAR,
  ARTICLE_TEXT_COLOR_VAR,
  createEmptyTextColorsStore,
  loadTextColorsStore,
  saveTextColorsStore,
  setTextColors,
  textColorsStorageKey,
  textColorsToCssVars,
} from './studio-text-colors'

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

describe('studio-text-colors store', () => {
  it('persists per-article defaults through the side-map key pattern', () => {
    const storage = createStorage()
    saveTextColorsStore('entry-1', { version: 1, highlightColor: '#fecaca', textColor: '#166534' }, storage)

    expect(storage.getItem(textColorsStorageKey('entry-1'))).toBeTruthy()
    expect(loadTextColorsStore('entry-1', storage)).toEqual({
      version: 1,
      highlightColor: '#fecaca',
      textColor: '#166534',
    })
    // a different article gets its own empty store
    expect(loadTextColorsStore('entry-2', storage)).toEqual(createEmptyTextColorsStore())
  })

  it('falls back to an empty store on malformed or legacy payloads', () => {
    expect(loadTextColorsStore('x', createStorage({ [textColorsStorageKey('x')]: 'not json' }))).toEqual(
      createEmptyTextColorsStore(),
    )
    expect(loadTextColorsStore('x', createStorage({ [textColorsStorageKey('x')]: '42' }))).toEqual(
      createEmptyTextColorsStore(),
    )
    // invalid hex values are dropped, not trusted
    expect(
      loadTextColorsStore('x', createStorage({
        [textColorsStorageKey('x')]: JSON.stringify({ version: 1, highlightColor: 'red', textColor: '#12345' }),
      })),
    ).toEqual(createEmptyTextColorsStore())
  })

  it('normalizes hex casing on load', () => {
    const storage = createStorage({
      [textColorsStorageKey('x')]: JSON.stringify({ version: 1, highlightColor: '#FECACA' }),
    })
    expect(loadTextColorsStore('x', storage).highlightColor).toBe('#fecaca')
  })

  it('sets and clears overrides immutably', () => {
    const empty = createEmptyTextColorsStore()
    const withHighlight = setTextColors(empty, { highlightColor: '#BAE6FD' })
    expect(withHighlight.highlightColor).toBe('#bae6fd')
    expect(empty.highlightColor).toBeUndefined()

    const cleared = setTextColors(withHighlight, { highlightColor: '' })
    expect(cleared.highlightColor).toBeUndefined()

    // invalid values never make it into the store
    expect(setTextColors(empty, { textColor: 'javascript:alert(1)' }).textColor).toBeUndefined()
  })

  it('resolves CSS variables only for set defaults (website tokens cover the rest)', () => {
    expect(textColorsToCssVars(createEmptyTextColorsStore())).toEqual({})
    expect(textColorsToCssVars({ version: 1, highlightColor: '#fecaca' })).toEqual({
      [ARTICLE_MARK_COLOR_VAR]: '#fecaca',
    })
    expect(textColorsToCssVars({ version: 1, highlightColor: '#fecaca', textColor: '#166534' })).toEqual({
      [ARTICLE_MARK_COLOR_VAR]: '#fecaca',
      [ARTICLE_TEXT_COLOR_VAR]: '#166534',
    })
  })

  it('returns an empty store when storage is unavailable', () => {
    expect(loadTextColorsStore('x', null)).toEqual(createEmptyTextColorsStore())
  })
})
