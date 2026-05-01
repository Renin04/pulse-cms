import type { Block, BlockData } from "../../../core/src/types/block";
import {
  type CommandSearchResult,
  type CommandSubmenuEntry,
  type EditorCommandContext,
  EditorCommandRegistry,
} from "../commands/CommandRegistry";
import { parseSlashTrigger, type SlashTriggerMatch } from "../commands/slashTrigger";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clampIndex(index: number, size: number): number {
  if (size === 0) {
    return -1;
  }

  if (index < 0) {
    return size - 1;
  }

  if (index >= size) {
    return 0;
  }

  return index;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function stripBidiControlChars(value: string): string {
  return value.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu, "");
}

function normalizePath(path: string[]): string[] {
  return path.map((segment) => stripBidiControlChars(segment).trim()).filter(Boolean);
}

function normalizePathSegment(value: string): string {
  return stripBidiControlChars(value).trim().toLowerCase();
}

function isPathPrefix(basePath: string[], candidatePath: string[]): boolean {
  if (basePath.length > candidatePath.length) {
    return false;
  }

  return basePath.every(
    (segment, index) =>
      normalizePathSegment(segment) === normalizePathSegment(candidatePath[index]),
  );
}

interface ParsedPaletteQuery {
  searchQuery: string;
  menuPath: string[];
}

function parsePaletteQuery(query: string): ParsedPaletteQuery {
  const normalizedQuery = stripBidiControlChars(query);
  const segments = normalizedQuery.split(/[\\/]/u);
  if (segments.length <= 1) {
    return {
      searchQuery: normalizedQuery.trim(),
      menuPath: [],
    };
  }

  const searchQuery = segments.pop() ?? "";
  return {
    searchQuery: searchQuery.trim(),
    menuPath: normalizePath(segments),
  };
}

interface ActivePaletteSubmenuItem {
  type: "submenu";
  entry: CommandSubmenuEntry;
}

interface ActivePaletteCommandItem<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  type: "command";
  entry: CommandSearchResult<TBlock>;
}

type ActivePaletteItem<
  TBlock extends Block<BlockData> = Block<BlockData>,
> = ActivePaletteSubmenuItem | ActivePaletteCommandItem<TBlock>;

export interface CommandPaletteState<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  isOpen: boolean;
  query: string;
  path: string[];
  trigger: SlashTriggerMatch | null;
  submenuEntries: CommandSubmenuEntry[];
  results: CommandSearchResult<TBlock>[];
  activeIndex: number;
  activePreview: string | null;
}

export interface CommandPaletteOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  registry: EditorCommandRegistry<TBlock>;
  maxResults?: number;
}

export interface CommandPaletteAction {
  type: "none" | "closed" | "executed" | "navigated" | "suggested";
  commandId?: string;
  path?: string[];
}

