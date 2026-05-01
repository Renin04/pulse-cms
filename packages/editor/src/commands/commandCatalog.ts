import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorCommand, EditorCommandRegistry } from "./CommandRegistry";

export interface CommandCatalogEntry<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  id: string;
  title: string;
  description?: string;
  category: string;
  menuPath: string[];
  slashTrigger?: string;
  aliases: string[];
  keywords: string[];
  shortcutCombo?: string;
  isAvailable: boolean;
  command: EditorCommand<TBlock>;
}

export interface CommandCatalogGroup<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  category: string;
  commands: CommandCatalogEntry<TBlock>[];
}

export interface CommandCatalogFilters {
  category?: string;
  query?: string;
  availableOnly?: boolean;
  includeShortcuts?: boolean;
}

export interface CommandCatalogOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  commandRegistry: EditorCommandRegistry<TBlock>;
  shortcutRegistry?: {
    getShortcutHelp(): Array<{
      id: string;
      combo: string;
      commandId: string;
      description?: string;
    }>;
  };
}

export class CommandCatalog<TBlock extends Block<BlockData> = Block<BlockData>> {
  private readonly commandRegistry: EditorCommandRegistry<TBlock>;
  private readonly shortcutRegistry?: CommandCatalogOptions<TBlock>["shortcutRegistry"];

  constructor(options: CommandCatalogOptions<TBlock>) {
    this.commandRegistry = options.commandRegistry;
    this.shortcutRegistry = options.shortcutRegistry;
  }

  /**
   * Get all commands as catalog entries with their availability and shortcut info.
   */
  getEntries(context: { state: { getSnapshot: () => { document: { blocks: TBlock[] } } } }): CommandCatalogEntry<TBlock>[] {
    const commands = this.commandRegistry.list();
    const shortcutHelp = this.shortcutRegistry?.getShortcutHelp() ?? [];
    const shortcutMap = new Map(shortcutHelp.map((s) => [s.commandId, s.combo]));

    return commands.map((command) => {
      const isAvailable = command.isAvailable ? command.isAvailable(context as unknown as import("./CommandRegistry").EditorCommandContext<TBlock>) : true;

      return {
        id: command.id,
        title: command.title,
        description: command.description,
        category: command.category ?? "General",
        menuPath: command.menuPath ?? [],
        slashTrigger: command.slashTrigger,
        aliases: command.aliases ?? [],
        keywords: command.keywords ?? [],
        shortcutCombo: shortcutMap.get(command.id),
        isAvailable,
        command,
      };
    });
  }

  /**
   * Get commands grouped by category.
   */
  getGrouped(context: { state: { getSnapshot: () => { document: { blocks: TBlock[] } } } }): CommandCatalogGroup<TBlock>[] {
    const entries = this.getEntries(context);
    const groupsByCategory = new Map<string, CommandCatalogEntry<TBlock>[]>();

    for (const entry of entries) {
      const category = entry.category;
      if (!groupsByCategory.has(category)) {
        groupsByCategory.set(category, []);
      }
      groupsByCategory.get(category)!.push(entry);
    }

    // Sort categories alphabetically, but put "General" last
    const sortedCategories = [...groupsByCategory.keys()].sort((a, b) => {
      if (a === "General") return 1;
      if (b === "General") return -1;
      return a.localeCompare(b);
    });

    return sortedCategories.map((category) => ({
      category,
      commands: groupsByCategory.get(category) ?? [],
    }));
  }

