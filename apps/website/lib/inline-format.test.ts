// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'

import {
  applyInlineFormat,
  handleInlineFormatKeydown,
  htmlToMarkdown,
  markdownToHtml,
  matchInlineFormatShortcut,
  nextTextColor,
  wrapMarkdownRange,
  INLINE_TEXT_COLOR_PALETTE,
} from './inline-format'

function keyEvent(init: { key: string; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean }) {
  return {
    key: init.key,
    ctrlKey: init.ctrlKey ?? false,
    metaKey: init.metaKey ?? false,
    shiftKey: init.shiftKey ?? false,
    altKey: init.altKey ?? false,
  }
}

describe('matchInlineFormatShortcut', () => {
  it('matches bold/italic/underline with ctrl or meta, no shift/alt', () => {
    expect(matchInlineFormatShortcut(keyEvent({ key: 'b', ctrlKey: true }))).toBe('bold')
    expect(matchInlineFormatShortcut(keyEvent({ key: 'I', metaKey: true }))).toBe('italic')
    expect(matchInlineFormatShortcut(keyEvent({ key: 'u', ctrlKey: true }))).toBe('underline')
  })

  it('matches highlight (mod+shift+m) and color (mod+shift+x)', () => {
    expect(matchInlineFormatShortcut(keyEvent({ key: 'M', ctrlKey: true, shiftKey: true }))).toBe('highlight')
    expect(matchInlineFormatShortcut(keyEvent({ key: 'x', metaKey: true, shiftKey: true }))).toBe('color')
  })

  it('ignores taken combos and non-mod keys', () => {
    expect(matchInlineFormatShortcut(keyEvent({ key: 'c', ctrlKey: true, shiftKey: true }))).toBeNull()
    expect(matchInlineFormatShortcut(keyEvent({ key: 'h', ctrlKey: true, shiftKey: true }))).toBeNull()
    expect(matchInlineFormatShortcut(keyEvent({ key: 'k', ctrlKey: true }))).toBeNull()
    expect(matchInlineFormatShortcut(keyEvent({ key: 'b' }))).toBeNull()
    expect(matchInlineFormatShortcut(keyEvent({ key: 'b', ctrlKey: true, shiftKey: true }))).toBeNull()
    expect(matchInlineFormatShortcut(keyEvent({ key: 'm', ctrlKey: true, altKey: true, shiftKey: true }))).toBeNull()
  })
})

describe('nextTextColor', () => {
  it('starts at the article/website default (empty style)', () => {
    expect(nextTextColor(null)).toBe('')
  })

  it('walks the palette and wraps to null (remove color) at the end', () => {
    expect(nextTextColor('')).toBe(INLINE_TEXT_COLOR_PALETTE[0])
    expect(nextTextColor(INLINE_TEXT_COLOR_PALETTE[0])).toBe(INLINE_TEXT_COLOR_PALETTE[1])
    expect(nextTextColor(INLINE_TEXT_COLOR_PALETTE[INLINE_TEXT_COLOR_PALETTE.length - 1])).toBeNull()
  })

  it('restarts from the default for unknown custom colors', () => {
    expect(nextTextColor('#123abc')).toBe('')
  })
})

describe('wrapMarkdownRange', () => {
  it('wraps the selection with delimiters and selects the inner content', () => {
    expect(wrapMarkdownRange('hello world', 6, 11, 'bold')).toEqual({
      text: 'hello **world**',
      start: 8,
      end: 13,
    })
    expect(wrapMarkdownRange('a b', 2, 3, 'highlight')).toEqual({
      text: 'a ==b==',
      start: 4,
      end: 5,
    })
    expect(wrapMarkdownRange('a b', 0, 1, 'color')).toEqual({
      text: '{color:}a{/color} b',
      start: 8,
      end: 9,
    })
  })

  it('unwraps an already-wrapped selection (toggle)', () => {
    expect(wrapMarkdownRange('hello **world**', 8, 13, 'bold')).toEqual({
      text: 'hello world',
      start: 6,
      end: 11,
    })
    expect(wrapMarkdownRange('a ==#ff0080:b==', 12, 13, 'highlight')).toEqual({
      text: 'a b',
      start: 2,
      end: 3,
    })
    expect(wrapMarkdownRange('{color:#166534}x{/color}', 15, 16, 'color')).toEqual({
      text: 'x',
      start: 0,
      end: 1,
    })
  })

  it('does not unwrap italic across bold delimiters', () => {
    const result = wrapMarkdownRange('**bold**', 2, 6, 'italic')
    expect(result.text).toBe('***bold***')
  })

  it('places the caret inside the delimiters on an empty selection', () => {
    expect(wrapMarkdownRange('ab', 1, 1, 'underline')).toEqual({
      text: 'a____b',
      start: 3,
      end: 3,
    })
  })
})

