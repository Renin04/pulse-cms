import { beforeEach, describe, expect, it } from "vitest";
import {
  AnimationRegistry,
  buildAnimationContract,
  buildFadeAnimationContract,
  buildSlideAnimationContract,
  registerBaselineAnimations,
  resolveAnimationConfig,
  isReducedMotionActive,
  resolveScrollTriggerConfig,
  computeVisibilityRatio,
  shouldTriggerOnScroll,
  shouldEnableScrollTrigger,
  applyScrollTriggerContract,
} from "../src/index";

describe("animation registry + config", () => {
  beforeEach(() => {
    AnimationRegistry.resetInstance();
  });

  it("resolves animation defaults", () => {
    const resolved = resolveAnimationConfig();

    expect(resolved).toMatchObject({
      type: "fade",
      trigger: "load",
      durationMs: 260,
      delayMs: 0,
      once: true,
      reducedMotion: "system",
      slideDirection: "up",
      slideDistancePx: 24,
    });
  });

  it("sanitizes invalid values", () => {
    const resolved = resolveAnimationConfig({
      durationMs: -120,
      delayMs: -8,
      easing: "",
      slideDistancePx: -32,
    });

    expect(resolved.durationMs).toBe(0);
    expect(resolved.delayMs).toBe(0);
    expect(resolved.easing).toBe("ease-out");
    expect(resolved.slideDistancePx).toBe(0);
  });

  it("honors reduced motion setting always", () => {
    const config = resolveAnimationConfig({ reducedMotion: "always" });

    expect(isReducedMotionActive(config, { prefersReducedMotion: false })).toBe(
      true,
    );
  });

  it("honors reduced motion setting never", () => {
    const config = resolveAnimationConfig({ reducedMotion: "never" });

    expect(isReducedMotionActive(config, { prefersReducedMotion: true })).toBe(
      false,
    );
  });

  it("registers and resolves baseline builders", () => {
    const registry = AnimationRegistry.getInstance();

    registerBaselineAnimations(registry);

    expect(registry.has("fade")).toBe(true);
    expect(registry.has("slide")).toBe(true);

    const contract = buildAnimationContract(
      {
        type: "fade",
      },
      {},
      registry,
    );

    expect(contract.active).toBe(true);
    expect(contract.className).toContain("pulse-anim--fade");
    expect(contract.attributes["data-pulse-animation"]).toBe("fade");
  });

  it("returns inactive contract when reduced motion is active", () => {
    const registry = AnimationRegistry.getInstance();
    registerBaselineAnimations(registry);

    const contract = buildAnimationContract(
      {
        type: "slide",
        reducedMotion: "system",
      },
      { prefersReducedMotion: true },
      registry,
    );

    expect(contract.active).toBe(false);
    expect(contract.attributes["data-pulse-animation-state"]).toBe(
      "reduced-motion",
    );
  });

  it("returns inactive contract for disabled animations", () => {
    const registry = AnimationRegistry.getInstance();
    registerBaselineAnimations(registry);

    const contract = buildAnimationContract(
      {
        type: "fade",
        disabled: true,
      },
      {},
      registry,
    );

    expect(contract.active).toBe(false);
    expect(contract.attributes["data-pulse-animation-state"]).toBe("disabled");
  });

  it("returns inactive contract when no builder is registered", () => {
    const registry = AnimationRegistry.getInstance();

    const contract = buildAnimationContract(
      {
        type: "slide",
      },
      {},
      registry,
    );

    expect(contract.active).toBe(false);
    expect(contract.attributes["data-pulse-animation-state"]).toBe(
      "unregistered",
    );
  });
});

