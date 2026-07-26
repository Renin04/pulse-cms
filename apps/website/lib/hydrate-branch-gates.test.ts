// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BRANCH_CHOICE_EVENT, type BranchChoiceEventDetail } from './branch-gate'
import { hydrateBranchGates } from './hydrate-branch-gates'

const BRANCHES_ID = 'branches-np7771'

function fireChoice(detail: BranchChoiceEventDetail) {
  document.dispatchEvent(new CustomEvent(BRANCH_CHOICE_EVENT, { detail }))
}

/**
 * SSR-shaped fixture: one branches block (picker state) plus three gates —
 * writer/educator bound to it, and one gate bound to an unrelated branches
 * block that must never react.
 */
function buildFixture(): HTMLElement {
  const container = document.createElement('div')
  container.innerHTML = `
    <section class="pulse-branches" data-branches-id="${BRANCHES_ID}" data-state="picker">
      <details class="pulse-branches__panel" data-branch-panel="role-writer"></details>
      <details class="pulse-branches__panel" data-branch-panel="role-educator"></details>
    </section>
    <div class="pulse-branch-gate" data-branch-gate="${BRANCHES_ID}:role-writer" data-gate-state="open"><h3>Writer</h3></div>
    <div class="pulse-branch-gate" data-branch-gate="${BRANCHES_ID}:role-educator" data-gate-state="open"><h3>Educator</h3></div>
    <div class="pulse-branch-gate" data-branch-gate="branches-other:role-writer" data-gate-state="open"><h3>Other</h3></div>
  `
  document.body.appendChild(container)
  return container
}

function gates(container: Element) {
  const list = Array.from(
    container.querySelectorAll<HTMLElement>('.pulse-branch-gate'),
  )
  return {
    writer: list[0],
    educator: list[1],
    other: list[2],
  }
}

describe('hydrateBranchGates', () => {
  let container: HTMLElement
  let cleanup: () => void

  beforeEach(() => {
    document.body.innerHTML = ''
    container = buildFixture()
    cleanup = hydrateBranchGates(container)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('collapses losing gates and keeps the chosen one on a chosen event (instant)', () => {
    fireChoice({ branchesId: BRANCHES_ID, branchId: 'role-writer', state: 'chosen', instant: true })
    const { writer, educator, other } = gates(container)

    expect(writer.dataset.gateState).toBe('open')
    expect(writer.hidden).toBe(false)
    expect(educator.dataset.gateState).toBe('closed')
    expect(educator.hidden).toBe(true)
    // Gates bound to another branches block are untouched.
    expect(other.dataset.gateState).toBe('open')
    expect(other.hidden).toBe(false)
  })

  it('re-opens every gate for that branchesId on a picker event', () => {
    fireChoice({ branchesId: BRANCHES_ID, branchId: 'role-educator', state: 'chosen', instant: true })
    fireChoice({ branchesId: BRANCHES_ID, branchId: null, state: 'picker', instant: true })
    const { writer, educator, other } = gates(container)

    expect(writer.dataset.gateState).toBe('open')
    expect(writer.hidden).toBe(false)
    expect(educator.dataset.gateState).toBe('open')
    expect(educator.hidden).toBe(false)
    expect(other.dataset.gateState).toBe('open')
  })

  it('animates non-instant closes: state flips immediately, hidden lands after the transition', () => {
    vi.useFakeTimers()
    try {
      fireChoice({ branchesId: BRANCHES_ID, branchId: 'role-writer', state: 'chosen' })
      const { educator } = gates(container)

      expect(educator.dataset.gateState).toBe('closed')
      expect(educator.dataset.gateAnimating).toBe('true')
      expect(educator.hidden).toBe(false)

      vi.advanceTimersByTime(300)
      expect(educator.hidden).toBe(true)
      expect(educator.dataset.gateAnimating).toBeUndefined()
    } finally {
      vi.useRealTimers()
    }
  })

  it('cancels a pending close when the gate re-opens mid-transition', () => {
    vi.useFakeTimers()
    try {
      fireChoice({ branchesId: BRANCHES_ID, branchId: 'role-writer', state: 'chosen' })
      fireChoice({ branchesId: BRANCHES_ID, branchId: null, state: 'picker' })
      vi.advanceTimersByTime(300)
      const { educator } = gates(container)
      expect(educator.dataset.gateState).toBe('open')
      expect(educator.hidden).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('mirrors an already-restored branches choice on hydrate (order-independent, instant)', () => {
    // Simulate hydrate-branches having run first: chosen state + active panel.
    const section = container.querySelector<HTMLElement>('.pulse-branches')!
    section.dataset.state = 'chosen'
    section
      .querySelector('.pulse-branches__panel[data-branch-panel="role-educator"]')
      ?.setAttribute('data-active', 'true')

    cleanup()
    cleanup = hydrateBranchGates(container)

    const { writer, educator } = gates(container)
    expect(educator.dataset.gateState).toBe('open')
    expect(educator.hidden).toBe(false)
    expect(writer.dataset.gateState).toBe('closed')
    expect(writer.hidden).toBe(true)
  })

  it('skips animation entirely for reduced-motion readers', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          addEventListener() {},
          removeEventListener() {},
        }) as unknown as MediaQueryList,
    )

    fireChoice({ branchesId: BRANCHES_ID, branchId: 'role-writer', state: 'chosen' })
    const { educator } = gates(container)
    expect(educator.dataset.gateState).toBe('closed')
    expect(educator.hidden).toBe(true)
    expect(educator.dataset.gateAnimating).toBeUndefined()
  })

  it('ignores malformed events', () => {
    document.dispatchEvent(new CustomEvent(BRANCH_CHOICE_EVENT, { detail: null }))
    document.dispatchEvent(new CustomEvent(BRANCH_CHOICE_EVENT, { detail: { state: 'chosen' } }))
    const { writer, educator, other } = gates(container)
    for (const gate of [writer, educator, other]) {
      expect(gate.dataset.gateState).toBe('open')
      expect(gate.hidden).toBe(false)
    }
  })

  it('stops reacting after cleanup', () => {
    cleanup()
    fireChoice({ branchesId: BRANCHES_ID, branchId: 'role-writer', state: 'chosen', instant: true })
    const { educator } = gates(container)
    expect(educator.dataset.gateState).toBe('open')
    expect(educator.hidden).toBe(false)
    // Rebind for afterEach symmetry.
    cleanup = () => {}
  })
})
