/**
 * Hydrates `.pulse-accordion` and `.pulse-toggle` disclosure blocks:
 * - smooth grid-template-rows open/close animation (native <details> stays the
 *   no-JS fallback; reduced-motion users get instant native toggling)
 * - single-open enforcement for accordions with data-allow-multiple="false"
 *
 * Returns a cleanup function that removes all listeners and pending timers.
 */

const DISCLOSURE_SELECTOR =
  '.pulse-accordion details.pulse-accordion__item, .pulse-toggle details.pulse-toggle__details';
const ANIMATION_MS = 280;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function hydrateDisclosures(container: Element): () => void {
  const cleanups: Array<() => void> = [];

  container.querySelectorAll<HTMLDetailsElement>(DISCLOSURE_SELECTOR).forEach((details) => {
    const summary = details.querySelector('summary');
    const panel = details.querySelector('.pulse-accordion__panel, .pulse-toggle__panel');
    if (!summary || !panel) return;

    let animating = false;
    let openTimer: ReturnType<typeof setTimeout> | null = null;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    function finishClose(target: HTMLDetailsElement) {
      target.open = false;
      target.removeAttribute('data-closing');
      if (target === details) animating = false;
    }

    function closeAnimated(target: HTMLDetailsElement, instant: boolean) {
      if (!target.open) return;
      if (instant) {
        target.open = false;
        return;
      }
      target.setAttribute('data-closing', '');
      setTimeout(() => finishClose(target), ANIMATION_MS + 40);
    }

    const handleClick = (event: Event) => {
      // Let inline links/refs inside the summary behave normally.
      if ((event.target as HTMLElement).closest('a')) return;
      event.preventDefault();
      if (animating) return;

      const instant = prefersReducedMotion();

      if (!details.open) {
        // Single-open accordions collapse their siblings first.
        const accordion = details.closest('.pulse-accordion');
        if (accordion && accordion.getAttribute('data-allow-multiple') !== 'true') {
          accordion
            .querySelectorAll<HTMLDetailsElement>('details.pulse-accordion__item[open]')
            .forEach((sibling) => {
              if (sibling !== details) closeAnimated(sibling, instant);
            });
        }

        if (instant) {
          details.open = true;
          return;
        }
        animating = true;
        // Start from 0fr, then release to 1fr on the next painted frame.
        details.setAttribute('data-entering', '');
        details.open = true;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            details.removeAttribute('data-entering');
            openTimer = setTimeout(() => {
              animating = false;
            }, ANIMATION_MS);
          });
        });
      } else {
        if (instant) {
          details.open = false;
          return;
        }
        animating = true;
        details.setAttribute('data-closing', '');
        closeTimer = setTimeout(() => finishClose(details), ANIMATION_MS + 40);
      }
    };

    summary.addEventListener('click', handleClick);
    cleanups.push(() => {
      summary.removeEventListener('click', handleClick);
      if (openTimer) clearTimeout(openTimer);
      if (closeTimer) clearTimeout(closeTimer);
    });
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
