/**
 * Hydrates all `.pulse-carousel` blocks inside a container with
 * autoplay, arrow navigation, dot navigation, and scroll-based active-dot updates.
 */
export function hydrateCarousels(container: Element): () => void {
  const timers: ReturnType<typeof setInterval>[] = [];
  const listeners: Array<{ element: EventTarget; type: string; handler: EventListener }> = [];

  function addListener(element: EventTarget, type: string, handler: EventListener) {
    element.addEventListener(type, handler);
    listeners.push({ element, type, handler });
  }

  function updateActiveDot(carousel: Element, index: number) {
    const dots = carousel.querySelectorAll('.pulse-carousel__dot');
    dots.forEach((dot, i) => {
      const isActive = i === index;
      dot.classList.toggle('pulse-carousel__dot--active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });
    const slides = carousel.querySelectorAll('.pulse-carousel__slide');
    slides.forEach((slide, i) => {
      slide.setAttribute('data-active', String(i === index));
    });
  }

  function getCurrentIndex(track: HTMLElement): number {
    const slideWidth = track.clientWidth || 1;
    const scrollLeft = track.scrollLeft;
    const index = Math.round(scrollLeft / slideWidth);
    return Math.max(0, Math.min(index, track.children.length - 1));
  }

  container.querySelectorAll('.pulse-carousel').forEach((carousel) => {
    const track = carousel.querySelector('.pulse-carousel__track') as HTMLElement | null;
    if (!track) return;

    // Scroll-based active-dot update
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        updateActiveDot(carousel, getCurrentIndex(track));
      }, 50);
    };
    addListener(track, 'scroll', handleScroll);

    // Autoplay
    if (carousel.getAttribute('data-autoplay') === 'true') {
      const intervalMs = Number(carousel.getAttribute('data-interval')) || 5000;
      const timer = setInterval(() => {
        const slideWidth = track.clientWidth;
        const maxScroll = track.scrollWidth - slideWidth;
        if (slideWidth <= 0) return;
        if (track.scrollLeft >= maxScroll - 2) {
          track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          track.scrollBy({ left: slideWidth, behavior: 'smooth' });
        }
      }, intervalMs);
      timers.push(timer);
    }

    // Arrow navigation
    carousel.querySelectorAll('.pulse-carousel__arrow').forEach((arrow) => {
      addListener(arrow, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const slideWidth = track.clientWidth;
        if (slideWidth <= 0) return;
        const direction = (arrow as HTMLElement).classList.contains('pulse-carousel__arrow--prev') ? -1 : 1;
        track.scrollBy({ left: direction * slideWidth, behavior: 'smooth' });
      });
    });

    // Dot navigation
    carousel.querySelectorAll('.pulse-carousel__dot').forEach((dot) => {
      addListener(dot, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = Number((dot as HTMLElement).getAttribute('data-target-index'));
        const slideWidth = track.clientWidth;
        if (Number.isNaN(index) || slideWidth <= 0) return;
        track.scrollTo({ left: index * slideWidth, behavior: 'smooth' });
        updateActiveDot(carousel, index);
      });
    });
  });

  return () => {
    timers.forEach(clearInterval);
    listeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
  };
}