describe('markdownToHtml / htmlToMarkdown round-trip', () => {
  it('renders highlights with a zero-width-space typing guard', () => {
    const html = markdownToHtml('a ==b== c')
    expect(html).toContain('<mark class="pulse-mark">b</mark>')
    expect(html).toContain('​')
  })

  it('renders custom highlight + colored spans', () => {
    expect(markdownToHtml('==#ff0080:x==')).toContain('--mark-color:#ff0080')
    expect(markdownToHtml('{color:#166534}y{/color}')).toContain('--text-color:#166534')
  })

  it.each([
    'plain [link](https://example.com) and `code`',
    '**bold** *italic* __underline__',
    '==highlight== and ==#ff0080:custom==',
    '{color:#166534}green{/color} and {color:}default{/color}',
    '**bold ==highlight {color:#111}nested{/color}==**',
    '[==marked link==](https://example.com){rel="nofollow"}',
    '==spanning [a link](https://example.com) across==',
    'cite [ref](https://example.com/a){text="Source" style="alphabetic"}',
    '2 * 3 * 4 and == unpaired',
  ])('round-trips: %s', (markdown) => {
    expect(htmlToMarkdown(markdownToHtml(markdown))).toBe(markdown)
  })

  it('serializes native execCommand elements back to markdown', () => {
    expect(htmlToMarkdown('<b>bold</b> <i>italic</i> <u>under</u>')).toBe('**bold** *italic* __under__')
    expect(htmlToMarkdown('<strong>bold <mark class="pulse-mark">hl</mark></strong>')).toBe('**bold ==hl==**')
  })

  it('reads mark/color from rendered blog HTML too', () => {
    expect(htmlToMarkdown('<mark class="pulse-mark" style="--mark-color:#ff0080">x</mark>')).toBe('==#ff0080:x==')
    expect(htmlToMarkdown('<span class="pulse-colored" style="--text-color:#166534">y</span>')).toBe('{color:#166534}y{/color}')
  })

  it('keeps editor link/ref spans intact through the serializer', () => {
    const html = markdownToHtml('[x](https://a.b){rel="nofollow" target="_blank"} [ref](https://c.d){text="T" style="greek"}')
    const markdown = htmlToMarkdown(html)
    expect(markdown).toBe('[x](https://a.b){rel="nofollow" target="_blank"} [ref](https://c.d){text="T" style="greek"}')
  })

  it('drops empty emphasis instead of piling up delimiters', () => {
    expect(htmlToMarkdown('<strong></strong>')).toBe('')
  })
})

describe('handleInlineFormatKeydown', () => {
  it('prevents default and formats on shortcut keys only', () => {
    const prevented: string[] = []
    const e = {
      ...keyEvent({ key: 'm', ctrlKey: true, shiftKey: true }),
      preventDefault() {
        prevented.push('yes')
      },
    }
    // happy-dom has no editing host; applyInlineFormat returns false without a
    // selection, but the keystroke must still be claimed + prevented.
    const handled = handleInlineFormatKeydown(e, {})
    expect(handled).toBe(true)
    expect(prevented).toHaveLength(1)

    const plain = { ...keyEvent({ key: 'm' }), preventDefault() { throw new Error('must not run') } }
    expect(handleInlineFormatKeydown(plain, {})).toBe(false)
  })
})

describe('applyInlineFormat', () => {
  it('returns false for highlight/color without a selection', () => {
    expect(applyInlineFormat('highlight')).toBe(false)
    expect(applyInlineFormat('color')).toBe(false)
  })
})
