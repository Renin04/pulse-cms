import { describe, it, expect } from "vitest";
import {
  THEME_LIGHT, THEME_DARK, THEME_MINIMAL,
  BUILT_IN_THEMES, getBuiltInTheme, listBuiltInThemeIds,
  type BuiltInThemeId,
} from "../src/theme/themes";
import {
  resolveTheme, generateThemeCss, generateThemeStyleTag,
  isBuiltInThemeId, getKnownTokenVariables,
} from "../src/theme/resolveTheme";
import {
  buildTypographyTokens, buildTypographyCss,
  buildSpacingTokens, buildSpacingCss,
} from "../src/theme/typography";

// ── Theme definitions ─────────────────────────────────────────────────────

describe("BUILT_IN_THEMES", () => {
  it("contains light, dark, minimal", () => {
    expect(Object.keys(BUILT_IN_THEMES)).toEqual(
      expect.arrayContaining(["light", "dark", "minimal"])
    );
  });

  it("every theme has a non-empty token map", () => {
    for (const theme of Object.values(BUILT_IN_THEMES)) {
      expect(Object.keys(theme.tokens).length).toBeGreaterThan(0);
    }
  });

  it("every theme token key starts with --pulse-", () => {
    for (const theme of Object.values(BUILT_IN_THEMES)) {
      for (const key of Object.keys(theme.tokens)) {
        expect(key.startsWith("--pulse-")).toBe(true);
      }
    }
  });

  it("dark theme avoids pure black and pure white backgrounds", () => {
    expect(THEME_DARK.tokens["--pulse-color-bg"]).not.toBe("#000000");
    expect(THEME_DARK.tokens["--pulse-color-bg"]).not.toBe("#ffffff");
    expect(THEME_DARK.tokens["--pulse-color-text"]).not.toBe("#ffffff");
  });

  it("minimal theme flattens shadows to none", () => {
    expect(THEME_MINIMAL.tokens["--pulse-shadow-sm"]).toBe("none");
    expect(THEME_MINIMAL.tokens["--pulse-shadow-md"]).toBe("none");
    expect(THEME_MINIMAL.tokens["--pulse-shadow-lg"]).toBe("none");
  });
});

describe("getBuiltInTheme", () => {
  it("returns the correct theme for each id", () => {
    expect(getBuiltInTheme("light").id).toBe("light");
    expect(getBuiltInTheme("dark").id).toBe("dark");
    expect(getBuiltInTheme("minimal").id).toBe("minimal");
  });
});

describe("listBuiltInThemeIds", () => {
  it("returns all three built-in ids", () => {
    const ids = listBuiltInThemeIds();
    expect(ids).toContain("light");
    expect(ids).toContain("dark");
    expect(ids).toContain("minimal");
  });
});

// ── resolveTheme ──────────────────────────────────────────────────────────

describe("resolveTheme", () => {
  it("resolves explicit theme with source=explicit", () => {
    const result = resolveTheme({ explicit: "dark" });
    expect(result.theme.id).toBe("dark");
    expect(result.source).toBe("explicit");
  });

  it("resolves stored theme when no explicit provided", () => {
    const result = resolveTheme({ stored: "minimal" });
    expect(result.theme.id).toBe("minimal");
    expect(result.source).toBe("stored");
  });

  it("explicit takes priority over stored", () => {
    const result = resolveTheme({ explicit: "dark", stored: "minimal" });
    expect(result.theme.id).toBe("dark");
    expect(result.source).toBe("explicit");
  });

  it("resolves system dark preference when no explicit/stored", () => {
    const result = resolveTheme({ system: "dark" });
    expect(result.theme.id).toBe("dark");
    expect(result.source).toBe("system");
  });

  it("falls back to light theme as default", () => {
    const result = resolveTheme({});
    expect(result.theme.id).toBe("light");
    expect(result.source).toBe("default");
  });

  it("resolves custom theme from customThemes registry", () => {
    const custom = {
      id: "brand",
      label: "Brand",
      affects: ["color" as const],
      tokens: { "--pulse-color-accent": "#e11d48" },
    };
    const result = resolveTheme({ explicit: "brand", customThemes: [custom] });
    expect(result.theme.id).toBe("brand");
    expect(result.theme.tokens["--pulse-color-accent"]).toBe("#e11d48");
  });

  it("custom theme overrides built-in with same id", () => {
    const override = {
      id: "dark" as BuiltInThemeId,
      label: "Custom Dark",
      affects: ["color" as const],
      tokens: { "--pulse-color-bg": "#0a0a0a" },
    };
    const result = resolveTheme({ explicit: "dark", customThemes: [override] });
    expect(result.theme.tokens["--pulse-color-bg"]).toBe("#0a0a0a");
  });

  it("ignores unknown explicit id and falls through to default", () => {
    const result = resolveTheme({ explicit: "nonexistent" as BuiltInThemeId });
    expect(result.theme.id).toBe("light");
    expect(result.source).toBe("default");
  });
});

// ── generateThemeCss ──────────────────────────────────────────────────────

