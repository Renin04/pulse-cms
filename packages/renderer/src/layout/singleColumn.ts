import { escapeHtml } from "../render/render";

export type SingleColumnBreakpointName =
  | "mobile"
  | "tablet"
  | "desktop"
  | "wide";

export interface SingleColumnBreakpointConfig {
  minViewportWidth: number;
  maxContainerWidth: number;
  horizontalPadding: number;
  blockGap: number;
}

export type SingleColumnBreakpointMap = Record<
  SingleColumnBreakpointName,
  SingleColumnBreakpointConfig
>;

export interface SingleColumnBreakpointOverrides {
  mobile?: Partial<SingleColumnBreakpointConfig>;
  tablet?: Partial<SingleColumnBreakpointConfig>;
  desktop?: Partial<SingleColumnBreakpointConfig>;
  wide?: Partial<SingleColumnBreakpointConfig>;
}

export interface SingleColumnLayoutMetrics
  extends SingleColumnBreakpointConfig {
  breakpoint: SingleColumnBreakpointName;
  viewportWidth: number;
}

export interface SingleColumnLayoutOptions {
  viewportWidth?: number;
  breakpoints?: SingleColumnBreakpointOverrides;
  rootTagName?: "article" | "section" | "div" | "main";
  innerTagName?: "div" | "section" | "main";
  rootClassName?: string;
  attributes?: Record<string, string>;
}

export const DEFAULT_SINGLE_COLUMN_BREAKPOINTS: SingleColumnBreakpointMap = {
  mobile: {
    minViewportWidth: 0,
    maxContainerWidth: 640,
    horizontalPadding: 16,
    blockGap: 16,
  },
  tablet: {
    minViewportWidth: 768,
    maxContainerWidth: 760,
    horizontalPadding: 24,
    blockGap: 18,
  },
  desktop: {
    minViewportWidth: 1024,
    maxContainerWidth: 860,
    horizontalPadding: 32,
    blockGap: 20,
  },
  wide: {
    minViewportWidth: 1440,
    maxContainerWidth: 960,
    horizontalPadding: 40,
    blockGap: 24,
  },
};

const BREAKPOINT_ORDER: SingleColumnBreakpointName[] = [
  "mobile",
  "tablet",
  "desktop",
  "wide",
];
const ALLOWED_ROOT_TAGS = ["article", "section", "div", "main"] as const;
const ALLOWED_INNER_TAGS = ["div", "section", "main"] as const;

function normalizePositiveInteger(value: number): number {
  const normalized = Math.floor(Number.isFinite(value) ? value : 0);
  if (normalized < 0) return 0;
  return normalized;
}

