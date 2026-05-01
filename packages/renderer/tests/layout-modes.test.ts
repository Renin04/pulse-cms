import { describe, expect, it } from "vitest";
import {
  DEFAULT_FULL_WIDTH_LAYOUT,
  DEFAULT_GRID_LAYOUT,
  DEFAULT_LAYOUT_SPACING,
  DEFAULT_MULTI_COLUMN_LAYOUT,
  DEFAULT_STICKY_LAYOUT,
  renderLayoutMode,
  resolveLayoutModeConfig,
  renderMangaLayout,
  renderMangaPanel,
} from "../src/index";

describe("resolveLayoutModeConfig", () => {
  it("returns baseline defaults", () => {
    const resolved = resolveLayoutModeConfig();
    expect(resolved.mode).toBe("single");
    expect(resolved.spacing).toEqual(DEFAULT_LAYOUT_SPACING);
    expect(resolved.multiColumn).toEqual(DEFAULT_MULTI_COLUMN_LAYOUT);
    expect(resolved.grid).toEqual(DEFAULT_GRID_LAYOUT);
    expect(resolved.fullWidth).toEqual(DEFAULT_FULL_WIDTH_LAYOUT);
    expect(resolved.sticky).toEqual(DEFAULT_STICKY_LAYOUT);
  });

  it("applies spacing overrides", () => {
    const resolved = resolveLayoutModeConfig({
      spacing: {
        blockGap: 24,
        rowGap: 32,
        columnGap: 40,
        outerPadding: 12,
      },
    });
    expect(resolved.spacing).toEqual({
      blockGap: 24,
      rowGap: 32,
      columnGap: 40,
      outerPadding: 12,
    });
  });

  it("normalizes invalid numeric values", () => {
    const resolved = resolveLayoutModeConfig({
      spacing: { blockGap: -10 },
      multiColumn: { columns: 999 },
      grid: { maxColumns: -2, minItemWidth: -1 },
      sticky: { topOffset: -9, zIndex: -1 },
    });
    expect(resolved.spacing.blockGap).toBe(0);
    expect(resolved.multiColumn.columns).toBe(6);
    expect(resolved.grid.maxColumns).toBe(1);
    expect(resolved.grid.minItemWidth).toBe(0);
    expect(resolved.sticky.topOffset).toBe(0);
    expect(resolved.sticky.zIndex).toBe(0);
  });

  it("uses mode fallback for undefined input", () => {
    const resolved = resolveLayoutModeConfig({ mode: undefined });
    expect(resolved.mode).toBe("single");
  });

  it("supports multi-column mode", () => {
    const resolved = resolveLayoutModeConfig({ mode: "multi-column" });
    expect(resolved.mode).toBe("multi-column");
  });

  it("supports grid mode", () => {
    const resolved = resolveLayoutModeConfig({ mode: "grid" });
    expect(resolved.mode).toBe("grid");
  });

  it("supports manga mode", () => {
    const resolved = resolveLayoutModeConfig({ mode: "manga" });
    expect(resolved.mode).toBe("manga");
  });

  it("supports dense auto-flow in grid config", () => {
    const resolved = resolveLayoutModeConfig({
      grid: { autoFlow: "dense" },
    });
    expect(resolved.grid.autoFlow).toBe("dense");
  });
});

