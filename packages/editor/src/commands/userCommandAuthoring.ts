import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorCommand, EditorCommandContext, EditorCommandRegistry } from "./CommandRegistry";
import type { ShortcutBinding, ShortcutConflict } from "../shortcuts/ShortcutRegistry";

export interface UserCommandDefinition {
  id: string;
  title: string;
  description?: string;
  category?: string;
  slashTrigger?: string;
  action: "macro" | "script" | "chain";
  actionData: unknown;
}

export interface UserShortcutDefinition {
  id: string;
  combo: string;
  commandId: string;
  description?: string;
  when?: string; // Serialized condition
}

export interface UserCommandValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
}

export interface UserShortcutValidationResult {
  valid: boolean;
  conflicts: ShortcutConflict[];
  errors: Array<{ field: string; message: string }>;
}

export interface UserCommandAuthoringOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  commandRegistry: EditorCommandRegistry<TBlock>;
  shortcutRegistry?: {
    getConflicts(): ShortcutConflict<TBlock>[];
    register(binding: ShortcutBinding<TBlock>): void;
    unregister(bindingId: string): boolean;
  };
}

const RESERVED_COMMAND_PREFIXES = ["editor.", "pulse.", "system."];
const VALID_COMMAND_ID_PATTERN = /^[a-z][a-z0-9._-]*$/;
const VALID_SHORTCUT_COMBO_PATTERN = /^(?:(?:ctrl|alt|shift|cmd|meta)\+)*(?:[a-z0-9]|space|enter|escape|tab|backspace|delete|arrow(?:up|down|left|right)|[a-z]\s[a-z])$/i;

