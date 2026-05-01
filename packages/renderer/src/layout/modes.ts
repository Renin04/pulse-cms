import { escapeHtml } from "../render/render";

export type LayoutMode = "single" | "multi-column" | "grid" | "manga";

export interface LayoutSpacingConfig {
  blockGap: number;
  rowGap: number;
  columnGap: number;
  outerPadding: number;
}

export interface MultiColumnLayoutConfig {
  columns: number;
  minColumnWidth: number;
}

export interface GridLayoutConfig {
  minItemWidth: number;
  maxColumns: number;
  autoFlow: "row" | "dense";
}

export interface FullWidthLayoutConfig {
  enabled: boolean;
  maxWidth: number;
}

export interface StickyLayoutConfig {
  enabled: boolean;
  topOffset: number;
  zIndex: number;
}

export interface LayoutModeConfig {
  mode?: LayoutMode;
  spacing?: Partial<LayoutSpacingConfig>;
  multiColumn?: Partial<MultiColumnLayoutConfig>;
  grid?: Partial<GridLayoutConfig>;
  fullWidth?: Partial<FullWidthLayoutConfig>;
  sticky?: Partial<StickyLayoutConfig>;
  rootTagName?: "article" | "section" | "div" | "main";
  innerTagName?: "div" | "section" | "main";
  rootClassName?: string;
  attributes?: Record<string, string>;
  stickyContentHtml?: string;
}

export interface ResolvedLayoutModeConfig {
  mode: LayoutMode;
  spacing: LayoutSpacingConfig;
  multiColumn: MultiColumnLayoutConfig;
  grid: GridLayoutConfig;
  fullWidth: FullWidthLayoutConfig;
  sticky: StickyLayoutConfig;
}

export const DEFAULT_LAYOUT_SPACING: LayoutSpacingConfig = {
  blockGap: 20,
  rowGap: 20,
  columnGap: 24,
  outerPadding: 24,
};

export const DEFAULT_MULTI_COLUMN_LAYOUT: MultiColumnLayoutConfig = {
  columns: 2,
  minColumnWidth: 280,
};

export const DEFAULT_GRID_LAYOUT: GridLayoutConfig = {
  minItemWidth: 240,
  maxColumns: 3,
  autoFlow: "row",
};

export const DEFAULT_FULL_WIDTH_LAYOUT: FullWidthLayoutConfig = {
  enabled: false,
  maxWidth: 1280,
};

export const DEFAULT_STICKY_LAYOUT: StickyLayoutConfig = {
  enabled: false,
  topOffset: 24,
  zIndex: 10,
};

const ALLOWED_LAYOUT_MODES: LayoutMode[] = [
  "single",
  "multi-column",
  "grid",
  "manga",
];
const ALLOWED_ROOT_TAGS = ["article", "section", "div", "main"] as const;
const ALLOWED_INNER_TAGS = ["div", "section", "main"] as const;

function normalizeInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.floor(value);
}