describe("renderLayoutMode", () => {
  it("renders single mode wrapper by default", () => {
    const html = renderLayoutMode("<p>Hello</p>");
    expect(html).toContain('class="pulse-layout pulse-layout--single"');
    expect(html).toContain('data-pulse-layout-mode="single"');
    expect(html).toContain('<div class="pulse-layout__inner"><p>Hello</p></div>');
  });

  it("renders multi-column mode classes and variables", () => {
    const html = renderLayoutMode("<p>Hello</p>", {
      mode: "multi-column",
      multiColumn: { columns: 3, minColumnWidth: 320 },
    });
    expect(html).toContain("pulse-layout--multi-column");
    expect(html).toContain("--pulse-layout-columns:3");
    expect(html).toContain("--pulse-layout-min-column-width:320px");
    expect(html).toContain('data-pulse-layout-mode="multi-column"');
  });

  it("renders grid mode classes and variables", () => {
    const html = renderLayoutMode("<p>Hello</p>", {
      mode: "grid",
      grid: { minItemWidth: 280, maxColumns: 4, autoFlow: "dense" },
    });
    expect(html).toContain("pulse-layout--grid");
    expect(html).toContain("--pulse-layout-grid-min-item-width:280px");
    expect(html).toContain("--pulse-layout-grid-max-columns:4");
    expect(html).toContain("--pulse-layout-grid-auto-flow:dense");
    expect(html).toContain('data-pulse-layout-mode="grid"');
  });

  it("renders manga mode class", () => {
    const html = renderLayoutMode("<p>Hello</p>", { mode: "manga" });
    expect(html).toContain("pulse-layout--manga");
    expect(html).toContain('data-pulse-layout-mode="manga"');
  });

  it("renders full-width class and state attributes", () => {
    const html = renderLayoutMode("<p>Hello</p>", {
      fullWidth: { enabled: true, maxWidth: 1400 },
    });
    expect(html).toContain("pulse-layout--full-width");
    expect(html).toContain('data-pulse-full-width="true"');
    expect(html).toContain("--pulse-layout-full-width-max:1400px");
  });

  it("renders sticky frame structure when sticky content is provided", () => {
    const html = renderLayoutMode("<p>Main</p>", {
      sticky: { enabled: true, topOffset: 32, zIndex: 20 },
      stickyContentHtml: "<p>Sticky</p>",
    });
    expect(html).toContain("pulse-layout--sticky");
    expect(html).toContain('data-pulse-sticky="true"');
    expect(html).toContain('class="pulse-layout__frame"');
    expect(html).toContain('class="pulse-layout__inner pulse-layout__scroll"');
    expect(html).toContain('class="pulse-layout__sticky-region"><p>Sticky</p></aside>');
    expect(html).toContain("--pulse-layout-sticky-top:32px");
    expect(html).toContain("--pulse-layout-sticky-z-index:20");
  });

  it("does not render sticky frame without sticky content html", () => {
    const html = renderLayoutMode("<p>Main</p>", {
      sticky: { enabled: true },
    });
    expect(html).not.toContain("pulse-layout__frame");
    expect(html).toContain('class="pulse-layout__inner"><p>Main</p></div>');
  });

  it("supports custom spacing controls", () => {
    const html = renderLayoutMode("<p>Hello</p>", {
      spacing: {
        blockGap: 12,
        rowGap: 16,
        columnGap: 20,
        outerPadding: 8,
      },
    });
    expect(html).toContain("--pulse-layout-block-gap:12px");
    expect(html).toContain("--pulse-layout-row-gap:16px");
    expect(html).toContain("--pulse-layout-column-gap:20px");
    expect(html).toContain("--pulse-layout-outer-padding:8px");
  });

  it("supports custom root and inner tags", () => {
    const html = renderLayoutMode("<p>Hello</p>", {
      rootTagName: "section",
      innerTagName: "main",
    });
    expect(html.startsWith("<section ")).toBe(true);
    expect(html).toContain('<main class="pulse-layout__inner"><p>Hello</p></main>');
    expect(html.endsWith("</section>")).toBe(true);
  });

  it("falls back to safe root and inner tags for invalid runtime values", () => {
    const html = renderLayoutMode("<p>Hello</p>", {
      rootTagName: "script" as never,
      innerTagName: "iframe" as never,
    });
    expect(html.startsWith("<article ")).toBe(true);
    expect(html).toContain('<div class="pulse-layout__inner"><p>Hello</p></div>');
    expect(html.endsWith("</article>")).toBe(true);
  });

  it("supports root class names", () => {
    const html = renderLayoutMode("<p>Hello</p>", {
      rootClassName: "custom-shell",
    });
    expect(html).toContain("custom-shell");
  });

  it("supports additional attributes and ignores reserved attributes", () => {
    const html = renderLayoutMode("<p>Hello</p>", {
      attributes: {
        id: "layout-1",
        "aria-label": "Layout",
        class: "should-be-ignored",
        style: "should-be-ignored",
      },
    });
    expect(html).toContain('id="layout-1"');
    expect(html).toContain('aria-label="Layout"');
    expect(html).not.toContain("should-be-ignored");
  });

  it("escapes attribute values", () => {
    const html = renderLayoutMode("<p>Hello</p>", {
      attributes: {
        "data-title": '"unsafe" <value>',
      },
    });
    expect(html).toContain("data-title=\"&quot;unsafe&quot; &lt;value&gt;\"");
  });

  it("ignores invalid attribute keys", () => {
    const html = renderLayoutMode("<p>Hello</p>", {
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
      mode: "grid" as const,
      fullWidth: { enabled: true, maxWidth: 1320 },
      spacing: { rowGap: 32, columnGap: 16 },
      attributes: { id: "stable", "data-test": "yes" },
      rootClassName: "stable-class",
    };
    const out1 = renderLayoutMode("<p>Stable</p>", options);
    const out2 = renderLayoutMode("<p>Stable</p>", options);
    expect(out1).toBe(out2);
  });
});

describe("renderMangaPanel", () => {
  it("renders panel with defaults", () => {
    const html = renderMangaPanel({ html: "<p>Panel</p>" });
    expect(html).toContain("pulse-manga-panel--normal");
    expect(html).toContain("pulse-manga-panel--align-left");
    expect(html).toContain('data-pulse-manga-size="normal"');
    expect(html).toContain("<p>Panel</p>");
  });

  it("renders panel with id, size, align, and sticky state", () => {
    const html = renderMangaPanel({
      id: "panel-1",
      html: "<p>Panel</p>",
      size: "hero",
      align: "center",
      sticky: true,
    });
    expect(html).toContain('data-pulse-manga-id="panel-1"');
    expect(html).toContain("pulse-manga-panel--hero");
    expect(html).toContain("pulse-manga-panel--align-center");
    expect(html).toContain("pulse-manga-panel--sticky");
  });

  it("falls back to safe values for invalid size and align", () => {
    const html = renderMangaPanel({
      html: "<p>Panel</p>",
      size: "invalid" as never,
      align: "invalid" as never,
    });
    expect(html).toContain("pulse-manga-panel--normal");
    expect(html).toContain("pulse-manga-panel--align-left");
  });
});

describe("renderMangaLayout", () => {
  const samplePanels = [
    { id: "p1", html: "<p>Panel 1</p>", size: "normal" as const },
    { id: "p2", html: "<p>Panel 2</p>", size: "wide" as const },
  ];

  it("renders manga layout wrapper and panels", () => {
    const html = renderMangaLayout(samplePanels);
    expect(html).toContain('class="pulse-layout pulse-layout--manga pulse-manga-layout"');
    expect(html).toContain('data-pulse-layout-mode="manga"');
    expect(html).toContain('class="pulse-layout__inner pulse-manga-grid"');
    expect(html).toContain("Panel 1");
    expect(html).toContain("Panel 2");
  });

  it("supports custom columns and gap", () => {
    const html = renderMangaLayout(samplePanels, {
      columns: 3,
      panelGap: 28,
    });
    expect(html).toContain("--pulse-layout-manga-columns:3");
    expect(html).toContain("--pulse-layout-manga-gap:28px");
  });

  it("clamps columns to valid range", () => {
    const html = renderMangaLayout(samplePanels, {
      columns: 10,
    });
    expect(html).toContain("--pulse-layout-manga-columns:4");
  });

  it("supports custom root tag and class", () => {
    const html = renderMangaLayout(samplePanels, {
      rootTagName: "article",
      rootClassName: "manga-shell",
    });
    expect(html.startsWith("<article ")).toBe(true);
    expect(html).toContain("manga-shell");
    expect(html.endsWith("</article>")).toBe(true);
  });

  it("falls back to safe root tag for invalid runtime value", () => {
    const html = renderMangaLayout(samplePanels, {
      rootTagName: "script" as never,
    });
    expect(html.startsWith("<section ")).toBe(true);
  });

  it("supports additional attributes and ignores reserved attributes", () => {
    const html = renderMangaLayout(samplePanels, {
      attributes: {
        id: "manga-1",
        "aria-label": "Manga layout",
        class: "ignore",
      },
    });
    expect(html).toContain('id="manga-1"');
    expect(html).toContain('aria-label="Manga layout"');
    expect(html).not.toContain("ignore");
  });

  it("renders deterministically for identical input", () => {
    const options = {
      columns: 2,
      panelGap: 20,
      attributes: { id: "stable-manga", "data-test": "yes" },
    };
    const out1 = renderMangaLayout(samplePanels, options);
    const out2 = renderMangaLayout(samplePanels, options);
    expect(out1).toBe(out2);
  });
});
