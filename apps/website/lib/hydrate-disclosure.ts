/**
 * Hydrates disclosure blocks on the public article page:
 * - Accordion: <section data-block-type="accordion" data-allow-multiple="…">
 *     <details><summary>…</summary><p>…</p></details>…
 *   (emitted by AccordionBlock.render() — no pulse-accordion* classes)
 * - Toggle: <details data-block-type="toggle"><summary>…</summary><p>…</p></details>
 *   (emitted by ToggleBlock.render())
 *
 * Behavior: single-open enforcement for accordions with
 * data-allow-multiple="false". Toggling itself is instant — the legacy
 * grid-template-rows animation this module used to drive relied on CSS the
 * Dr Hayat skin never shipped (no [data-entering]/[data-closing] rules
 * exist), so the animated path only added a 320ms freeze before closing.
 * Native <details> remains the no-JS fallback.
 *
 * Returns a cleanup function that removes all listeners.
 */

const ACCORDION_SELECTOR = '[data-block-type="accordion"]';
const DISCLOSURE_SELECTOR = `${ACCORDION_SELECTOR} > details, details[data-block-type="toggle"]`;

export function hydrateDisclosures(container: Element): () => void {
  const cleanups: Array<() => void> = [];

  container.querySelectorAll<HTMLDetailsElement>(DISCLOSURE_SELECTOR).forEach((details) => {
    const summary = details.querySelector(':scope > summary');
    if (!summary) return;

    const handleClick = (event: Event) => {
      // Let inline links/refs inside the summary behave normally.
      if ((event.target as HTMLElement).closest('a')) return;

      if (!details.open) {
        // Single-open accordions collapse their siblings first.
        const accordion = details.closest(ACCORDION_SELECTOR);
        if (accordion && accordion.getAttribute('data-allow-multiple') !== 'true') {
          accordion
            .querySelectorAll<HTMLDetailsElement>(':scope > details[open]')
            .forEach((sibling) => {
              if (sibling !== details) sibling.open = false;
            });
        }
        details.open = true;
      } else {
        details.open = false;
      }
      // We manage `open` ourselves; skip the native toggle for this click.
      event.preventDefault();
    };

    summary.addEventListener('click', handleClick);
    cleanups.push(() => summary.removeEventListener('click', handleClick));
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
