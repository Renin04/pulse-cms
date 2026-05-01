import type { ReducedMotionSetting } from "../animations/registry";

export type HoverEffectType = "lift" | "scale" | "glow" | "underline";
export type HoverPointerMode = "all" | "fine" | "coarse";
export type HoverRuntimePointer = "mouse" | "pen" | "touch";

export interface HoverEffectConfig {
  enabled?: boolean;
  effect?: HoverEffectType;
  intensity?: number;
  enterDurationMs?: number;
  leaveDurationMs?: number;
  pointerMode?: HoverPointerMode;
  reducedMotion?: ReducedMotionSetting;
  disabled?: boolean;
}

export interface ResolvedHoverEffectConfig {
  enabled: boolean;
  effect: HoverEffectType;
  intensity: number;
  enterDurationMs: number;
  leaveDurationMs: number;
  pointerMode: HoverPointerMode;
  reducedMotion: ReducedMotionSetting;
  disabled: boolean;
}

export interface HoverRuntimeContext {
  prefersReducedMotion?: boolean;
  pointerType?: HoverRuntimePointer;
}

export type HoverEventType = "enter" | "leave" | "toggle" | "reset";

export interface HoverState {
  hovered: boolean;
  transitions: number;
  lastEvent: HoverEventType | "init";
}

export interface HoverContract {
  className: string;
  attributes: Record<string, string>;
  style: Record<string, string>;
  active: boolean;
}

export const DEFAULT_HOVER_CONFIG: ResolvedHoverEffectConfig = {
  enabled: true,
  effect: "lift",
  intensity: 0.6,
  enterDurationMs: 160,
  leaveDurationMs: 120,
  pointerMode: "fine",
  reducedMotion: "system",
  disabled: false,
};

const ALLOWED_EFFECTS: HoverEffectType[] = ["lift", "scale", "glow", "underline"];
const ALLOWED_POINTER_MODES: HoverPointerMode[] = ["all", "fine", "coarse"];

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

function resolveEffect(value: HoverEffectType | undefined): HoverEffectType {
  if (!value) return DEFAULT_HOVER_CONFIG.effect;
  return ALLOWED_EFFECTS.includes(value) ? value : DEFAULT_HOVER_CONFIG.effect;
}

function resolvePointerMode(value: HoverPointerMode | undefined): HoverPointerMode {
  if (!value) return DEFAULT_HOVER_CONFIG.pointerMode;
  return ALLOWED_POINTER_MODES.includes(value)
    ? value
    : DEFAULT_HOVER_CONFIG.pointerMode;
}

function resolveReducedMotion(
  value: ReducedMotionSetting | undefined,
): ReducedMotionSetting {
  if (!value) return DEFAULT_HOVER_CONFIG.reducedMotion;
  if (value === "always" || value === "never" || value === "system") return value;
  return DEFAULT_HOVER_CONFIG.reducedMotion;
}

function isReducedMotionActive(
  config: ResolvedHoverEffectConfig,
  context: HoverRuntimeContext = {},
): boolean {
  if (config.reducedMotion === "always") return true;
  if (config.reducedMotion === "never") return false;
  return context.prefersReducedMotion ?? false;
}

function matchesPointerMode(
  mode: HoverPointerMode,
  pointerType: HoverRuntimePointer | undefined,
): boolean {
  if (mode === "all") return true;

  const resolvedPointerType = pointerType ?? "mouse";
  if (mode === "fine") {
    return resolvedPointerType === "mouse" || resolvedPointerType === "pen";
  }
  return resolvedPointerType === "touch";
}

export function resolveHoverEffectConfig(
  config: HoverEffectConfig = {},
): ResolvedHoverEffectConfig {
  return {
    enabled: config.enabled ?? DEFAULT_HOVER_CONFIG.enabled,
    effect: resolveEffect(config.effect),
    intensity: clamp(
      config.intensity ?? DEFAULT_HOVER_CONFIG.intensity,
      0,
      1,
    ),
    enterDurationMs: normalizeInteger(
      config.enterDurationMs,
      DEFAULT_HOVER_CONFIG.enterDurationMs,
    ),
    leaveDurationMs: normalizeInteger(
      config.leaveDurationMs,
      DEFAULT_HOVER_CONFIG.leaveDurationMs,
    ),
    pointerMode: resolvePointerMode(config.pointerMode),
    reducedMotion: resolveReducedMotion(config.reducedMotion),
    disabled: config.disabled ?? DEFAULT_HOVER_CONFIG.disabled,
  };
}

export function isHoverEffectActive(
  config: HoverEffectConfig = {},
  context: HoverRuntimeContext = {},
): boolean {
  const resolved = resolveHoverEffectConfig(config);

  if (!resolved.enabled) return false;
  if (resolved.disabled) return false;
  if (isReducedMotionActive(resolved, context)) return false;
  if (!matchesPointerMode(resolved.pointerMode, context.pointerType)) return false;

  return true;
}

export function createHoverContract(
  config: HoverEffectConfig = {},
  context: HoverRuntimeContext = {},
): HoverContract {
  const resolved = resolveHoverEffectConfig(config);
  const active = isHoverEffectActive(resolved, context);

  return {
    className: active
      ? `pulse-hover pulse-hover--${resolved.effect}`
      : "pulse-hover pulse-hover--inactive",
    attributes: {
      "data-pulse-hover": active ? "true" : "false",
      "data-pulse-hover-effect": resolved.effect,
      "data-pulse-hover-pointer": resolved.pointerMode,
    },
    style: {
      "--pulse-hover-intensity": resolved.intensity.toString(),
      "--pulse-hover-enter-duration": `${resolved.enterDurationMs}ms`,
      "--pulse-hover-leave-duration": `${resolved.leaveDurationMs}ms`,
    },
    active,
  };
}

export function createHoverState(initialHovered = false): HoverState {
  return {
    hovered: initialHovered,
    transitions: 0,
    lastEvent: "init",
  };
}

export function applyHoverEvent(
  state: HoverState,
  event: HoverEventType,
  config: HoverEffectConfig = {},
  context: HoverRuntimeContext = {},
): HoverState {
  if (!isHoverEffectActive(config, context)) {
    if (event === "reset") {
      return {
        hovered: false,
        transitions: state.transitions,
        lastEvent: "reset",
      };
    }

    return {
      hovered: state.hovered,
      transitions: state.transitions,
      lastEvent: event,
    };
  }

  let nextHovered = state.hovered;

  if (event === "enter") {
    nextHovered = true;
  } else if (event === "leave") {
    nextHovered = false;
  } else if (event === "toggle") {
    nextHovered = !state.hovered;
  } else if (event === "reset") {
    nextHovered = false;
  }

  const transitioned = nextHovered !== state.hovered;

  return {
    hovered: nextHovered,
    transitions: transitioned ? state.transitions + 1 : state.transitions,
    lastEvent: event,
  };
}
