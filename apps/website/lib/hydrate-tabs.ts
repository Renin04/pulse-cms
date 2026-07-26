/**
 * Hydrates all `.pulse-tabs` blocks inside a container with a proper ARIA
 * tablist: click activation, roving tabindex, arrow-key navigation, a sliding
 * active-tab indicator, content crossfade, and scroll edge-fade overflow hints.
 */
export function hydrateTabs(container: Element): () => void {
  const cleanups: Array<() => void> = [];

  function addListener(element: EventTarget, type: string, handler: EventListener, options?: AddEventListenerOptions) {
    element.addEventListener(type, handler, options);
    cleanups.push(() => element.removeEventListener(type, handler, options));
  }

  container.querySelectorAll('.pulse-tabs').forEach((tabsEl) => {
    const tabs = tabsEl as HTMLElement;
    const list = tabs.querySelector('.pulse-tabs__list') as HTMLElement | null;
    const indicator = tabs.querySelector('.pulse-tabs__indicator') as HTMLElement | null;
    if (!list) return;

    const tabButtons = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]'));
    const panels = Array.from(tabs.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
    if (tabButtons.length === 0) return;

    tabs.classList.add('pulse-tabs--enhanced');

    // Panels are crossfaded via [data-active] once enhanced; the SSR `hidden`
    // attribute would short-circuit the fade, so manage visibility ourselves.
    panels.forEach((panel) => {
      panel.removeAttribute('hidden');
    });

    const activeTab = (): HTMLElement | null =>
      tabButtons.find((tab) => tab.getAttribute('aria-selected') === 'true') ?? tabButtons[0] ?? null;

    const moveIndicator = (animate: boolean) => {
      if (!indicator) return;
      const current = activeTab();
      if (!current) return;
      if (!animate) {
        indicator.style.transition = 'none';
      }
      const baseWidth = indicator.offsetWidth || 1;
      const scale = current.offsetWidth / baseWidth;
      indicator.style.transform = `translateX(${current.offsetLeft}px) scaleX(${scale})`;
      if (!animate) {
        // Force the un-animated position to apply before restoring the transition.
        void indicator.offsetWidth;
        indicator.style.transition = '';
      }
    };

    const activateTab = (next: HTMLElement, options: { focus?: boolean; animate?: boolean } = {}) => {
      const animate = options.animate !== false;
      tabButtons.forEach((tab) => {
        const isActive = tab === next;
        tab.setAttribute('aria-selected', String(isActive));
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
      });
      const nextId = next.getAttribute('data-tab-id');
      panels.forEach((panel) => {
        panel.setAttribute('data-active', String(panel.getAttribute('data-tab-panel') === nextId));
      });
      moveIndicator(animate);
      if (options.focus) {
        next.focus();
      }
      next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    };

    const updateOverflow = () => {
      const maxScroll = list.scrollWidth - list.clientWidth;
      const scrollable = maxScroll > 2;
      tabs.setAttribute('data-overflow', String(scrollable));
      list.setAttribute('data-fade-left', String(scrollable && list.scrollLeft > 2));
      list.setAttribute('data-fade-right', String(scrollable && list.scrollLeft < maxScroll - 2));
      if (scrollable) {
        list.style.justifyContent = 'flex-start';
      } else {
        list.style.justifyContent = '';
      }
    };

    tabButtons.forEach((tab) => {
      addListener(tab, 'click', (event) => {
        event.preventDefault();
        activateTab(tab);
      });
    });

    addListener(list, 'keydown', (event) => {
      const keyEvent = event as KeyboardEvent;
      const currentIndex = tabButtons.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) return;
      let nextIndex: number | null = null;
      if (keyEvent.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabButtons.length;
      else if (keyEvent.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
      else if (keyEvent.key === 'Home') nextIndex = 0;
      else if (keyEvent.key === 'End') nextIndex = tabButtons.length - 1;
      if (nextIndex === null) return;
      keyEvent.preventDefault();
      const next = tabButtons[nextIndex];
      if (next) activateTab(next, { focus: true });
    });

    addListener(list, 'scroll', () => updateOverflow(), { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        updateOverflow();
        moveIndicator(false);
      });
      observer.observe(list);
      cleanups.push(() => observer.disconnect());
    } else {
      addListener(window, 'resize', () => {
        updateOverflow();
        moveIndicator(false);
      });
    }

    // Initial layout sync (un-animated so first paint is stable).
    updateOverflow();
    moveIndicator(false);
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
