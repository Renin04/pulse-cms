/**
 * Pulse built-in theme definitions.
 *
 * Each theme is a partial map of `--pulse-*` token overrides applied on top of
 * the base token defaults defined in `tokens.css` / `tokens.ts`.
 *
 * Built-in themes:
 *  - light   → default light editorial (matches tokens.css defaults)
 *  - dark    → dark editorial (avoids pure black/white per STYLING_GUIDE)
 *  - minimal → high-contrast, stripped-back, no decorative shadows/radius
 */

import { type TokenGroup } from "./tokens";

/** Identifier for a built-in theme. */
export type BuiltInThemeId = "light" | "dark" | "minimal";

/** A theme is a named set of CSS variable overrides. */
export interface ThemeDefinition {
  /** Unique theme identifier. */
  id: BuiltInThemeId | string;
  /** Human-readable label. */
  label: string;
  /** Partial map of `--pulse-*` variable overrides. */
  tokens: Record<string, string>;
  /** Which token groups this theme primarily affects (informational). */
  affects: TokenGroup[];
}

// ── Light theme ───────────────────────────────────────────────────────────
// Matches the base token defaults — no overrides needed, but defined
// explicitly so consumers can reference it by id.

export const THEME_LIGHT: ThemeDefinition = {
  id: "light",
  label: "Light",
  affects: ["color"],
  tokens: {
    "--pulse-color-bg":                "#ffffff",
    "--pulse-color-surface":           "#f8f9fa",
    "--pulse-color-text":              "#1a1a1a",
    "--pulse-color-text-muted":        "#6b7280",
    "--pulse-color-heading":           "#111111",
    "--pulse-color-link":              "#2563eb",
    "--pulse-color-link-hover":        "#1d4ed8",
    "--pulse-color-border":            "#e5e7eb",
    "--pulse-color-focus":             "#2563eb",
    "--pulse-color-accent":            "#2563eb",
    "--pulse-color-code-bg":           "#f3f4f6",
    "--pulse-color-code-text":         "#111827",
    "--pulse-color-blockquote-border": "#d1d5db",
    "--pulse-color-blockquote-bg":     "#f9fafb",
  },
};

// ── Dark theme ────────────────────────────────────────────────────────────
// Avoids pure black (#000) / pure white (#fff) per STYLING_GUIDE rule 3.

export const THEME_DARK: ThemeDefinition = {
  id: "dark",
  label: "Dark",
  affects: ["color"],
  tokens: {
    "--pulse-color-bg":                "#18181b",
    "--pulse-color-surface":           "#27272a",
    "--pulse-color-text":              "#e4e4e7",
    "--pulse-color-text-muted":        "#a1a1aa",
    "--pulse-color-heading":           "#f4f4f5",
    "--pulse-color-link":              "#60a5fa",
    "--pulse-color-link-hover":        "#93c5fd",
    "--pulse-color-border":            "#3f3f46",
    "--pulse-color-focus":             "#60a5fa",
    "--pulse-color-accent":            "#60a5fa",
    "--pulse-color-code-bg":           "#27272a",
    "--pulse-color-code-text":         "#e4e4e7",
    "--pulse-color-blockquote-border": "#52525b",
    "--pulse-color-blockquote-bg":     "#27272a",
  },
};

// ── Minimal theme ─────────────────────────────────────────────────────────
// High-contrast, no decorative shadows, tight radius — clean reading mode.

export const THEME_MINIMAL: ThemeDefinition = {
  id: "minimal",
  label: "Minimal",
  affects: ["color", "shadow", "radius"],
  tokens: {
    "--pulse-color-bg":                "#ffffff",
    "--pulse-color-surface":           "#ffffff",
    "--pulse-color-text":              "#0a0a0a",
    "--pulse-color-text-muted":        "#525252",
    "--pulse-color-heading":           "#0a0a0a",
    "--pulse-color-link":              "#0a0a0a",
    "--pulse-color-link-hover":        "#404040",
    "--pulse-color-border":            "#d4d4d4",
    "--pulse-color-focus":             "#0a0a0a",
    "--pulse-color-accent":            "#0a0a0a",
    "--pulse-color-code-bg":           "#f5f5f5",
    "--pulse-color-code-text":         "#0a0a0a",
    "--pulse-color-blockquote-border": "#a3a3a3",
    "--pulse-color-blockquote-bg":     "#fafafa",
    // Flatten decorative chrome
    "--pulse-shadow-sm":               "none",
    "--pulse-shadow-md":               "none",
    "--pulse-shadow-lg":               "none",
    "--pulse-radius-sm":               "2px",
    "--pulse-radius-md":               "2px",
    "--pulse-radius-lg":               "2px",
  },
};

/** All built-in themes indexed by id. */
export const BUILT_IN_THEMES: Record<BuiltInThemeId, ThemeDefinition> = {
  light:   THEME_LIGHT,
  dark:    THEME_DARK,
  minimal: THEME_MINIMAL,
};

/**
 * Return a built-in theme by id, or `undefined` if not found.
 */
export function getBuiltInTheme(id: BuiltInThemeId): ThemeDefinition {
  return BUILT_IN_THEMES[id];
}

/**
 * List all built-in theme ids.
 */
export function listBuiltInThemeIds(): BuiltInThemeId[] {
  return Object.keys(BUILT_IN_THEMES) as BuiltInThemeId[];
}
