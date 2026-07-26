/**
 * Hydrates all `.pulse-ba` before/after comparison blocks inside a container:
 * pointer drag (mouse + touch), click-to-position, and full keyboard control
 * on the focusable slider handle (arrow keys, PageUp/Down, Home/End).
 *
 * The initial position is SSR-rendered via the `--ba-position` CSS variable,
 * so the block looks correct before hydration; this module only wires input.
 */
export interface HydrateBeforeAfterOptions {
  /** Called with the committed (integer) position after a drag ends or a key is pressed. */
  onPositionChange?: (root: HTMLElement, position: number) => void;
}

export function hydrateBeforeAfter(
  container: Element,
  options?: HydrateBeforeAfterOptions,
): () => void {
  const listeners: Array<{ element: EventTarget; type: string; handler: EventListener }> = [];
  const hydratedRoots: HTMLElement[] = [];

  function addListener(element: EventTarget, type: string, handler: EventListener) {
    element.addEventListener(type, handler);
    listeners.push({ element, type, handler });
  }

  container.querySelectorAll('.pulse-ba').forEach((el) => {
    const root = el as HTMLElement;
    if (root.dataset.baHydrated === 'true') return;
    root.dataset.baHydrated = 'true';
    hydratedRoots.push(root);

    const stage = root.querySelector('.pulse-ba__stage') as HTMLElement | null;
    const handle = root.querySelector('.pulse-ba__handle') as HTMLElement | null;
    if (!stage || !handle) return;

    const beforeLabel =
      root.querySelector('.pulse-ba__chip--before')?.textContent?.trim() || 'Before';
    const afterLabel =
      root.querySelector('.pulse-ba__chip--after')?.textContent?.trim() || 'After';

    let position = Number(root.getAttribute('data-position'));
    if (!Number.isFinite(position)) position = 50;

    const apply = (next: number, commit: boolean) => {
      position = Math.max(0, Math.min(100, next));
      const rounded = Math.round(position);
      root.style.setProperty('--ba-position', String(position));
      root.setAttribute('data-position', String(position));
      handle.setAttribute('aria-valuenow', String(rounded));
      handle.setAttribute(
        'aria-valuetext',
        `${beforeLabel} ${rounded}%, ${afterLabel} ${100 - rounded}%`,
      );
      if (commit && options?.onPositionChange) {
        options.onPositionChange(root, rounded);
      }
    };

    const positionFromEvent = (e: PointerEvent): number => {
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0) return position;
      return ((e.clientX - rect.left) / rect.width) * 100;
    };

    let dragging = false;

    addListener(stage, 'pointerdown', (e) => {
      const pe = e as PointerEvent;
      if (pe.pointerType === 'mouse' && pe.button !== 0) return;
      dragging = true;
      try {
        stage.setPointerCapture(pe.pointerId);
      } catch {
        // Pointer already released — drag will end on pointerup.
      }
      apply(positionFromEvent(pe), false);
      handle.focus();
      pe.preventDefault();
    });

    addListener(stage, 'pointermove', (e) => {
      if (!dragging) return;
      apply(positionFromEvent(e as PointerEvent), false);
    });

    const endDrag = (e: Event) => {
      if (!dragging) return;
      dragging = false;
      apply(positionFromEvent(e as PointerEvent), true);
    };
    addListener(stage, 'pointerup', endDrag);
    addListener(stage, 'pointercancel', endDrag);

    addListener(handle, 'keydown', (e) => {
      const ke = e as KeyboardEvent;
      const step = ke.shiftKey ? 10 : 1;
      let next: number | null = null;
      switch (ke.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          next = position - step;
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          next = position + step;
          break;
        case 'PageDown':
          next = position - 10;
          break;
        case 'PageUp':
          next = position + 10;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = 100;
          break;
        default:
          return;
      }
      ke.preventDefault();
      ke.stopPropagation();
      apply(next, true);
    });
  });

  return () => {
    listeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    // Clear the skip flag so StrictMode remounts can re-bind (see branches).
    hydratedRoots.forEach((root) => {
      delete root.dataset.baHydrated;
    });
  };
}
