import type { Block, BlockData } from "../../../core/src/types/block";
import type { ShortcutHelpEntry } from "./ShortcutRegistry";

export interface ShortcutReferenceGroup<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  category: string;
  shortcuts: ShortcutReferenceEntry<TBlock>[];
}

export interface ShortcutReferenceEntry<
  TBlock extends Block<BlockData> = Block<BlockData>,
> extends ShortcutHelpEntry<TBlock> {
  platform: "mac" | "windows" | "linux" | "universal";
  readableCombo: string;
}

export interface ShortcutReferenceFilters {
  category?: string;
  platform?: "mac" | "windows" | "linux";
  source?: "default" | "custom";
  query?: string;
}

export interface ShortcutReferenceOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  shortcutRegistry: {
    getShortcutHelp(): ShortcutHelpEntry<TBlock>[];
  };
  platform: "mac" | "windows" | "linux";
}

const PLATFORM_MODIFIER_MAP: Record<string, Record<string, string>> = {
  mac: {
    ctrl: "⌃",
    alt: "⌥",
    shift: "⇧",
    cmd: "⌘",
    meta: "⌘",
  },
  windows: {
    ctrl: "Ctrl",
    alt: "Alt",
    shift: "Shift",
    cmd: "Win",
    meta: "Win",
  },
  linux: {
    ctrl: "Ctrl",
    alt: "Alt",
    shift: "Shift",
    cmd: "Super",
    meta: "Super",
  },
};

const KEY_DISPLAY_NAMES: Record<string, string> = {
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  escape: "Esc",
  delete: "Del",
  backspace: "⌫",
  enter: "↵",
  tab: "Tab",
  space: "Space",
};

export class ShortcutReference<TBlock extends Block<BlockData> = Block<BlockData>> {
  private readonly shortcutRegistry: ShortcutReferenceOptions<TBlock>["shortcutRegistry"];
  private readonly platform: "mac" | "windows" | "linux";

  constructor(options: ShortcutReferenceOptions<TBlock>) {
    this.shortcutRegistry = options.shortcutRegistry;
    this.platform = options.platform;
  }

  /**
   * Get all shortcuts formatted for reference display.
   */
  getAll(): ShortcutReferenceEntry<TBlock>[] {
    const helpEntries = this.shortcutRegistry.getShortcutHelp();
    return helpEntries.map((entry) => this.formatEntry(entry));
  }

  /**
   * Get shortcuts grouped by category.
   */
  getGrouped(): ShortcutReferenceGroup<TBlock>[] {
    const entries = this.getAll();
    const groupsByCategory = new Map<string, ShortcutReferenceEntry<TBlock>[]>();

    for (const entry of entries) {
      // Derive category from binding ID or use "General"
      const category = this.inferCategory(entry);
      if (!groupsByCategory.has(category)) {
        groupsByCategory.set(category, []);
      }
      groupsByCategory.get(category)!.push(entry);
    }

    // Sort categories
    const sortedCategories = [...groupsByCategory.keys()].sort((a, b) => {
      if (a === "General") return 1;
      if (b === "General") return -1;
      return a.localeCompare(b);
    });

    return sortedCategories.map((category) => ({
      category,
      shortcuts: groupsByCategory.get(category) ?? [],
    }));
  }

