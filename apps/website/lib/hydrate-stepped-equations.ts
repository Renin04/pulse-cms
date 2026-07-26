/**
 * Hydrates all `.pulse-stepmath` stepped-equation blocks inside a container:
 * - prev/next navigation (clamped — buttons disable at the ends)
 * - clickable step dots + "Step n of total" status announced via aria-live
 * - ArrowLeft/ArrowRight keyboard navigation while focus is inside the block
 *
 * SSR renders step 1 deterministically; this module only adds interactivity.
 */
export function hydrateSteppedEquations(container: Element): () => void {
  const listeners: Array<{ element: EventTarget; type: string; handler: EventListener }> = [];

  function addListener(element: EventTarget, type: string, handler: EventListener) {
    element.addEventListener(type, handler);
    listeners.push({ element, type, handler });
  }

  container.querySelectorAll<HTMLElement>('.pulse-stepmath').forEach((section) => {
    const steps = Array.from(section.querySelectorAll<HTMLElement>('.pulse-stepmath__step'));
    const total = steps.length;
    if (total === 0) return;

    const prevBtn = section.querySelector<HTMLButtonElement>('.pulse-stepmath__nav--prev');
    const nextBtn = section.querySelector<HTMLButtonElement>('.pulse-stepmath__nav--next');
    const positionEl = section.querySelector<HTMLElement>('.pulse-stepmath__position');
    const dots = Array.from(section.querySelectorAll<HTMLButtonElement>('.pulse-stepmath__dot'));

    let position = 0;

    function apply() {
      steps.forEach((step, index) => {
        const isActive = index === position;
        step.dataset.active = String(isActive);
        if (isActive) {
          step.removeAttribute('aria-hidden');
        } else {
          step.setAttribute('aria-hidden', 'true');
        }
      });
      dots.forEach((dot, index) => {
        const isActive = index === position;
        dot.dataset.active = String(isActive);
        if (isActive) {
          dot.setAttribute('aria-current', 'step');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
      if (positionEl) {
        positionEl.textContent = `Step ${position + 1} of ${total}`;
      }
      if (prevBtn) prevBtn.disabled = position === 0;
      if (nextBtn) nextBtn.disabled = position === total - 1;
    }

    function goTo(index: number) {
      const next = Math.max(0, Math.min(total - 1, index));
      if (next === position) return;
      position = next;
      apply();
    }

    if (prevBtn) {
      addListener(prevBtn, 'click', () => goTo(position - 1));
    }
    if (nextBtn) {
      addListener(nextBtn, 'click', () => goTo(position + 1));
    }
    dots.forEach((dot, index) => {
      addListener(dot, 'click', () => goTo(index));
    });

    // Arrow-key navigation while focus is anywhere inside the block region.
    addListener(section, 'keydown', (event) => {
      const key = (event as KeyboardEvent).key;
      if (key === 'ArrowLeft') {
        event.preventDefault();
        goTo(position - 1);
      } else if (key === 'ArrowRight') {
        event.preventDefault();
        goTo(position + 1);
      }
    });

    apply();
  });

  return () => {
    listeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
  };
}