describe("generateThemeCss", () => {
  it("returns empty string for light theme (matches defaults)", () => {
    expect(generateThemeCss(THEME_LIGHT)).toBe("");
  });

  it("generates scoped selector for dark theme", () => {
    const css = generateThemeCss(THEME_DARK);
    expect(css).toContain('[data-pulse-theme="dark"]');
    expect(css).toContain("--pulse-color-bg");
  });

  it("generates scoped selector for minimal theme", () => {
    const css = generateThemeCss(THEME_MINIMAL);
    expect(css).toContain('[data-pulse-theme="minimal"]');
    expect(css).toContain("--pulse-shadow-sm: none");
  });

  it("contains all token overrides for dark theme", () => {
    const css = generateThemeCss(THEME_DARK);
    for (const [key, value] of Object.entries(THEME_DARK.tokens)) {
      expect(css).toContain(key);
      expect(css).toContain(value);
    }
  });
});

// ── generateThemeStyleTag ─────────────────────────────────────────────────

describe("generateThemeStyleTag", () => {
  it("returns empty string for light theme", () => {
    expect(generateThemeStyleTag(THEME_LIGHT)).toBe("");
  });

  it("wraps dark theme CSS in a style tag", () => {
    const tag = generateThemeStyleTag(THEME_DARK);
    expect(tag).toContain("<style");
    expect(tag).toContain('data-pulse-custom="pulse-theme-dark"');
    expect(tag).toContain("</style>");
  });
});

// ── isBuiltInThemeId ──────────────────────────────────────────────────────

describe("isBuiltInThemeId", () => {
  it("returns true for built-in ids", () => {
    expect(isBuiltInThemeId("light")).toBe(true);
    expect(isBuiltInThemeId("dark")).toBe(true);
    expect(isBuiltInThemeId("minimal")).toBe(true);
  });

  it("returns false for unknown ids", () => {
    expect(isBuiltInThemeId("brand")).toBe(false);
    expect(isBuiltInThemeId("")).toBe(false);
  });
});

// ── getKnownTokenVariables ────────────────────────────────────────────────

describe("getKnownTokenVariables", () => {
  it("returns an array of --pulse- prefixed strings", () => {
    const vars = getKnownTokenVariables();
    expect(vars.length).toBeGreaterThan(0);
    expect(vars.every((v) => v.startsWith("--pulse-"))).toBe(true);
  });
});

// ── buildTypographyTokens ─────────────────────────────────────────────────

describe("buildTypographyTokens", () => {
  it("maps fontFamily.body to --pulse-font-family-body", () => {
    const tokens = buildTypographyTokens({ fontFamily: { body: "Georgia, serif" } });
    expect(tokens["--pulse-font-family-body"]).toBe("Georgia, serif");
  });

  it("maps fontSize.base to --pulse-font-size-base", () => {
    const tokens = buildTypographyTokens({ fontSize: { base: "1.0625rem" } });
    expect(tokens["--pulse-font-size-base"]).toBe("1.0625rem");
  });

  it("maps lineHeight.body to --pulse-line-height-body", () => {
    const tokens = buildTypographyTokens({ lineHeight: { body: "1.8" } });
    expect(tokens["--pulse-line-height-body"]).toBe("1.8");
  });

  it("maps fontWeight.bold to --pulse-font-weight-bold", () => {
    const tokens = buildTypographyTokens({ fontWeight: { bold: "800" } });
    expect(tokens["--pulse-font-weight-bold"]).toBe("800");
  });

  it("omits undefined fields", () => {
    const tokens = buildTypographyTokens({ fontFamily: { body: "serif" } });
    expect(tokens["--pulse-font-family-heading"]).toBeUndefined();
  });

  it("returns empty object for empty config", () => {
    expect(buildTypographyTokens({})).toEqual({});
  });
});

describe("buildTypographyCss", () => {
  it("generates a :root block with typography overrides", () => {
    const css = buildTypographyCss({ fontFamily: { body: "Georgia, serif" } });
    expect(css).toContain(":root {");
    expect(css).toContain("--pulse-font-family-body: Georgia, serif;");
  });

  it("returns empty string for empty config", () => {
    expect(buildTypographyCss({})).toBe("");
  });
});

// ── buildSpacingTokens ────────────────────────────────────────────────────

describe("buildSpacingTokens", () => {
  it("maps scale steps to --pulse-space-* tokens", () => {
    const tokens = buildSpacingTokens({ scale: { "4": "18px", "8": "36px" } });
    expect(tokens["--pulse-space-4"]).toBe("18px");
    expect(tokens["--pulse-space-8"]).toBe("36px");
  });

  it("maps layout.maxWidth to --pulse-layout-max-width", () => {
    const tokens = buildSpacingTokens({ layout: { maxWidth: "720px" } });
    expect(tokens["--pulse-layout-max-width"]).toBe("720px");
  });

  it("maps layout.blockGap to --pulse-layout-block-gap", () => {
    const tokens = buildSpacingTokens({ layout: { blockGap: "24px" } });
    expect(tokens["--pulse-layout-block-gap"]).toBe("24px");
  });

  it("returns empty object for empty config", () => {
    expect(buildSpacingTokens({})).toEqual({});
  });
});

describe("buildSpacingCss", () => {
  it("generates a :root block with spacing overrides", () => {
    const css = buildSpacingCss({ layout: { maxWidth: "720px" } });
    expect(css).toContain(":root {");
    expect(css).toContain("--pulse-layout-max-width: 720px;");
  });

  it("returns empty string for empty config", () => {
    expect(buildSpacingCss({})).toBe("");
  });
});
