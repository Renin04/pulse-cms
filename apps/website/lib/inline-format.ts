import { escapeHtml, formatReferenceNumber, renderInlineMarkdown, normalizeInlineHexColor } from '@pulse/blocks'
import type { ReferenceStyle } from '@pulse/blocks'

/* ─── Pulse inline formatting — shared editor utilities ────────────────────
 * Single source of truth for:
 *   1. markdownToHtml / htmlToMarkdown — the contentEditable <-> markdown
 *      bridge used by EVERY rich text field in the studio (block canvas,
 *      disclosure/rich-inline/math-caption fields, demo editor).
 *   2. Keyboard shortcuts for inline marks (bold / italic / underline /
 *      highlight / text color) — one matcher + one applier so behavior is
 *      identical on every surface and cannot drift.
 *   3. Textarea/input markdown wrapping for the prose fields that store raw
 *      markdown (callout, alert, spoiler, table cells).
 *
 * Syntax (parsed by the shared engine in @pulse/blocks — see inlineMarkdown.ts):
 *   **bold** · *italic* · __underline__ · `code`
 *   ==highlight== · ==#hex:highlight==
 *   {color:#hex}text{/color} · {color:}text{/color} (article/website default)
 *
 * Shortcuts (all surfaces; mod = Ctrl on Windows/Linux, Cmd on macOS):
 *   mod+B bold · mod+I italic · mod+U underline
 *   mod+Shift+M highlight toggle ("mark")
 *   mod+Shift+X text color cycle (default → palette → off)
 *   (mod+Shift+C is the comments panel, mod+Shift+H is the stepped-equation
 *   no-change toggle, mod+K is the link modal — deliberately avoided.)
 * ─────────────────────────────────────────────────────────────────────────── */

/* ─── Editor markdown <-> HTML bridge ─── */

function parseRefAttrs(attrs: string): { text?: string; style?: string; target?: string; rel?: string } {
  const result: { text?: string; style?: string; target?: string; rel?: string } = {}
  const textMatch = attrs.match(/text="([^"]*)"/)
  if (textMatch) result.text = textMatch[1]
  const styleMatch = attrs.match(/style="([^"]*)"/)
  if (styleMatch) result.style = styleMatch[1]
  const targetMatch = attrs.match(/target="([^"]*)"/)
  if (targetMatch) result.target = targetMatch[1]
  const relMatch = attrs.match(/rel="([^"]*)"/)
  if (relMatch) result.rel = relMatch[1]
  return result
}

/**
 * Markdown -> editor HTML. Links/refs become data-attribute spans (edited via
 * the Link/Ref modals) and every inline element is followed by a zero-width
 * space so the caret never gets stuck inside a mark/link while typing
 * (htmlToMarkdown strips the ZWSP again, so round-trips are stable).
 */
export function markdownToHtml(text: string): string {
  let refCounter = 0
  return renderInlineMarkdown(text, {
    inlineSuffix: '\u200B',
    renderLink: (labelHtml, url, attrs) => {
      const relMatch = attrs.match(/rel="([^"]*)"/)
      const rel = relMatch ? relMatch[1] : ''
      const targetMatch = attrs.match(/target="([^"]*)"/)
      const target = targetMatch ? targetMatch[1] : ''
      return `<span class="pulse-editor-link" data-url="${escapeHtml(url)}" data-rel="${escapeHtml(rel)}" data-type="link"${target ? ` data-target="${escapeHtml(target)}"` : ''}>${labelHtml}</span>\u200B`
    },
    renderRef: (url, attrs) => {
      refCounter++
      const { text: refText, style, target, rel: refRel } = parseRefAttrs(attrs)
      const num = formatReferenceNumber(refCounter, (style || 'numeric') as ReferenceStyle)
      return `<span class="pulse-editor-ref pulse-reference-editor" data-url="${escapeHtml(url)}" data-text="${escapeHtml(refText || '')}" data-style="${escapeHtml(style || 'numeric')}"${target ? ` data-target="${escapeHtml(target)}"` : ''}${refRel ? ` data-rel="${escapeHtml(refRel)}"` : ''}>${num}</span>\u200B`
    },
  })
}

/** Wraps serialized children in delimiters, skipping empty content so delimiters never pile up. */
function wrapDelimited(inner: string, open: string, close: string = open): string {
  if (!inner.trim()) return inner
  return `${open}${inner}${close}`
}

