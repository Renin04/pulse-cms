/**
 * Custom CSS override path for @pulse/renderer.
 *
 * Consumers can inject site-specific CSS at three layers:
 *
 *  1. Token overrides  — change `--pulse-*` variable values
 *  2. Block overrides  — target `.pulse-block--*` selectors
 *  3. Arbitrary CSS    — any valid CSS string
 *
 * All injected styles are scoped under a `data-pulse-custom` attribute by
 * default so they can be identified and removed/replaced without affecting
 * other page styles.
 */

/** Supported injection targets for custom CSS. */
export type CustomCssTarget =
  | "token-overrides"   // overrides :root --pulse-* variables
  | "block-overrides"   // targets .pulse-block--* selectors
  | "arbitrary";        // any CSS string

/** A single custom CSS entry. */
export interface CustomCssEntry {
  /** Logical identifier — used to deduplicate and replace entries. */
  id: string;
  /** The raw CSS string to inject. */
  css: string;
  /** Injection target category (informational; does not affect injection). */
  target: CustomCssTarget;
}

/** Options for building a custom CSS style block. */
export interface CustomCssOptions {
  /** Entries to include. */
  entries: CustomCssEntry[];
  /**
   * When true, wraps the combined CSS in a comment block with entry ids.
   * Useful for debugging. Default: false.
   */
  annotate?: boolean;
}

/**
 * Combine multiple `CustomCssEntry` items into a single CSS string.
 *
 * Duplicate `id` values are deduplicated — last entry wins.
 *
 * @example
 * const css = buildCustomCss({
 *   entries: [
 *     { id: 'brand', target: 'token-overrides', css: ':root { --pulse-color-accent: #e11d48; }' },
 *     { id: 'hero',  target: 'block-overrides',  css: '.pulse-block--image { border-radius: 0; }' },
 *   ],
 * });
 */
export function buildCustomCss(options: CustomCssOptions): string {
  const { entries, annotate = false } = options;

  // Deduplicate by id — last entry wins
  const deduped = deduplicateEntries(entries);

  if (deduped.length === 0) return "";

  const parts: string[] = deduped.map((entry) => {
    if (annotate) {
      return `/* pulse-custom: ${entry.id} (${entry.target}) */\n${entry.css.trim()}`;
    }
    return entry.css.trim();
  });

  return parts.join("\n\n");
}

/**
 * Wrap a CSS string in a `<style>` tag with the `data-pulse-custom` marker.
 * Safe to call in SSR contexts — produces a plain HTML string.
 *
 * @example
 * const tag = wrapInStyleTag('body { color: red; }', 'my-overrides');
 * // '<style data-pulse-custom="my-overrides">body { color: red; }</style>'
 */
export function wrapInStyleTag(css: string, id = "pulse-custom"): string {
  if (!css.trim()) return "";
  return `<style data-pulse-custom="${id}">${css}</style>`;
}

/**
 * Generate a token-override CSS block from a plain key→value map.
 *
 * Keys must be valid `--pulse-*` variable names.
 * Invalid (non `--pulse-`) keys are silently skipped.
 *
 * @example
 * const css = buildTokenOverrideCss({
 *   '--pulse-color-accent': '#e11d48',
 *   '--pulse-font-size-base': '1.0625rem',
 * });
 * // ':root {\n  --pulse-color-accent: #e11d48;\n  --pulse-font-size-base: 1.0625rem;\n}'
 */
export function buildTokenOverrideCss(
  overrides: Record<string, string>
): string {
  const declarations = Object.entries(overrides)
    .filter(([key]) => key.startsWith("--pulse-"))
    .map(([key, value]) => `  ${key}: ${value};`);

  if (declarations.length === 0) return "";
  return `:root {\n${declarations.join("\n")}\n}`;
}

/**
 * Validate that all keys in an override map are registered `--pulse-*` tokens.
 *
 * Returns an array of unrecognised variable names (empty = all valid).
 * Pass `knownVariables` from `PULSE_TOKENS.map(t => t.variable)`.
 */
export function validateTokenOverrides(
  overrides: Record<string, string>,
  knownVariables: string[]
): string[] {
  const known = new Set(knownVariables);
  return Object.keys(overrides).filter(
    (key) => key.startsWith("--pulse-") && !known.has(key)
  );
}

// ── Internal helpers ──────────────────────────────────────────────────────

function deduplicateEntries(entries: CustomCssEntry[]): CustomCssEntry[] {
  const seen = new Map<string, CustomCssEntry>();
  for (const entry of entries) {
    seen.set(entry.id, entry);
  }
  return Array.from(seen.values());
}
