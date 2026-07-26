/**
 * Hydrates all `.pulse-flashcards` decks inside a container with:
 * - 3D flip on card click / Flip button (Space/Enter via real buttons)
 * - prev/next navigation with wrap-around + ArrowLeft/ArrowRight keys
 * - shuffle toggle (Fisher-Yates), restoring order when disabled
 * - "n / total" progress + animated progress bar, announced via aria-live
 * - pointer-driven card tilt (fine-pointer desktops, reduced-motion off)
 * - deal-in direction (data-deal) + progress tick pulse on nav/shuffle
 *
 * SSR renders card 1 (front) deterministically; this module only adds
 * interactivity on top of that markup.
 */
export function hydrateFlashcards(container: Element): () => void {
  const listeners: Array<{ element: EventTarget; type: string; handler: EventListener }> = [];

  function addListener(element: EventTarget, type: string, handler: EventListener) {
    element.addEventListener(type, handler);
    listeners.push({ element, type, handler });
  }

  container.querySelectorAll<HTMLElement>('.pulse-flashcards').forEach((section) => {
    const cards = Array.from(section.querySelectorAll<HTMLElement>('.pulse-flashcards__card'));
    const total = cards.length;
    if (total === 0) return;

    const prevBtn = section.querySelector<HTMLButtonElement>('.pulse-flashcards__nav--prev');
    const nextBtn = section.querySelector<HTMLButtonElement>('.pulse-flashcards__nav--next');
    const shuffleBtn = section.querySelector<HTMLButtonElement>('.pulse-flashcards__shuffle');
    const positionEl = section.querySelector<HTMLElement>('.pulse-flashcards__position');
    const progressFill = section.querySelector<HTMLElement>('.pulse-flashcards__progress-fill');
    const progressBar = section.querySelector<HTMLElement>('.pulse-flashcards__progress');

    const motionSafe =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    const finePointer =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    let order = cards.map((_, index) => index);
    let position = 0;
    let flipped = false;
    let shuffled = false;

    function setFaceInteractivity(face: HTMLElement | null, enabled: boolean) {
      if (!face) return;
      face.setAttribute('aria-hidden', String(!enabled));
      face.querySelectorAll<HTMLElement>('a, button').forEach((el) => {
        el.tabIndex = enabled ? 0 : -1;
      });
    }

    function apply() {
      const activeIndex = order[position];
      cards.forEach((card, index) => {
        const isActive = index === activeIndex;
        card.dataset.active = String(isActive);
        const showBack = isActive && flipped;
        card.dataset.state = showBack ? 'back' : 'front';
        setFaceInteractivity(card.querySelector<HTMLElement>('.pulse-flashcards__face--front'), !showBack);
        setFaceInteractivity(card.querySelector<HTMLElement>('.pulse-flashcards__face--back'), showBack);
      });
      if (positionEl) {
        positionEl.textContent = `${position + 1} / ${total}`;
      }
      if (progressFill) {
        progressFill.style.transform = `scaleX(${((position + 1) / total).toFixed(4)})`;
      }
    }

    function markInteracted() {
      section.dataset.interacted = 'true';
    }

    // Quick thickness pulse on the progress track. The class self-terminates
    // with the animation; the reflow restarts it on rapid successive navs.
    function tickProgress() {
      if (!progressBar) return;
      progressBar.classList.remove('pulse-flashcards__progress--tick');
      void progressBar.offsetWidth;
      progressBar.classList.add('pulse-flashcards__progress--tick');
    }

    function flip() {
      flipped = !flipped;
      markInteracted();
      apply();
    }

    function navigate(direction: -1 | 1) {
      position = (position + direction + total) % total;
      flipped = false;
      // Deal direction feeds the CSS deal-in animation on the new active card.
      section.dataset.deal = direction === 1 ? 'next' : 'prev';
      markInteracted();
      tickProgress();
      apply();
    }

    function toggleShuffle() {
      shuffled = !shuffled;
      if (shuffleBtn) {
        shuffleBtn.setAttribute('aria-pressed', String(shuffled));
      }
      if (shuffled) {
        for (let i = order.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
        position = 0;
      } else {
        const currentCard = order[position];
        order = cards.map((_, index) => index);
        position = Math.max(0, order.indexOf(currentCard));
      }
      flipped = false;
      section.dataset.deal = 'next';
      markInteracted();
      tickProgress();
      apply();
    }

    // Pointer-driven tilt toward the cursor. Desktop fine-pointer only, and
    // skipped entirely for reduced-motion users (CSS also forces
    // `transform: none` under that media query as a backstop).
    if (motionSafe && finePointer) {
      cards.forEach((card) => {
        addListener(card, 'pointermove', (event) => {
          if (card.dataset.active !== 'true') return;
          const pointer = event as PointerEvent;
          const rect = card.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          const px = (pointer.clientX - rect.left) / rect.width - 0.5;
          const py = (pointer.clientY - rect.top) / rect.height - 0.5;
          card.style.setProperty('--flashcard-tilt-x', `${(px * 7).toFixed(2)}deg`);
          card.style.setProperty('--flashcard-tilt-y', `${(py * -6).toFixed(2)}deg`);
        });
        addListener(card, 'pointerleave', () => {
          card.style.setProperty('--flashcard-tilt-x', '0deg');
          card.style.setProperty('--flashcard-tilt-y', '0deg');
        });
      });
    }

    // Flip: whole-card click (mouse convenience; links/buttons excluded)…
    cards.forEach((card) => {
      addListener(card, 'click', (event) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest('a, button')) return;
        if (card.dataset.active !== 'true') return;
        flip();
      });
    });

    // …plus the real Flip buttons (keyboard-operable by default).
    section.querySelectorAll('.pulse-flashcards__flip').forEach((button) => {
      addListener(button, 'click', () => {
        flip();
      });
    });

    if (prevBtn) {
      addListener(prevBtn, 'click', () => navigate(-1));
    }
    if (nextBtn) {
      addListener(nextBtn, 'click', () => navigate(1));
    }
    if (shuffleBtn) {
      addListener(shuffleBtn, 'click', () => toggleShuffle());
    }

    // Arrow-key navigation while focus is anywhere inside the deck region.
    addListener(section, 'keydown', (event) => {
      const key = (event as KeyboardEvent).key;
      if (key === 'ArrowLeft') {
        event.preventDefault();
        navigate(-1);
      } else if (key === 'ArrowRight') {
        event.preventDefault();
        navigate(1);
      }
    });

    // Deterministic SSR always ships the original order; apply the saved
    // shuffle preference only now, on the client.
    if (section.dataset.shuffle === 'true') {
      shuffled = false;
      toggleShuffle();
    } else {
      apply();
    }
  });

  return () => {
    listeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
  };
}
