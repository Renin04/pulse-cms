import { describe, expect, it } from 'vitest'

import {
  formatBranchGateAttr,
  getBlockBranchGate,
  parseBranchGateAttr,
  wrapHtmlWithBranchGate,
} from './branch-gate'
import { renderStudioBlocksHtml, type StudioBlock } from './blog-studio'
import { adaptEntryDetail } from './entry-adapter'
import type { EntryDetail } from './api-client'

const GATE = { branchesId: 'branches-np7771', branchId: 'role-writer' }
const NOW = '2026-01-01T00:00:00.000Z'

function makeTextBlock(id: string, text: string, meta?: unknown): StudioBlock {
  return {
    id,
    type: 'text',
    data: {
      text,
      marks: { bold: false, italic: false, underline: false, code: false },
      align: 'left',
    },
    ...(meta ? { meta: meta as StudioBlock['meta'] } : {}),
    createdAt: NOW,
    updatedAt: NOW,
  }
}

describe('getBlockBranchGate', () => {
  it('reads a well-formed gate from wrapper meta', () => {
    expect(getBlockBranchGate({ meta: { gate: GATE } })).toEqual(GATE)
  })

  it('returns null for ungated or malformed meta', () => {
    expect(getBlockBranchGate({})).toBeNull()
    expect(getBlockBranchGate({ meta: null })).toBeNull()
    expect(getBlockBranchGate({ meta: 'junk' })).toBeNull()
    expect(getBlockBranchGate({ meta: { gate: null } })).toBeNull()
    expect(getBlockBranchGate({ meta: { gate: { branchesId: 1, branchId: 'x' } } })).toBeNull()
    expect(getBlockBranchGate({ meta: { gate: { branchesId: 'x', branchId: '' } } })).toBeNull()
    expect(getBlockBranchGate({ meta: { gate: { branchId: 'x' } } })).toBeNull()
  })
})

describe('branch-gate attribute encoding', () => {
  it('round-trips through format/parse', () => {
    const attr = formatBranchGateAttr(GATE)
    expect(attr).toBe('branches-np7771:role-writer')
    expect(parseBranchGateAttr(attr)).toEqual(GATE)
  })

  it('splits on the first colon only (branchIds may contain colons)', () => {
    const gate = { branchesId: 'branches-abc', branchId: 'path:with:colons' }
    expect(parseBranchGateAttr(formatBranchGateAttr(gate))).toEqual(gate)
  })

  it('rejects malformed attribute values', () => {
    expect(parseBranchGateAttr('')).toBeNull()
    expect(parseBranchGateAttr('nocolon')).toBeNull()
    expect(parseBranchGateAttr(':branch')).toBeNull()
    expect(parseBranchGateAttr('branches-x:')).toBeNull()
  })
})

describe('wrapHtmlWithBranchGate', () => {
  it('wraps gated blocks in an open pulse-branch-gate div', () => {
    const html = wrapHtmlWithBranchGate({ meta: { gate: GATE } }, '<p>hello</p>')
    expect(html).toBe(
      '<div class="pulse-branch-gate" data-branch-gate="branches-np7771:role-writer" data-gate-state="open"><p>hello</p></div>',
    )
  })

  it('passes ungated blocks through untouched', () => {
    expect(wrapHtmlWithBranchGate({}, '<p>free</p>')).toBe('<p>free</p>')
    expect(wrapHtmlWithBranchGate({ meta: { other: true } }, '<p>free</p>')).toBe('<p>free</p>')
  })

  it('escapes attribute-hostile ids instead of breaking markup', () => {
    const html = wrapHtmlWithBranchGate(
      { meta: { gate: { branchesId: 'b" onclick="x', branchId: 'y' } } },
      '<p>x</p>',
    )
    // The raw quote must be entity-encoded so it cannot close the attribute;
    // the word itself stays as inert text.
    expect(html).not.toContain('b" onclick')
    expect(html).toContain('b&quot; onclick=&quot;x')
  })
})

describe('renderStudioBlocksHtml — gate wrapping', () => {
  it('wraps gated blocks and leaves ungated siblings bare, all content rendered', () => {
    const html = renderStudioBlocksHtml([
      makeTextBlock('b1', 'Visible to everyone'),
      makeTextBlock('b2', 'Writer-only section', { gate: GATE }),
    ])

    // SEO contract: gated content still ships in the HTML, wrapped and open.
    expect(html).toContain('Visible to everyone')
    expect(html).toContain('Writer-only section')
    expect(html).toContain(
      '<div class="pulse-branch-gate" data-branch-gate="branches-np7771:role-writer" data-gate-state="open">',
    )
    // Exactly one gate wrapper, around the gated block only.
    expect(html.match(/pulse-branch-gate/g)).toHaveLength(1)
    const gateIndex = html.indexOf('pulse-branch-gate')
    const gatedIndex = html.indexOf('Writer-only section')
    const freeIndex = html.indexOf('Visible to everyone')
    expect(freeIndex).toBeLessThan(gateIndex)
    expect(gateIndex).toBeLessThan(gatedIndex)
  })
})

describe('adaptEntryDetail — gate wrapping (public renderer)', () => {
  it('produces the same gate wrapper for the blog page', () => {
    const entry = {
      id: 'entry-1',
      contentTypeId: 'ct-1',
      title: 'Gated post',
      slug: 'gated-post',
      status: 'published',
      authorId: null,
      publishedAt: NOW,
      scheduledAt: null,
      createdAt: NOW,
      updatedAt: NOW,
      fieldValues: [],
      blocks: [makeTextBlock('b1', 'Before the gate'), makeTextBlock('b2', 'Educator-only refresher', { gate: { branchesId: 'branches-np7771', branchId: 'role-educator' } })],
      metadata: {},
    } as unknown as EntryDetail

    const adapted = adaptEntryDetail(entry)
    expect(adapted).not.toBeNull()
    expect(adapted?.html).toContain('Before the gate')
    expect(adapted?.html).toContain('Educator-only refresher')
    expect(adapted?.html).toContain(
      '<div class="pulse-branch-gate" data-branch-gate="branches-np7771:role-educator" data-gate-state="open">',
    )
  })
})
