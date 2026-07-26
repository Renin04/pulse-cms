/**
 * Hydrates all `.pulse-annotated` annotated-image blocks inside a container.
 *
 * Hovering, focusing, or tapping a numbered marker highlights the matching
 * note in the adjacent list (and vice versa) via `data-active` mirroring.
 * Clicking pins the highlight; Escape or a second click releases it.
 * All styling (including the active marker's pulse ring) lives in CSS —
 * this module only syncs state and scrolls the counterpart into view.
 */
export function hydrateAnnotatedImages(container: Element): () => void {
  const listeners: Array<{ element: EventTarget; type: string; handler: EventListener }> = [];
  const hydratedRoots: HTMLElement[] = [];

  function addListener(element: EventTarget, type: string, handler: EventListener) {
    element.addEventListener(type, handler);
    listeners.push({ element, type, handler });
  }

  const reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior: ScrollBehavior = reducedMotion ? 'auto' : 'smooth';

  container.querySelectorAll('.pulse-annotated').forEach((el) => {
    const root = el as HTMLElement;
    if (root.dataset.annotatedHydrated === 'true') return;
    root.dataset.annotatedHydrated = 'true';
    hydratedRoots.push(root);

    let pinnedId: string | null = null;
    let hoverId: string | null = null;

    const applyActive = () => {
      const activeId = hoverId ?? pinnedId;
      root.querySelectorAll('[data-hotspot-id]').forEach((node) => {
        const isActive = activeId !== null && node.getAttribute('data-hotspot-id') === activeId;
        node.setAttribute('data-active', String(isActive));
      });
    };

    const findCounterpart = (id: string, selector: string): HTMLElement | null => {
      const matches = Array.from(
        root.querySelectorAll(`${selector}[data-hotspot-id]`),
      ) as HTMLElement[];
      return matches.find((node) => node.getAttribute('data-hotspot-id') === id) ?? null;
    };

    const bind = (trigger: HTMLElement, id: string, counterpartSelector: string) => {
      addListener(trigger, 'mouseenter', () => {
        hoverId = id;
        applyActive();
      });
      addListener(trigger, 'mouseleave', () => {
        if (hoverId === id) hoverId = null;
        applyActive();
      });
      addListener(trigger, 'focus', () => {
        hoverId = id;
        applyActive();
      });
      addListener(trigger, 'blur', () => {
        if (hoverId === id) hoverId = null;
        applyActive();
      });
      addListener(trigger, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        pinnedId = pinnedId === id ? null : id;
        applyActive();
        if (pinnedId) {
          const counterpart = findCounterpart(id, counterpartSelector);
          counterpart?.scrollIntoView({ block: 'nearest', behavior: scrollBehavior });
        }
      });
      addListener(trigger, 'keydown', (e) => {
        const ke = e as KeyboardEvent;
        if (ke.key === 'Escape') {
          pinnedId = null;
          hoverId = null;
          applyActive();
          ke.stopPropagation();
        }
      });
    };

    root.querySelectorAll('.pulse-annotated__marker[data-hotspot-id]').forEach((marker) => {
      const id = marker.getAttribute('data-hotspot-id');
      if (!id) return;
      // From a marker, bring the matching note into view.
      bind(marker as HTMLElement, id, '.pulse-annotated__note');
    });

    root.querySelectorAll('.pulse-annotated__note[data-hotspot-id]').forEach((note) => {
      const id = note.getAttribute('data-hotspot-id');
      const trigger = note.querySelector('.pulse-annotated__note-btn') as HTMLElement | null;
      if (!id || !trigger) return;
      // From a note, bring the matching marker into view.
      bind(trigger, id, '.pulse-annotated__marker');
    });
  });

  return () => {
    listeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    // Clear the skip flag so StrictMode remounts can re-bind (see branches).
    hydratedRoots.forEach((root) => {
      delete root.dataset.annotatedHydrated;
    });
  };
}
