export interface AriaAttributes {
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  'aria-relevant'?: string;
  'aria-busy'?: boolean;
  tabIndex?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface KeyboardNavigationConfig {
  enableArrowKeys?: boolean;
  enableTabNavigation?: boolean;
  enableEscapeKey?: boolean;
  enableEnterKey?: boolean;
  trapFocus?: boolean;
}

export interface FocusManagementOptions {
  preventScroll?: boolean;
  restoreFocus?: boolean;
  initialFocusSelector?: string;
}

export function applyAriaAttributes(
  element: HTMLElement,
  attributes: AriaAttributes
): void {
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === undefined) return;
    element.setAttribute(key, String(value));
  });
}

export function getBlockRole(blockType: string): string {
  const roleMap: Record<string, string> = {
    heading: 'heading',
    paragraph: 'paragraph',
    list: 'list',
    'list-item': 'listitem',
    image: 'img',
    video: 'video',
    audio: 'audio',
    button: 'button',
    link: 'link',
    navigation: 'navigation',
    article: 'article',
    section: 'region',
    aside: 'complementary',
    footer: 'contentinfo',
    header: 'banner',
    form: 'form',
    search: 'search',
    table: 'table',
    dialog: 'dialog',
    alert: 'alert',
    status: 'status',
  };
  return roleMap[blockType] || 'group';
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

export function createKeyboardNavigationHandler(
  container: HTMLElement,
  config: KeyboardNavigationConfig = {}
): (event: KeyboardEvent) => void {
  const {
    enableArrowKeys = true,
    enableTabNavigation = true,
    enableEscapeKey = true,
    enableEnterKey = true,
    trapFocus = false,
  } = config;

  return (event: KeyboardEvent) => {
    const { key, shiftKey, target } = event;

    if (enableArrowKeys && (key === 'ArrowUp' || key === 'ArrowDown')) {
      const focusable = getFocusableElements(container);
      const currentIndex = focusable.indexOf(target as HTMLElement);
      if (currentIndex !== -1) {
        event.preventDefault();
        const nextIndex =
          key === 'ArrowDown'
            ? Math.min(currentIndex + 1, focusable.length - 1)
            : Math.max(currentIndex - 1, 0);
        focusable[nextIndex]?.focus();
      }
    }

    if (enableTabNavigation && trapFocus && key === 'Tab') {
      const focusable = getFocusableElements(container);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (shiftKey && target === first) {
        event.preventDefault();
        last?.focus();
      } else if (!shiftKey && target === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    if (enableEscapeKey && key === 'Escape') {
      container.dispatchEvent(new CustomEvent('pulse:close', { bubbles: true }));
    }

    if (enableEnterKey && key === 'Enter') {
      container.dispatchEvent(
        new CustomEvent('pulse:activate', { bubbles: true, detail: { target } })
      );
    }
  };
}

export class FocusManager {
  private container: HTMLElement;
  private previousFocus: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  setInitialFocus(options: FocusManagementOptions = {}): void {
    const { preventScroll = false, initialFocusSelector } = options;
    let target: HTMLElement | null = null;
    if (initialFocusSelector) {
      target = this.container.querySelector<HTMLElement>(initialFocusSelector);
    }
    if (!target) {
      target = getFocusableElements(this.container)[0] ?? null;
    }
    target?.focus({ preventScroll });
  }

  saveFocus(): void {
    this.previousFocus = document.activeElement as HTMLElement;
  }

  restoreFocus(options: FocusManagementOptions = {}): void {
    const { preventScroll = false } = options;
    if (this.previousFocus && document.contains(this.previousFocus)) {
      this.previousFocus.focus({ preventScroll });
    }
  }

  trapFocus(): () => void {
    const handler = createKeyboardNavigationHandler(this.container, {
      trapFocus: true,
    });
    this.container.addEventListener('keydown', handler as EventListener);
    return () => {
      this.container.removeEventListener('keydown', handler as EventListener);
    };
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function applyReducedMotion(element: HTMLElement): void {
  if (prefersReducedMotion()) {
    element.classList.add('pulse-reduced-motion');
  }
}

export function createLiveRegion(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): HTMLElement {
  const region = document.createElement('div');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', priority);
  region.setAttribute('aria-atomic', 'true');
  region.className = 'pulse-sr-only';
  region.textContent = message;
  Object.assign(region.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });
  return region;
}

export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
  duration: number = 3000
): void {
  if (typeof document === 'undefined') return;
  const region = createLiveRegion(message, priority);
  document.body.appendChild(region);
  setTimeout(() => {
    if (document.body.contains(region)) document.body.removeChild(region);
  }, duration);
}

export function getAccessibleLabel(element: HTMLElement): string {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl) return labelEl.textContent ?? '';
  }

  if (element instanceof HTMLInputElement && element.id) {
    const label = document.querySelector<HTMLElement>(`label[for="${element.id}"]`);
    if (label) return label.textContent ?? '';
  }

  return element.textContent ?? '';
}

export function addSkipLink(
  targetId: string,
  label: string = 'Skip to main content'
): HTMLElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.className = 'pulse-skip-link';
  skipLink.textContent = label;
  Object.assign(skipLink.style, {
    position: 'absolute',
    top: '-40px',
    left: '0',
    background: 'var(--pulse-color-bg-primary, #fff)',
    color: 'var(--pulse-color-text-primary, #000)',
    padding: 'var(--pulse-space-2, 8px)',
    textDecoration: 'none',
    zIndex: '1000',
  });
  skipLink.addEventListener('focus', () => { skipLink.style.top = '0'; });
  skipLink.addEventListener('blur', () => { skipLink.style.top = '-40px'; });
  return skipLink;
}