function normalizePositive(value: number, fallback: number): number {
  const normalized = normalizeInteger(value, fallback);
  if (normalized < 0) return 0;
  return normalized;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeTagName<TTag extends string>(
  value: string | undefined,
  allowedTags: readonly TTag[],
  fallback: TTag,
): TTag {
  if (!value) return fallback;
  return (allowedTags as readonly string[]).includes(value)
    ? (value as TTag)
    : fallback;
}

function resolveLayoutMode(mode: LayoutMode | undefined): LayoutMode {
  if (!mode) return "single";
  if (ALLOWED_LAYOUT_MODES.includes(mode)) return mode;
  return "single";
}

function isValidAttributeName(name: string): boolean {
  return /^[A-Za-z_:][-A-Za-z0-9_:.]*$/.test(name);
}

function serializeAttributes(attributes: Record<string, string>): string {
  const entries = Object.entries(attributes);
  if (entries.length === 0) return "";
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(" ");
}

function resolveSpacingConfig(
  overrides: Partial<LayoutSpacingConfig> = {},
): LayoutSpacingConfig {
  return {
    blockGap: normalizePositive(
      overrides.blockGap ?? DEFAULT_LAYOUT_SPACING.blockGap,
      DEFAULT_LAYOUT_SPACING.blockGap,
    ),
    rowGap: normalizePositive(
      overrides.rowGap ?? DEFAULT_LAYOUT_SPACING.rowGap,
      DEFAULT_LAYOUT_SPACING.rowGap,
    ),
    columnGap: normalizePositive(
      overrides.columnGap ?? DEFAULT_LAYOUT_SPACING.columnGap,
      DEFAULT_LAYOUT_SPACING.columnGap,
    ),
    outerPadding: normalizePositive(
      overrides.outerPadding ?? DEFAULT_LAYOUT_SPACING.outerPadding,
      DEFAULT_LAYOUT_SPACING.outerPadding,
    ),
  };
}

function resolveMultiColumnConfig(
  overrides: Partial<MultiColumnLayoutConfig> = {},
): MultiColumnLayoutConfig {
  return {
    columns: clamp(
      normalizePositive(
        overrides.columns ?? DEFAULT_MULTI_COLUMN_LAYOUT.columns,
        DEFAULT_MULTI_COLUMN_LAYOUT.columns,
      ),
      1,
      6,
    ),
    minColumnWidth: normalizePositive(
      overrides.minColumnWidth ?? DEFAULT_MULTI_COLUMN_LAYOUT.minColumnWidth,
      DEFAULT_MULTI_COLUMN_LAYOUT.minColumnWidth,
    ),
  };
}

function resolveGridConfig(
  overrides: Partial<GridLayoutConfig> = {},
): GridLayoutConfig {
  const autoFlow = overrides.autoFlow;
  return {
    minItemWidth: normalizePositive(
      overrides.minItemWidth ?? DEFAULT_GRID_LAYOUT.minItemWidth,
      DEFAULT_GRID_LAYOUT.minItemWidth,
    ),
    maxColumns: clamp(
      normalizePositive(
        overrides.maxColumns ?? DEFAULT_GRID_LAYOUT.maxColumns,
        DEFAULT_GRID_LAYOUT.maxColumns,
      ),
      1,
      8,
    ),
    autoFlow: autoFlow === "dense" ? "dense" : DEFAULT_GRID_LAYOUT.autoFlow,
  };
}

function resolveFullWidthConfig(
  overrides: Partial<FullWidthLayoutConfig> = {},
): FullWidthLayoutConfig {
  return {
    enabled: Boolean(overrides.enabled ?? DEFAULT_FULL_WIDTH_LAYOUT.enabled),
    maxWidth: normalizePositive(
      overrides.maxWidth ?? DEFAULT_FULL_WIDTH_LAYOUT.maxWidth,
      DEFAULT_FULL_WIDTH_LAYOUT.maxWidth,
    ),
  };
}

function resolveStickyConfig(
  overrides: Partial<StickyLayoutConfig> = {},
): StickyLayoutConfig {
  return {
    enabled: Boolean(overrides.enabled ?? DEFAULT_STICKY_LAYOUT.enabled),
    topOffset: normalizePositive(
      overrides.topOffset ?? DEFAULT_STICKY_LAYOUT.topOffset,
      DEFAULT_STICKY_LAYOUT.topOffset,
    ),
    zIndex: normalizePositive(
      overrides.zIndex ?? DEFAULT_STICKY_LAYOUT.zIndex,
      DEFAULT_STICKY_LAYOUT.zIndex,
    ),
  };
}

function serializeRootAttributes(
  config: LayoutModeConfig,
  resolved: ResolvedLayoutModeConfig,
): string {
  const classTokens = [
    "pulse-layout",
    `pulse-layout--${resolved.mode}`,
    resolved.fullWidth.enabled ? "pulse-layout--full-width" : "",
    resolved.sticky.enabled ? "pulse-layout--sticky" : "",
  ].filter(Boolean);

  if (config.rootClassName) {
    classTokens.push(config.rootClassName.trim());
  }

  const attributes: Record<string, string> = {
    class: classTokens.join(" ").trim(),
    "data-pulse-layout-mode": resolved.mode,
    "data-pulse-full-width": String(resolved.fullWidth.enabled),
    "data-pulse-sticky": String(resolved.sticky.enabled),
    style: [
      `--pulse-layout-block-gap:${resolved.spacing.blockGap}px`,
      `--pulse-layout-row-gap:${resolved.spacing.rowGap}px`,
      `--pulse-layout-column-gap:${resolved.spacing.columnGap}px`,
      `--pulse-layout-outer-padding:${resolved.spacing.outerPadding}px`,
      `--pulse-layout-columns:${resolved.multiColumn.columns}`,
      `--pulse-layout-min-column-width:${resolved.multiColumn.minColumnWidth}px`,
      `--pulse-layout-grid-min-item-width:${resolved.grid.minItemWidth}px`,
      `--pulse-layout-grid-max-columns:${resolved.grid.maxColumns}`,
      `--pulse-layout-grid-auto-flow:${resolved.grid.autoFlow}`,
      `--pulse-layout-full-width-max:${resolved.fullWidth.maxWidth}px`,
      `--pulse-layout-sticky-top:${resolved.sticky.topOffset}px`,
      `--pulse-layout-sticky-z-index:${resolved.sticky.zIndex}`,
    ].join(";"),
  };

  if (config.attributes) {
    for (const [key, value] of Object.entries(config.attributes)) {
      if (
        key === "class" ||
        key === "style" ||
        key === "data-pulse-layout-mode" ||
        key === "data-pulse-full-width" ||
        key === "data-pulse-sticky"
      ) {
        continue;
      }
      if (!isValidAttributeName(key)) continue;
      attributes[key] = value;
    }
  }

  return serializeAttributes(attributes);
}

export function resolveLayoutModeConfig(
  config: LayoutModeConfig = {},
): ResolvedLayoutModeConfig {
  return {
    mode: resolveLayoutMode(config.mode),
    spacing: resolveSpacingConfig(config.spacing),
    multiColumn: resolveMultiColumnConfig(config.multiColumn),
    grid: resolveGridConfig(config.grid),
    fullWidth: resolveFullWidthConfig(config.fullWidth),
    sticky: resolveStickyConfig(config.sticky),
  };
}

export function renderLayoutMode(
  contentHtml: string,
  config: LayoutModeConfig = {},
): string {
  const resolved = resolveLayoutModeConfig(config);
  const rootTagName = sanitizeTagName(
    config.rootTagName,
    ALLOWED_ROOT_TAGS,
    "article",
  );
  const innerTagName = sanitizeTagName(
    config.innerTagName,
    ALLOWED_INNER_TAGS,
    "div",
  );
  const rootAttributes = serializeRootAttributes(config, resolved);

  if (resolved.sticky.enabled && config.stickyContentHtml) {
    return `<${rootTagName} ${rootAttributes}><div class="pulse-layout__frame"><${innerTagName} class="pulse-layout__inner pulse-layout__scroll">${contentHtml}</${innerTagName}><aside class="pulse-layout__sticky-region">${config.stickyContentHtml}</aside></div></${rootTagName}>`;
  }

  return `<${rootTagName} ${rootAttributes}><${innerTagName} class="pulse-layout__inner">${contentHtml}</${innerTagName}></${rootTagName}>`;
}