function readInlineColor(el: HTMLElement, property: '--mark-color' | '--text-color'): string | undefined {
  const raw = el.style?.getPropertyValue(property) ?? ''
  return normalizeInlineHexColor(raw)
}

function serializeInlineChildren(el: HTMLElement): string {
  let result = ''
  el.childNodes.forEach((node) => {
    result += serializeInlineNode(node)
  })
  return result
}

function serializeInlineNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || ''
  if (node.nodeType !== Node.ELEMENT_NODE) return ''
  const el = node as HTMLElement
  const tag = el.tagName

  if (tag === 'BR') return '\n'
  if (tag === 'CODE') return `\`${el.textContent || ''}\``
  if (tag === 'STRONG' || tag === 'B') return wrapDelimited(serializeInlineChildren(el), '**')
  if (tag === 'EM' || tag === 'I') return wrapDelimited(serializeInlineChildren(el), '*')
  if (tag === 'U') return wrapDelimited(serializeInlineChildren(el), '__')

  if (tag === 'MARK' && el.classList.contains('pulse-mark')) {
    const color = readInlineColor(el, '--mark-color')
    return wrapDelimited(serializeInlineChildren(el), color ? `==${color}:` : '==', '==')
  }

  if (tag === 'SPAN' && el.classList.contains('pulse-colored')) {
    const color = readInlineColor(el, '--text-color')
    return wrapDelimited(serializeInlineChildren(el), `{color:${color ?? ''}}`, '{/color}')
  }

  if (tag === 'SPAN' && el.classList.contains('pulse-editor-ref')) {
    const url = el.getAttribute('data-url') || ''
    const text = el.getAttribute('data-text') || ''
    const style = el.getAttribute('data-style') || ''
    const target = el.getAttribute('data-target') || ''
    const rel = el.getAttribute('data-rel') || ''
    const parts: string[] = []
    if (text) parts.push(`text="${text}"`)
    if (style && style !== 'numeric') parts.push(`style="${style}"`)
    if (target) parts.push(`target="${target}"`)
    if (rel) parts.push(`rel="${rel}"`)
    const attrs = parts.length > 0 ? `{${parts.join(' ')}}` : ''
    return `[ref](${url})${attrs}`
  }

  if (tag === 'SPAN' && el.classList.contains('pulse-editor-link')) {
    const url = el.getAttribute('data-url') || ''
    const text = serializeInlineChildren(el)
    const rel = el.getAttribute('data-rel') || ''
    const target = el.getAttribute('data-target') || ''
    const parts: string[] = []
    if (rel) parts.push(`rel="${rel}"`)
    if (target) parts.push(`target="${target}"`)
    const attrs = parts.length > 0 ? `{${parts.join(' ')}}` : ''
    return `[${text}](${url})${attrs}`
  }

  return serializeInlineChildren(el)
}

/**
 * Editor HTML -> markdown. Recursive so nested marks compose
 * (<strong>bold <mark>hl</mark></strong> -> **bold ==hl==**); zero-width
 * spaces (the typing affordance added by markdownToHtml) are stripped.
 */
export function htmlToMarkdown(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return serializeInlineChildren(div).replace(/\u200B/g, '')
}

/* ─── Shortcut matching ─── */

export type InlineFormatAction = 'bold' | 'italic' | 'underline' | 'highlight' | 'color'

export const INLINE_FORMAT_SHORTCUTS: ReadonlyArray<{ action: InlineFormatAction; combo: string; label: string }> = [
  { action: 'bold', combo: 'mod+b', label: 'Bold' },
  { action: 'italic', combo: 'mod+i', label: 'Italic' },
  { action: 'underline', combo: 'mod+u', label: 'Underline' },
  { action: 'highlight', combo: 'mod+shift+m', label: 'Highlight' },
  { action: 'color', combo: 'mod+shift+x', label: 'Text color' },
]

/** Minimal keyboard-event shape so the matcher stays pure/testable. */
export interface InlineFormatKeyEvent {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
  preventDefault(): void
}

export function matchInlineFormatShortcut(e: Pick<InlineFormatKeyEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>): InlineFormatAction | null {
  const mod = e.ctrlKey || e.metaKey
  if (!mod || e.altKey) return null
  const key = e.key.toLowerCase()
  if (!e.shiftKey) {
    if (key === 'b') return 'bold'
    if (key === 'i') return 'italic'
    if (key === 'u') return 'underline'
    return null
  }
  if (key === 'm') return 'highlight'
  if (key === 'x') return 'color'
  return null
}

/* ─── contentEditable formatting (visual fields) ─── */

