import type { BlockMeta } from '@pulse/core'

/**
 * Branch gates — the wrapper-level companion to the branches block.
 *
 * A block may carry `meta: { gate: { branchesId, branchId } }` (outside its
 * zod-validated `data`, so block schemas stay untouched). Server renderers
 * (entry-adapter.ts, blog-studio.ts) wrap every gated block's HTML in
 * `.pulse-branch-gate` so ALL branch content ships in the initial HTML —
 * everything stays crawlable, no cloaking. Client-side,
 * hydrate-branch-gates.ts listens for `pulse:branch-choice` (dispatched by
 * hydrate-branches.ts) and collapses the gates whose branchId did not win.
 *
 * This module is the shared contract: the meta shape, the SSR wrapper, the
 * data-attribute encoding, and the event name/detail live here exactly once.
 */

export interface BranchGate {
  /** Stable data-branches-id of the gate-keeper branches block. */
  branchesId: string
  /** The branch path this block belongs to. */
  branchId: string
}

/** CustomEvent name fired on `document` whenever a branch choice changes. */
export const BRANCH_CHOICE_EVENT = 'pulse:branch-choice'

export interface BranchChoiceEventDetail {
  /** data-branches-id of the branches block whose state changed. */
  branchesId: string
  /** The chosen path id, or null when the reader went back to the picker. */
  branchId: string | null
  /** 'chosen' after a pick, 'picker' after "Switch path". */
  state: 'chosen' | 'picker'
  /** True when the final state must apply with no animation (persisted restore on load). */
  instant?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Reads a validated branch gate off a block's wrapper meta. Returns null for
 * ungated blocks and for malformed gates (both ids must be non-empty
 * strings), so junk meta can never produce broken markup.
 */
export function getBlockBranchGate(block: { meta?: unknown }): BranchGate | null {
  const meta = block.meta as BlockMeta | undefined
  if (!isRecord(meta)) return null
  const gate = meta.gate
  if (!isRecord(gate)) return null
  const { branchesId, branchId } = gate
  if (
    typeof branchesId !== 'string' ||
    branchesId.length === 0 ||
    typeof branchId !== 'string' ||
    branchId.length === 0
  ) {
    return null
  }
  return { branchesId, branchId }
}

/**
 * Encodes a gate as the `data-branch-gate` attribute value:
 * "<branchesId>:<branchId>". branchId may itself contain colons, so parsing
 * splits on the FIRST colon only.
 */
export function formatBranchGateAttr(gate: BranchGate): string {
  return `${gate.branchesId}:${gate.branchId}`
}

/** Inverse of formatBranchGateAttr; null on malformed input. */
export function parseBranchGateAttr(value: string): BranchGate | null {
  const separator = value.indexOf(':')
  if (separator <= 0 || separator === value.length - 1) return null
  return {
    branchesId: value.slice(0, separator),
    branchId: value.slice(separator + 1),
  }
}

/**
 * Wraps one rendered block in its branch gate. Ungated blocks pass through
 * unchanged. Gates render `data-gate-state="open"` — the SEO/no-JS default
 * is "everything visible"; only hydration collapses losing branches.
 */
export function wrapHtmlWithBranchGate(block: { meta?: unknown }, html: string): string {
  const gate = getBlockBranchGate(block)
  if (!gate) return html
  return (
    `<div class="pulse-branch-gate" data-branch-gate="${escapeHtmlAttr(formatBranchGateAttr(gate))}" data-gate-state="open">` +
    html +
    `</div>`
  )
}
