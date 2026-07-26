import {
  BRANCH_CHOICE_EVENT,
  parseBranchGateAttr,
  type BranchChoiceEventDetail,
} from './branch-gate';

/**
 * Hydrates `.pulse-branch-gate` wrappers (SSR markup from
 * wrapHtmlWithBranchGate) so a branch choice reshapes the rest of the
 * article: when the reader picks a path in a `.pulse-branches` block, every
 * gate bound to that branchesId collapses unless it belongs to the chosen
 * path; "Switch path" re-opens all of them.
 *
 * The contract travels on a `pulse:branch-choice` CustomEvent dispatched on
 * `document` by hydrate-branches.ts (choose / backToPicker / persisted
 * restore). All gate variants ship in the initial HTML — collapsing is a
 * client-side layer over fully crawlable content, never cloaking.
 *
 * Collapse/reveal is the grid-rows 1fr → 0fr pattern (same technique as
 * .pulse-collapse-grid) plus a fade, 240ms ease-out, then `hidden` so closed
 * gates leave both the layout and the accessibility tree. Restored choices
 * (instant: true) and prefers-reduced-motion skip the animation entirely.
 *
 * The listener is registered on `document` and gates are re-queried per
 * event, so gates rendered after hydration (studio preview re-renders) still
 * respond. Returns a cleanup that removes the listener and cancels any
 * pending close timers.
 */

/** Keep in sync with the globals.css transition durations. */
const GATE_ANIMATION_MS = 240;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function hydrateBranchGates(container: Element): () => void {
  const pendingTimers = new Map<HTMLElement, number>();

  function cancelPending(gate: HTMLElement) {
    const timer = pendingTimers.get(gate);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      pendingTimers.delete(gate);
    }
  }

  function closeGate(gate: HTMLElement, instant: boolean) {
    cancelPending(gate);
    if (instant) {
      delete gate.dataset.gateAnimating;
      gate.dataset.gateState = 'closed';
      gate.hidden = true;
      return;
    }
    if (gate.dataset.gateState === 'closed' && gate.hidden) return;
    gate.dataset.gateAnimating = 'true';
    gate.dataset.gateState = 'closed';
    // The transition is CSS-driven; `hidden` lands only after it completes so
    // the collapse is visible instead of an instant display:none.
    pendingTimers.set(
      gate,
      window.setTimeout(() => {
        pendingTimers.delete(gate);
        if (gate.dataset.gateState === 'closed') {
          gate.hidden = true;
          delete gate.dataset.gateAnimating;
        }
      }, GATE_ANIMATION_MS + 20),
    );
  }

  function openGate(gate: HTMLElement, instant: boolean) {
    cancelPending(gate);
    if (instant) {
      delete gate.dataset.gateAnimating;
      gate.hidden = false;
      gate.dataset.gateState = 'open';
      return;
    }
    if (!gate.hidden && gate.dataset.gateState === 'open') return;
    const wasHidden = gate.hidden;
    gate.dataset.gateAnimating = 'true';
    gate.hidden = false;
    if (wasHidden) {
      // Force reflow between un-hiding (still 0fr) and flipping to open so
      // the browser actually runs the 0fr → 1fr transition.
      void gate.offsetHeight;
    }
    gate.dataset.gateState = 'open';
    pendingTimers.set(
      gate,
      window.setTimeout(() => {
        pendingTimers.delete(gate);
        delete gate.dataset.gateAnimating;
      }, GATE_ANIMATION_MS + 20),
    );
  }

  function applyChoice(branchesId: string, branchId: string | null, state: 'chosen' | 'picker', instant: boolean) {
    container
      .querySelectorAll<HTMLElement>('.pulse-branch-gate[data-branch-gate]')
      .forEach((gate) => {
        const parsed = parseBranchGateAttr(gate.dataset.branchGate ?? '');
        if (!parsed || parsed.branchesId !== branchesId) return;
        if (state === 'chosen' && parsed.branchId !== branchId) {
          closeGate(gate, instant);
        } else {
          openGate(gate, instant);
        }
      });
  }

  function handleBranchChoice(event: Event) {
    const detail = (event as CustomEvent<BranchChoiceEventDetail>).detail;
    if (!detail || typeof detail.branchesId !== 'string') return;
    if (detail.state !== 'chosen' && detail.state !== 'picker') return;
    const instant = detail.instant === true || prefersReducedMotion();
    applyChoice(detail.branchesId, detail.branchId, detail.state, instant);
  }

  document.addEventListener(BRANCH_CHOICE_EVENT, handleBranchChoice);

  // Initial sync: if a branches block already shows a restored choice (e.g.
  // hydrate-branches ran first), mirror it instantly — no animation, no
  // dependence on hydration order. With no restored choice every gate keeps
  // its SSR default: open.
  container
    .querySelectorAll<HTMLElement>('.pulse-branches[data-branches-id][data-state="chosen"]')
    .forEach((section) => {
      const branchesId = section.dataset.branchesId;
      const activePanel = section.querySelector<HTMLElement>(
        '.pulse-branches__panel[data-active="true"]',
      );
      const branchId = activePanel?.dataset.branchPanel;
      if (!branchesId || !branchId) return;
      applyChoice(branchesId, branchId, 'chosen', true);
    });

  return () => {
    document.removeEventListener(BRANCH_CHOICE_EVENT, handleBranchChoice);
    pendingTimers.forEach((timer) => window.clearTimeout(timer));
    pendingTimers.clear();
  };
}
