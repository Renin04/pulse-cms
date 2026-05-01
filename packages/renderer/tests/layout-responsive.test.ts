import { describe, expect, it } from "vitest";
import {
  DEFAULT_SINGLE_COLUMN_BREAKPOINTS,
  getSingleColumnLayoutMetrics,
  renderSingleColumnLayout,
  resolveSingleColumnBreakpoint,
} from "../src/index";

describe("single-column layout breakpoints", () => {
  it("resolves mobile breakpoint below tablet minimum", () => {
    expect(resolveSingleColumnBreakpoint(375)).toBe("mobile");
  });

  it("resolves tablet breakpoint at boundary", () => {
    expect(resolveSingleColumnBreakpoint(768)).toBe("tablet");
  });

  it("resolves desktop breakpoint at boundary", () => {
    expect(resolveSingleColumnBreakpoint(1024)).toBe("desktop");
  });

  it("resolves wide breakpoint at boundary", () => {
    expect(resolveSingleColumnBreakpoint(1440)).toBe("wide");
  });

  it("clamps negative viewport widths to mobile", () => {
    const metrics = getSingleColumnLayoutMetrics(-12);
    expect(metrics.viewportWidth).toBe(0);
    expect(metrics.breakpoint).toBe("mobile");
  });
});

describe("single-column layout metrics", () => {
  it("returns default mobile metrics", () => {
    expect(getSingleColumnLayoutMetrics(400)).toEqual({
      breakpoint: "mobile",
      viewportWidth: 400,
      minViewportWidth: 0,
      maxContainerWidth: 640,
      horizontalPadding: 16,
      blockGap: 16,
    });
  });

  it("returns default tablet metrics", () => {
    expect(getSingleColumnLayoutMetrics(800)).toEqual({
      breakpoint: "tablet",
      viewportWidth: 800,
      minViewportWidth: 768,
      maxContainerWidth: 760,
      horizontalPadding: 24,
      blockGap: 18,
    });
  });

  it("returns default desktop metrics", () => {
    expect(getSingleColumnLayoutMetrics(1200)).toEqual({
      breakpoint: "desktop",
      viewportWidth: 1200,
      minViewportWidth: 1024,
      maxContainerWidth: 860,
      horizontalPadding: 32,
      blockGap: 20,
    });
  });

  it("returns default wide metrics", () => {
    expect(getSingleColumnLayoutMetrics(1600)).toEqual({
      breakpoint: "wide",
      viewportWidth: 1600,
      minViewportWidth: 1440,
      maxContainerWidth: 960,
      horizontalPadding: 40,
      blockGap: 24,
    });
  });

  it("applies partial breakpoint overrides", () => {
    const metrics = getSingleColumnLayoutMetrics(1200, {
      desktop: {
        minViewportWidth: 900,
        maxContainerWidth: 920,
        horizontalPadding: 28,
        blockGap: 22,
      },
    });

    expect(metrics).toEqual({
      breakpoint: "desktop",
      viewportWidth: 1200,
      minViewportWidth: 900,
      maxContainerWidth: 920,
      horizontalPadding: 28,
      blockGap: 22,
    });
  });

  it("normalizes invalid override values to zero", () => {
    const metrics = getSingleColumnLayoutMetrics(300, {
      mobile: {
        maxContainerWidth: -1,
        horizontalPadding: -50,
        blockGap: -3,
      },
    });

    expect(metrics.maxContainerWidth).toBe(0);
    expect(metrics.horizontalPadding).toBe(0);
    expect(metrics.blockGap).toBe(0);
  });
});

describe("renderSingleColumnLayout", () => {
  it("wraps content with single-column layout classes", () => {
    const html = renderSingleColumnLayout("<p>Hello</p>", { viewportWidth: 800 });
    expect(html).toContain('class="pulse-layout pulse-layout--single pulse-layout--tablet"');
    expect(html).toContain('data-pulse-layout="single-column"');
    expect(html).toContain('data-pulse-breakpoint="tablet"');
    expect(html).toContain("<div class=\"pulse-layout__inner\"><p>Hello</p></div>");
  });

  it("includes CSS custom properties for responsive sizing", () => {
    const html = renderSingleColumnLayout("<p>Hello</p>", { viewportWidth: 1200 });
    expect(html).toContain("--pulse-container-max-width:860px");
    expect(html).toContain("--pulse-container-padding:32px");
    expect(html).toContain("--pulse-block-gap:20px");
  });

  it("supports custom root and inner tags", () => {
    const html = renderSingleColumnLayout("<p>Hello</p>", {
      viewportWidth: 1200,
      rootTagName: "section",
      innerTagName: "main",
    });
    expect(html.startsWith("<section ")).toBe(true);
    expect(html).toContain("<main class=\"pulse-layout__inner\"><p>Hello</p></main>");
    expect(html.endsWith("</section>")).toBe(true);
  });

  it("falls back to safe default tags for invalid runtime values", () => {
    const html = renderSingleColumnLayout("<p>Hello</p>", {
      rootTagName: "script" as never,
      innerTagName: "iframe" as never,
    });
    expect(html.startsWith("<article ")).toBe(true);
    expect(html).toContain("<div class=\"pulse-layout__inner\"><p>Hello</p></div>");
    expect(html.endsWith("</article>")).toBe(true);
  });

  it("supports custom root class names", () => {
    const html = renderSingleColumnLayout("<p>Hello</p>", {
      viewportWidth: 375,
      rootClassName: "custom-shell",
    });
    expect(html).toContain("custom-shell");
  });

  it("supports extra root attributes except reserved ones", () => {
    const html = renderSingleColumnLayout("<p>Hello</p>", {
      viewportWidth: 375,
      attributes: {
        id: "post-1",
        "aria-label": "Post layout",
        class: "ignored-by-design",
        style: "ignored-by-design",
      },
    });
    expect(html).toContain('id="post-1"');
    expect(html).toContain('aria-label="Post layout"');
    expect(html).not.toContain("ignored-by-design");
  });

  it("escapes attribute values", () => {
    const html = renderSingleColumnLayout("<p>Hello</p>", {
      attributes: {
        "data-title": '"unsafe" <value>',
      },
    });
    expect(html).toContain("data-title=\"&quot;unsafe&quot; &lt;value&gt;\"");
  });

  it("ignores invalid attribute names", () => {
    const html = renderSingleColumnLayout("<p>Hello</p>", {
      attributes: {
        "data-good": "ok",
        "bad key": "nope",
      },
    });
    expect(html).toContain('data-good="ok"');
    expect(html).not.toContain("bad key");
  });

  it("renders deterministically for identical input", () => {
    const options = {
      viewportWidth: 1024,
      rootClassName: "layout-shell",
      attributes: { id: "stable-id", "data-test": "yes" },
    };
    const out1 = renderSingleColumnLayout("<p>Stable</p>", options);
    const out2 = renderSingleColumnLayout("<p>Stable</p>", options);
    expect(out1).toBe(out2);
  });

  it("uses default viewport width when omitted", () => {
    const html = renderSingleColumnLayout("<p>Hello</p>");
    expect(html).toContain("pulse-layout--desktop");
  });
});

describe("DEFAULT_SINGLE_COLUMN_BREAKPOINTS", () => {
  it("contains expected baseline keys", () => {
    expect(Object.keys(DEFAULT_SINGLE_COLUMN_BREAKPOINTS).sort()).toEqual([
      "desktop",
      "mobile",
      "tablet",
      "wide",
    ]);
  });
});
