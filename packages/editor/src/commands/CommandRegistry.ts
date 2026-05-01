import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorStateAdapter } from "../state/EditorStateAdapter";
import type { SlashTriggerMatch } from "./slashTrigger";

const DEFAULT_RECENT_COMMAND_LIMIT = 8;
const RECENT_SCORE_BASE = 120;

function stripBidiControlChars(value: string): string {
  return value.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu, "");
}

function normalizeText(value: string): string {
  return stripBidiControlChars(value).trim().toLowerCase();
}

function scoreSubsequence(candidate: string, query: string): number {
  let queryIndex = 0;
  let firstMatchIndex = -1;

  for (let index = 0; index < candidate.length && queryIndex < query.length; index += 1) {
    if (candidate[index] === query[queryIndex]) {
      if (firstMatchIndex < 0) {
        firstMatchIndex = index;
      }
      queryIndex += 1;
    }
  }

  if (queryIndex !== query.length) {
    return 0;
  }

  const compactnessPenalty = Math.max(0, candidate.length - query.length);
  const positionBonus = Math.max(0, 20 - Math.max(firstMatchIndex, 0));

  return 40 + positionBonus - Math.min(compactnessPenalty, 20);
}

function scoreSingleCandidate(candidate: string, query: string): number {
  const normalizedCandidate = normalizeText(candidate);
  if (!normalizedCandidate) {
    return 0;
  }

  if (normalizedCandidate === query) {
    return 220;
  }

  if (normalizedCandidate.startsWith(query)) {
    return 180 - Math.min(normalizedCandidate.length - query.length, 50);
  }

  const includesIndex = normalizedCandidate.indexOf(query);
  if (includesIndex >= 0) {
    return 130 - Math.min(includesIndex, 40);
  }

  return scoreSubsequence(normalizedCandidate, query);
}

function scoreCommand<TBlock extends Block<BlockData>>(
  command: EditorCommand<TBlock>,
  query: string,
): number {
  const candidates: string[] = [
    command.id,
    command.title,
    command.description ?? "",
    command.category ?? "",
    command.slashTrigger ?? "",
    ...(command.menuPath ?? []),
    (command.menuPath ?? []).join("/"),
    ...(command.aliases ?? []),
    ...(command.keywords ?? []),
  ];

  return candidates.reduce((best, candidate) => {
    const nextScore = scoreSingleCandidate(candidate, query);
    return Math.max(best, nextScore);
  }, 0);
}

function createRecentLookup(recentCommandIds: string[]): Map<string, number> {
  return new Map(recentCommandIds.map((commandId, index) => [commandId, index]));
}

function normalizeMenuPath(path: string[]): string[] {
  return path.map((segment) => segment.trim()).filter(Boolean);
}

function isMenuPathPrefix(path: string[], candidate: string[]): boolean {
  if (path.length > candidate.length) {
    return false;
  }

  return path.every((segment, index) => normalizeText(candidate[index]) === normalizeText(segment));
}

export interface EditorCommandContext<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  state: EditorStateAdapter<TBlock>;
  query?: string;
  trigger?: SlashTriggerMatch | null;
  onSaveDocument?: (context: EditorCommandContext<TBlock>) => void | Promise<void>;
  clipboard?: {
    copySelectedBlocks: () => Promise<unknown>;
    pasteBlocks: (options?: { mode?: "append" | "replace" | "insert"; index?: number }) => Promise<unknown>;
  };
}

export interface EditorCommand<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  id: string;
  title: string;
  description?: string;
  category?: string;
  menuPath?: string[];
  slashTrigger?: string;
  aliases?: string[];
  keywords?: string[];
  getPreview?(context: EditorCommandContext<TBlock>): string | undefined;
  isAvailable?(context: EditorCommandContext<TBlock>): boolean;
  execute(context: EditorCommandContext<TBlock>): void | Promise<void>;
}

export interface CommandSearchResult<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  command: EditorCommand<TBlock>;
  score: number;
  recentIndex: number;
}

export interface CommandSearchOptions {
  limit?: number;
  includeUnavailable?: boolean;
  menuPath?: string[];
}

export interface CommandSearchGroup<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  category: string;
  results: CommandSearchResult<TBlock>[];
}

export interface CommandSubmenuEntry {
  key: string;
  title: string;
  path: string[];
  commandCount: number;
}

