/**
 * Hydrates all `.pulse-timeline` blocks inside a container with progressive
 * enhancement: entries reveal as they scroll into view (IntersectionObserver)
 * and the spine gets a scroll-driven red progress line (transform-only).
 *
 * SSR output is fully readable without JS — the `--enhanced` class is what
 * opts items into the hidden-until-revealed state, and reduced-motion users
 * are marked visible immediately with no listeners attached.
 */
export function hydrateTimelines(container: Element): () => void {
  const cleanups: Array<() => void> = [];
  const reduceMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  container.querySelectorAll('.pulse-timeline').forEach((timelineEl) => {
    const timeline = timelineEl as HTMLElement;
    const items = Array.from(timeline.querySelectorAll<HTMLElement>('.pulse-timeline__item'));
    const track = timeline.querySelector<HTMLElement>('.pulse-timeline__track');

    timeline.classList.add('pulse-timeline--enhanced');

    if (reduceMotion) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              (entry.target as HTMLElement).classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2, rootMargin: '0px 0px -6% 0px' },
      );
      items.forEach((item) => observer.observe(item));
      cleanups.push(() => observer.disconnect());
    } else {
      items.forEach((item) => item.classList.add('is-visible'));
    }

    // Spine progress: fills as the track scrolls past a viewport anchor line.
    if (track) {
      let ticking = false;
      const updateProgress = () => {
        ticking = false;
        const rect = track.getBoundingClientRect();
        if (rect.height <= 0) return;
        const anchor = window.innerHeight * 0.72;
        const progress = Math.min(1, Math.max(0, (anchor - rect.top) / rect.height));
        track.style.setProperty('--tl-progress', progress.toFixed(4));
      };
      const onScroll = () => {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(updateProgress);
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      cleanups.push(() => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      });
      updateProgress();
    }
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
