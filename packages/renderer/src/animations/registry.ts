export type AnimationType = "fade" | "slide";
export type AnimationTrigger = "load" | "scroll";
export type ReducedMotionSetting = "system" | "always" | "never";
export type SlideDirection = "up" | "down" | "left" | "right";

export interface BlockAnimationConfig {
  type?: AnimationType;
  trigger?: AnimationTrigger;
  durationMs?: number;
  delayMs?: number;
  easing?: string;
  once?: boolean;
  reducedMotion?: ReducedMotionSetting;
  disabled?: boolean;
  slideDirection?: SlideDirection;
  slideDistancePx?: number;
}

export interface ResolvedBlockAnimationConfig {
  type: AnimationType;
  trigger: AnimationTrigger;
  durationMs: number;
  delayMs: number;
  easing: string;
  once: boolean;
  reducedMotion: ReducedMotionSetting;
  disabled: boolean;
  slideDirection: SlideDirection;
  slideDistancePx: number;
}

export interface AnimationRuntimeContext {
  prefersReducedMotion?: boolean;
}

export interface AnimationRenderContract {
  className: string;
  attributes: Record<string, string>;
  style: Record<string, string>;
  active: boolean;
}

export type AnimationContractBuilder = (
  config: ResolvedBlockAnimationConfig,
  context: AnimationRuntimeContext,
) => AnimationRenderContract;

export const DEFAULT_ANIMATION_CONFIG: ResolvedBlockAnimationConfig = {
  type: "fade",
  trigger: "load",
  durationMs: 260,
  delayMs: 0,
  easing: "ease-out",
  once: true,
  reducedMotion: "system",
  disabled: false,
  slideDirection: "up",
  slideDistancePx: 24,
};

const ALLOWED_TYPES: AnimationType[] = ["fade", "slide"];
const ALLOWED_TRIGGERS: AnimationTrigger[] = ["load", "scroll"];
const ALLOWED_REDUCED_MOTION: ReducedMotionSetting[] = [
  "system",
  "always",
  "never",
];
const ALLOWED_DIRECTIONS: SlideDirection[] = ["up", "down", "left", "right"];

function sanitizeInteger(value: number | undefined, fallback: number): number {
  const normalized = Math.floor(Number.isFinite(value) ? (value as number) : fallback);
  if (normalized < 0) return 0;
  return normalized;
}

function sanitizeType(value: AnimationType | undefined): AnimationType {
  if (!value) return DEFAULT_ANIMATION_CONFIG.type;
  return ALLOWED_TYPES.includes(value) ? value : DEFAULT_ANIMATION_CONFIG.type;
}

function sanitizeTrigger(value: AnimationTrigger | undefined): AnimationTrigger {
  if (!value) return DEFAULT_ANIMATION_CONFIG.trigger;
  return ALLOWED_TRIGGERS.includes(value)
    ? value
    : DEFAULT_ANIMATION_CONFIG.trigger;
}

function sanitizeReducedMotion(
  value: ReducedMotionSetting | undefined,
): ReducedMotionSetting {
  if (!value) return DEFAULT_ANIMATION_CONFIG.reducedMotion;
  return ALLOWED_REDUCED_MOTION.includes(value)
    ? value
    : DEFAULT_ANIMATION_CONFIG.reducedMotion;
}

function sanitizeDirection(value: SlideDirection | undefined): SlideDirection {
  if (!value) return DEFAULT_ANIMATION_CONFIG.slideDirection;
  return ALLOWED_DIRECTIONS.includes(value)
    ? value
    : DEFAULT_ANIMATION_CONFIG.slideDirection;
}

function sanitizeEasing(value: string | undefined): string {
  if (!value || value.trim() === "") return DEFAULT_ANIMATION_CONFIG.easing;
  return value.trim();
}

export function resolveAnimationConfig(
  config: BlockAnimationConfig = {},
): ResolvedBlockAnimationConfig {
  return {
    type: sanitizeType(config.type),
    trigger: sanitizeTrigger(config.trigger),
    durationMs: sanitizeInteger(config.durationMs, DEFAULT_ANIMATION_CONFIG.durationMs),
    delayMs: sanitizeInteger(config.delayMs, DEFAULT_ANIMATION_CONFIG.delayMs),
    easing: sanitizeEasing(config.easing),
    once: config.once ?? DEFAULT_ANIMATION_CONFIG.once,
    reducedMotion: sanitizeReducedMotion(config.reducedMotion),
    disabled: config.disabled ?? DEFAULT_ANIMATION_CONFIG.disabled,
    slideDirection: sanitizeDirection(config.slideDirection),
    slideDistancePx: sanitizeInteger(
      config.slideDistancePx,
      DEFAULT_ANIMATION_CONFIG.slideDistancePx,
    ),
  };
}

export function isReducedMotionActive(
  config: ResolvedBlockAnimationConfig,
  context: AnimationRuntimeContext = {},
): boolean {
  if (config.reducedMotion === "always") return true;
  if (config.reducedMotion === "never") return false;
  return context.prefersReducedMotion ?? false;
}

export class AnimationRegistry {
  private static instance: AnimationRegistry | null = null;

  private readonly builders = new Map<AnimationType, AnimationContractBuilder>();

  static getInstance(): AnimationRegistry {
    if (!AnimationRegistry.instance) {
      AnimationRegistry.instance = new AnimationRegistry();
    }
    return AnimationRegistry.instance;
  }

  static resetInstance(): void {
    AnimationRegistry.instance = null;
  }

  register(
    type: AnimationType,
    builder: AnimationContractBuilder,
    options: { override?: boolean } = {},
  ): void {
    if (!options.override && this.builders.has(type)) {
      throw new Error(`Animation "${type}" is already registered.`);
    }
    this.builders.set(type, builder);
  }

  has(type: AnimationType): boolean {
    return this.builders.has(type);
  }

  get(type: AnimationType): AnimationContractBuilder | undefined {
    return this.builders.get(type);
  }

  unregister(type: AnimationType): boolean {
    return this.builders.delete(type);
  }

  clear(): void {
    this.builders.clear();
  }

  registeredTypes(): AnimationType[] {
    return Array.from(this.builders.keys());
  }
}

function buildInactiveContract(
  config: ResolvedBlockAnimationConfig,
  reason: "disabled" | "reduced-motion" | "unregistered",
): AnimationRenderContract {
  return {
    className: "pulse-anim pulse-anim--inactive",
    attributes: {
      "data-pulse-animation": config.type,
      "data-pulse-animation-trigger": config.trigger,
      "data-pulse-animation-state": reason,
    },
    style: {
      "--pulse-anim-duration": "0ms",
      "--pulse-anim-delay": "0ms",
    },
    active: false,
  };
}

export function buildAnimationContract(
  config: BlockAnimationConfig,
  context: AnimationRuntimeContext = {},
  registry: AnimationRegistry = AnimationRegistry.getInstance(),
): AnimationRenderContract {
  const resolved = resolveAnimationConfig(config);

  if (resolved.disabled) {
    return buildInactiveContract(resolved, "disabled");
  }

  if (isReducedMotionActive(resolved, context)) {
    return buildInactiveContract(resolved, "reduced-motion");
  }

  const builder = registry.get(resolved.type);
  if (!builder) {
    return buildInactiveContract(resolved, "unregistered");
  }

  return builder(resolved, context);
}