  /**
   * Filter shortcuts based on criteria.
   */
  filter(filters: ShortcutReferenceFilters): ShortcutReferenceEntry<TBlock>[] {
    let entries = this.getAll();

    if (filters.platform && filters.platform !== this.platform) {
      // Filter by platform compatibility
      entries = entries.filter((e) =>
        e.platform === "universal" || e.platform === filters.platform,
      );
    }

    if (filters.source) {
      entries = entries.filter((e) => e.source === filters.source);
    }

    if (filters.category) {
      entries = entries.filter((e) => this.inferCategory(e) === filters.category);
    }

    if (filters.query) {
      const query = filters.query.toLowerCase().trim();
      entries = entries.filter((e) => {
        const searchable = [
          e.id,
          e.commandId,
          e.description ?? "",
          e.combo,
          e.readableCombo,
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(query);
      });
    }

    return entries;
  }

  /**
   * Search shortcuts with fuzzy matching.
   */
  search(query: string, options: { limit?: number } = {}): ShortcutReferenceEntry<TBlock>[] {
    const normalizedQuery = query.toLowerCase().trim();
    const entries = this.getAll();

    const scored = entries.map((entry) => {
      let score = 0;

      // Combo match
      if (entry.combo.toLowerCase().includes(normalizedQuery)) {
        score += 100;
      }
      if (entry.readableCombo.toLowerCase().includes(normalizedQuery)) {
        score += 90;
      }

      // Command ID match
      if (entry.commandId.toLowerCase().includes(normalizedQuery)) {
        score += 50;
      }

      // Description match
      if (entry.description?.toLowerCase().includes(normalizedQuery)) {
        score += 40;
      }

      return { entry, score };
    });

    const filtered = scored.filter((s) => s.score > 0);
    filtered.sort((a, b) => b.score - a.score);

    if (options.limit) {
      return filtered.slice(0, options.limit).map((s) => s.entry);
    }

    return filtered.map((s) => s.entry);
  }

  /**
   * Get shortcuts that use chords (multi-key sequences).
   */
  getChords(): ShortcutReferenceEntry<TBlock>[] {
    return this.getAll().filter((e) => e.isChord);
  }

  /**
   * Get shortcuts that are custom (user-defined).
   */
  getCustom(): ShortcutReferenceEntry<TBlock>[] {
    return this.getAll().filter((e) => e.source === "custom");
  }

  /**
   * Get conflicting shortcuts.
   */
  getConflicts(): Array<{
    combo: string;
    shortcuts: ShortcutReferenceEntry<TBlock>[];
  }> {
    const entries = this.getAll();
    const byCombo = new Map<string, ShortcutReferenceEntry<TBlock>[]>();

    for (const entry of entries) {
      const normalizedCombo = entry.combo.toLowerCase().trim();
      if (!byCombo.has(normalizedCombo)) {
        byCombo.set(normalizedCombo, []);
      }
      byCombo.get(normalizedCombo)!.push(entry);
    }

    return [...byCombo.entries()]
      .filter(([, shortcuts]) => shortcuts.length > 1)
      .map(([combo, shortcuts]) => ({ combo, shortcuts }));
  }

  /**
   * Export shortcuts as formatted text for documentation.
   */
  exportToMarkdown(): string {
    const groups = this.getGrouped();
    const lines: string[] = ["# Keyboard Shortcuts Reference", ""];

    lines.push(`**Platform:** ${this.platform}`, "");

    for (const group of groups) {
      lines.push(`## ${group.category}`, "");

      for (const shortcut of group.shortcuts) {
        const chordIndicator = shortcut.isChord ? " (chord)" : "";
        lines.push(`- **${shortcut.readableCombo}**${chordIndicator} — ${shortcut.description ?? shortcut.commandId}`);
      }

      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Format a shortcut combo for readable display.
   */
  formatCombo(combo: string): string {
    const parts = combo.toLowerCase().trim().split(/\s+/);
    const modifierMap = PLATFORM_MODIFIER_MAP[this.platform];

    return parts
      .map((part) => {
        // Handle modifier keys
        if (part.includes("+")) {
          const keys = part.split("+");
          return keys
            .map((key) => {
              const normalized = key.trim();
              return modifierMap[normalized] ?? KEY_DISPLAY_NAMES[normalized] ?? normalized.toUpperCase();
            })
            .join(this.platform === "mac" ? "" : "+");
        }

        // Single key
        return KEY_DISPLAY_NAMES[part] ?? part.toUpperCase();
      })
      .join(" then ");
  }

  /**
   * Check if a combo is available (not used by any shortcut).
   */
  isComboAvailable(combo: string): boolean {
    const normalizedCombo = combo.toLowerCase().trim();
    const entries = this.getAll();
    return !entries.some((e) => e.combo.toLowerCase().trim() === normalizedCombo);
  }

  /**
   * Get suggestions for available shortcut combos.
   */
  getAvailableComboSuggestions(prefix?: string): string[] {
    const suggestions: string[] = [];
    const modifiers = this.platform === "mac" ? ["cmd", "cmd+shift", "cmd+alt", "cmd+shift+alt"] : ["ctrl", "ctrl+shift", "ctrl+alt", "ctrl+shift+alt"];

    // Letter keys
    for (let i = 65; i <= 90; i++) {
      const letter = String.fromCharCode(i).toLowerCase();
      for (const mod of modifiers) {
        const combo = `${mod}+${letter}`;
        if (this.isComboAvailable(combo)) {
          if (!prefix || combo.startsWith(prefix.toLowerCase())) {
            suggestions.push(combo);
          }
        }
      }
    }

    // Number keys
    for (let i = 0; i <= 9; i++) {
      for (const mod of modifiers) {
        const combo = `${mod}+${i}`;
        if (this.isComboAvailable(combo)) {
          if (!prefix || combo.startsWith(prefix.toLowerCase())) {
            suggestions.push(combo);
          }
        }
      }
    }

    return suggestions.slice(0, 20);
  }

  private formatEntry(entry: ShortcutHelpEntry<TBlock>): ShortcutReferenceEntry<TBlock> {
    return {
      ...entry,
      platform: this.inferPlatform(entry.combo),
      readableCombo: this.formatCombo(entry.combo),
    };
  }

  private inferCategory(entry: ShortcutReferenceEntry<TBlock>): string {
    // Infer category from binding ID
    const id = entry.id.toLowerCase();
    if (id.includes("format")) return "Formatting";
    if (id.includes("block")) return "Blocks";
    if (id.includes("document")) return "Document";
    if (id.includes("edit")) return "Editing";
    if (id.includes("find") || id.includes("replace")) return "Find & Replace";
    if (id.includes("image") || id.includes("media")) return "Media";
    if (id.includes("align")) return "Alignment";
    if (id.includes("stats")) return "Statistics";
    return "General";
  }

  private inferPlatform(combo: string): "mac" | "windows" | "linux" | "universal" {
    const normalized = combo.toLowerCase();
    const hasCmd = normalized.includes("cmd") || normalized.includes("meta");
    const hasCtrl = normalized.includes("ctrl");

    if (hasCmd && !hasCtrl) return "mac";
    if (hasCtrl && !hasCmd) return "windows"; // Also applies to Linux
    return "universal";
  }
}

export function createShortcutReference<TBlock extends Block<BlockData> = Block<BlockData>>(
  options: ShortcutReferenceOptions<TBlock>,
): ShortcutReference<TBlock> {
  return new ShortcutReference(options);
}
