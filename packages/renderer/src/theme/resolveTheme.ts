/**
 * Runtime theme resolution API for @pulse/renderer.
 *
 * Resolves the active theme from multiple sources (explicit id, system
 * preference, stored preference) and generates the CSS needed to apply it.
 * Does not require a DOM — safe for SSR contexts.
 */

import { BUILT_IN_THEMES, THEME_LIGHT, type BuiltInThemeId, type ThemeDefinition } from "./themes";
import { PULSE_TOKENS } from "./tokens";
import { buildTokenOverrideCss, wrapInStyleTag } from "./customCss";

/** All recognised theme sources, in resolution priority order. */
export type ThemeSource = "explicit" | "stored" | "system" | "default";

/** Result of a theme resolution pass. */
export interface ResolvedTheme {
  /** The theme definition that was resolved. */
  theme: ThemeDefinition;
  /** Which source produced this resolution. */
  source: ThemeSource;
}

/** Options for `resolveTheme`. */
export interface ResolveThemeOptions {
  /**
   * Explicitly requested theme id. Takes highest priority.
   * Pass `undefined` to skip explicit resolution.
   */
  explicit?: BuiltInThemeId | string;
  /**
   * Previously stored theme id (e.g. from localStorage).
   * Used when no explicit id is provided.
   */
  stored?: BuiltInThemeId | string;
  /**
   * System color-scheme preference (`"dark"` | `"light"`).
   * Pass the result of `window.matchMedia('(prefers-color-scheme: dark)').matches`
   * as `"dark"` or `"light"`. Omit for SSR.
   */
  system?: "dark" | "light";
  /**
   * Custom theme registry — merged with built-in themes.
   * Custom entries override built-ins with the same id.
   */
  customThemes?: ThemeDefinition[];
}

/**
 * Resolve the active theme from the provided options.
 *
 * Priority: explicit → stored → system → default (light)
 *
 * @example
 * const { theme } = resolveTheme({ explicit: 'dark' });
 * // theme.id === 'dark'
 */
export function resolveTheme(options: ResolveThemeOptions = {}): ResolvedTheme {
  const { explicit, stored, system, customThemes = [] } = options;
  const registry = buildThemeRegistry(customThemes);

  if (explicit) {
    const theme = registry.get(explicit);
    if (theme) return { theme, source: "explicit" };
  }

  if (stored) {
    const theme = registry.get(stored);
    if (theme) return { theme, source: "stored" };
  }

  if (system === "dark") {
    const theme = registry.get("dark");
    if (theme) return { theme, source: "system" };
  }

  return { theme: THEME_LIGHT, source: "default" };
}

/**
 * Generate a CSS string that applies the resolved theme's token overrides.
 * Scopes overrides to `[data-pulse-theme="<id>"]` for explicit themes,
 * or `:root` for the default (light) theme.
 *
 * Safe for SSR — returns a plain string.
 *
 * @example
 * const css = generateThemeCss(resolveTheme({ explicit: 'dark' }).theme);
 */
export function generateThemeCss(theme: ThemeDefinition): string {
  if (theme.id === "light" || Object.keys(theme.tokens).length === 0) {
    return "";
  }
  const declarations = Object.entries(theme.tokens)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
  return `[data-pulse-theme="${theme.id}"] {\n${declarations}\n}`;
}

/**
 * Generate a `<style>` tag string for SSR injection of a theme.
 *
 * @example
 * const tag = generateThemeStyleTag(resolveTheme({ explicit: 'dark' }).theme);
 * // inject into <head> during SSR
 */
export function generateThemeStyleTag(theme: ThemeDefinition): string {
  const css = generateThemeCss(theme);
  if (!css) return "";
  return wrapInStyleTag(css, `pulse-theme-${theme.id}`);
}

/**
 * Generate a `:root` override block for a flat token map.
 * Convenience wrapper around `buildTokenOverrideCss` for theme consumers.
 */
export function generateRootOverrideCss(overrides: Record<string, string>): string {
  return buildTokenOverrideCss(overrides);
}

/**
 * Check whether a given string is a valid built-in theme id.
 */
export function isBuiltInThemeId(id: string): id is BuiltInThemeId {
  return id === "light" || id === "dark" || id === "minimal";
}

/**
 * Return the list of all known token variable names.
 * Useful for validating custom theme token keys.
 */
export function getKnownTokenVariables(): string[] {
  return PULSE_TOKENS.map((t) => t.variable);
}

// ── Internal ──────────────────────────────────────────────────────────────

function buildThemeRegistry(
  customThemes: ThemeDefinition[]
): Map<string, ThemeDefinition> {
  const map = new Map<string, ThemeDefinition>();
  for (const theme of Object.values(BUILT_IN_THEMES)) {
    map.set(theme.id, theme);
  }
  for (const theme of customThemes) {
    map.set(theme.id, theme);
  }
  return map;
}
