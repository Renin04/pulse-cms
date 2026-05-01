import { escapeHtml } from "../render/render";

export type MangaPanelSize = "normal" | "wide" | "tall" | "hero";
export type MangaPanelAlign = "left" | "center" | "right";

export interface MangaPanel {
  id?: string;
  html: string;
  size?: MangaPanelSize;
  align?: MangaPanelAlign;
  sticky?: boolean;
}

export interface MangaLayoutOptions {
  columns?: number;
  panelGap?: number;
  rootTagName?: "section" | "article" | "div";
  rootClassName?: string;
  attributes?: Record<string, string>;
}

const ALLOWED_PANEL_SIZES: MangaPanelSize[] = ["normal", "wide", "tall", "hero"];
const ALLOWED_PANEL_ALIGN: MangaPanelAlign[] = ["left", "center", "right"];
const ALLOWED_ROOT_TAGS = ["section", "article", "div"] as const;

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

function normalizePositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const normalized = Math.floor(value);
  if (normalized < 0) return 0;
  return normalized;
}

function isValidAttributeName(name: string): boolean {
  return /^[A-Za-z_:][-A-Za-z0-9_:.]*$/.test(name);
}

function serializeAttributes(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(" ");
}

function resolvePanelSize(size: MangaPanelSize | undefined): MangaPanelSize {
  if (!size) return "normal";
  if (ALLOWED_PANEL_SIZES.includes(size)) return size;
  return "normal";
}

function resolvePanelAlign(align: MangaPanelAlign | undefined): MangaPanelAlign {
  if (!align) return "left";
  if (ALLOWED_PANEL_ALIGN.includes(align)) return align;
  return "left";
}

export function renderMangaPanel(panel: MangaPanel): string {
  const size = resolvePanelSize(panel.size);
  const align = resolvePanelAlign(panel.align);
  const classTokens = [
    "pulse-manga-panel",
    `pulse-manga-panel--${size}`,
    `pulse-manga-panel--align-${align}`,
    panel.sticky ? "pulse-manga-panel--sticky" : "",
  ].filter(Boolean);

  const attributes: Record<string, string> = {
    class: classTokens.join(" "),
    "data-pulse-manga-size": size,
    "data-pulse-manga-align": align,
  };

  if (panel.id) {
    attributes["data-pulse-manga-id"] = panel.id;
  }

  return `<section ${serializeAttributes(attributes)}>${panel.html}</section>`;
}

export function renderMangaLayout(
  panels: MangaPanel[],
  options: MangaLayoutOptions = {},
): string {
  const columns = Math.max(
    1,
    Math.min(4, normalizePositiveInteger(options.columns ?? 2, 2)),
  );
  const panelGap = normalizePositiveInteger(options.panelGap ?? 20, 20);
  const rootTagName = sanitizeTagName(
    options.rootTagName,
    ALLOWED_ROOT_TAGS,
    "section",
  );

  const classTokens = [
    "pulse-layout",
    "pulse-layout--manga",
    "pulse-manga-layout",
    options.rootClassName ? options.rootClassName.trim() : "",
  ].filter(Boolean);

  const attributes: Record<string, string> = {
    class: classTokens.join(" "),
    "data-pulse-layout-mode": "manga",
    style: [
      `--pulse-layout-manga-columns:${columns}`,
      `--pulse-layout-manga-gap:${panelGap}px`,
    ].join(";"),
  };

  if (options.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      if (
        key === "class" ||
        key === "style" ||
        key === "data-pulse-layout-mode"
      ) {
        continue;
      }
      if (!isValidAttributeName(key)) continue;
      attributes[key] = value;
    }
  }

  const serializedRootAttributes = serializeAttributes(attributes);
  const panelHtml = panels.map((panel) => renderMangaPanel(panel)).join("");

  return `<${rootTagName} ${serializedRootAttributes}><div class="pulse-layout__inner pulse-manga-grid">${panelHtml}</div></${rootTagName}>`;
}
