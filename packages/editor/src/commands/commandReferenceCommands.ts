import type { Block, BlockData } from "../../../core/src/types/block";
import type {
  EditorCommand,
  EditorCommandRegistry,
} from "./CommandRegistry";

export const COMMAND_CATALOG_OPEN_COMMAND_ID = "editor.reference.commandCatalog";
export const SHORTCUT_REFERENCE_OPEN_COMMAND_ID = "editor.reference.shortcutHelp";
export const USER_COMMAND_EDITOR_OPEN_COMMAND_ID = "editor.reference.userCommands";
export const EXPORT_COMMAND_REFERENCE_COMMAND_ID = "editor.reference.exportCommands";
export const EXPORT_SHORTCUT_REFERENCE_COMMAND_ID = "editor.reference.exportShortcuts";

export function createCommandReferenceCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): EditorCommand<TBlock>[] {
  return [
    {
      id: COMMAND_CATALOG_OPEN_COMMAND_ID,
      title: "Command Catalog",
      description: "Open the command catalog to browse all available commands",
      category: "Reference",
      menuPath: ["help", "reference"],
      slashTrigger: "command catalog",
      aliases: ["commands", "catalog", "فرمان‌ها"],
      keywords: ["commands", "reference", "help", "browse"],
      execute() {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pulse:reference:openCommandCatalog", {
              detail: {},
            }),
          );
        }
      },
    },
    {
      id: SHORTCUT_REFERENCE_OPEN_COMMAND_ID,
      title: "Keyboard Shortcuts",
      description: "Open the keyboard shortcuts reference",
      category: "Reference",
      menuPath: ["help", "reference"],
      slashTrigger: "shortcuts",
      aliases: ["keyboard shortcuts", "hotkeys", "keybindings", "میان‌برها"],
      keywords: ["shortcuts", "keyboard", "hotkeys", "reference"],
      execute() {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pulse:reference:openShortcutHelp", {
              detail: {},
            }),
          );
        }
      },
    },
    {
      id: USER_COMMAND_EDITOR_OPEN_COMMAND_ID,
      title: "User Commands",
      description: "Open the user command and shortcut editor",
      category: "Reference",
      menuPath: ["help", "customization"],
      slashTrigger: "user commands",
      aliases: ["custom commands", "custom shortcuts", "فرمان‌های سفارشی"],
      keywords: ["custom", "user", "commands", "shortcuts", "editor"],
      execute() {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pulse:reference:openUserCommandEditor", {
              detail: {},
            }),
          );
        }
      },
    },
    {
      id: EXPORT_COMMAND_REFERENCE_COMMAND_ID,
      title: "Export Command Reference",
      description: "Export the command reference as markdown",
      category: "Reference",
      menuPath: ["help", "reference"],
      slashTrigger: "export commands",
      aliases: ["export reference", "download commands"],
      keywords: ["export", "commands", "markdown", "documentation"],
      execute() {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pulse:reference:exportCommands", {
              detail: {},
            }),
          );
        }
      },
    },
    {
      id: EXPORT_SHORTCUT_REFERENCE_COMMAND_ID,
      title: "Export Shortcut Reference",
      description: "Export the keyboard shortcuts reference as markdown",
      category: "Reference",
      menuPath: ["help", "reference"],
      slashTrigger: "export shortcuts",
      aliases: ["export shortcuts", "download shortcuts"],
      keywords: ["export", "shortcuts", "keyboard", "markdown", "documentation"],
      execute() {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("pulse:reference:exportShortcuts", {
              detail: {},
            }),
          );
        }
      },
    },
  ];
}

export function registerCommandReferenceCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(registry: EditorCommandRegistry<TBlock>): EditorCommand<TBlock>[] {
  const commands = createCommandReferenceCommands<TBlock>();
  const registered: EditorCommand<TBlock>[] = [];

  for (const command of commands) {
    if (!registry.has(command.id)) {
      registry.register(command);
      registered.push(command);
    }
  }

  return registered;
}
