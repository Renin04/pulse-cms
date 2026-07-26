/**
 * Hydrates all `.pulse-branches` blocks inside a container:
 * - reveals the "choose your path" picker (SSR ships it inert/hidden; the
 *   native <details> panels are the no-JS/SEO fallback)
 * - choosing an option collapses the picker and reveals that branch's panel
 *   with a slim "You chose: X · Switch path" indicator
 * - the choice persists per-reader in localStorage (keyed by the block's
 *   deterministic data-branches-id) and is re-applied on the next visit
 * - ArrowUp/ArrowDown move between options; everything is a real button
 * - every state change is broadcast as a `pulse:branch-choice` CustomEvent
 *   on `document` (detail: { branchesId, branchId | null, state, instant? })
 *   so branch-gated blocks elsewhere on the page (hydrate-branch-gates.ts)
 *   can collapse/reveal in sync. Choose → state 'chosen'; Switch path →
 *   state 'picker' with branchId null; a persisted choice restored on load
 *   fires 'chosen' with instant: true (no gate animation).
 *
 * Selection choreography is CSS-driven off data attributes this module sets:
 * the clicked option gets data-selected="true" (lift, red keyline, traveling
 * marker) while the other options dim/settle on a stagger and the picker
 * condenses; on switch-back the taken option degrades to data-visited="true"
 * (a quiet check chip) as the picker re-expands. Reduced-motion users get
 * instant swaps via the globals.css reduced-motion block.
 *
 * SSR renders deterministically with NO branch pre-selected; this module only
 * layers interactivity (and the saved choice) on top of that markup.
 *
 * Pass { persist: false } for author-facing previews (studio editor) so
 * preview clicks never touch reader storage.
 */

import { BRANCH_CHOICE_EVENT, type BranchChoiceEventDetail } from './branch-gate';

const STORAGE_KEY = 'pulse-branch-choice';

/** Broadcasts a branches state change for branch gates (and future listeners). */
function dispatchBranchChoice(detail: BranchChoiceEventDetail) {
  document.dispatchEvent(new CustomEvent(BRANCH_CHOICE_EVENT, { detail }));
}

export interface HydrateBranchesOptions {
  persist?: boolean;
}

function loadSavedChoice(branchesId: string): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, string>;
    const choice = data[branchesId];
    return typeof choice === 'string' && choice.length > 0 ? choice : null;
  } catch {
    return null;
  }
}

function saveChoice(branchesId: string, branchId: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    data[branchesId] = branchId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage unavailable (private mode etc.) — choice just won't persist */ }
}

