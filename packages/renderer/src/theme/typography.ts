/**
 * Font and spacing token customization APIs for @pulse/renderer.
 *
 * Provides typed helpers for building token override maps for typography
 * and spacing — the two most commonly customized token groups.
 */

import { buildTokenOverrideCss } from "./customCss";

// ── Typography ────────────────────────────────────────────────────────────

/** Font family configuration. */
export interface FontFamilyConfig {
  /** Body / prose font stack. Maps to `--pulse-font-family-body`. */
  body?: string;
  /** Heading font stack. Maps to `--pulse-font-family-heading`. */
  heading?: string;
  /** Monospace font stack. Maps to `--pulse-font-family-mono`. */
  mono?: string;
}

/** Font size scale overrides. All values should be valid CSS length strings. */
export interface FontSizeConfig {
  base?: string;
  sm?: string;
  lg?: string;
  xl?: string;
  "2xl"?: string;
  "3xl"?: string;
  "4xl"?: string;
}

/** Line height overrides. */
export interface LineHeightConfig {
  body?: string;
  heading?: string;
  code?: string;
}

/** Font weight overrides. Values should be numeric strings (e.g. "400"). */
export interface FontWeightConfig {
  normal?: string;
  medium?: string;
  semibold?: string;
  bold?: string;
}

/** Combined typography customization config. */
export interface TypographyConfig {
  fontFamily?: FontFamilyConfig;
  fontSize?: FontSizeConfig;
  lineHeight?: LineHeightConfig;
  fontWeight?: FontWeightConfig;
}

/**
 * Build a token override map from a `TypographyConfig`.
 *
 * @example
 * const overrides = buildTypographyTokens({
 *   fontFamily: { body: 'Georgia, serif' },
 *   fontSize: { base: '1.0625rem' },
 * });
 */
export function buildTypographyTokens(
  config: TypographyConfig
): Record<string, string> {
  const overrides: Record<string, string> = {};

  if (config.fontFamily) {
    const { body, heading, mono } = config.fontFamily;
    if (body)    overrides["--pulse-font-family-body"]    = body;
    if (heading) overrides["--pulse-font-family-heading"] = heading;
    if (mono)    overrides["--pulse-font-family-mono"]    = mono;
  }

  if (config.fontSize) {
    const fs = config.fontSize;
    if (fs.base)  overrides["--pulse-font-size-base"]  = fs.base;
    if (fs.sm)    overrides["--pulse-font-size-sm"]    = fs.sm;
    if (fs.lg)    overrides["--pulse-font-size-lg"]    = fs.lg;
    if (fs.xl)    overrides["--pulse-font-size-xl"]    = fs.xl;
    if (fs["2xl"]) overrides["--pulse-font-size-2xl"] = fs["2xl"];
    if (fs["3xl"]) overrides["--pulse-font-size-3xl"] = fs["3xl"];
    if (fs["4xl"]) overrides["--pulse-font-size-4xl"] = fs["4xl"];
  }

  if (config.lineHeight) {
    const lh = config.lineHeight;
    if (lh.body)    overrides["--pulse-line-height-body"]    = lh.body;
    if (lh.heading) overrides["--pulse-line-height-heading"] = lh.heading;
    if (lh.code)    overrides["--pulse-line-height-code"]    = lh.code;
  }

  if (config.fontWeight) {
    const fw = config.fontWeight;
    if (fw.normal)   overrides["--pulse-font-weight-normal"]   = fw.normal;
    if (fw.medium)   overrides["--pulse-font-weight-medium"]   = fw.medium;
    if (fw.semibold) overrides["--pulse-font-weight-semibold"] = fw.semibold;
    if (fw.bold)     overrides["--pulse-font-weight-bold"]     = fw.bold;
  }

  return overrides;
}

/**
 * Generate a `:root {}` CSS block from a `TypographyConfig`.
 *
 * @example
 * const css = buildTypographyCss({ fontFamily: { body: 'Georgia, serif' } });
 * // ':root {\n  --pulse-font-family-body: Georgia, serif;\n}'
 */
export function buildTypographyCss(config: TypographyConfig): string {
  return buildTokenOverrideCss(buildTypographyTokens(config));
}

// ── Spacing ───────────────────────────────────────────────────────────────

/** Spacing scale overrides. All values should be valid CSS length strings. */
export interface SpacingConfig {
  "1"?: string;
  "2"?: string;
  "3"?: string;
  "4"?: string;
  "5"?: string;
  "6"?: string;
  "8"?: string;
  "10"?: string;
}

/** Layout spacing overrides. */
export interface LayoutSpacingOverrides {
  /** Max content column width. Maps to `--pulse-layout-max-width`. */
  maxWidth?: string;
  /** Horizontal padding on layout container. Maps to `--pulse-layout-padding-inline`. */
  paddingInline?: string;
  /** Vertical gap between blocks. Maps to `--pulse-layout-block-gap`. */
  blockGap?: string;
}

/** Combined spacing customization config. */
export interface SpacingCustomConfig {
  scale?: SpacingConfig;
  layout?: LayoutSpacingOverrides;
}

/**
 * Build a token override map from a `SpacingCustomConfig`.
 *
 * @example
 * const overrides = buildSpacingTokens({
 *   layout: { maxWidth: '720px', blockGap: '24px' },
 * });
 */
export function buildSpacingTokens(
  config: SpacingCustomConfig
): Record<string, string> {
  const overrides: Record<string, string> = {};

  if (config.scale) {
    const s = config.scale;
    if (s["1"])  overrides["--pulse-space-1"]  = s["1"];
    if (s["2"])  overrides["--pulse-space-2"]  = s["2"];
    if (s["3"])  overrides["--pulse-space-3"]  = s["3"];
    if (s["4"])  overrides["--pulse-space-4"]  = s["4"];
    if (s["5"])  overrides["--pulse-space-5"]  = s["5"];
    if (s["6"])  overrides["--pulse-space-6"]  = s["6"];
    if (s["8"])  overrides["--pulse-space-8"]  = s["8"];
    if (s["10"]) overrides["--pulse-space-10"] = s["10"];
  }

  if (config.layout) {
    const l = config.layout;
    if (l.maxWidth)      overrides["--pulse-layout-max-width"]      = l.maxWidth;
    if (l.paddingInline) overrides["--pulse-layout-padding-inline"] = l.paddingInline;
    if (l.blockGap)      overrides["--pulse-layout-block-gap"]      = l.blockGap;
  }

  return overrides;
}

/**
 * Generate a `:root {}` CSS block from a `SpacingCustomConfig`.
 *
 * @example
 * const css = buildSpacingCss({ layout: { maxWidth: '720px' } });
 */
export function buildSpacingCss(config: SpacingCustomConfig): string {
  return buildTokenOverrideCss(buildSpacingTokens(config));
}
