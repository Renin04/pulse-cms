import {
  isReducedMotionActive,
  type AnimationRenderContract,
  type AnimationRuntimeContext,
  type ResolvedBlockAnimationConfig,
} from "./registry";

export interface ScrollTriggerConfig {
  enabled: boolean;
  threshold: number;
  rootMargin: string;
  once: boolean;
  offsetPx: number;
  minVisiblePx: number;
}

export interface ScrollTargetSnapshot {
  top: number;
  height: number;
  hasTriggered?: boolean;
}

export interface ScrollViewportSnapshot {
  scrollY: number;
  viewportHeight: number;
}

export const DEFAULT_SCROLL_TRIGGER_CONFIG: ScrollTriggerConfig = {
  enabled: true,
  threshold: 0.2,
  rootMargin: "0px 0px -10% 0px",
  once: true,
  offsetPx: 0,
  minVisiblePx: 16,
};

function clamp(value: number, min: number, max: number): number {
  const finite = Number.isFinite(value) ? value : min;
  if (finite < min) return min;
  if (finite > max) return max;
  return finite;
}

function sanitizeRootMargin(rootMargin: string | undefined): string {
  if (!rootMargin || rootMargin.trim() === "") {
    return DEFAULT_SCROLL_TRIGGER_CONFIG.rootMargin;
  }
  return rootMargin.trim();
}

function normalizePixelValue(value: number, fallback: number): number {
  const normalized = Math.floor(Number.isFinite(value) ? value : fallback);
  if (normalized < 0) return 0;
  return normalized;
}

export function resolveScrollTriggerConfig(
  config: Partial<ScrollTriggerConfig> = {},
): ScrollTriggerConfig {
  return {
    enabled: config.enabled ?? DEFAULT_SCROLL_TRIGGER_CONFIG.enabled,
    threshold: clamp(
      config.threshold ?? DEFAULT_SCROLL_TRIGGER_CONFIG.threshold,
      0,
      1,
    ),
    rootMargin: sanitizeRootMargin(config.rootMargin),
    once: config.once ?? DEFAULT_SCROLL_TRIGGER_CONFIG.once,
    offsetPx: normalizePixelValue(
      config.offsetPx ?? DEFAULT_SCROLL_TRIGGER_CONFIG.offsetPx,
      DEFAULT_SCROLL_TRIGGER_CONFIG.offsetPx,
    ),
    minVisiblePx: normalizePixelValue(
      config.minVisiblePx ?? DEFAULT_SCROLL_TRIGGER_CONFIG.minVisiblePx,
      DEFAULT_SCROLL_TRIGGER_CONFIG.minVisiblePx,
    ),
  };
}

export function computeVisiblePixels(
  target: ScrollTargetSnapshot,
  viewport: ScrollViewportSnapshot,
): number {
  const topInViewport = target.top - viewport.scrollY;
  const bottomInViewport = topInViewport + target.height;

  const visibleTop = Math.max(topInViewport, 0);
  const visibleBottom = Math.min(bottomInViewport, viewport.viewportHeight);

  return Math.max(0, visibleBottom - visibleTop);
}

export function computeVisibilityRatio(
  target: ScrollTargetSnapshot,
  viewport: ScrollViewportSnapshot,
): number {
  if (target.height <= 0 || viewport.viewportHeight <= 0) return 0;
  const visiblePx = computeVisiblePixels(target, viewport);
  return clamp(visiblePx / target.height, 0, 1);
}

export function shouldTriggerOnScroll(
  target: ScrollTargetSnapshot,
  viewport: ScrollViewportSnapshot,
  config: Partial<ScrollTriggerConfig> = {},
): boolean {
  const resolved = resolveScrollTriggerConfig(config);

  if (!resolved.enabled) return false;
  if (resolved.once && target.hasTriggered) return false;
  if (target.height <= 0 || viewport.viewportHeight <= 0) return false;

  const visiblePx = computeVisiblePixels(target, viewport);
  if (visiblePx < resolved.minVisiblePx) return false;

  const ratio = computeVisibilityRatio(target, viewport);
  if (ratio < resolved.threshold) return false;

  const topInViewport = target.top - viewport.scrollY;
  const triggerLine = viewport.viewportHeight - resolved.offsetPx;
  return topInViewport <= triggerLine;
}

export function shouldEnableScrollTrigger(
  animationConfig: ResolvedBlockAnimationConfig,
  context: AnimationRuntimeContext = {},
  scrollConfig: Partial<ScrollTriggerConfig> = {},
): boolean {
  const resolved = resolveScrollTriggerConfig(scrollConfig);
  if (!resolved.enabled) return false;
  if (animationConfig.trigger !== "scroll") return false;
  if (isReducedMotionActive(animationConfig, context)) return false;
  if (animationConfig.disabled) return false;
  return true;
}

export function createScrollTriggerAttributes(
  config: Partial<ScrollTriggerConfig> = {},
): Record<string, string> {
  const resolved = resolveScrollTriggerConfig(config);
  if (!resolved.enabled) return {};

  return {
    "data-pulse-scroll-trigger": "true",
    "data-pulse-scroll-threshold": resolved.threshold.toString(),
    "data-pulse-scroll-once": resolved.once ? "true" : "false",
    "data-pulse-scroll-margin": resolved.rootMargin,
    "data-pulse-scroll-offset": resolved.offsetPx.toString(),
    "data-pulse-scroll-min-visible": resolved.minVisiblePx.toString(),
  };
}

function mergeClassName(base: string, nextToken: string): string {
  if (!base.trim()) return nextToken;
  const tokens = new Set(base.split(/\s+/).filter(Boolean));
  tokens.add(nextToken);
  return Array.from(tokens).join(" ");
}

export function applyScrollTriggerContract(
  contract: AnimationRenderContract,
  config: Partial<ScrollTriggerConfig> = {},
): AnimationRenderContract {
  const attrs = createScrollTriggerAttributes(config);
  if (Object.keys(attrs).length === 0) {
    return contract;
  }

  return {
    ...contract,
    className: mergeClassName(contract.className, "pulse-anim--scroll"),
    attributes: {
      ...contract.attributes,
      ...attrs,
    },
  };
}