function findInlineAncestor(node: Node | null, predicate: (el: HTMLElement) => boolean): HTMLElement | null {
  let el: HTMLElement | null =
    node && node.nodeType === Node.TEXT_NODE ? (node as Text).parentElement : (node as HTMLElement | null)
  while (el) {
    if (predicate(el)) return el
    if (el.isContentEditable) break
    el = el.parentElement
  }
  return null
}

function unwrapInlineElement(el: HTMLElement): void {
  const parent = el.parentNode
  if (!parent) return
  while (el.firstChild) parent.insertBefore(el.firstChild, el)
  parent.removeChild(el)
  if (parent instanceof HTMLElement) parent.normalize()
}

function wrapSelectionIn(el: HTMLElement): boolean {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return false
  const range = selection.getRangeAt(0)
  const fragment = range.extractContents()
  if (!fragment.textContent || !fragment.textContent.trim()) {
    range.insertNode(fragment)
    return false
  }
  el.appendChild(fragment)
  range.insertNode(el)
  const after = document.createRange()
  after.setStartAfter(el)
  after.collapse(true)
  selection.removeAllRanges()
  selection.addRange(after)
  return true
}

function toggleHighlightMark(): boolean {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false
  const existing = findInlineAncestor(
    selection.anchorNode,
    (el) => el.tagName === 'MARK' && el.classList.contains('pulse-mark'),
  )
  if (existing) {
    unwrapInlineElement(existing)
    return true
  }
  const mark = document.createElement('mark')
  mark.className = 'pulse-mark'
  return wrapSelectionIn(mark)
}

/**
 * Text-color palette. '' is the article/website default (rendered through the
 * CSS variable chain); every explicit entry keeps ≥4.5:1 contrast against the
 * light article background for body-text sizes.
 */
export const INLINE_TEXT_COLOR_PALETTE = [
  '#c41e00',
  '#9a3412',
  '#166534',
  '#0f766e',
  '#1d4ed8',
  '#373737',
] as const

const INLINE_TEXT_COLOR_CYCLE: readonly string[] = ['', ...INLINE_TEXT_COLOR_PALETTE]

/**
 * Next step in the color cycle. `current` is the span's --text-color ('' when
 * the span uses the default). Returns null when the cycle wraps around,
 * meaning the colored span should be removed entirely.
 */
export function nextTextColor(current: string | null): string | null {
  if (current === null) return INLINE_TEXT_COLOR_CYCLE[0]
  const index = INLINE_TEXT_COLOR_CYCLE.findIndex((c) => c === current.toLowerCase())
  if (index === -1) return INLINE_TEXT_COLOR_CYCLE[0]
  if (index === INLINE_TEXT_COLOR_CYCLE.length - 1) return null
  return INLINE_TEXT_COLOR_CYCLE[index + 1]
}

function cycleTextColor(): boolean {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false
  const existing = findInlineAncestor(
    selection.anchorNode,
    (el) => el.tagName === 'SPAN' && el.classList.contains('pulse-colored'),
  )
  if (existing) {
    const current = normalizeInlineHexColor(existing.style.getPropertyValue('--text-color')) ?? ''
    const next = nextTextColor(current)
    if (next === null) {
      unwrapInlineElement(existing)
    } else if (next === '') {
      existing.style.removeProperty('--text-color')
    } else {
      existing.style.setProperty('--text-color', next)
    }
    return true
  }
  const span = document.createElement('span')
  span.className = 'pulse-colored'
  const first = nextTextColor(null)
  if (first) span.style.setProperty('--text-color', first)
  return wrapSelectionIn(span)
}

/**
 * Applies an inline format to the live selection of the focused
 * contentEditable field. Bold/italic/underline go through execCommand (the
 * native path produces <b>/<i>/<u>, which htmlToMarkdown serializes back to
 * ** / * / __); highlight and text color use explicit pulse-mark /
 * pulse-colored elements so the markdown round-trip stays exact.
 */
export function applyInlineFormat(action: InlineFormatAction): boolean {
  if (action === 'bold') return document.execCommand('bold')
  if (action === 'italic') return document.execCommand('italic')
  if (action === 'underline') return document.execCommand('underline')
  if (action === 'highlight') return toggleHighlightMark()
  return cycleTextColor()
}

/**
 * Shared keydown glue for contentEditable rich fields. Returns true when the
 * keystroke was an inline-format shortcut (caller must not handle it further);
 * `onFormatted` fires after the DOM changed so the field can commit.
 */
