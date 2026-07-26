import { escapeHtml, renderMath, solveEquation } from '@pulse/blocks';
import type { SolveResult } from '@pulse/blocks';

/**
 * Hydrates all `.pulse-autosolve` auto-solve equation blocks:
 * - Run button solves the equation client-side (scoped symbolic solver —
 *   linear + quadratic, NO AI) and reveals the steps one by one
 * - each step's math is rendered through the same TeX-subset renderer the
 *   server uses, so published and solved math look identical
 * - unsupported input gets a styled "cannot auto-solve this yet" state
 * - Reset restores the initial SSR state
 *
 * SSR ships only the equation + Run button; all solving happens on click.
 */
export function hydrateAutoSolveEquations(container: Element): () => void {
  const listeners: Array<{ element: EventTarget; type: string; handler: EventListener }> = [];
  const timers: Array<ReturnType<typeof setTimeout>> = [];

  function addListener(element: EventTarget, type: string, handler: EventListener) {
    element.addEventListener(type, handler);
    listeners.push({ element, type, handler });
  }

  container.querySelectorAll<HTMLElement>('.pulse-autosolve').forEach((section) => {
    const runBtn = section.querySelector<HTMLButtonElement>('.pulse-autosolve__run');
    const resetBtn = section.querySelector<HTMLButtonElement>('.pulse-autosolve__reset');
    const stepsEl = section.querySelector<HTMLElement>('.pulse-autosolve__steps');
    const equation = section.dataset.equation ?? '';
    if (!runBtn || !resetBtn || !stepsEl || !equation) return;
    const stepsRegion: HTMLElement = stepsEl;

    function buildStepsHtml(result: SolveResult): string {
      if (!result.ok) {
        return (
          `<div class="pulse-autosolve__unsupported" role="status">` +
          `<span class="pulse-autosolve__unsupported-icon" aria-hidden="true">` +
          `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14"><circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.8v3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11" r="0.9" fill="currentColor"/></svg>` +
          `</span>` +
          `<div>` +
          `<p class="pulse-autosolve__unsupported-title">Can't auto-solve this equation yet</p>` +
          `<p class="pulse-autosolve__unsupported-reason">${escapeHtml(result.reason)}</p>` +
          `<p class="pulse-autosolve__unsupported-scope">The local solver currently supports linear equations (2x + 5 = 11) and quadratic equations (x^2 - 5x + 6 = 0) in one variable, with parentheses and fractions.</p>` +
          `</div>` +
          `</div>`
        );
      }
      return result.steps
        .map((step, index) => {
          const finalClass = step.final ? ' pulse-autosolve__step--final' : '';
          return (
            `<div class="pulse-autosolve__step${finalClass}" data-visible="false">` +
            `<span class="pulse-autosolve__step-num" aria-hidden="true">${index + 1}</span>` +
            `<div class="pulse-autosolve__step-body">` +
            `<p class="pulse-autosolve__step-note">${escapeHtml(step.note)}</p>` +
            `<div class="pulse-autosolve__step-math">${renderMath(step.math, { displayMode: true, highlight: false })}</div>` +
            `</div>` +
            `</div>`
          );
        })
        .join('');
    }

    function revealSteps() {
      const reducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const stepEls = Array.from(stepsRegion.querySelectorAll<HTMLElement>('.pulse-autosolve__step'));
      stepEls.forEach((el, index) => {
        if (reducedMotion) {
          el.dataset.visible = 'true';
          return;
        }
        timers.push(
          setTimeout(() => {
            el.dataset.visible = 'true';
          }, 120 + index * 280),
        );
      });
    }

    addListener(runBtn, 'click', () => {
      let result: SolveResult;
      try {
        result = solveEquation(equation);
      } catch {
        result = {
          ok: false,
          reason: 'Something went wrong while solving — check the equation syntax and try again.',
        };
      }
      stepsRegion.innerHTML = buildStepsHtml(result);
      section.dataset.state = result.ok ? 'solved' : 'unsupported';
      runBtn.hidden = true;
      resetBtn.hidden = false;
      revealSteps();
    });

    addListener(resetBtn, 'click', () => {
      timers.splice(0).forEach((timer) => clearTimeout(timer));
      stepsRegion.innerHTML = '';
      section.dataset.state = 'idle';
      resetBtn.hidden = true;
      runBtn.hidden = false;
      runBtn.focus();
    });
  });

  return () => {
    timers.splice(0).forEach((timer) => clearTimeout(timer));
    listeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
  };
}
