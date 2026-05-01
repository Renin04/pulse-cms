export interface TouchConfig {
  swipeThreshold?: number;
  swipeTimeLimit?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
}

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  duration: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export type SwipeHandler = (event: SwipeEvent) => void;
export type LongPressHandler = (x: number, y: number) => void;
export type DoubleTapHandler = (x: number, y: number) => void;
export type PinchHandler = (scale: number, centerX: number, centerY: number) => void;

const DEFAULT_CONFIG: Required<TouchConfig> = {
  swipeThreshold: 50,
  swipeTimeLimit: 300,
  longPressDelay: 500,
  doubleTapDelay: 300,
};

/**
 * Detect if the current environment is a touch device
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}

/**
 * Get touch coordinates from a TouchEvent
 */
export function getTouchPoint(touch: Touch): TouchPoint {
  return {
    x: touch.clientX,
    y: touch.clientY,
    timestamp: Date.now(),
  };
}

/**
 * Calculate swipe direction and distance
 */
export function calculateSwipe(
  start: TouchPoint,
  end: TouchPoint
): SwipeEvent | null {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const duration = end.timestamp - start.timestamp;

  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  let direction: SwipeEvent['direction'];
  if (absX > absY) {
    direction = deltaX > 0 ? 'right' : 'left';
  } else {
    direction = deltaY > 0 ? 'down' : 'up';
  }

  return {
    direction,
    distance,
    duration,
    startX: start.x,
    startY: start.y,
    endX: end.x,
    endY: end.y,
  };
}

/**
 * Attach swipe gesture detection to an element
 */
export function attachSwipeHandler(
  element: HTMLElement,
  onSwipe: SwipeHandler,
  config: TouchConfig = {}
): () => void {
  const { swipeThreshold, swipeTimeLimit } = { ...DEFAULT_CONFIG, ...config };

  let startPoint: TouchPoint | null = null;

  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch) startPoint = getTouchPoint(touch);
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!startPoint) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    const endPoint = getTouchPoint(touch);
    const swipe = calculateSwipe(startPoint, endPoint);

    if (
      swipe &&
      swipe.distance >= swipeThreshold &&
      swipe.duration <= swipeTimeLimit
    ) {
      onSwipe(swipe);
    }

    startPoint = null;
  };

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchend', onTouchEnd, { passive: true });

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchend', onTouchEnd);
  };
}

/**
 * Attach long press detection to an element
 */
export function attachLongPressHandler(
  element: HTMLElement,
  onLongPress: LongPressHandler,
  config: TouchConfig = {}
): () => void {
  const { longPressDelay } = { ...DEFAULT_CONFIG, ...config };
  let timer: ReturnType<typeof setTimeout> | null = null;

  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const { clientX, clientY } = touch;
    timer = setTimeout(() => onLongPress(clientX, clientY), longPressDelay);
  };

  const cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchend', cancel, { passive: true });
  element.addEventListener('touchmove', cancel, { passive: true });
  element.addEventListener('touchcancel', cancel, { passive: true });

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchend', cancel);
    element.removeEventListener('touchmove', cancel);
    element.removeEventListener('touchcancel', cancel);
    cancel();
  };
}

/**
 * Attach double tap detection to an element
 */
export function attachDoubleTapHandler(
  element: HTMLElement,
  onDoubleTap: DoubleTapHandler,
  config: TouchConfig = {}
): () => void {
  const { doubleTapDelay } = { ...DEFAULT_CONFIG, ...config };
  let lastTap: TouchPoint | null = null;

  const onTouchEnd = (e: TouchEvent) => {
    const touch = e.changedTouches[0];
    if (!touch) return;

    const now = Date.now();
    const point: TouchPoint = { x: touch.clientX, y: touch.clientY, timestamp: now };

    if (lastTap && now - lastTap.timestamp <= doubleTapDelay) {
      onDoubleTap(point.x, point.y);
      lastTap = null;
    } else {
      lastTap = point;
    }
  };

  element.addEventListener('touchend', onTouchEnd, { passive: true });
  return () => element.removeEventListener('touchend', onTouchEnd);
}

/**
 * Attach pinch-to-zoom detection to an element
 */
export function attachPinchHandler(
  element: HTMLElement,
  onPinch: PinchHandler
): () => void {
  let initialDistance: number | null = null;

  const getDistance = (touches: TouchList): number => {
    const [a, b] = [touches[0], touches[1]];
    if (!a || !b) return 0;
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touches: TouchList): { x: number; y: number } => {
    const [a, b] = [touches[0], touches[1]];
    if (!a || !b) return { x: 0, y: 0 };
    return {
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
    };
  };

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistance = getDistance(e.touches);
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 2 || initialDistance === null) return;
    const currentDistance = getDistance(e.touches);
    const scale = currentDistance / initialDistance;
    const center = getCenter(e.touches);
    onPinch(scale, center.x, center.y);
  };

  const onTouchEnd = () => { initialDistance = null; };

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchmove', onTouchMove, { passive: true });
  element.addEventListener('touchend', onTouchEnd, { passive: true });

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchmove', onTouchMove);
    element.removeEventListener('touchend', onTouchEnd);
  };
}

/**
 * Apply mobile-friendly touch target sizing to an element
 */
export function applyTouchTarget(element: HTMLElement, minSize: number = 44): void {
  const rect = element.getBoundingClientRect();
  if (rect.width < minSize) {
    element.style.minWidth = `${minSize}px`;
  }
  if (rect.height < minSize) {
    element.style.minHeight = `${minSize}px`;
  }
}

/**
 * Apply touch affordance classes to interactive elements within a container
 */
export function applyTouchAffordances(
  container: HTMLElement,
  minTouchSize: number = 44
): void {
  const interactiveSelector = 'button, a, input, select, textarea, [role="button"]';
  const elements = container.querySelectorAll<HTMLElement>(interactiveSelector);
  elements.forEach((el) => {
    el.classList.add('pulse-touch-target');
    applyTouchTarget(el, minTouchSize);
  });
}

/**
 * Prevent default scroll behavior on touch (useful for custom scroll containers)
 */
export function preventTouchScroll(element: HTMLElement): () => void {
  const handler = (e: TouchEvent) => e.preventDefault();
  element.addEventListener('touchmove', handler, { passive: false });
  return () => element.removeEventListener('touchmove', handler);
}

/**
 * Detect current viewport type
 */
export function getViewportType(): 'mobile' | 'tablet' | 'desktop' | 'wide' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1440) return 'desktop';
  return 'wide';
}

/**
 * Check if viewport is mobile
 */
export function isMobileViewport(): boolean {
  return getViewportType() === 'mobile';
}
