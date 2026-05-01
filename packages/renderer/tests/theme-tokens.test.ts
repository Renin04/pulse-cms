import { describe, it, expect } from "vitest";
import {
  PULSE_TOKENS,
  buildTokenMap,
  getTokensByGroup,
  getTokenDefault,
  generateTokensRootBlock,
  type TokenGroup,
} from "../src/theme/tokens";
import {
  buildCustomCss,
  buildTokenOverrideCss,
  validateTokenOverrides,
  wrapInStyleTag,
  type CustomCssEntry,
} from "../src/theme/customCss";

// ── Token registry ────────────────────────────────────────────────────────

describe("PULSE_TOKENS", () => {
  it("contains at least one token per group", () => {
    const groups: TokenGroup[] = ["color", "space", "font", "radius", "shadow", "motion", "layout"];
    for (const group of groups) {
      expect(PULSE_TOKENS.some((t) => t.group === group)).toBe(true);
    }
  });

  it("every token has a --pulse- prefixed variable name", () => {
    for (const token of PULSE_TOKENS) {
      expect(token.variable.startsWith("--pulse-")).toBe(true);
    }
  });

  it("every token has a non-empty defaultValue", () => {
    for (const token of PULSE_TOKENS) {
      expect(token.defaultValue.trim().length).toBeGreaterThan(0);
    }
  });

  it("every token has a non-empty description", () => {
    for (const token of PULSE_TOKENS) {
      expect(token.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate variable names", () => {
    const names = PULSE_TOKENS.map((t) => t.variable);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

// ── buildTokenMap ─────────────────────────────────────────────────────────

describe("buildTokenMap", () => {
  it("returns a map with the same count as PULSE_TOKENS", () => {
    const map = buildTokenMap();
    expect(Object.keys(map).length).toBe(PULSE_TOKENS.length);
  });

  it("allows O(1) lookup by variable name", () => {
    const map = buildTokenMap();
    expect(map["--pulse-color-text"].defaultValue).toBe("#1a1a1a");
    expect(map["--pulse-font-size-base"].defaultValue).toBe("1rem");
  });

  it("returns undefined for unknown tokens", () => {
    const map = buildTokenMap();
    expect(map["--pulse-nonexistent"]).toBeUndefined();
  });
});

// ── getTokensByGroup ──────────────────────────────────────────────────────

describe("getTokensByGroup", () => {
  it("returns only tokens for the requested group", () => {
    const colorTokens = getTokensByGroup("color");
    expect(colorTokens.length).toBeGreaterThan(0);
    expect(colorTokens.every((t) => t.group === "color")).toBe(true);
  });

  it("returns space tokens with px values", () => {
    const spaceTokens = getTokensByGroup("space");
    expect(spaceTokens.every((t) => t.defaultValue.endsWith("px"))).toBe(true);
  });

  it("returns motion tokens with ms or cubic-bezier values", () => {
    const motionTokens = getTokensByGroup("motion");
    expect(motionTokens.length).toBeGreaterThan(0);
  });
});

// ── getTokenDefault ───────────────────────────────────────────────────────

describe("getTokenDefault", () => {
  it("returns the default value for a known token", () => {
    expect(getTokenDefault("--pulse-color-bg")).toBe("#ffffff");
    expect(getTokenDefault("--pulse-space-4")).toBe("16px");
    expect(getTokenDefault("--pulse-radius-md")).toBe("8px");
  });

  it("returns undefined for an unknown token", () => {
    expect(getTokenDefault("--pulse-unknown-token")).toBeUndefined();
  });
});

// ── generateTokensRootBlock ───────────────────────────────────────────────

describe("generateTokensRootBlock", () => {
  it("starts with :root {", () => {
    const block = generateTokensRootBlock();
    expect(block.startsWith(":root {")).toBe(true);
  });

  it("ends with }", () => {
    const block = generateTokensRootBlock();
    expect(block.trimEnd().endsWith("}")).toBe(true);
  });

  it("contains all token variable names", () => {
    const block = generateTokensRootBlock();
    for (const token of PULSE_TOKENS) {
      expect(block).toContain(token.variable);
    }
  });

  it("contains all token default values", () => {
    const block = generateTokensRootBlock();
    for (const token of PULSE_TOKENS) {
      expect(block).toContain(token.defaultValue);
    }
  });

  it("respects custom indent", () => {
    const block = generateTokensRootBlock(4);
    const lines = block.split("\n").filter((l) => l.includes("--pulse-"));
    expect(lines[0].startsWith("    --pulse-")).toBe(true);
  });
});

// ── buildCustomCss ────────────────────────────────────────────────────────

describe("buildCustomCss", () => {
  it("returns empty string for empty entries", () => {
    expect(buildCustomCss({ entries: [] })).toBe("");
  });

  it("combines multiple entries", () => {
    const entries: CustomCssEntry[] = [
      { id: "a", target: "token-overrides", css: ":root { --pulse-color-accent: red; }" },
      { id: "b", target: "block-overrides", css: ".pulse-block { margin: 0; }" },
    ];
    const result = buildCustomCss({ entries });
    expect(result).toContain("--pulse-color-accent: red");
    expect(result).toContain(".pulse-block { margin: 0; }");
  });

  it("deduplicates by id — last entry wins", () => {
    const entries: CustomCssEntry[] = [
      { id: "brand", target: "token-overrides", css: ":root { --pulse-color-accent: blue; }" },
      { id: "brand", target: "token-overrides", css: ":root { --pulse-color-accent: red; }" },
    ];
    const result = buildCustomCss({ entries });
    expect(result).toContain("red");
    expect(result).not.toContain("blue");
  });

  it("annotates entries when annotate=true", () => {
    const entries: CustomCssEntry[] = [
      { id: "my-id", target: "arbitrary", css: "body { color: red; }" },
    ];
    const result = buildCustomCss({ entries, annotate: true });
    expect(result).toContain("pulse-custom: my-id");
  });
});

// ── buildTokenOverrideCss ─────────────────────────────────────────────────

describe("buildTokenOverrideCss", () => {
  it("generates a :root block with overrides", () => {
    const css = buildTokenOverrideCss({ "--pulse-color-accent": "#e11d48" });
    expect(css).toContain(":root {");
    expect(css).toContain("--pulse-color-accent: #e11d48;");
  });

  it("returns empty string for empty overrides", () => {
    expect(buildTokenOverrideCss({})).toBe("");
  });

  it("skips keys that do not start with --pulse-", () => {
    const css = buildTokenOverrideCss({
      "--pulse-color-accent": "red",
      "--other-var": "blue",
      "color": "green",
    });
    expect(css).toContain("--pulse-color-accent");
    expect(css).not.toContain("--other-var");
    expect(css).not.toContain("color: green");
  });

  it("handles multiple overrides", () => {
    const css = buildTokenOverrideCss({
      "--pulse-color-accent": "#e11d48",
      "--pulse-font-size-base": "1.0625rem",
    });
    expect(css).toContain("--pulse-color-accent: #e11d48;");
    expect(css).toContain("--pulse-font-size-base: 1.0625rem;");
  });
});

// ── validateTokenOverrides ────────────────────────────────────────────────

describe("validateTokenOverrides", () => {
  const knownVars = PULSE_TOKENS.map((t) => t.variable);

  it("returns empty array when all overrides are known tokens", () => {
    const result = validateTokenOverrides(
      { "--pulse-color-accent": "red", "--pulse-space-4": "20px" },
      knownVars
    );
    expect(result).toEqual([]);
  });

  it("returns unknown --pulse- variable names", () => {
    const result = validateTokenOverrides(
      { "--pulse-color-accent": "red", "--pulse-nonexistent-token": "blue" },
      knownVars
    );
    expect(result).toContain("--pulse-nonexistent-token");
    expect(result).not.toContain("--pulse-color-accent");
  });

  it("ignores non --pulse- keys (they are not renderer tokens)", () => {
    const result = validateTokenOverrides(
      { "--other-var": "blue" },
      knownVars
    );
    expect(result).toEqual([]);
  });
});

// ── wrapInStyleTag ────────────────────────────────────────────────────────

describe("wrapInStyleTag", () => {
  it("wraps CSS in a style tag with data-pulse-custom attribute", () => {
    const tag = wrapInStyleTag("body { color: red; }", "my-id");
    expect(tag).toBe('<style data-pulse-custom="my-id">body { color: red; }</style>');
  });

  it("uses default id when none provided", () => {
    const tag = wrapInStyleTag("body {}");
    expect(tag).toContain('data-pulse-custom="pulse-custom"');
  });

  it("returns empty string for empty CSS", () => {
    expect(wrapInStyleTag("")).toBe("");
    expect(wrapInStyleTag("   ")).toBe("");
  });
});
