// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  applyAriaAttributes,
  getBlockRole,
  getFocusableElements,
  createKeyboardNavigationHandler,
  FocusManager,
  prefersReducedMotion,
  applyReducedMotion,
  createLiveRegion,
  announceToScreenReader,
  getAccessibleLabel,
  addSkipLink,
} from '../src/a11y/semantics';
import {
  isTouchDevice,
  getTouchPoint,
  calculateSwipe,
  attachSwipeHandler,
  attachLongPressHandler,
  attachDoubleTapHandler,
  attachPinchHandler,
  applyTouchTarget,
  applyTouchAffordances,
  getViewportType,
  isMobileViewport,
} from '../src/mobile/touch';

describe('Accessibility Semantics', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('applyAriaAttributes', () => {
    it('should apply ARIA attributes to element', () => {
      const element = document.createElement('div');
      applyAriaAttributes(element, {
        role: 'button',
        'aria-label': 'Test button',
        'aria-expanded': false,
      });

      expect(element.getAttribute('role')).toBe('button');
      expect(element.getAttribute('aria-label')).toBe('Test button');
      expect(element.getAttribute('aria-expanded')).toBe('false');
    });

    it('should skip undefined attributes', () => {
      const element = document.createElement('div');
      applyAriaAttributes(element, {
        role: 'button',
        'aria-label': undefined,
      });

      expect(element.getAttribute('role')).toBe('button');
      expect(element.hasAttribute('aria-label')).toBe(false);
    });
  });

  describe('getBlockRole', () => {
    it('should return correct role for known block types', () => {
      expect(getBlockRole('heading')).toBe('heading');
      expect(getBlockRole('paragraph')).toBe('paragraph');
      expect(getBlockRole('list')).toBe('list');
      expect(getBlockRole('image')).toBe('img');
      expect(getBlockRole('button')).toBe('button');
    });

    it('should return "group" for unknown block types', () => {
      expect(getBlockRole('unknown')).toBe('group');
      expect(getBlockRole('custom-block')).toBe('group');
    });
  });

  describe('getFocusableElements', () => {
    it('should find all focusable elements', () => {
      container.innerHTML = `
        <a href="#">Link</a>
        <button>Button</button>
        <input type="text" />
        <div tabindex="0">Focusable div</div>
        <div>Not focusable</div>
      `;

      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(4);
    });

    it('should exclude disabled elements', () => {
      container.innerHTML = `
        <button>Enabled</button>
        <button disabled>Disabled</button>
        <input type="text" />
        <input type="text" disabled />
      `;

      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(2);
    });

    it('should exclude elements with tabindex="-1"', () => {
      container.innerHTML = `
        <div tabindex="0">Focusable</div>
        <div tabindex="-1">Not focusable</div>
      `;

      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(1);
    });
  });

  describe('createKeyboardNavigationHandler', () => {
    it('should handle arrow key navigation', () => {
      container.innerHTML = `
        <button tabindex="0">Button 1</button>
        <button tabindex="0">Button 2</button>
        <button tabindex="0">Button 3</button>
      `;

      const buttons = container.querySelectorAll('button');
      const handler = createKeyboardNavigationHandler(container);

      buttons[0].focus();
      expect(document.activeElement).toBe(buttons[0]);
      
      const event = new KeyboardEvent('keydown', { 
        key: 'ArrowDown',
      });
      Object.defineProperty(event, 'target', { value: buttons[0], writable: false });
      handler(event);
      expect(document.activeElement).toBe(buttons[1]);
    });

    it('should dispatch pulse:close on Escape', () => {
      const handler = createKeyboardNavigationHandler(container);
      const spy = vi.fn();
      container.addEventListener('pulse:close', spy);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      handler(event);

      expect(spy).toHaveBeenCalled();
    });

    it('should dispatch pulse:activate on Enter', () => {
      const button = document.createElement('button');
      container.appendChild(button);
      const handler = createKeyboardNavigationHandler(container);
      const spy = vi.fn();
      container.addEventListener('pulse:activate', spy);

      button.focus();
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      Object.defineProperty(event, 'target', { value: button, writable: false });
      handler(event);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('FocusManager', () => {
    it('should set initial focus to first focusable element', () => {
      container.innerHTML = `
        <button>Button 1</button>
        <button>Button 2</button>
      `;

      const manager = new FocusManager(container);
      manager.setInitialFocus();

      expect(document.activeElement).toBe(container.querySelector('button'));
    });

    it('should set focus to specified selector', () => {
      container.innerHTML = `
        <button>Button 1</button>
        <button class="target">Button 2</button>
      `;

      const manager = new FocusManager(container);
      manager.setInitialFocus({ initialFocusSelector: '.target' });

      expect(document.activeElement).toBe(container.querySelector('.target'));
    });

    it('should save and restore focus', () => {
      container.innerHTML = `
        <button class="external">External</button>
        <button class="internal">Internal</button>
      `;
      
      const externalButton = container.querySelector('.external') as HTMLElement;
      const internalButton = container.querySelector('.internal') as HTMLElement;
      
      externalButton.focus();
      expect(document.activeElement).toBe(externalButton);

      const manager = new FocusManager(container);
      manager.saveFocus();

      internalButton.focus();
      expect(document.activeElement).toBe(internalButton);

      manager.restoreFocus();
      expect(document.activeElement).toBe(externalButton);
    });
  });

  describe('prefersReducedMotion', () => {
    it('should return false in non-browser environment', () => {
      expect(prefersReducedMotion()).toBe(false);
    });
  });

  describe('applyReducedMotion', () => {
    it('should add class if reduced motion is preferred', () => {
      const element = document.createElement('div');
      vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
      } as MediaQueryList);

      applyReducedMotion(element);
      expect(element.classList.contains('pulse-reduced-motion')).toBe(true);
    });
  });

  describe('createLiveRegion', () => {
    it('should create live region with correct attributes', () => {
      const region = createLiveRegion('Test message', 'polite');

      expect(region.getAttribute('role')).toBe('status');
      expect(region.getAttribute('aria-live')).toBe('polite');
      expect(region.getAttribute('aria-atomic')).toBe('true');
      expect(region.textContent).toBe('Test message');
      expect(region.className).toBe('pulse-sr-only');
    });

    it('should create assertive live region', () => {
      const region = createLiveRegion('Urgent message', 'assertive');
      expect(region.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('announceToScreenReader', () => {
    it('should add and remove live region', async () => {
      announceToScreenReader('Test announcement', 'polite', 100);

      const region = document.querySelector('.pulse-sr-only');
      expect(region).toBeTruthy();
      expect(region?.textContent).toBe('Test announcement');

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(document.querySelector('.pulse-sr-only')).toBeFalsy();
    });
  });

  describe('getAccessibleLabel', () => {
    it('should return aria-label if present', () => {
      const element = document.createElement('button');
      element.setAttribute('aria-label', 'Close');
      expect(getAccessibleLabel(element)).toBe('Close');
    });

    it('should return text from aria-labelledby', () => {
      const label = document.createElement('span');
      label.id = 'label-id';
      label.textContent = 'Label text';
      document.body.appendChild(label);

      const element = document.createElement('button');
      element.setAttribute('aria-labelledby', 'label-id');

      expect(getAccessibleLabel(element)).toBe('Label text');
      document.body.removeChild(label);
    });

    it('should return text from associated label element', () => {
      const label = document.createElement('label');
      label.setAttribute('for', 'input-id');
      label.textContent = 'Input label';
      document.body.appendChild(label);

      const input = document.createElement('input');
      input.id = 'input-id';

      expect(getAccessibleLabel(input)).toBe('Input label');
      document.body.removeChild(label);
    });

    it('should fallback to text content', () => {
      const element = document.createElement('button');
      element.textContent = 'Button text';
      expect(getAccessibleLabel(element)).toBe('Button text');
    });
  });

  describe('addSkipLink', () => {
    it('should create skip link with correct attributes', () => {
      const skipLink = addSkipLink('main-content', 'Skip to content');

      expect(skipLink.tagName).toBe('A');
      expect(skipLink.getAttribute('href')).toBe('#main-content');
      expect(skipLink.textContent).toBe('Skip to content');
      expect(skipLink.className).toBe('pulse-skip-link');
    });

    it('should use default label', () => {
      const skipLink = addSkipLink('main');
      expect(skipLink.textContent).toBe('Skip to main content');
    });
  });
});

describe('Mobile Touch Interactions', () => {
  describe('isTouchDevice', () => {
    it('should detect touch support', () => {
      const result = isTouchDevice();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getTouchPoint', () => {
    it('should extract touch coordinates', () => {
      const touch = { clientX: 100, clientY: 200 } as Touch;
      const point = getTouchPoint(touch);

      expect(point.x).toBe(100);
      expect(point.y).toBe(200);
      expect(typeof point.timestamp).toBe('number');
    });
  });

  describe('calculateSwipe', () => {
    it('should calculate horizontal swipe right', () => {
      const start = { x: 0, y: 100, timestamp: 1000 };
      const end = { x: 100, y: 100, timestamp: 1200 };
      const swipe = calculateSwipe(start, end);

      expect(swipe?.direction).toBe('right');
      expect(swipe?.distance).toBe(100);
      expect(swipe?.duration).toBe(200);
    });

    it('should calculate horizontal swipe left', () => {
      const start = { x: 100, y: 100, timestamp: 1000 };
      const end = { x: 0, y: 100, timestamp: 1200 };
      const swipe = calculateSwipe(start, end);

      expect(swipe?.direction).toBe('left');
    });

    it('should calculate vertical swipe down', () => {
      const start = { x: 100, y: 0, timestamp: 1000 };
      const end = { x: 100, y: 100, timestamp: 1200 };
      const swipe = calculateSwipe(start, end);

      expect(swipe?.direction).toBe('down');
    });

    it('should calculate vertical swipe up', () => {
      const start = { x: 100, y: 100, timestamp: 1000 };
      const end = { x: 100, y: 0, timestamp: 1200 };
      const swipe = calculateSwipe(start, end);

      expect(swipe?.direction).toBe('up');
    });
  });

  describe('attachSwipeHandler', () => {
    it('should attach and detach swipe handler', () => {
      const element = document.createElement('div');
      const handler = vi.fn();
      const detach = attachSwipeHandler(element, handler);

      expect(typeof detach).toBe('function');
      detach();
    });
  });

  describe('attachLongPressHandler', () => {
    it('should attach and detach long press handler', () => {
      const element = document.createElement('div');
      const handler = vi.fn();
      const detach = attachLongPressHandler(element, handler);

      expect(typeof detach).toBe('function');
      detach();
    });
  });

  describe('attachDoubleTapHandler', () => {
    it('should attach and detach double tap handler', () => {
      const element = document.createElement('div');
      const handler = vi.fn();
      const detach = attachDoubleTapHandler(element, handler);

      expect(typeof detach).toBe('function');
      detach();
    });
  });

  describe('attachPinchHandler', () => {
    it('should attach and detach pinch handler', () => {
      const element = document.createElement('div');
      const handler = vi.fn();
      const detach = attachPinchHandler(element, handler);

      expect(typeof detach).toBe('function');
      detach();
    });
  });

  describe('applyTouchTarget', () => {
    it('should apply minimum touch target size', () => {
      const element = document.createElement('button');
      document.body.appendChild(element);

      applyTouchTarget(element, 44);

      const minWidth = element.style.minWidth;
      const minHeight = element.style.minHeight;

      expect(minWidth).toBe('44px');
      expect(minHeight).toBe('44px');

      document.body.removeChild(element);
    });
  });

  describe('applyTouchAffordances', () => {
    it('should apply touch affordances to interactive elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button</button>
        <a href="#">Link</a>
        <input type="text" />
      `;
      document.body.appendChild(container);

      applyTouchAffordances(container, 44);

      const button = container.querySelector('button');
      const link = container.querySelector('a');
      const input = container.querySelector('input');

      expect(button?.classList.contains('pulse-touch-target')).toBe(true);
      expect(link?.classList.contains('pulse-touch-target')).toBe(true);
      expect(input?.classList.contains('pulse-touch-target')).toBe(true);

      document.body.removeChild(container);
    });
  });

  describe('getViewportType', () => {
    it('should return viewport type based on width', () => {
      const type = getViewportType();
      expect(['mobile', 'tablet', 'desktop', 'wide']).toContain(type);
    });
  });

  describe('isMobileViewport', () => {
    it('should return boolean for mobile viewport', () => {
      const result = isMobileViewport();
      expect(typeof result).toBe('boolean');
    });
  });
});