export class EditorCommandPalette<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  private readonly registry: EditorCommandRegistry<TBlock>;
  private readonly maxResults: number;
  private lastContext: EditorCommandContext<TBlock> | null = null;
  private state: CommandPaletteState<TBlock> = {
    isOpen: false,
    query: "",
    path: [],
    trigger: null,
    submenuEntries: [],
    results: [],
    activeIndex: -1,
    activePreview: null,
  };

  constructor(options: CommandPaletteOptions<TBlock>) {
    this.registry = options.registry;
    this.maxResults = options.maxResults ?? 10;

    if (!Number.isInteger(this.maxResults) || this.maxResults < 1) {
      throw new Error("Command palette maxResults must be a positive integer");
    }
  }

  getState(): CommandPaletteState<TBlock> {
    return {
      isOpen: this.state.isOpen,
      query: this.state.query,
      path: [...this.state.path],
      trigger: this.state.trigger ? { ...this.state.trigger, range: { ...this.state.trigger.range } } : null,
      submenuEntries: this.state.submenuEntries.map((entry) => ({
        ...entry,
        path: [...entry.path],
      })),
      results: [...this.state.results],
      activeIndex: this.state.activeIndex,
      activePreview: this.state.activePreview,
    };
  }

  openFromText(
    text: string,
    cursorOffset: number,
    context: EditorCommandContext<TBlock>,
  ): CommandPaletteState<TBlock> {
    const trigger = parseSlashTrigger(text, cursorOffset);
    if (!trigger) {
      this.close();
      return this.getState();
    }

    return this.openWithQuery(trigger.query, context, trigger);
  }

  openWithQuery(
    query: string,
    context: EditorCommandContext<TBlock>,
    trigger: SlashTriggerMatch | null = null,
    menuPath?: string[],
  ): CommandPaletteState<TBlock> {
    const parsed = menuPath
      ? {
          searchQuery: query,
          menuPath: normalizePath(menuPath),
        }
      : parsePaletteQuery(query);

    return this.openWithResolvedQuery(parsed.searchQuery, parsed.menuPath, context, trigger);
  }

  updateQuery(
    query: string,
    context: EditorCommandContext<TBlock>,
  ): CommandPaletteState<TBlock> {
    if (!this.state.isOpen) {
      return this.openWithQuery(query, context, null);
    }

    return this.openWithQuery(query, context, this.state.trigger);
  }

  close(): CommandPaletteState<TBlock> {
    this.lastContext = null;
    this.state = {
      isOpen: false,
      query: "",
      path: [],
      trigger: null,
      submenuEntries: [],
      results: [],
      activeIndex: -1,
      activePreview: null,
    };

    return this.getState();
  }

  moveActive(delta: 1 | -1): CommandPaletteState<TBlock> {
    const itemCount = this.getItemCount();
    if (!this.state.isOpen || itemCount === 0) {
      return this.getState();
    }

    const nextIndex = clampIndex(this.state.activeIndex + delta, itemCount);
    this.state = {
      ...this.state,
      activeIndex: nextIndex,
      activePreview: this.resolveActivePreview(nextIndex),
    };

    return this.getState();
  }

  async executeActive(
    context: EditorCommandContext<TBlock>,
  ): Promise<CommandPaletteAction> {
    const activeItem = this.resolveActiveItem();
    if (!activeItem) {
      return { type: "none" };
    }

    if (activeItem.type === "submenu") {
      this.openWithResolvedQuery("", activeItem.entry.path, context, this.state.trigger);
      return {
        type: "navigated",
        path: [...activeItem.entry.path],
      };
    }

    const executionContext: EditorCommandContext<TBlock> = {
      ...context,
      query: this.state.query,
      trigger: this.state.trigger,
    };

    await this.registry.execute(activeItem.entry.command.id, executionContext);
    const commandId = activeItem.entry.command.id;
    this.close();
    return {
      type: "executed",
      commandId,
    };
  }

  suggestActive(
    context: EditorCommandContext<TBlock>,
  ): CommandPaletteAction {
    const activeItem = this.resolveActiveItem();
    if (!activeItem) {
      return { type: "none" };
    }

    if (activeItem.type === "submenu") {
      this.openWithResolvedQuery("", activeItem.entry.path, context, this.state.trigger);
      return {
        type: "suggested",
        path: [...activeItem.entry.path],
      };
    }

    const nextPath = this.resolveSuggestedPath(activeItem.entry);
    if (!nextPath) {
      return { type: "none" };
    }

    this.openWithResolvedQuery("", nextPath, context, this.state.trigger);
    return {
      type: "suggested",
      path: [...nextPath],
    };
  }

  navigateIntoActiveSubmenu(
    context: EditorCommandContext<TBlock>,
  ): CommandPaletteAction {
    const activeItem = this.resolveActiveItem();
    if (!activeItem || activeItem.type !== "submenu") {
      return { type: "none" };
    }

    this.openWithResolvedQuery("", activeItem.entry.path, context, this.state.trigger);
    return {
      type: "navigated",
      path: [...activeItem.entry.path],
    };
  }

  async handleKey(
    key: string,
    context: EditorCommandContext<TBlock>,
  ): Promise<CommandPaletteAction> {
    if (!this.state.isOpen) {
      return { type: "none" };
    }

    const normalizedKey = normalizeKey(key);
    if (normalizedKey === "arrowdown") {
      this.moveActive(1);
      return { type: "none" };
    }

    if (normalizedKey === "arrowup") {
      this.moveActive(-1);
      return { type: "none" };
    }

    if (normalizedKey === "enter") {
      return this.executeActive(context);
    }

    if (normalizedKey === "tab") {
      return this.suggestActive(context);
    }

    if (normalizedKey === "arrowright") {
      return this.navigateIntoActiveSubmenu(context);
    }

    if (
      (normalizedKey === "arrowleft" || normalizedKey === "backspace") &&
      this.state.query.length === 0 &&
      this.state.path.length > 0
    ) {
      const parentPath = this.state.path.slice(0, -1);
      this.openWithResolvedQuery("", parentPath, context, this.state.trigger);
      return {
        type: "navigated",
        path: parentPath,
      };
    }

    if (normalizedKey === "escape") {
      this.close();
      return { type: "closed" };
    }

    return { type: "none" };
  }

  render(): string {
    if (!this.state.isOpen) {
      return "";
    }

    const groups = this.registry.groupResults(this.state.results);
    const hasItems = this.state.submenuEntries.length > 0 || groups.length > 0;

    if (!hasItems) {
      return [
        '<div class="pulse-editor__command-palette" data-command-palette="true" role="dialog" aria-label="Command palette">',
        `<div class="pulse-editor__command-palette-query">${escapeHtml(
          `${this.getTriggerCharacter()}${this.getDisplayQuery()}`,
        )}</div>`,
        '<div class="pulse-editor__command-palette-empty">No commands found</div>',
        "</div>",
      ].join("");
    }

    let itemIndex = -1;

    const submenuMarkup =
      this.state.submenuEntries.length > 0
        ? [
            '<section class="pulse-editor__command-group" data-category="Submenus">',
            '<header class="pulse-editor__command-group-title">Submenus</header>',
            '<ul class="pulse-editor__command-list" role="listbox" aria-label="Command submenus">',
            this.state.submenuEntries
              .map((entry) => {
                itemIndex += 1;
                const isActive = itemIndex === this.state.activeIndex;
                return [
                  `<li class="pulse-editor__command-item pulse-editor__command-item--submenu${isActive ? " is-active" : ""}"`,
                  ` data-command-submenu-key="${escapeHtml(entry.key)}"`,
                  ` data-command-submenu-path="${escapeHtml(entry.path.join(this.getTriggerCharacter()))}"`,
                  ` data-active="${String(isActive)}"`,
                  " role=\"option\"",
                  ` aria-selected="${String(isActive)}">`,
                  `<div class="pulse-editor__command-title">${escapeHtml(entry.title)}</div>`,
                  `<div class="pulse-editor__command-description">${entry.commandCount} commands</div>`,
                  "</li>",
                ].join("");
              })
              .join(""),
            "</ul>",
            "</section>",
          ].join("")
        : "";

    const groupMarkup = groups
      .map((group) => {
        const listItems = group.results
          .map((result) => {
            itemIndex += 1;
            const isActive = itemIndex === this.state.activeIndex;

            return [
              `<li class="pulse-editor__command-item${isActive ? " is-active" : ""}"`,
              ` data-command-id="${escapeHtml(result.command.id)}"`,
              ` data-active="${String(isActive)}"`,
              " role=\"option\"",
              ` aria-selected="${String(isActive)}">`,
              `<div class="pulse-editor__command-title">${escapeHtml(result.command.title)}</div>`,
              result.command.description
                ? `<div class="pulse-editor__command-description">${escapeHtml(result.command.description)}</div>`
                : "",
              "</li>",
            ].join("");
          })
          .join("");

        return [
          `<section class="pulse-editor__command-group" data-category="${escapeHtml(group.category)}">`,
          `<header class="pulse-editor__command-group-title">${escapeHtml(group.category)}</header>`,
          `<ul class="pulse-editor__command-list" role="listbox" aria-label="${escapeHtml(group.category)} commands">`,
          listItems,
          "</ul>",
          "</section>",
        ].join("");
      })
      .join("");

    const breadcrumbMarkup =
      this.state.path.length > 0
        ? [
            '<nav class="pulse-editor__command-breadcrumb" aria-label="Command path">',
            this.state.path
              .map((segment) =>
                `<span class="pulse-editor__command-breadcrumb-segment">${escapeHtml(segment)}</span>`,
              )
              .join(
                `<span class="pulse-editor__command-breadcrumb-separator">${escapeHtml(
                  this.getTriggerCharacter(),
                )}</span>`,
              ),
            "</nav>",
          ].join("")
        : "";

    const previewMarkup = this.state.activePreview
      ? `<div class="pulse-editor__command-preview" data-command-preview="true">${escapeHtml(
          this.state.activePreview,
        )}</div>`
      : "";

    return [
      '<div class="pulse-editor__command-palette" data-command-palette="true" role="dialog" aria-label="Command palette">',
      `<div class="pulse-editor__command-palette-query">${escapeHtml(
        `${this.getTriggerCharacter()}${this.getDisplayQuery()}`,
      )}</div>`,
      breadcrumbMarkup,
      previewMarkup,
      submenuMarkup,
      groupMarkup,
      "</div>",
    ].join("");
  }

  private getItemCount(): number {
    return this.state.submenuEntries.length + this.state.results.length;
  }

  private getDisplayQuery(): string {
    const separator = this.getTriggerCharacter();
    if (this.state.path.length === 0) {
      return this.state.query;
    }

    if (!this.state.query) {
      return `${this.state.path.join(separator)}${separator}`;
    }

    return `${this.state.path.join(separator)}${separator}${this.state.query}`;
  }

  private getTriggerCharacter(): "/" | "\\" {
    return this.state.trigger?.trigger ?? "/";
  }

  private openWithResolvedQuery(
    searchQuery: string,
    menuPath: string[],
    context: EditorCommandContext<TBlock>,
    trigger: SlashTriggerMatch | null,
  ): CommandPaletteState<TBlock> {
    this.lastContext = context;
    const normalizedPath = normalizePath(menuPath);
    const commandContext: EditorCommandContext<TBlock> = {
      ...context,
      query: searchQuery,
      trigger,
    };

    const submenuEntries =
      searchQuery.length === 0
        ? this.registry.getSubmenuEntries(normalizedPath, commandContext)
        : [];
    const results = this.registry.search(searchQuery, commandContext, {
      limit: this.maxResults,
      menuPath: normalizedPath,
    });

    this.state = {
      isOpen: true,
      query: searchQuery,
      path: normalizedPath,
      trigger,
      submenuEntries,
      results,
      activeIndex: submenuEntries.length + results.length > 0 ? 0 : -1,
      activePreview: null,
    };

    this.state.activePreview = this.resolveActivePreview(this.state.activeIndex);

    return this.getState();
  }

  private resolveActiveItem(): ActivePaletteItem<TBlock> | null {
    if (this.state.activeIndex < 0) {
      return null;
    }

    const submenuEntry = this.state.submenuEntries[this.state.activeIndex];
    if (submenuEntry) {
      return {
        type: "submenu",
        entry: submenuEntry,
      };
    }

    const commandIndex = this.state.activeIndex - this.state.submenuEntries.length;
    const commandEntry = this.state.results[commandIndex];
    if (!commandEntry) {
      return null;
    }

    return {
      type: "command",
      entry: commandEntry,
    };
  }

  private resolveSuggestedPath(result: CommandSearchResult<TBlock>): string[] | null {
    const command = result.command;
    const commandPath = normalizePath(command.menuPath ?? []);
    if (
      commandPath.length > this.state.path.length &&
      isPathPrefix(this.state.path, commandPath)
    ) {
      return [...this.state.path, commandPath[this.state.path.length]];
    }

    const suggestionToken = this.resolveSuggestionToken(command);
    if (!suggestionToken) {
      return null;
    }

    return [...this.state.path, suggestionToken];
  }

  private resolveSuggestionToken(command: CommandSearchResult<TBlock>["command"]): string | null {
    const slashTrigger = command.slashTrigger?.trim();
    if (slashTrigger) {
      return slashTrigger;
    }

    const alias = command.aliases?.find((value) => Boolean(value.trim()));
    if (alias) {
      return alias.trim();
    }

    const title = command.title.trim();
    if (!title) {
      return null;
    }

    return title.toLowerCase().replace(/\s+/gu, "-");
  }

  private resolveActivePreview(activeIndex: number): string | null {
    if (activeIndex < this.state.submenuEntries.length) {
      const submenu = this.state.submenuEntries[activeIndex];
      return submenu ? `Navigate to ${submenu.title} submenu` : null;
    }

    const commandIndex = activeIndex - this.state.submenuEntries.length;
    if (commandIndex < 0) {
      return null;
    }

    const result = this.state.results[commandIndex];
    if (!result) {
      return null;
    }

    const preview = this.lastContext
      ? result.command.getPreview?.({
          ...this.lastContext,
          query: this.state.query,
          trigger: this.state.trigger,
        })
      : undefined;
    if (preview && preview.trim()) {
      return preview.trim();
    }

    return result.command.description ?? null;
  }
}

export function createCommandPalette<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  options: CommandPaletteOptions<TBlock>,
): EditorCommandPalette<TBlock> {
  return new EditorCommandPalette(options);
}
