import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";
import { renderInlineMarkdown } from "./BlockquoteBlock";

/**
 * Branched content — one block holding N reader-selectable paths
 * ("choose your adventure" posts from the vision doc). The reader picks a
 * branch and only that path's content is revealed; every branch is also
 * rendered inside a native <details> so the full text stays crawlable and
 * readable without JavaScript.
 */
export interface BranchPath {
  id: string;
  label: string;
  description?: string;
  content: string;
}

export interface BranchesBlockData extends Record<string, unknown> {
  prompt?: string;
  branches: BranchPath[];
}

export const BRANCHES_MIN = 2;
export const BRANCHES_MAX = 6;

const branchPathSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    content: z.string(),
  })
  .strict();

export const branchesBlockDataSchema = z
  .object({
    prompt: z.string().optional(),
    branches: z.array(branchPathSchema).max(BRANCHES_MAX),
  })
  .strict();

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstString(
  source: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.length > 0) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function normalizeBranch(raw: unknown, index: number): BranchPath | null {
  const record = asRecord(raw);
  if (!record) return null;

  // Tolerant read: current {label, description, content} plus plausible
  // hand-edited shapes ({title}, {name}, {hint}, {body}, {text}).
  const label =
    firstString(record, ["label", "title", "name", "path"]) ?? "";
  const content =
    firstString(record, ["content", "body", "text"]) ?? "";
  if (!label && !content) return null;

  const description = firstString(record, ["description", "hint", "subtitle"]);
  const rawId = record.id;
  const id =
    typeof rawId === "string" && rawId.length > 0
      ? rawId
      : `branch-legacy-${index + 1}`;

  return {
    id,
    label,
    ...(description ? { description } : {}),
    content,
  };
}

/**
 * Coerce arbitrary saved data into a valid BranchesBlockData.
 * Junk entries are dropped, missing ids are generated, duplicate ids are
 * de-duped and the list is capped at BRANCHES_MAX instead of rejected, so
 * hand-edited or AI-authored articles keep rendering.
 */
export function normalizeBranchesData(raw: unknown): BranchesBlockData {
  const record = asRecord(raw) ?? {};
  const rawBranches = Array.isArray(record.branches) ? record.branches : [];

  const seenIds = new Set<string>();
  const branches: BranchPath[] = [];
  for (
    let index = 0;
    index < rawBranches.length && branches.length < BRANCHES_MAX;
    index += 1
  ) {
    const branch = normalizeBranch(rawBranches[index], index);
    if (!branch) continue;
    let id = branch.id;
    let suffix = 2;
    while (seenIds.has(id)) {
      id = `${branch.id}-${suffix}`;
      suffix += 1;
    }
    seenIds.add(id);
    branches.push({ ...branch, id });
  }

  const prompt =
    typeof record.prompt === "string" && record.prompt.trim().length > 0
      ? record.prompt
      : undefined;

  return branchesBlockDataSchema.parse({
    prompt,
    branches,
  });
}

function createBranchId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `branch-${crypto.randomUUID()}`;
  }

  return `branch-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function addBranch(
  data: BranchesBlockData,
  branch: Omit<BranchPath, "id"> & { id?: string },
): BranchesBlockData {
  const parsed = normalizeBranchesData(data);

  return branchesBlockDataSchema.parse({
    ...parsed,
    branches: [
      ...parsed.branches,
      {
        ...branch,
        id: branch.id ?? createBranchId(),
      },
    ],
  });
}

/**
 * Deterministic per-block id derived from the prompt + branch identity, so a
 * reader's saved choice (localStorage) survives reloads and SSR re-renders
 * but resets when the author renames or reorders the paths. Also the key
 * branch-gated blocks reference via `meta.gate.branchesId`.
 */
export function stableBranchesId(
  prompt: string | undefined,
  branches: BranchPath[],
): string {
  const raw =
    (prompt ?? "") + branches.map((branch) => branch.id + branch.label).join("");
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `branches-${Math.abs(hash).toString(36)}`;
}

const CHEVRON_ICON = `<svg class="pulse-branches__panel-chevron" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m6 3 5 5-5 5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ARROW_ICON = `<svg class="pulse-branches__option-arrow" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M2.5 8h11m0 0-4.5-4.5M13.5 8 9 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const PATH_ICON = `<svg class="pulse-branches__chosen-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="4" cy="12.5" r="1.75" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="3.5" r="1.75" stroke="currentColor" stroke-width="1.5"/><path d="M4 10.75V8.5a2 2 0 0 1 2-2h2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

function branchLabel(branch: BranchPath, index: number): string {
  const trimmed = branch.label.trim();
  return trimmed.length > 0 ? trimmed : `Path ${index + 1}`;
}

type InlineRenderer = (text: string) => string;

function renderBranchContent(
  content: string,
  renderInline: InlineRenderer = renderInlineMarkdown,
): string {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  if (paragraphs.length === 0) {
    return `<p class="pulse-branches__panel-text"></p>`;
  }

  return paragraphs
    .map(
      (paragraph) =>
        `<p class="pulse-branches__panel-text">${renderInline(paragraph)}</p>`,
    )
    .join("");
}

function buildOption(branch: BranchPath, index: number): string {
  const label = branchLabel(branch, index);
  const description = branch.description?.trim();
  const descriptionMarkup = description
    ? `<span class="pulse-branches__option-desc">${escapeHtml(description)}</span>`
    : "";

  return (
    `<button type="button" class="pulse-branches__option" data-branch-id="${escapeHtml(branch.id)}">` +
    `<span class="pulse-branches__option-key" aria-hidden="true">${index + 1}</span>` +
    `<span class="pulse-branches__option-text">` +
    `<span class="pulse-branches__option-label">${escapeHtml(label)}</span>` +
    descriptionMarkup +
    `</span>` +
    ARROW_ICON +
    `</button>`
  );
}