  /**
   * Filter commands based on criteria.
   */
  filter(
    context: { state: { getSnapshot: () => { document: { blocks: TBlock[] } } } },
    filters: CommandCatalogFilters,
  ): CommandCatalogEntry<TBlock>[] {
    let entries = this.getEntries(context);

    if (filters.availableOnly) {
      entries = entries.filter((e) => e.isAvailable);
    }

    if (filters.category) {
      entries = entries.filter((e) => e.category === filters.category);
    }

    if (filters.query) {
      const query = filters.query.toLowerCase().trim();
      entries = entries.filter((e) => {
        const searchable = [
          e.title,
          e.description ?? "",
          e.category,
          e.slashTrigger ?? "",
          ...e.aliases,
          ...e.keywords,
          ...e.menuPath,
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(query);
      });
    }

    if (filters.includeShortcuts === false) {
      entries = entries.filter((e) => !e.shortcutCombo);
    }

    return entries;
  }

  /**
   * Search commands with scoring (similar to command palette but for catalog display).
   */
  search(
    context: { state: { getSnapshot: () => { document: { blocks: TBlock[] } } } },
    query: string,
    options: { limit?: number; availableOnly?: boolean } = {},
  ): Array<CommandCatalogEntry<TBlock> & { score: number }> {
    const normalizedQuery = query.toLowerCase().trim();
    const entries = this.getEntries(context).filter((e) =>
      options.availableOnly ? e.isAvailable : true,
    );

    const scored = entries.map((entry) => {
      let score = 0;
      const titleLower = entry.title.toLowerCase();
      const slashLower = entry.slashTrigger?.toLowerCase() ?? "";

      // Exact title match
      if (titleLower === normalizedQuery) {
        score += 200;
      }
      // Title starts with query
      else if (titleLower.startsWith(normalizedQuery)) {
        score += 150;
      }
      // Title contains query
      else if (titleLower.includes(normalizedQuery)) {
        score += 100;
      }

      // Slash trigger match
      if (slashLower === normalizedQuery) {
        score += 180;
      } else if (slashLower.startsWith(normalizedQuery)) {
        score += 120;
      }

      // Alias matches
      for (const alias of entry.aliases) {
        const aliasLower = alias.toLowerCase();
        if (aliasLower === normalizedQuery) {
          score += 140;
        } else if (aliasLower.startsWith(normalizedQuery)) {
          score += 90;
        } else if (aliasLower.includes(normalizedQuery)) {
          score += 40;
        }
      }

      // Keyword matches
      for (const keyword of entry.keywords) {
        if (keyword.toLowerCase().includes(normalizedQuery)) {
          score += 30;
        }
      }

      return { ...entry, score };
    });

    const filtered = scored.filter((s) => s.score > 0);
    filtered.sort((a, b) => b.score - a.score);

    if (options.limit) {
      return filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Get a flat list of all available menu paths for navigation.
   */
  getMenuPaths(): string[][] {
    const commands = this.commandRegistry.list();
    const paths = new Set<string>();

    for (const command of commands) {
      if (command.menuPath && command.menuPath.length > 0) {
        // Add full path and each parent path
        for (let i = 1; i <= command.menuPath.length; i++) {
          paths.add(command.menuPath.slice(0, i).join("/"));
        }
      }
    }

    return [...paths]
      .map((p) => p.split("/"))
      .sort((a, b) => a.join("/").localeCompare(b.join("/")));
  }

  /**
   * Get commands by menu path.
   */
  getByMenuPath(
    context: { state: { getSnapshot: () => { document: { blocks: TBlock[] } } } },
    path: string[],
  ): CommandCatalogEntry<TBlock>[] {
    const entries = this.getEntries(context);
    const pathStr = path.join("/").toLowerCase();

    return entries.filter((e) => {
      const entryPathStr = e.menuPath.join("/").toLowerCase();
      return entryPathStr.startsWith(pathStr);
    });
  }

  /**
   * Export catalog as formatted text for documentation.
   */
  exportToMarkdown(context: { state: { getSnapshot: () => { document: { blocks: TBlock[] } } } }): string {
    const groups = this.getGrouped(context);
    const lines: string[] = ["# Command Reference", ""];

    for (const group of groups) {
      lines.push(`## ${group.category}`, "");

      for (const cmd of group.commands) {
        const shortcut = cmd.shortcutCombo ? ` \`${cmd.shortcutCombo}\`` : "";
        lines.push(`### ${cmd.title}${shortcut}`);
        lines.push("");

        if (cmd.description) {
          lines.push(`**Description:** ${cmd.description}`);
          lines.push("");
        }

        if (cmd.slashTrigger) {
          lines.push(`**Slash command:** \`${cmd.slashTrigger}\``);
          lines.push("");
        }

        if (cmd.aliases.length > 0) {
          lines.push(`**Aliases:** ${cmd.aliases.join(", ")}`);
          lines.push("");
        }

        if (cmd.menuPath.length > 0) {
          lines.push(`**Menu path:** ${cmd.menuPath.join(" > ")}`);
          lines.push("");
        }

        lines.push("");
      }
    }

    return lines.join("\n");
  }
}

export function createCommandCatalog<TBlock extends Block<BlockData> = Block<BlockData>>(
  options: CommandCatalogOptions<TBlock>,
): CommandCatalog<TBlock> {
  return new CommandCatalog(options);
}
