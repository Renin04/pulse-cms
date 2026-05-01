import type { Block } from "@pulse/core";
import { escapeHtml } from "../render/render";

export interface TocItem {
  id: string;
  text: string;
  level: number;
  blockId: string;
  order: number;
}

export interface TocNode extends TocItem {
  children: TocNode[];
}

export interface TocBuildOptions {
  minLevel?: number;
  maxLevel?: number;
  includeLevels?: number[];
  headingTypes?: string[];
  maxItems?: number;
}

export interface TocRenderOptions {
  navClassName?: string;
  listClassName?: string;
  itemClassName?: string;
  linkClassName?: string;
  ordered?: boolean;
  includeDataAttributes?: boolean;
}

const DEFAULT_HEADING_TYPES = ["heading"];

function clampHeadingLevel(level: number): number {
  if (!Number.isFinite(level)) return 2;
  if (level < 1) return 1;
  if (level > 6) return 6;
  return Math.floor(level);
}

function normalizeHeadingText(block: Block): string {
  const data = block.data as Record<string, unknown>;
  const text = data["text"] ?? data["title"] ?? data["content"];
  if (typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim();
}

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "section";
}

function resolveHeadingId(
  block: Block,
  text: string,
  used: Set<string>,
): string {
  const data = block.data as Record<string, unknown>;
  const existing = data["anchorId"];

  const base =
    typeof existing === "string" && existing.trim().length > 0
      ? existing.trim()
      : slugify(text || block.id);

  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  const unique = `${base}-${suffix}`;
  used.add(unique);
  return unique;
}

function shouldIncludeLevel(
  level: number,
  options: TocBuildOptions,
): boolean {
  const minLevel = clampHeadingLevel(options.minLevel ?? 1);
  const maxLevel = clampHeadingLevel(options.maxLevel ?? 6);
  if (level < minLevel || level > maxLevel) return false;

  if (options.includeLevels && options.includeLevels.length > 0) {
    const includeSet = new Set(options.includeLevels.map(clampHeadingLevel));
    return includeSet.has(level);
  }

  return true;
}

export function generateToc(
  blocks: Block[],
  options: TocBuildOptions = {},
): TocItem[] {
  const headingTypes =
    options.headingTypes && options.headingTypes.length > 0
      ? options.headingTypes
      : DEFAULT_HEADING_TYPES;

  const headingTypeSet = new Set(headingTypes);
  const usedIds = new Set<string>();
  const items: TocItem[] = [];

  for (const block of blocks) {
    if (!headingTypeSet.has(block.type)) continue;

    const data = block.data as Record<string, unknown>;
    const level = clampHeadingLevel(
      typeof data["level"] === "number" ? data["level"] : 2,
    );

    if (!shouldIncludeLevel(level, options)) continue;

    const text = normalizeHeadingText(block);
    if (text.length === 0) continue;

    items.push({
      id: resolveHeadingId(block, text, usedIds),
      text,
      level,
      blockId: block.id,
      order: items.length,
    });

    if (options.maxItems && items.length >= options.maxItems) {
      break;
    }
  }

  return items;
}

export function buildTocTree(items: TocItem[]): TocNode[] {
  const roots: TocNode[] = [];
  const stack: TocNode[] = [];

  for (const item of items) {
    const node: TocNode = { ...item, children: [] };

    while (stack.length > 0 && stack[stack.length - 1]!.level >= node.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1]!.children.push(node);
    }

    stack.push(node);
  }

  return roots;
}

function renderTocNodes(
  nodes: TocNode[],
  options: TocRenderOptions,
): string {
  const listTag = options.ordered ? "ol" : "ul";
  const listClass = options.listClassName ?? "pulse-toc__list";
  const itemClass = options.itemClassName ?? "pulse-toc__item";
  const linkClass = options.linkClassName ?? "pulse-toc__link";
  const includeDataAttrs = options.includeDataAttributes ?? true;

  const itemsHtml = nodes
    .map((node) => {
      const attrs = includeDataAttrs
        ? ` data-pulse-toc-level="${node.level}" data-pulse-toc-id="${escapeHtml(node.id)}"`
        : "";

      const linkHtml = `<a class="${escapeHtml(linkClass)}" href="#${escapeHtml(node.id)}">${escapeHtml(node.text)}</a>`;
      const childrenHtml =
        node.children.length > 0 ? renderTocNodes(node.children, options) : "";

      return `<li class="${escapeHtml(itemClass)}"${attrs}>${linkHtml}${childrenHtml}</li>`;
    })
    .join("");

  return `<${listTag} class="${escapeHtml(listClass)}">${itemsHtml}</${listTag}>`;
}

export function renderTocHtml(
  items: TocItem[],
  options: TocRenderOptions = {},
): string {
  const navClassName = options.navClassName ?? "pulse-toc";
  if (items.length === 0) {
    return `<nav class="${escapeHtml(navClassName)}" data-pulse-toc-empty="true"></nav>`;
  }

  const tree = buildTocTree(items);
  const content = renderTocNodes(tree, options);

  return `<nav class="${escapeHtml(navClassName)}" data-pulse-toc="true">${content}</nav>`;
}
