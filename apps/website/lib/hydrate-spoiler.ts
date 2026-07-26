/**
 * Hydrates all `.pulse-spoiler` blocks inside a container: clicking the toggle
 * (or the shimmering veil) reveals/hides the content with a dissolve.
 * Reduced-motion users get an instant toggle with no veil animation.
 */
export function hydrateSpoilers(container: Element): () => void {
  const cleanups: Array<() => void> = [];

  function addListener(element: EventTarget, type: string, handler: EventListener) {
    element.addEventListener(type, handler);
    cleanups.push(() => element.removeEventListener(type, handler));
  }

  const prefersReducedMotion = (): boolean =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  container.querySelectorAll('.pulse-spoiler').forEach((spoilerEl) => {
    const spoiler = spoilerEl as HTMLElement;
    const toggle = spoiler.querySelector('.pulse-spoiler__toggle') as HTMLElement | null;
    const content = spoiler.querySelector('.pulse-spoiler__content') as HTMLElement | null;
    const veil = spoiler.querySelector('.pulse-spoiler__veil') as HTMLElement | null;
    const hint = spoiler.querySelector('.pulse-spoiler__hint') as HTMLElement | null;
    if (!toggle || !content || !veil) return;

    const label = spoiler.querySelector('.pulse-spoiler__label')?.textContent ?? 'Spoiler';
    let dissolveTimer: ReturnType<typeof setTimeout> | null = null;

    const setRevealed = (revealed: boolean) => {
      spoiler.setAttribute('data-revealed', String(revealed));
      // Gates the CSS reform animation so it never plays on initial load.
      spoiler.setAttribute('data-interacted', 'true');
      toggle.setAttribute('aria-expanded', String(revealed));
      toggle.setAttribute('aria-label', `${revealed ? 'Hide' : 'Reveal'} spoiler: ${label}`);
      if (hint) hint.textContent = revealed ? 'Tap to hide' : 'Tap to reveal';

      if (dissolveTimer) {
        clearTimeout(dissolveTimer);
        dissolveTimer = null;
      }

      if (revealed) {
        content.removeAttribute('aria-hidden');
        content.removeAttribute('inert');
        if (prefersReducedMotion()) {
          veil.setAttribute('hidden', '');
          return;
        }
        // Let the veil dissolve (opacity/transform handled in CSS), then remove it.
        veil.classList.add('pulse-spoiler__veil--dissolving');
        dissolveTimer = setTimeout(() => {
          veil.setAttribute('hidden', '');
          veil.classList.remove('pulse-spoiler__veil--dissolving');
          dissolveTimer = null;
        }, 350);
      } else {
        veil.classList.remove('pulse-spoiler__veil--dissolving');
        veil.removeAttribute('hidden');
        content.setAttribute('aria-hidden', 'true');
        content.setAttribute('inert', '');
      }
    };

    addListener(toggle, 'click', (event) => {
      event.preventDefault();
      setRevealed(spoiler.getAttribute('data-revealed') !== 'true');
    });

    // The veil itself is the big Telegram-style tap target (mouse/touch only —
    // keyboard users drive the real toggle button above).
    addListener(veil, 'click', () => {
      setRevealed(true);
    });

    cleanups.push(() => {
      if (dissolveTimer) clearTimeout(dissolveTimer);
    });
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