export function hydrateBranches(container: Element, options?: HydrateBranchesOptions): () => void {
  const persist = options?.persist !== false;
  const listeners: Array<{ element: EventTarget; type: string; handler: EventListener }> = [];
  const hydratedSections: HTMLElement[] = [];

  function addListener(element: EventTarget, type: string, handler: EventListener) {
    element.addEventListener(type, handler);
    listeners.push({ element, type, handler });
  }

  container.querySelectorAll<HTMLElement>('.pulse-branches[data-branches-id]').forEach((section) => {
    if (section.dataset.branchesHydrated === 'true') return;
    section.dataset.branchesHydrated = 'true';
    hydratedSections.push(section);

    const rawBranchesId = section.dataset.branchesId;
    if (!rawBranchesId) return;
    const branchesId: string = rawBranchesId;

    const picker = section.querySelector<HTMLElement>('.pulse-branches__picker');
    const optionButtons = Array.from(section.querySelectorAll<HTMLButtonElement>('.pulse-branches__option'));
    const panels = Array.from(section.querySelectorAll<HTMLDetailsElement>('.pulse-branches__panel'));
    const chosenBar = section.querySelector<HTMLElement>('.pulse-branches__chosen');
    const chosenLabel = section.querySelector<HTMLElement>('.pulse-branches__chosen-label');
    const switchBtn = section.querySelector<HTMLButtonElement>('.pulse-branches__switch');
    if (!picker || optionButtons.length === 0 || panels.length === 0) return;

    // Progressive enhancement: swap the no-JS details list for the picker UI.
    section.dataset.enhanced = 'true';
    picker.hidden = false;

    // In-session choice — tracked in memory so non-persisting contexts
    // (studio editor preview) never touch reader storage.
    let currentChoice: string | null = null;

    function findPanel(branchId: string): HTMLDetailsElement | null {
      return panels.find((panel) => panel.dataset.branchPanel === branchId) ?? null;
    }

    function panelLabel(panel: HTMLDetailsElement): string {
      return panel.querySelector('.pulse-branches__panel-label')?.textContent?.trim() || '';
    }

    function applyChoice(branchId: string) {
      const active = findPanel(branchId);
      if (!active) return;
      panels.forEach((panel) => {
        const isActive = panel === active;
        panel.dataset.active = String(isActive);
        panel.open = isActive;
      });
      if (chosenLabel) chosenLabel.textContent = panelLabel(active);
      if (chosenBar) chosenBar.hidden = false;
      section.dataset.state = 'chosen';
    }

    function choose(branchId: string, choiceOptions?: { moveFocus?: boolean; instant?: boolean }) {
      applyChoice(branchId);
      currentChoice = branchId;
      // Tag the taken path so CSS can run the select choreography (lift +
      // keyline + traveling marker) while the picker condenses around it.
      optionButtons.forEach((btn) => {
        if (btn.dataset.branchId === branchId) {
          btn.dataset.selected = 'true';
          delete btn.dataset.visited;
        }
      });
      if (persist) saveChoice(branchesId, branchId);
      if (choiceOptions?.moveFocus !== false) {
        const body = findPanel(branchId)?.querySelector<HTMLElement>('.pulse-branches__panel-body');
        if (body) {
          body.tabIndex = -1;
          body.focus({ preventScroll: true });
        }
      }
      // Branch gates react to this — restored choices land instantly.
      dispatchBranchChoice({
        branchesId,
        branchId,
        state: 'chosen',
        ...(choiceOptions?.instant ? { instant: true } : {}),
      });
    }

    function backToPicker() {
      section.dataset.state = 'picker';
      panels.forEach((panel) => {
        panel.dataset.active = 'false';
        panel.open = false;
      });
      if (chosenBar) chosenBar.hidden = true;
      // The path the reader just left keeps a subtle "visited" check chip
      // instead of the full selected treatment.
      optionButtons.forEach((btn) => {
        if (btn.dataset.selected === 'true') {
          delete btn.dataset.selected;
          btn.dataset.visited = 'true';
        }
      });
      // Return focus to the path the reader came from, so keyboard users
      // land where they left off instead of at the top of the picker.
      const focusTarget =
        (currentChoice ? optionButtons.find((btn) => btn.dataset.branchId === currentChoice) : null) ??
        optionButtons[0];
      focusTarget?.focus();
      // Re-open every branch gate bound to this picker.
      dispatchBranchChoice({ branchesId, branchId: null, state: 'picker' });
    }

    optionButtons.forEach((button, index) => {
      addListener(button, 'click', () => {
        const branchId = button.dataset.branchId;
        if (branchId) choose(branchId);
      });
      // Roving arrow-key navigation between path options.
      addListener(button, 'keydown', (event) => {
        const key = (event as KeyboardEvent).key;
        let targetIndex: number | null = null;
        if (key === 'ArrowDown' || key === 'ArrowRight') targetIndex = (index + 1) % optionButtons.length;
        else if (key === 'ArrowUp' || key === 'ArrowLeft') targetIndex = (index - 1 + optionButtons.length) % optionButtons.length;
        else if (key === 'Home') targetIndex = 0;
        else if (key === 'End') targetIndex = optionButtons.length - 1;
        if (targetIndex !== null) {
          event.preventDefault();
          optionButtons[targetIndex].focus();
        }
      });
    });

    if (switchBtn) {
      addListener(switchBtn, 'click', backToPicker);
    }

    // Keep native <details> toggles in sync pre-choice (defensive: in the
    // enhanced picker state the panels list is hidden, but stay correct if
    // CSS is disabled or a reader forces it visible).
    panels.forEach((panel) => {
      addListener(panel, 'toggle', () => {
        if (section.dataset.state === 'chosen' && panel.dataset.active === 'true' && !panel.open) {
          panel.open = true;
        }
      });
    });

    // Re-apply the reader's saved path (deterministic SSR ships none). The
    // event fires with instant: true so branch gates snap to their final
    // states instead of animating on page load.
    if (persist) {
      const saved = loadSavedChoice(branchesId);
      if (saved && findPanel(saved)) {
        choose(saved, { moveFocus: false, instant: true });
      }
    }
  });

  return () => {
    listeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    // Clear the skip flag so a later hydration (e.g. React StrictMode
    // remount) can re-bind listeners instead of leaving dead UI behind.
    hydratedSections.forEach((section) => {
      delete section.dataset.branchesHydrated;
    });
  };
}
