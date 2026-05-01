import { describe, expect, it } from "vitest";
import {
  applyHoverEvent,
  computeParallaxProgress,
  computeParallaxVector,
  computeDocumentProgress,
  createHoverContract,
  createHoverState,
  createParallaxContract,
  createParallaxState,
  createParallaxTransformStyle,
  createProgressSignalState,
  isHoverEffectActive,
  isParallaxActive,
  resolveHoverEffectConfig,
  resolveParallaxConfig,
  resolveProgressTrackingConfig,
  runProgressSignalTimeline,
  shouldUpdateParallax,
  advanceParallaxState,
  collectProgressSignals,
} from "../src/index";

describe("hover effects runtime", () => {
  it("resolves hover defaults", () => {
    const resolved = resolveHoverEffectConfig();

    expect(resolved).toMatchObject({
      enabled: true,
      effect: "lift",
      intensity: 0.6,
      pointerMode: "fine",
      reducedMotion: "system",
    });
  });

  it("normalizes hover values", () => {
    const resolved = resolveHoverEffectConfig({
      intensity: 99,
      enterDurationMs: -20,
      leaveDurationMs: -10,
    });

    expect(resolved.intensity).toBe(1);
    expect(resolved.enterDurationMs).toBe(0);
    expect(resolved.leaveDurationMs).toBe(0);
  });

  it("disables hover for reduced motion users", () => {
    const active = isHoverEffectActive(
      {
        reducedMotion: "system",
      },
      {
        prefersReducedMotion: true,
      },
    );

    expect(active).toBe(false);
  });

  it("requires fine pointer when configured", () => {
    const active = isHoverEffectActive(
      {
        pointerMode: "fine",
      },
      {
        pointerType: "touch",
      },
    );

    expect(active).toBe(false);
  });

  it("builds active hover contract", () => {
    const contract = createHoverContract(
      {
        effect: "glow",
        intensity: 0.8,
      },
      {
        pointerType: "mouse",
      },
    );

    expect(contract.active).toBe(true);
    expect(contract.className).toContain("pulse-hover--glow");
    expect(contract.attributes["data-pulse-hover"]).toBe("true");
    expect(contract.style["--pulse-hover-intensity"]).toBe("0.8");
  });

  it("updates hover state transitions deterministically", () => {
    let state = createHoverState();

    state = applyHoverEvent(state, "enter");
    state = applyHoverEvent(state, "enter");
    state = applyHoverEvent(state, "toggle");
    state = applyHoverEvent(state, "leave");

    expect(state.hovered).toBe(false);
    expect(state.transitions).toBe(2);
  });
});

describe("parallax runtime", () => {
  it("resolves parallax defaults", () => {
    const resolved = resolveParallaxConfig();

    expect(resolved).toMatchObject({
      enabled: true,
      axis: "y",
      direction: "normal",
      speed: 0.2,
      maxOffsetPx: 48,
      throttleMs: 16,
    });
  });

  it("normalizes parallax values", () => {
    const resolved = resolveParallaxConfig({
      speed: 9,
      maxOffsetPx: -20,
      throttleMs: -5,
    });

    expect(resolved.speed).toBe(1);
    expect(resolved.maxOffsetPx).toBe(0);
    expect(resolved.throttleMs).toBe(0);
  });

  it("disables parallax for reduced motion users", () => {
    const active = isParallaxActive(
      {
        reducedMotion: "system",
      },
      {
        prefersReducedMotion: true,
      },
    );

    expect(active).toBe(false);
  });

  it("computes deterministic parallax vectors", () => {
    const vector = computeParallaxVector(
      {
        top: 1400,
        height: 400,
      },
      {
        scrollY: 1000,
        viewportHeight: 800,
      },
      {
        axis: "both",
        speed: 0.5,
        maxOffsetPx: 60,
      },
    );

    expect(vector.progress).toBeCloseTo(1 / 3, 2);
    expect(vector.x).toBe(10);
    expect(vector.y).toBe(10);
  });

  it("applies inverse direction in progress computation", () => {
    const normal = computeParallaxProgress(
      {
        top: 600,
        height: 300,
      },
      {
        scrollY: 500,
        viewportHeight: 700,
      },
      {
        direction: "normal",
      },
    );

    const inverse = computeParallaxProgress(
      {
        top: 600,
        height: 300,
      },
      {
        scrollY: 500,
        viewportHeight: 700,
      },
      {
        direction: "inverse",
      },
    );

    expect(inverse).toBeCloseTo(-normal, 6);
  });

  it("builds parallax contract and transform style", () => {
    const contract = createParallaxContract({
      axis: "x",
      speed: 0.3,
      maxOffsetPx: 80,
    });

    const style = createParallaxTransformStyle({
      progress: 0.5,
      x: 12,
      y: 0,
    });

    expect(contract.className).toContain("pulse-parallax--x");
    expect(contract.attributes["data-pulse-parallax"]).toBe("true");
    expect(style.transform).toBe("translate3d(12px, 0px, 0)");
  });

  it("throttles parallax updates across high-frequency frames", () => {
    let state = createParallaxState();

    for (let frame = 0; frame < 500; frame += 1) {
      const nowMs = frame * 4;
      state = advanceParallaxState(state, nowMs, { throttleMs: 16 });
    }

    expect(state.updates).toBeLessThanOrEqual(126);
    expect(shouldUpdateParallax(state.lastUpdateMs, state.lastUpdateMs + 15, { throttleMs: 16 })).toBe(false);
    expect(shouldUpdateParallax(state.lastUpdateMs, state.lastUpdateMs + 16, { throttleMs: 16 })).toBe(true);
  });
});