export function handleInlineFormatKeydown(
  e: InlineFormatKeyEvent,
  opts?: { onFormatted?: () => void },
): boolean {
  const action = matchInlineFormatShortcut(e)
  if (!action) return false
  e.preventDefault()
  if (applyInlineFormat(action)) opts?.onFormatted?.()
  return true
}

/* ─── Textarea / plain-input formatting (raw markdown fields) ─── */

const WRAP_DELIMITERS: Record<InlineFormatAction, { open: string; close: string }> = {
  bold: { open: '**', close: '**' },
  italic: { open: '*', close: '*' },
  underline: { open: '__', close: '__' },
  highlight: { open: '==', close: '==' },
  color: { open: '{color:}', close: '{/color}' },
}

function unwrapRangeDelimiters(
  before: string,
  after: string,
  action: InlineFormatAction,
): { before: string; after: string } | null {
  if (action === 'highlight') {
    const openMatch = before.match(/==(?:#[0-9a-fA-F]{3,8}:)?$/)
    if (openMatch && after.startsWith('==')) {
      return { before: before.slice(0, before.length - openMatch[0].length), after: after.slice(2) }
    }
    return null
  }
  if (action === 'color') {
    const openMatch = before.match(/\{color:(?:#[0-9a-fA-F]{3,8})?\}$/)
    if (openMatch && after.startsWith('{/color}')) {
      return { before: before.slice(0, before.length - openMatch[0].length), after: after.slice('{/color}'.length) }
    }
    return null
  }
  if (action === 'bold') {
    if (!before.endsWith('**') || before.endsWith('***') || !after.startsWith('**') || after.startsWith('***')) return null
    return { before: before.slice(0, -2), after: after.slice(2) }
  }
  if (action === 'italic') {
    if (!before.endsWith('*') || before.endsWith('**') || !after.startsWith('*') || after.startsWith('**')) return null
    return { before: before.slice(0, -1), after: after.slice(1) }
  }
  // underline
  if (!before.endsWith('__') || before.endsWith('___') || !after.startsWith('__') || after.startsWith('___')) return null
  return { before: before.slice(0, -2), after: after.slice(2) }
}

/**
 * Pure markdown wrap/unwrap over a [start, end) selection — the textarea
 * counterpart of applyInlineFormat. Toggles off when the selection is already
 * wrapped; otherwise wraps (an empty selection gets the delimiter pair with
 * the caret placed inside, ready to type).
 */
export function wrapMarkdownRange(
  text: string,
  start: number,
  end: number,
  action: InlineFormatAction,
): { text: string; start: number; end: number } {
  const before = text.slice(0, start)
  const after = text.slice(end)
  const unwrapped = unwrapRangeDelimiters(before, after, action)
  if (unwrapped) {
    const removedOpen = before.length - unwrapped.before.length
    return {
      text: unwrapped.before + text.slice(start, end) + unwrapped.after,
      start: start - removedOpen,
      end: end - removedOpen,
    }
  }
  const { open, close } = WRAP_DELIMITERS[action]
  const inner = text.slice(start, end)
  return {
    text: before + open + inner + close + after,
    start: start + open.length,
    end: end + open.length,
  }
}

/** Applies an inline format to a raw-markdown input/textarea, preserving focus + caret. */
export function applyInlineFormatToInput(
  el: HTMLInputElement | HTMLTextAreaElement,
  action: InlineFormatAction,
  commit: (next: string) => void,
): void {
  const value = el.value
  const start = el.selectionStart ?? value.length
  const end = el.selectionEnd ?? value.length
  const result = wrapMarkdownRange(value, start, end, action)
  commit(result.text)
  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(result.start, result.end)
  })
}

/** Shared keydown glue for raw-markdown inputs/textareas. */
export function handleInputInlineFormatKeydown(
  e: InlineFormatKeyEvent,
  el: HTMLInputElement | HTMLTextAreaElement,
  commit: (next: string) => void,
): boolean {
  const action = matchInlineFormatShortcut(e)
  if (!action) return false
  e.preventDefault()
  applyInlineFormatToInput(el, action, commit)
  return true
}

/* ─── Highlight palette (article defaults popover) ─── */

/** Light tints; body text (#373737, ~10.9:1 on white) stays ≥4.5:1 on each. */
export const INLINE_HIGHLIGHT_PALETTE = [
  '#ffe695',
  '#fde68a',
  '#fecaca',
  '#bbf7d0',
  '#bae6fd',
  '#e5e7eb',
] as const
