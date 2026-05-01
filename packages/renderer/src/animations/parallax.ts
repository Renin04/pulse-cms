import type { ReducedMotionSetting } from "./registry";

export type ParallaxAxis = "x" | "y" | "both";
export type ParallaxDirection = "normal" | "inverse";

export interface ParallaxConfig {
  enabled?: boolean;
  axis?: ParallaxAxis;
  direction?: ParallaxDirection;
  speed?: number;
  maxOffsetPx?: number;
  throttleMs?: number;
  reducedMotion?: ReducedMotionSetting;
  disabled?: boolean;
}

export interface ResolvedParallaxConfig {
  enabled: boolean;
  axis: ParallaxAxis;
  direction: ParallaxDirection;
  speed: number;
  maxOffsetPx: number;
  throttleMs: number;
  reducedMotion: ReducedMotionSetting;
  disabled: boolean;
}

export interface ParallaxRuntimeContext {
  prefersReducedMotion?: boolean;
}

export interface ParallaxTargetSnapshot {
  top: number;
  height: number;
}

export interface ParallaxViewportSnapshot {
  scrollY: number;
  viewportHeight: number;
}

export interface ParallaxVector {
  progress: number;
  x: number;
  y: number;
}

export interface ParallaxState {
  lastUpdateMs: number;
  updates: number;
}

export interface ParallaxContract {
  className: string;
  attributes: Record<string, string>;
  style: Record<string, string>;
  active: boolean;
}

export const DEFAULT_PARALLAX_CONFIG: ResolvedParallaxConfig = {
  enabled: true,
  axis: "y",
  direction: "normal",
  speed: 0.2,
  maxOffsetPx: 48,
  throttleMs: 16,
  reducedMotion: "system",
  disabled: false,
};

const ALLOWED_AXIS: ParallaxAxis[] = ["x", "y", "both"];
const ALLOWED_DIRECTION: ParallaxDirection[] = ["normal", "inverse"];

function clamp(value: number, min: number, max: number): number {
  const numeric = Number.isFinite(value) ? value : min;
  if (numeric < min) return min;
  if (numeric > max) return max;
  return numeric;
}

function normalizeInteger(value: number | undefined, fallback: number): number {
  const normalized = Math.floor(Number.isFinite(value) ? (value as number) : fallback);
  if (normalized < 0) return 0;
  return normalized;
}

function resolveAxis(axis: ParallaxAxis | undefined): ParallaxAxis {
  if (!axis) return DEFAULT_PARALLAX_CONFIG.axis;
  return ALLOWED_AXIS.includes(axis) ? axis : DEFAULT_PARALLAX_CONFIG.axis;
}

function resolveDirection(
  direction: ParallaxDirection | undefined,
): ParallaxDirection {
  if (!direction) return DEFAULT_PARALLAX_CONFIG.direction;
  return ALLOWED_DIRECTION.includes(direction)
    ? direction
    : DEFAULT_PARALLAX_CONFIG.direction;
}

function resolveReducedMotion(
  reducedMotion: ReducedMotionSetting | undefined,
): ReducedMotionSetting {
  if (!reducedMotion) return DEFAULT_PARALLAX_CONFIG.reducedMotion;
  if (
    reducedMotion === "always" ||
    reducedMotion === "never" ||
    reducedMotion === "system"
  ) {
    return reducedMotion;
  }
  return DEFAULT_PARALLAX_CONFIG.reducedMotion;
}

export function resolveParallaxConfig(
  config: ParallaxConfig = {},
): ResolvedParallaxConfig {
  return {
    enabled: config.enabled ?? DEFAULT_PARALLAX_CONFIG.enabled,
    axis: resolveAxis(config.axis),
    direction: resolveDirection(config.direction),
    speed: clamp(config.speed ?? DEFAULT_PARALLAX_CONFIG.speed, 0, 1),
    maxOffsetPx: normalizeInteger(
      config.maxOffsetPx,
      DEFAULT_PARALLAX_CONFIG.maxOffsetPx,
    ),
    throttleMs: normalizeInteger(
      config.throttleMs,
      DEFAULT_PARALLAX_CONFIG.throttleMs,
    ),
    reducedMotion: resolveReducedMotion(config.reducedMotion),
    disabled: config.disabled ?? DEFAULT_PARALLAX_CONFIG.disabled,
  };
}