describe("progress tracking signals", () => {
  it("resolves progress tracking defaults", () => {
    const resolved = resolveProgressTrackingConfig();

    expect(resolved).toMatchObject({
      enabled: true,
      throttleMs: 120,
      milestones: [0.25, 0.5, 0.75, 1],
      precision: 3,
    });
  });

  it("normalizes progress config values", () => {
    const resolved = resolveProgressTrackingConfig({
      throttleMs: -40,
      precision: 10,
      milestones: [1.2, -1, 0.25, 0.25, 0.5],
    });

    expect(resolved.throttleMs).toBe(0);
    expect(resolved.precision).toBe(6);
    expect(resolved.milestones).toEqual([0.25, 0.5, 1]);
  });

  it("computes document progress with clamp behavior", () => {
    const atTop = computeDocumentProgress({
      scrollY: 0,
      viewportHeight: 800,
      documentHeight: 3200,
    });
    const overBottom = computeDocumentProgress({
      scrollY: 999999,
      viewportHeight: 800,
      documentHeight: 3200,
    });

    expect(atTop).toBe(0);
    expect(overBottom).toBe(1);
  });

  it("emits update and milestone signals deterministically", () => {
    const resultA = collectProgressSignals(
      createProgressSignalState(),
      {
        scrollY: 0,
        viewportHeight: 1000,
        documentHeight: 4000,
        timestampMs: 0,
      },
      {
        throttleMs: 100,
      },
    );

    const resultB = collectProgressSignals(
      resultA.state,
      {
        scrollY: 1500,
        viewportHeight: 1000,
        documentHeight: 4000,
        timestampMs: 100,
      },
      {
        throttleMs: 100,
      },
    );

    const milestoneSignals = resultB.signals.filter(
      (signal) => signal.type === "milestone",
    );

    expect(resultA.signals[0]?.type).toBe("update");
    expect(resultB.signals.find((signal) => signal.type === "update")).toBeTruthy();
    expect(milestoneSignals.map((signal) => signal.milestone)).toEqual([0.25, 0.5]);
  });

  it("resets reached milestones when progress moves backward", () => {
    const forward = runProgressSignalTimeline(
      [
        {
          scrollY: 0,
          viewportHeight: 1000,
          documentHeight: 4000,
          timestampMs: 0,
        },
        {
          scrollY: 2000,
          viewportHeight: 1000,
          documentHeight: 4000,
          timestampMs: 200,
        },
      ],
      {
        throttleMs: 50,
      },
    );

    const backwardThenForward = runProgressSignalTimeline(
      [
        {
          scrollY: 0,
          viewportHeight: 1000,
          documentHeight: 4000,
          timestampMs: 0,
        },
        {
          scrollY: 2000,
          viewportHeight: 1000,
          documentHeight: 4000,
          timestampMs: 200,
        },
        {
          scrollY: 500,
          viewportHeight: 1000,
          documentHeight: 4000,
          timestampMs: 400,
        },
        {
          scrollY: 2000,
          viewportHeight: 1000,
          documentHeight: 4000,
          timestampMs: 600,
        },
      ],
      {
        throttleMs: 50,
      },
    );

    const forwardMilestones = forward.filter((signal) => signal.type === "milestone");
    const cycleMilestones = backwardThenForward.filter(
      (signal) => signal.type === "milestone",
    );

    expect(forwardMilestones.length).toBeGreaterThanOrEqual(2);
    expect(cycleMilestones.length).toBeGreaterThan(forwardMilestones.length);
  });

  it("keeps update emissions bounded under long timelines", () => {
    const snapshots = Array.from({ length: 2000 }, (_, index) => ({
      scrollY: index * 30,
      viewportHeight: 800,
      documentHeight: 120000,
      timestampMs: index * 10,
    }));

    const signals = runProgressSignalTimeline(snapshots, {
      throttleMs: 100,
      milestones: [0.25, 0.5, 0.75, 1],
      precision: 3,
    });

    const updates = signals.filter((signal) => signal.type === "update");
    const milestones = signals.filter((signal) => signal.type === "milestone");

    expect(updates.length).toBeLessThanOrEqual(220);
    expect(milestones.length).toBeLessThanOrEqual(4);
  });
});
