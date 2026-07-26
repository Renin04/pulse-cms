/**
 * Hydrates all `.pulse-map` figures inside a container.
 *
 * SSR ships the OpenStreetMap iframe stacked on top of a styled fallback
 * card (coordinates + label + external link), so the block is never a blank
 * box. This module only flips the root `data-state` attribute:
 * - "loading"     → SSR default; the fallback shows through the transparent
 *                   iframe until tiles arrive.
 * - "loaded"      → iframe fired `load`; the fallback is faded out.
 * - "unavailable" → iframe error or the browser is offline; the iframe is
 *                   hidden and the fallback's offline message is shown.
 *
 * When the connection comes back, the iframe is reloaded automatically.
 */
export function hydrateMaps(container: Element): () => void {
  const listeners: Array<{ element: EventTarget; type: string; handler: EventListener }> = [];

  function addListener(element: EventTarget, type: string, handler: EventListener) {
    element.addEventListener(type, handler);
    listeners.push({ element, type, handler });
  }

  container.querySelectorAll<HTMLElement>('.pulse-map[data-block-type="map"]').forEach((root) => {
    const iframe = root.querySelector<HTMLIFrameElement>('.pulse-map__iframe');
    if (!iframe) return;

    const setState = (state: 'loading' | 'loaded' | 'unavailable') => {
      root.dataset.state = state;
    };

    addListener(iframe, 'load', () => setState('loaded'));
    addListener(iframe, 'error', () => setState('unavailable'));
    addListener(window, 'offline', () => setState('unavailable'));
    addListener(window, 'online', () => {
      if (root.dataset.state !== 'unavailable') return;
      setState('loading');
      const src = iframe.getAttribute('src');
      if (src) iframe.setAttribute('src', src);
    });

    // Offline-first: if we already know there is no connection, go straight
    // to the fallback instead of waiting on a doomed request.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setState('unavailable');
    }
  });

  return () => {
    listeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
  };
}