function normalizeViewportWidth(viewportWidth: number): number {
  return normalizePositiveInteger(viewportWidth);
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

function mergeBreakpoints(
  overrides: SingleColumnBreakpointOverrides = {},
): SingleColumnBreakpointMap {
  return {
    mobile: {
      ...DEFAULT_SINGLE_COLUMN_BREAKPOINTS.mobile,
      ...(overrides.mobile ?? {}),
    },
    tablet: {
      ...DEFAULT_SINGLE_COLUMN_BREAKPOINTS.tablet,
      ...(overrides.tablet ?? {}),
    },
    desktop: {
      ...DEFAULT_SINGLE_COLUMN_BREAKPOINTS.desktop,
      ...(overrides.desktop ?? {}),
    },
    wide: {
      ...DEFAULT_SINGLE_COLUMN_BREAKPOINTS.wide,
      ...(overrides.wide ?? {}),
    },
  };
}

function normalizeBreakpoints(
  breakpoints: SingleColumnBreakpointMap,
): SingleColumnBreakpointMap {
  return {
    mobile: {
      minViewportWidth: normalizePositiveInteger(
        breakpoints.mobile.minViewportWidth,
      ),
      maxContainerWidth: normalizePositiveInteger(
        breakpoints.mobile.maxContainerWidth,
      ),
      horizontalPadding: normalizePositiveInteger(
        breakpoints.mobile.horizontalPadding,
      ),
      blockGap: normalizePositiveInteger(breakpoints.mobile.blockGap),
    },
    tablet: {
      minViewportWidth: normalizePositiveInteger(
        breakpoints.tablet.minViewportWidth,
      ),
      maxContainerWidth: normalizePositiveInteger(
        breakpoints.tablet.maxContainerWidth,
      ),
      horizontalPadding: normalizePositiveInteger(
        breakpoints.tablet.horizontalPadding,
      ),
      blockGap: normalizePositiveInteger(breakpoints.tablet.blockGap),
    },
    desktop: {
      minViewportWidth: normalizePositiveInteger(
        breakpoints.desktop.minViewportWidth,
      ),
      maxContainerWidth: normalizePositiveInteger(
        breakpoints.desktop.maxContainerWidth,
      ),
      horizontalPadding: normalizePositiveInteger(
        breakpoints.desktop.horizontalPadding,
      ),
      blockGap: normalizePositiveInteger(breakpoints.desktop.blockGap),
    },
    wide: {
      minViewportWidth: normalizePositiveInteger(
        breakpoints.wide.minViewportWidth,
      ),
      maxContainerWidth: normalizePositiveInteger(
        breakpoints.wide.maxContainerWidth,
      ),
      horizontalPadding: normalizePositiveInteger(
        breakpoints.wide.horizontalPadding,
      ),
      blockGap: normalizePositiveInteger(breakpoints.wide.blockGap),
    },
  };
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

function serializeRootAttributes(
  options: SingleColumnLayoutOptions,
  metrics: SingleColumnLayoutMetrics,
): string {
  const classTokens = [
    "pulse-layout",
    "pulse-layout--single",
    `pulse-layout--${metrics.breakpoint}`,
  ];
  if (options.rootClassName) {
    classTokens.push(options.rootClassName.trim());
  }

  const attributes: Record<string, string> = {
    class: classTokens.join(" ").trim(),
    "data-pulse-layout": "single-column",
    "data-pulse-breakpoint": metrics.breakpoint,
    style: [
      `--pulse-container-max-width:${metrics.maxContainerWidth}px`,
      `--pulse-container-padding:${metrics.horizontalPadding}px`,
      `--pulse-block-gap:${metrics.blockGap}px`,
    ].join(";"),
  };

  if (options.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      if (
        key === "class" ||
        key === "style" ||
        key === "data-pulse-layout" ||
        key === "data-pulse-breakpoint"
      ) {
        continue;
      }
      if (!isValidAttributeName(key)) continue;
      attributes[key] = value;
    }
  }

  return serializeAttributes(attributes);
}

export function resolveSingleColumnBreakpoint(
  viewportWidth: number,
  breakpoints: SingleColumnBreakpointMap = DEFAULT_SINGLE_COLUMN_BREAKPOINTS,
): SingleColumnBreakpointName {
  const width = normalizeViewportWidth(viewportWidth);
  let resolved: SingleColumnBreakpointName = "mobile";

  for (const name of BREAKPOINT_ORDER) {
    const config = breakpoints[name];
    if (width >= config.minViewportWidth) {
      resolved = name;
    }
  }

  return resolved;
}

export function getSingleColumnLayoutMetrics(
  viewportWidth: number,
  breakpointOverrides: SingleColumnBreakpointOverrides = {},
): SingleColumnLayoutMetrics {
  const normalizedBreakpoints = normalizeBreakpoints(
    mergeBreakpoints(breakpointOverrides),
  );
  const normalizedViewportWidth = normalizeViewportWidth(viewportWidth);
  const breakpoint = resolveSingleColumnBreakpoint(
    normalizedViewportWidth,
    normalizedBreakpoints,
  );
  const config = normalizedBreakpoints[breakpoint];

  return {
    breakpoint,
    viewportWidth: normalizedViewportWidth,
    minViewportWidth: config.minViewportWidth,
    maxContainerWidth: config.maxContainerWidth,
    horizontalPadding: config.horizontalPadding,
    blockGap: config.blockGap,
  };
}

export function renderSingleColumnLayout(
  contentHtml: string,
  options: SingleColumnLayoutOptions = {},
): string {
  const metrics = getSingleColumnLayoutMetrics(
    options.viewportWidth ?? 1280,
    options.breakpoints,
  );
  const rootTagName = sanitizeTagName(
    options.rootTagName,
    ALLOWED_ROOT_TAGS,
    "article",
  );
  const innerTagName = sanitizeTagName(
    options.innerTagName,
    ALLOWED_INNER_TAGS,
    "div",
  );
  const rootAttributes = serializeRootAttributes(options, metrics);
  const innerClassName = "pulse-layout__inner";

  return `<${rootTagName} ${rootAttributes}><${innerTagName} class="${innerClassName}">${contentHtml}</${innerTagName}></${rootTagName}>`;
}