function isReducedMotionActive(
  config: ResolvedParallaxConfig,
  context: ParallaxRuntimeContext = {},
): boolean {
  if (config.reducedMotion === "always") return true;
  if (config.reducedMotion === "never") return false;
  return context.prefersReducedMotion ?? false;
}

export function isParallaxActive(
  config: ParallaxConfig = {},
  context: ParallaxRuntimeContext = {},
): boolean {
  const resolved = resolveParallaxConfig(config);
  if (!resolved.enabled) return false;
  if (resolved.disabled) return false;
  if (isReducedMotionActive(resolved, context)) return false;
  if (resolved.maxOffsetPx === 0 || resolved.speed === 0) return false;
  return true;
}

function clampProgress(progress: number): number {
  return clamp(progress, -1, 1);
}

export function computeParallaxProgress(
  target: ParallaxTargetSnapshot,
  viewport: ParallaxViewportSnapshot,
  config: ParallaxConfig = {},
): number {
  const resolved = resolveParallaxConfig(config);
  if (target.height <= 0 || viewport.viewportHeight <= 0) return 0;

  const targetCenter = target.top + target.height / 2;
  const viewportCenter = viewport.scrollY + viewport.viewportHeight / 2;
  const normalizer = Math.max(1, (viewport.viewportHeight + target.height) / 2);

  const rawProgress = (targetCenter - viewportCenter) / normalizer;
  const directionMultiplier = resolved.direction === "inverse" ? -1 : 1;

  return clampProgress(rawProgress * directionMultiplier);
}

export function computeParallaxVector(
  target: ParallaxTargetSnapshot,
  viewport: ParallaxViewportSnapshot,
  config: ParallaxConfig = {},
): ParallaxVector {
  const resolved = resolveParallaxConfig(config);
  const progress = computeParallaxProgress(target, viewport, resolved);
  const offset = Math.round(progress * resolved.speed * resolved.maxOffsetPx);

  const x = resolved.axis === "x" || resolved.axis === "both" ? offset : 0;
  const y = resolved.axis === "y" || resolved.axis === "both" ? offset : 0;

  return {
    progress,
    x,
    y,
  };
}

export function shouldUpdateParallax(
  lastUpdateMs: number,
  nowMs: number,
  config: ParallaxConfig = {},
): boolean {
  const resolved = resolveParallaxConfig(config);
  if (lastUpdateMs < 0) return true;
  return nowMs - lastUpdateMs >= resolved.throttleMs;
}

export function createParallaxState(): ParallaxState {
  return {
    lastUpdateMs: -1,
    updates: 0,
  };
}

export function advanceParallaxState(
  state: ParallaxState,
  nowMs: number,
  config: ParallaxConfig = {},
): ParallaxState {
  if (!shouldUpdateParallax(state.lastUpdateMs, nowMs, config)) {
    return state;
  }

  return {
    lastUpdateMs: nowMs,
    updates: state.updates + 1,
  };
}

export function createParallaxContract(
  config: ParallaxConfig = {},
  context: ParallaxRuntimeContext = {},
): ParallaxContract {
  const resolved = resolveParallaxConfig(config);
  const active = isParallaxActive(resolved, context);

  return {
    className: active
      ? `pulse-parallax pulse-parallax--${resolved.axis}`
      : "pulse-parallax pulse-parallax--inactive",
    attributes: {
      "data-pulse-parallax": active ? "true" : "false",
      "data-pulse-parallax-axis": resolved.axis,
      "data-pulse-parallax-direction": resolved.direction,
      "data-pulse-parallax-throttle": resolved.throttleMs.toString(),
    },
    style: {
      "--pulse-parallax-speed": resolved.speed.toString(),
      "--pulse-parallax-max-offset": `${resolved.maxOffsetPx}px`,
    },
    active,
  };
}

export function createParallaxTransformStyle(
  vector: ParallaxVector,
): Record<string, string> {
  return {
    "--pulse-parallax-x": `${vector.x}px`,
    "--pulse-parallax-y": `${vector.y}px`,
    transform: `translate3d(${vector.x}px, ${vector.y}px, 0)`,
  };
}