export interface EditorCommandRegistryOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  commands?: EditorCommand<TBlock>[];
  recentLimit?: number;
  recentCommandIds?: string[];
}

export class EditorCommandRegistry<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  private readonly commandsById = new Map<string, EditorCommand<TBlock>>();
  private readonly aliasIndex = new Map<string, string>();
  private readonly recentLimit: number;
  private recentCommandIds: string[];

  constructor(options: EditorCommandRegistryOptions<TBlock> = {}) {
    this.recentLimit = options.recentLimit ?? DEFAULT_RECENT_COMMAND_LIMIT;
    if (this.recentLimit < 1) {
      throw new Error("EditorCommandRegistry recent limit must be greater than zero");
    }

    this.recentCommandIds = [];

    for (const command of options.commands ?? []) {
      this.register(command);
    }

    this.recentCommandIds = this.normalizeRecentIds(options.recentCommandIds ?? []);
  }

  register(command: EditorCommand<TBlock>): void {
    if (!command.id.trim()) {
      throw new Error("Command id is required");
    }

    if (this.commandsById.has(command.id)) {
      throw new Error(`Command with id "${command.id}" is already registered`);
    }

    this.commandsById.set(command.id, command);
    this.indexAliases(command);
  }

  unregister(commandId: string): boolean {
    const command = this.commandsById.get(commandId);
    const removed = this.commandsById.delete(commandId);
    if (removed) {
      this.recentCommandIds = this.recentCommandIds.filter((id) => id !== commandId);
      if (command) {
        this.removeAliases(command);
      }
    }

    return removed;
  }

  resolveByAlias(alias: string): EditorCommand<TBlock> | undefined {
    const normalized = normalizeText(alias);
    const commandId = this.aliasIndex.get(normalized);
    if (!commandId) {
      return undefined;
    }
    return this.commandsById.get(commandId);
  }

  findByAlias(alias: string): EditorCommand<TBlock> | undefined {
    return this.resolveByAlias(alias);
  }

  getAliasMap(): Map<string, string> {
    return new Map(this.aliasIndex);
  }

  has(commandId: string): boolean {
    return this.commandsById.has(commandId);
  }

  get(commandId: string): EditorCommand<TBlock> | undefined {
    return this.commandsById.get(commandId);
  }

  list(): EditorCommand<TBlock>[] {
    return [...this.commandsById.values()];
  }

  getRecentCommandIds(): string[] {
    return [...this.recentCommandIds];
  }

  seedRecentCommandIds(commandIds: string[]): void {
    this.recentCommandIds = this.normalizeRecentIds(commandIds);
  }

  getAvailableCommands(context: EditorCommandContext<TBlock>): EditorCommand<TBlock>[] {
    return this.list().filter((command) => {
      if (!command.isAvailable) {
        return true;
      }

      return command.isAvailable(context);
    });
  }

  search(
    query: string,
    context: EditorCommandContext<TBlock>,
    options: CommandSearchOptions = {},
  ): CommandSearchResult<TBlock>[] {
    const normalizedQuery = normalizeText(query);
    const includeUnavailable = options.includeUnavailable ?? false;
    const source = includeUnavailable ? this.list() : this.getAvailableCommands(context);
    const menuPath = normalizeMenuPath(options.menuPath ?? []);
    const filteredSource = source.filter((command) =>
      this.matchesMenuPath(command, menuPath),
    );
    const recentLookup = createRecentLookup(this.recentCommandIds);

    let results = filteredSource
      .map((command) => {
        const recentIndex = recentLookup.get(command.id) ?? -1;

        if (!normalizedQuery) {
          return {
            command,
            score: recentIndex >= 0 ? RECENT_SCORE_BASE - recentIndex : 0,
            recentIndex,
          };
        }

        const score = scoreCommand(command, normalizedQuery);
        return {
          command,
          score,
          recentIndex,
        };
      })
      .filter((result) => (normalizedQuery ? result.score > 0 : true));

    results = results.sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }

      if (left.recentIndex !== right.recentIndex) {
        if (left.recentIndex < 0) {
          return 1;
        }

        if (right.recentIndex < 0) {
          return -1;
        }

        return left.recentIndex - right.recentIndex;
      }

      return left.command.title.localeCompare(right.command.title);
    });

    if (options.limit !== undefined) {
      if (!Number.isInteger(options.limit) || options.limit < 1) {
        throw new Error("Search option limit must be a positive integer");
      }

      return results.slice(0, options.limit);
    }

    return results;
  }

  getSubmenuEntries(
    menuPath: string[],
    context: EditorCommandContext<TBlock>,
    options: { includeUnavailable?: boolean } = {},
  ): CommandSubmenuEntry[] {
    const includeUnavailable = options.includeUnavailable ?? false;
    const source = includeUnavailable ? this.list() : this.getAvailableCommands(context);
    const normalizedPath = normalizeMenuPath(menuPath);
    const entriesByKey = new Map<string, CommandSubmenuEntry>();

    for (const command of source) {
      const commandPath = this.resolveMenuPath(command);
      if (!isMenuPathPrefix(normalizedPath, commandPath)) {
        continue;
      }

      if (commandPath.length <= normalizedPath.length) {
        continue;
      }

      const nextPath = commandPath.slice(0, normalizedPath.length + 1);
      const nextSegment = nextPath[nextPath.length - 1];
      const key = nextPath.map((segment) => normalizeText(segment)).join("/");

      const existing = entriesByKey.get(key);
      if (existing) {
        existing.commandCount += 1;
        continue;
      }

      entriesByKey.set(key, {
        key,
        title: nextSegment,
        path: nextPath,
        commandCount: 1,
      });
    }

    return [...entriesByKey.values()].sort((left, right) =>
      left.title.localeCompare(right.title),
    );
  }

  groupResults(results: CommandSearchResult<TBlock>[]): CommandSearchGroup<TBlock>[] {
    const groupsByCategory = new Map<string, CommandSearchResult<TBlock>[]>();
    const orderedCategories: string[] = [];

    for (const result of results) {
      const category = result.command.category?.trim() || "General";
      if (!groupsByCategory.has(category)) {
        groupsByCategory.set(category, []);
        orderedCategories.push(category);
      }

      groupsByCategory.get(category)!.push(result);
    }

    return orderedCategories.map((category) => ({
      category,
      results: groupsByCategory.get(category) ?? [],
    }));
  }

  async execute(
    commandId: string,
    context: EditorCommandContext<TBlock>,
  ): Promise<EditorCommand<TBlock>> {
    const command = this.commandsById.get(commandId);
    if (!command) {
      throw new Error(`Command with id "${commandId}" is not registered`);
    }

    if (command.isAvailable && !command.isAvailable(context)) {
      throw new Error(`Command "${commandId}" is currently unavailable`);
    }

    await command.execute(context);
    this.markAsRecent(commandId);
    return command;
  }

  private markAsRecent(commandId: string): void {
    this.recentCommandIds = [
      commandId,
      ...this.recentCommandIds.filter((id) => id !== commandId),
    ].slice(0, this.recentLimit);
  }

  private matchesMenuPath(command: EditorCommand<TBlock>, menuPath: string[]): boolean {
    if (menuPath.length === 0) {
      return true;
    }

    const commandPath = this.resolveMenuPath(command);
    return isMenuPathPrefix(menuPath, commandPath);
  }

  private resolveMenuPath(command: EditorCommand<TBlock>): string[] {
    return normalizeMenuPath(command.menuPath ?? []);
  }

  private indexAliases(command: EditorCommand<TBlock>): void {
    for (const alias of command.aliases ?? []) {
      const normalized = normalizeText(alias);
      if (normalized && !this.aliasIndex.has(normalized)) {
        this.aliasIndex.set(normalized, command.id);
      }
    }
  }

  private removeAliases(command: EditorCommand<TBlock>): void {
    for (const alias of command.aliases ?? []) {
      const normalized = normalizeText(alias);
      if (this.aliasIndex.get(normalized) === command.id) {
        this.aliasIndex.delete(normalized);
      }
    }
  }

  private normalizeRecentIds(commandIds: string[]): string[] {
    const nextIds: string[] = [];

    for (const commandId of commandIds) {
      if (!this.commandsById.has(commandId)) {
        continue;
      }

      if (!nextIds.includes(commandId)) {
        nextIds.push(commandId);
      }
    }

    return nextIds.slice(0, this.recentLimit);
  }
}

export function createCommandRegistry<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  options: EditorCommandRegistryOptions<TBlock> = {},
): EditorCommandRegistry<TBlock> {
  return new EditorCommandRegistry(options);
}