describe("fade and slide contracts", () => {
  it("builds fade contract with expected class and styles", () => {
    const config = resolveAnimationConfig({ type: "fade", trigger: "load" });
    const contract = buildFadeAnimationContract(config);

    expect(contract.className).toContain("pulse-anim--fade");
    expect(contract.style["--pulse-anim-duration"]).toBe("260ms");
    expect(contract.attributes["data-pulse-animation-family"]).toBe("fade");
  });

  it("builds slide contract with directional translation", () => {
    const config = resolveAnimationConfig({
      type: "slide",
      slideDirection: "left",
      slideDistancePx: 42,
      trigger: "scroll",
    });
    const contract = buildSlideAnimationContract(config);

    expect(contract.className).toContain("pulse-anim--slide-left");
    expect(contract.style["--pulse-slide-distance"]).toBe("42px");
    expect(contract.style["--pulse-slide-x"]).toBe("42px");
    expect(contract.style["--pulse-slide-y"]).toBe("0px");
    expect(contract.attributes["data-pulse-animation-trigger"]).toBe("scroll");
  });

  it("builds slide contract for vertical directions", () => {
    const upContract = buildSlideAnimationContract(
      resolveAnimationConfig({
        type: "slide",
        slideDirection: "up",
        slideDistancePx: 30,
      }),
    );
    const downContract = buildSlideAnimationContract(
      resolveAnimationConfig({
        type: "slide",
        slideDirection: "down",
        slideDistancePx: 30,
      }),
    );

    expect(upContract.style["--pulse-slide-y"]).toBe("30px");
    expect(downContract.style["--pulse-slide-y"]).toBe("-30px");
  });
});

describe("scroll trigger runtime", () => {
  it("resolves scroll trigger defaults", () => {
    const resolved = resolveScrollTriggerConfig();

    expect(resolved).toMatchObject({
      enabled: true,
      threshold: 0.2,
      rootMargin: "0px 0px -10% 0px",
      once: true,
      offsetPx: 0,
      minVisiblePx: 16,
    });
  });

  it("clamps scroll trigger thresholds and pixel values", () => {
    const resolved = resolveScrollTriggerConfig({
      threshold: 9,
      offsetPx: -10,
      minVisiblePx: -4,
      rootMargin: "",
    });

    expect(resolved.threshold).toBe(1);
    expect(resolved.offsetPx).toBe(0);
    expect(resolved.minVisiblePx).toBe(0);
    expect(resolved.rootMargin).toBe("0px 0px -10% 0px");
  });

  it("computes visibility ratio for partially visible targets", () => {
    const ratio = computeVisibilityRatio(
      {
        top: 900,
        height: 300,
      },
      {
        scrollY: 700,
        viewportHeight: 400,
      },
    );

    expect(ratio).toBeCloseTo(2 / 3, 4);
  });

  it("triggers when ratio and trigger line conditions pass", () => {
    const shouldTrigger = shouldTriggerOnScroll(
      {
        top: 840,
        height: 300,
      },
      {
        scrollY: 700,
        viewportHeight: 500,
      },
      {
        threshold: 0.25,
        minVisiblePx: 40,
        offsetPx: 0,
      },
    );

    expect(shouldTrigger).toBe(true);
  });

  it("does not trigger for once=true blocks that already fired", () => {
    const shouldTrigger = shouldTriggerOnScroll(
      {
        top: 840,
        height: 300,
        hasTriggered: true,
      },
      {
        scrollY: 700,
        viewportHeight: 500,
      },
      {
        once: true,
      },
    );

    expect(shouldTrigger).toBe(false);
  });

  it("disables scroll triggers when reduced motion is active", () => {
    const enabled = shouldEnableScrollTrigger(
      resolveAnimationConfig({
        type: "slide",
        trigger: "scroll",
        reducedMotion: "system",
      }),
      {
        prefersReducedMotion: true,
      },
    );

    expect(enabled).toBe(false);
  });

  it("enables scroll triggers for scroll animations in normal motion mode", () => {
    const enabled = shouldEnableScrollTrigger(
      resolveAnimationConfig({
        type: "slide",
        trigger: "scroll",
        reducedMotion: "never",
      }),
      {
        prefersReducedMotion: true,
      },
      {
        enabled: true,
      },
    );

    expect(enabled).toBe(true);
  });

  it("applies scroll trigger attributes to existing animation contract", () => {
    const baseContract = buildSlideAnimationContract(
      resolveAnimationConfig({
        type: "slide",
        trigger: "scroll",
      }),
    );

    const merged = applyScrollTriggerContract(baseContract, {
      threshold: 0.5,
      once: false,
      offsetPx: 32,
      minVisiblePx: 48,
    });

    expect(merged.className).toContain("pulse-anim--scroll");
    expect(merged.attributes["data-pulse-scroll-trigger"]).toBe("true");
    expect(merged.attributes["data-pulse-scroll-threshold"]).toBe("0.5");
    expect(merged.attributes["data-pulse-scroll-once"]).toBe("false");
    expect(merged.attributes["data-pulse-scroll-offset"]).toBe("32");
    expect(merged.attributes["data-pulse-scroll-min-visible"]).toBe("48");
  });
});
