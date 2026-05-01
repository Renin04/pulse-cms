import {
  AnimationRegistry,
  type AnimationRenderContract,
  type AnimationRuntimeContext,
  type ResolvedBlockAnimationConfig,
} from "./registry";

function serializeClassName(tokens: string[]): string {
  const unique = Array.from(new Set(tokens.map((token) => token.trim()).filter(Boolean)));
  return unique.join(" ");
}

function baseAnimationAttributes(
  config: ResolvedBlockAnimationConfig,
): Record<string, string> {
  return {
    "data-pulse-animation": config.type,
    "data-pulse-animation-trigger": config.trigger,
    "data-pulse-animation-once": config.once ? "true" : "false",
  };
}

function baseAnimationStyle(
  config: ResolvedBlockAnimationConfig,
): Record<string, string> {
  return {
    "--pulse-anim-duration": `${config.durationMs}ms`,
    "--pulse-anim-delay": `${config.delayMs}ms`,
    "--pulse-anim-easing": config.easing,
  };
}

export function buildFadeAnimationContract(
  config: ResolvedBlockAnimationConfig,
  context: AnimationRuntimeContext = {},
): AnimationRenderContract {
  void context;
  return {
    className: serializeClassName([
      "pulse-anim",
      "pulse-anim--fade",
      `pulse-anim--trigger-${config.trigger}`,
    ]),
    attributes: {
      ...baseAnimationAttributes(config),
      "data-pulse-animation-family": "fade",
    },
    style: {
      ...baseAnimationStyle(config),
      "--pulse-anim-opacity-from": "0",
      "--pulse-anim-opacity-to": "1",
    },
    active: true,
  };
}

function resolveSlideVector(
  direction: ResolvedBlockAnimationConfig["slideDirection"],
  distancePx: number,
): { x: number; y: number } {
  switch (direction) {
    case "up":
      return { x: 0, y: distancePx };
    case "down":
      return { x: 0, y: -distancePx };
    case "left":
      return { x: distancePx, y: 0 };
    case "right":
      return { x: -distancePx, y: 0 };
  }
}

export function buildSlideAnimationContract(
  config: ResolvedBlockAnimationConfig,
  context: AnimationRuntimeContext = {},
): AnimationRenderContract {
  void context;
  const vector = resolveSlideVector(config.slideDirection, config.slideDistancePx);

  return {
    className: serializeClassName([
      "pulse-anim",
      "pulse-anim--slide",
      `pulse-anim--slide-${config.slideDirection}`,
      `pulse-anim--trigger-${config.trigger}`,
    ]),
    attributes: {
      ...baseAnimationAttributes(config),
      "data-pulse-animation-family": "slide",
      "data-pulse-slide-direction": config.slideDirection,
    },
    style: {
      ...baseAnimationStyle(config),
      "--pulse-slide-distance": `${config.slideDistancePx}px`,
      "--pulse-slide-x": `${vector.x}px`,
      "--pulse-slide-y": `${vector.y}px`,
      "--pulse-anim-opacity-from": "0",
      "--pulse-anim-opacity-to": "1",
    },
    active: true,
  };
}

export function registerBaselineAnimations(
  registry: AnimationRegistry = AnimationRegistry.getInstance(),
): void {
  if (!registry.has("fade")) {
    registry.register("fade", buildFadeAnimationContract);
  }

  if (!registry.has("slide")) {
    registry.register("slide", buildSlideAnimationContract);
  }
}
