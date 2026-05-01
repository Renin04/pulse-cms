/**
 * Pulse renderer CSS variable token contract.
 *
 * Every `--pulse-*` variable recognised by the renderer is listed here with its
 * default value. Consumers can override any token on `:root` or a scoped
 * selector; the renderer will pick up the change automatically because all
 * rendered HTML references these variables rather than raw values.
 *
 * Groups:
 *  color   → --pulse-color-*
 *  space   → --pulse-space-*
 *  font    → --pulse-font-*
 *  radius  → --pulse-radius-*
 *  shadow  → --pulse-shadow-*
 *  motion  → --pulse-motion-*
 *  layout  → --pulse-layout-*
 */

/** A single CSS variable token definition. */
export interface TokenDefinition {
  /** The full CSS variable name, e.g. `--pulse-color-text`. */
  variable: string;
  /** The default value applied in `tokens.css`. */
  defaultValue: string;
  /** Human-readable description of what this token controls. */
  description: string;
  /** Token group for organisation and documentation. */
  group: TokenGroup;
}

export type TokenGroup =
  | "color"
  | "space"
  | "font"
  | "radius"
  | "shadow"
  | "motion"
  | "layout";

/** Complete registry of all `--pulse-*` CSS variable tokens. */
export const PULSE_TOKENS: TokenDefinition[] = [
  // ── Color ─────────────────────────────────────────────────────────────────
  { variable: "--pulse-color-bg",               defaultValue: "#ffffff",    description: "Page / renderer background",                    group: "color" },
  { variable: "--pulse-color-surface",          defaultValue: "#f8f9fa",    description: "Card / block surface background",               group: "color" },
  { variable: "--pulse-color-text",             defaultValue: "#1a1a1a",    description: "Primary body text",                             group: "color" },
  { variable: "--pulse-color-text-muted",       defaultValue: "#6b7280",    description: "Secondary / muted text (captions, meta)",       group: "color" },
  { variable: "--pulse-color-heading",          defaultValue: "#111111",    description: "Heading text color",                            group: "color" },
  { variable: "--pulse-color-link",             defaultValue: "#2563eb",    description: "Hyperlink default color",                       group: "color" },
  { variable: "--pulse-color-link-hover",       defaultValue: "#1d4ed8",    description: "Hyperlink hover color",                         group: "color" },
  { variable: "--pulse-color-border",           defaultValue: "#e5e7eb",    description: "Default border / divider color",                group: "color" },
  { variable: "--pulse-color-focus",            defaultValue: "#2563eb",    description: "Keyboard focus ring color",                     group: "color" },
  { variable: "--pulse-color-accent",           defaultValue: "#2563eb",    description: "Brand / accent color used for highlights",      group: "color" },
  { variable: "--pulse-color-code-bg",          defaultValue: "#f3f4f6",    description: "Inline code and code block background",         group: "color" },
  { variable: "--pulse-color-code-text",        defaultValue: "#111827",    description: "Inline code and code block text",               group: "color" },
  { variable: "--pulse-color-blockquote-border",defaultValue: "#d1d5db",    description: "Left-border accent for blockquote blocks",      group: "color" },
  { variable: "--pulse-color-blockquote-bg",    defaultValue: "#f9fafb",    description: "Background tint for blockquote blocks",         group: "color" },

  // ── Space ─────────────────────────────────────────────────────────────────
  { variable: "--pulse-space-1",  defaultValue: "4px",  description: "Spacing scale step 1", group: "space" },
  { variable: "--pulse-space-2",  defaultValue: "8px",  description: "Spacing scale step 2", group: "space" },
  { variable: "--pulse-space-3",  defaultValue: "12px", description: "Spacing scale step 3", group: "space" },
  { variable: "--pulse-space-4",  defaultValue: "16px", description: "Spacing scale step 4", group: "space" },
  { variable: "--pulse-space-5",  defaultValue: "20px", description: "Spacing scale step 5", group: "space" },
  { variable: "--pulse-space-6",  defaultValue: "24px", description: "Spacing scale step 6", group: "space" },
  { variable: "--pulse-space-8",  defaultValue: "32px", description: "Spacing scale step 8", group: "space" },
  { variable: "--pulse-space-10", defaultValue: "40px", description: "Spacing scale step 10", group: "space" },

  // ── Font ──────────────────────────────────────────────────────────────────
  { variable: "--pulse-font-family-body",    defaultValue: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",                          description: "Body / prose font family",          group: "font" },
  { variable: "--pulse-font-family-heading", defaultValue: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",                          description: "Heading font family",               group: "font" },
  { variable: "--pulse-font-family-mono",    defaultValue: "'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",               description: "Monospace font family (code blocks)", group: "font" },
  { variable: "--pulse-font-size-base",      defaultValue: "1rem",    description: "Base body font size",              group: "font" },
  { variable: "--pulse-font-size-sm",        defaultValue: "0.875rem",description: "Small / caption font size",        group: "font" },
  { variable: "--pulse-font-size-lg",        defaultValue: "1.125rem",description: "Large emphasis font size",         group: "font" },
  { variable: "--pulse-font-size-xl",        defaultValue: "1.25rem", description: "Extra-large font size",            group: "font" },
  { variable: "--pulse-font-size-2xl",       defaultValue: "1.5rem",  description: "2x extra-large (h3 range)",        group: "font" },
  { variable: "--pulse-font-size-3xl",       defaultValue: "1.875rem",description: "3x extra-large (h2 range)",        group: "font" },
  { variable: "--pulse-font-size-4xl",       defaultValue: "2.25rem", description: "4x extra-large (h1 range)",        group: "font" },
  { variable: "--pulse-font-weight-normal",  defaultValue: "400",     description: "Normal / regular font weight",     group: "font" },
  { variable: "--pulse-font-weight-medium",  defaultValue: "500",     description: "Medium font weight",               group: "font" },
  { variable: "--pulse-font-weight-semibold",defaultValue: "600",     description: "Semibold font weight",             group: "font" },
  { variable: "--pulse-font-weight-bold",    defaultValue: "700",     description: "Bold font weight",                 group: "font" },
  { variable: "--pulse-line-height-body",    defaultValue: "1.7",     description: "Line height for body prose",       group: "font" },
  { variable: "--pulse-line-height-heading", defaultValue: "1.25",    description: "Line height for headings",         group: "font" },
  { variable: "--pulse-line-height-code",    defaultValue: "1.5",     description: "Line height for code blocks",      group: "font" },

  // ── Radius ────────────────────────────────────────────────────────────────
  { variable: "--pulse-radius-sm",   defaultValue: "4px",    description: "Small border-radius (badges, inline chips)", group: "radius" },
  { variable: "--pulse-radius-md",   defaultValue: "8px",    description: "Medium border-radius (cards, panels)",       group: "radius" },
  { variable: "--pulse-radius-lg",   defaultValue: "12px",   description: "Large border-radius (modals, callouts)",     group: "radius" },
  { variable: "--pulse-radius-full", defaultValue: "9999px", description: "Fully-rounded (pills, avatars)",             group: "radius" },

  // ── Shadow ────────────────────────────────────────────────────────────────
  { variable: "--pulse-shadow-sm", defaultValue: "0 1px 2px 0 rgb(0 0 0 / 0.05)",                                                          description: "Subtle lift shadow",    group: "shadow" },
  { variable: "--pulse-shadow-md", defaultValue: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",                    description: "Medium card shadow",    group: "shadow" },
  { variable: "--pulse-shadow-lg", defaultValue: "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)",                  description: "Elevated panel shadow", group: "shadow" },

  // ── Motion ────────────────────────────────────────────────────────────────
  { variable: "--pulse-motion-duration-fast",    defaultValue: "150ms",                      description: "Fast transition duration (hover, focus)",      group: "motion" },
  { variable: "--pulse-motion-duration-base",    defaultValue: "250ms",                      description: "Base animation duration",                      group: "motion" },
  { variable: "--pulse-motion-duration-slow",    defaultValue: "400ms",                      description: "Slow / entrance animation duration",           group: "motion" },
  { variable: "--pulse-motion-easing-default",   defaultValue: "cubic-bezier(0.4, 0, 0.2, 1)", description: "Default easing (material standard)",        group: "motion" },
  { variable: "--pulse-motion-easing-out",       defaultValue: "cubic-bezier(0, 0, 0.2, 1)",   description: "Decelerate / ease-out for entrance motion", group: "motion" },
  { variable: "--pulse-motion-easing-in",        defaultValue: "cubic-bezier(0.4, 0, 1, 1)",   description: "Accelerate / ease-in for exit motion",      group: "motion" },

  // ── Layout ────────────────────────────────────────────────────────────────
  { variable: "--pulse-layout-max-width",      defaultValue: "860px", description: "Default content column max-width",              group: "layout" },
  { variable: "--pulse-layout-padding-inline", defaultValue: "24px",  description: "Horizontal padding on the layout container",    group: "layout" },
  { variable: "--pulse-layout-block-gap",      defaultValue: "20px",  description: "Vertical gap between content blocks",           group: "layout" },
];

/** Typed map of token variable name → its definition for O(1) lookup. */
export type TokenMap = Record<string, TokenDefinition>;

/**
 * Build a lookup map of all tokens indexed by their CSS variable name.
 *
 * @example
 * const map = buildTokenMap();
 * map['--pulse-color-text'].defaultValue; // '#1a1a1a'
 */
export function buildTokenMap(): TokenMap {
  const map: TokenMap = {};
  for (const token of PULSE_TOKENS) {
    map[token.variable] = token;
  }
  return map;
}

/**
 * Return all tokens belonging to a given group.
 *
 * @example
 * const colorTokens = getTokensByGroup('color');
 */
export function getTokensByGroup(group: TokenGroup): TokenDefinition[] {
  return PULSE_TOKENS.filter((t) => t.group === group);
}

/**
 * Resolve a token's default value by its CSS variable name.
 * Returns `undefined` if the token is not registered.
 */
export function getTokenDefault(variable: string): string | undefined {
  return PULSE_TOKENS.find((t) => t.variable === variable)?.defaultValue;
}

/**
 * Generate a CSS `:root { }` block string containing all default token
 * declarations. Useful for SSR style injection and testing.
 *
 * @param indent - Number of spaces per indent level (default 2).
 */
export function generateTokensRootBlock(indent = 2): string {
  const pad = " ".repeat(indent);
  const declarations = PULSE_TOKENS.map(
    (t) => `${pad}${t.variable}: ${t.defaultValue};`
  ).join("\n");
  return `:root {\n${declarations}\n}`;
}