export class UserCommandAuthoring<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  private readonly commandRegistry: EditorCommandRegistry<TBlock>;
  private readonly shortcutRegistry?: UserCommandAuthoringOptions<TBlock>["shortcutRegistry"];
  private userCommands = new Map<string, UserCommandDefinition>();
  private userShortcuts = new Map<string, UserShortcutDefinition>();

  constructor(options: UserCommandAuthoringOptions<TBlock>) {
    this.commandRegistry = options.commandRegistry;
    this.shortcutRegistry = options.shortcutRegistry;
  }

  /**
   * Validate a user-defined command definition.
   */
  validateCommand(definition: UserCommandDefinition): UserCommandValidationResult {
    const errors: Array<{ field: string; message: string }> = [];
    const warnings: Array<{ field: string; message: string }> = [];

    // ID validation
    if (!definition.id || definition.id.trim().length === 0) {
      errors.push({ field: "id", message: "Command ID is required" });
    } else {
      if (!VALID_COMMAND_ID_PATTERN.test(definition.id)) {
        errors.push({
          field: "id",
          message: "Command ID must start with a letter and contain only lowercase letters, numbers, dots, hyphens, and underscores",
        });
      }

      // Check reserved prefixes
      for (const prefix of RESERVED_COMMAND_PREFIXES) {
        if (definition.id.startsWith(prefix)) {
          errors.push({
            field: "id",
            message: `Command ID cannot start with reserved prefix "${prefix}"`,
          });
          break;
        }
      }

      // Check for duplicates
      if (this.commandRegistry.has(definition.id) || this.userCommands.has(definition.id)) {
        errors.push({ field: "id", message: `Command ID "${definition.id}" is already in use` });
      }
    }

    // Title validation
    if (!definition.title || definition.title.trim().length === 0) {
      errors.push({ field: "title", message: "Command title is required" });
    } else if (definition.title.length > 100) {
      warnings.push({ field: "title", message: "Title is very long (over 100 characters)" });
    }

    // Slash trigger validation
    if (definition.slashTrigger) {
      if (definition.slashTrigger.includes(" ")) {
        errors.push({ field: "slashTrigger", message: "Slash trigger cannot contain spaces" });
      }
      if (definition.slashTrigger.length > 50) {
        warnings.push({ field: "slashTrigger", message: "Slash trigger is very long" });
      }
    }

    // Action validation
    const validActions = ["macro", "script", "chain"];
    if (!validActions.includes(definition.action)) {
      errors.push({
        field: "action",
        message: `Action must be one of: ${validActions.join(", ")}`,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a user-defined shortcut definition.
   */
  validateShortcut(definition: UserShortcutDefinition): UserShortcutValidationResult {
    const errors: Array<{ field: string; message: string }> = [];
    const conflicts: ShortcutConflict[] = [];

    // ID validation
    if (!definition.id || definition.id.trim().length === 0) {
      errors.push({ field: "id", message: "Shortcut ID is required" });
    } else if (this.userShortcuts.has(definition.id)) {
      errors.push({ field: "id", message: `Shortcut ID "${definition.id}" is already in use` });
    }

    // Combo validation
    if (!definition.combo || definition.combo.trim().length === 0) {
      errors.push({ field: "combo", message: "Shortcut combo is required" });
    } else {
      const normalizedCombo = definition.combo.toLowerCase().trim();

      // Check format
      if (!VALID_SHORTCUT_COMBO_PATTERN.test(normalizedCombo)) {
        errors.push({
          field: "combo",
          message: "Invalid shortcut format. Use format like 'ctrl+k', 'cmd+shift+p', or 'g g' for chords",
        });
      }

      // Check for dangerous shortcuts
      const dangerousCombos = ["ctrl+w", "cmd+w", "ctrl+q", "cmd+q", "ctrl+r", "cmd+r"];
      if (dangerousCombos.includes(normalizedCombo)) {
        errors.push({
          field: "combo",
          message: "This shortcut conflicts with browser/system shortcuts and cannot be used",
        });
      }
    }

    // Command ID validation
    if (!definition.commandId) {
      errors.push({ field: "commandId", message: "Target command ID is required" });
    } else if (!this.commandRegistry.has(definition.commandId) && !this.userCommands.has(definition.commandId)) {
      errors.push({
        field: "commandId",
        message: `Command "${definition.commandId}" does not exist`,
      });
    }

    // Check for conflicts if combo is valid
    if (definition.combo && errors.length === 0 && this.shortcutRegistry) {
      // Temporarily register to check conflicts
      const tempBinding: ShortcutBinding<TBlock> = {
        id: definition.id,
        combo: definition.combo,
        commandId: definition.commandId,
        description: definition.description,
      };

      this.shortcutRegistry.register(tempBinding);
      const allConflicts = this.shortcutRegistry.getConflicts();
      this.shortcutRegistry.unregister(definition.id);

      // Filter conflicts that involve this binding
      for (const conflict of (allConflicts as unknown) as ShortcutConflict[]) {
        if (conflict.bindings.some((b) => b.id === definition.id)) {
          conflicts.push(conflict);
        }
      }
    }

    return {
      valid: errors.length === 0 && conflicts.length === 0,
      conflicts,
      errors,
    };
  }

  /**
   * Register a user-defined command after validation.
   */
  registerCommand(definition: UserCommandDefinition): UserCommandValidationResult {
    const validation = this.validateCommand(definition);

    if (validation.valid) {
      this.userCommands.set(definition.id, definition);

      // Create and register the actual command
      const command: EditorCommand<TBlock> = {
        id: definition.id,
        title: definition.title,
        description: definition.description,
        category: definition.category ?? "Custom",
        slashTrigger: definition.slashTrigger,
        execute: (context: EditorCommandContext<TBlock>) => {
          this.executeUserCommand(definition, context);
        },
      };

      this.commandRegistry.register(command);
    }

    return validation;
  }

  /**
   * Register a user-defined shortcut after validation.
   */
  registerShortcut(definition: UserShortcutDefinition): UserShortcutValidationResult {
    const validation = this.validateShortcut(definition);

    if (validation.valid && this.shortcutRegistry) {
      this.userShortcuts.set(definition.id, definition);

      const binding: ShortcutBinding<TBlock> = {
        id: definition.id,
        combo: definition.combo,
        commandId: definition.commandId,
        description: definition.description,
      };

      this.shortcutRegistry.register(binding);
    }

    return validation;
  }

  /**
   * Unregister a user-defined command.
   */
  unregisterCommand(commandId: string): boolean {
    if (!this.userCommands.has(commandId)) {
      return false;
    }

    this.userCommands.delete(commandId);
    return this.commandRegistry.unregister(commandId);
  }

  /**
   * Unregister a user-defined shortcut.
   */
  unregisterShortcut(shortcutId: string): boolean {
    if (!this.userShortcuts.has(shortcutId)) {
      return false;
    }

    this.userShortcuts.delete(shortcutId);
    return this.shortcutRegistry?.unregister(shortcutId) ?? false;
  }

  /**
   * Get all user-defined commands.
   */
  getUserCommands(): UserCommandDefinition[] {
    return [...this.userCommands.values()];
  }

  /**
   * Get all user-defined shortcuts.
   */
  getUserShortcuts(): UserShortcutDefinition[] {
    return [...this.userShortcuts.values()];
  }

  /**
   * Export user commands and shortcuts for persistence.
   */
  exportDefinitions(): { commands: UserCommandDefinition[]; shortcuts: UserShortcutDefinition[] } {
    return {
      commands: this.getUserCommands(),
      shortcuts: this.getUserShortcuts(),
    };
  }

  /**
   * Import user commands and shortcuts from persisted data.
   */
  importDefinitions(data: { commands: UserCommandDefinition[]; shortcuts: UserShortcutDefinition[] }): {
    commandResults: Array<{ definition: UserCommandDefinition; result: UserCommandValidationResult }>;
    shortcutResults: Array<{ definition: UserShortcutDefinition; result: UserShortcutValidationResult }>;
  } {
    const commandResults: Array<{ definition: UserCommandDefinition; result: UserCommandValidationResult }> = [];
    const shortcutResults: Array<{ definition: UserShortcutDefinition; result: UserShortcutValidationResult }> = [];

    // Import commands first
    for (const cmd of data.commands) {
      const result = this.registerCommand(cmd);
      commandResults.push({ definition: cmd, result });
    }

    // Then import shortcuts
    for (const shortcut of data.shortcuts) {
      const result = this.registerShortcut(shortcut);
      shortcutResults.push({ definition: shortcut, result });
    }

    return { commandResults, shortcutResults };
  }

  private executeUserCommand(
    definition: UserCommandDefinition,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: EditorCommandContext<TBlock>,
  ): void {
    // Dispatch event for the user command execution
    // The actual implementation would depend on the action type
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("pulse:userCommand:execute", {
          detail: {
            commandId: definition.id,
            action: definition.action,
            actionData: definition.actionData,
          },
        }),
      );
    }
  }
}

export function createUserCommandAuthoring<TBlock extends Block<BlockData> = Block<BlockData>>(
  options: UserCommandAuthoringOptions<TBlock>,
): UserCommandAuthoring<TBlock> {
  return new UserCommandAuthoring(options);
}

// Types are already exported above