function buildPanel(
  branch: BranchPath,
  index: number,
  renderInline: InlineRenderer,
): string {
  const label = branchLabel(branch, index);
  const description = branch.description?.trim();
  const descriptionMarkup = description
    ? `<span class="pulse-branches__panel-desc">${escapeHtml(description)}</span>`
    : "";

  return (
    `<details class="pulse-branches__panel" data-branch-panel="${escapeHtml(branch.id)}">` +
    `<summary class="pulse-branches__panel-summary">` +
    `<span class="pulse-branches__panel-heading">` +
    `<span class="pulse-branches__panel-label">${escapeHtml(label)}</span>` +
    descriptionMarkup +
    `</span>` +
    CHEVRON_ICON +
    `</summary>` +
    `<div class="pulse-branches__panel-body">${renderBranchContent(branch.content, renderInline)}</div>` +
    `</details>`
  );
}

/**
 * Full renderer, parameterized with the inline-markdown pipeline so
 * document-level adapters can inject their reference counter (quote/callout
 * pattern). Defaults to the standalone inline renderer.
 */
export function renderBranchesHtml(
  data: BranchesBlockData,
  renderInline: InlineRenderer = renderInlineMarkdown,
): string {
  const parsed = normalizeBranchesData(data);
  const total = parsed.branches.length;
    const prompt = parsed.prompt?.trim();
    const regionLabel = prompt
      ? `Branched content: ${prompt}`
      : "Branched content";

    const titleMarkup = prompt
      ? `<h3 class="pulse-branches__title">${escapeHtml(prompt)}</h3>`
      : "";

    if (total === 0) {
      return (
        `<section class="pulse-branches pulse-branches--empty" data-block-type="branches" data-state="picker" role="region" aria-label="${escapeHtml(regionLabel)}">` +
        `<header class="pulse-branches__header">${titleMarkup}</header>` +
        `<p class="pulse-branches__empty">This branched content block has no paths yet.</p>` +
        `</section>`
      );
    }

    // A single surviving path is degenerate — render its content directly
    // instead of a one-option "choice".
    if (total === 1) {
      const only = parsed.branches[0];
      return (
        `<section class="pulse-branches pulse-branches--single" data-block-type="branches" data-state="chosen" role="region" aria-label="${escapeHtml(regionLabel)}">` +
        `<header class="pulse-branches__header">${titleMarkup}</header>` +
        `<div class="pulse-branches__panels"><div class="pulse-branches__panel-body">${renderBranchContent(only.content, renderInline)}</div></div>` +
        `</section>`
      );
    }

    const branchesId = stableBranchesId(prompt, parsed.branches);

    const header =
      `<header class="pulse-branches__header">${titleMarkup}` +
      `<p class="pulse-branches__eyebrow">Choose your path · ${total} options</p>` +
      `</header>`;

    // The picker is button-driven, so it ships inert (hidden) and is revealed
    // by hydration; without JS the <details> panels below carry everything.
    const picker =
      `<div class="pulse-branches__picker-wrap">` +
      `<div class="pulse-branches__picker" role="group" aria-label="Choose a path" hidden>` +
      parsed.branches.map((branch, index) => buildOption(branch, index)).join("") +
      `</div>` +
      `</div>`;

    const chosen =
      `<p class="pulse-branches__chosen" hidden>` +
      PATH_ICON +
      `<span class="pulse-branches__chosen-text">You chose: <strong class="pulse-branches__chosen-label"></strong></span>` +
      `<span class="pulse-branches__chosen-sep" aria-hidden="true">·</span>` +
      `<button type="button" class="pulse-branches__switch">Switch path</button>` +
      `</p>`;

    const panels =
      `<div class="pulse-branches__panels">` +
      parsed.branches.map((branch, index) => buildPanel(branch, index, renderInline)).join("") +
      `</div>`;

    return (
      `<section class="pulse-branches" data-block-type="branches" data-branches-id="${escapeHtml(branchesId)}" data-state="picker" role="region" aria-label="${escapeHtml(regionLabel)}">` +
      `${header}${picker}${chosen}${panels}` +
      `</section>`
    );
}

export const BranchesBlock: BlockTypeDefinition<BranchesBlockData> = {
  type: "branches",
  name: "Branched Content",
  icon: "BRANCHES",
  schema: branchesBlockDataSchema,
  defaultData: {
    prompt: "Two ways to read this",
    branches: [
      {
        id: "branch-1",
        label: "The quick version",
        description: "Skim the essentials in a minute",
        content:
          "Give the reader the short path — the key points only, with a [link](https://example.com) to dig deeper.",
      },
      {
        id: "branch-2",
        label: "The deep dive",
        description: "Full context, examples and edge cases",
        content:
          "Give the reader the scenic route — background, step-by-step reasoning, and references[ref](https://example.com){text=\"Source\"}.",
      },
    ],
  },
  config: {
    category: "interactive",
    canHaveChildren: false,
  },
  render(data) {
    return renderBranchesHtml(data, renderInlineMarkdown);
  },
  serialize(data) {
    const parsed = normalizeBranchesData(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return normalizeBranchesData(parseJson<BranchesBlockData>(content));
  },
};
