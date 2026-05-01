import type { Block, BlockData } from "../../../core/src/types/block";
import type {
  EditorCommand,
  EditorCommandContext,
  EditorCommandRegistry,
} from "./CommandRegistry";

export type MacroKind = "quickInsert" | "variable" | "template";

export interface MacroDefinition<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  id: string;
  title: string;
  description: string;
  kind: MacroKind;
  trigger: string;
  aliases?: string[];
  execute(context: EditorCommandContext<TBlock>): void;
  preview?(context: EditorCommandContext<TBlock>): string;
}

export const MACRO_INSERT_DATE_COMMAND_ID = "editor.macro.insertDate";
export const MACRO_INSERT_TIME_COMMAND_ID = "editor.macro.insertTime";
export const MACRO_VARIABLE_DATE_COMMAND_ID = "editor.macro.variable.date";
export const MACRO_VARIABLE_AUTHOR_COMMAND_ID = "editor.macro.variable.author";
export const MACRO_TEMPLATE_NOTE_COMMAND_ID = "editor.macro.template.note";

function createGeneratedId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatTime(date: Date): string {
  return date.toISOString().slice(11, 16);
}

function createTextBlock<TBlock extends Block<BlockData>>(
  text: string,
  type: string = "text",
): TBlock {
  const timestamp = new Date().toISOString();

  return {
    id: createGeneratedId(type),
    type,
    data: {
      text,
      marks: {
        bold: false,
        italic: false,
        underline: false,
        code: false,
      },
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  } as unknown as TBlock;
}

export class MacroRegistry<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  private readonly macrosById = new Map<string, MacroDefinition<TBlock>>();

  register(definition: MacroDefinition<TBlock>): void {
    if (!definition.id.trim()) {
      throw new Error("Macro id is required");
    }

    if (this.macrosById.has(definition.id)) {
      throw new Error(`Macro with id "${definition.id}" is already registered`);
    }

    this.macrosById.set(definition.id, definition);
  }

  has(macroId: string): boolean {
    return this.macrosById.has(macroId);
  }

  list(): MacroDefinition<TBlock>[] {
    return [...this.macrosById.values()];
  }

  get(macroId: string): MacroDefinition<TBlock> | undefined {
    return this.macrosById.get(macroId);
  }
}

export interface CreateMacroCommandsOptions {
  currentAuthor?: string;
}

export function createMacroDefinitions<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  options: CreateMacroCommandsOptions = {},
): MacroDefinition<TBlock>[] {
  const author = options.currentAuthor ?? "Unknown author";

  return [
    {
      id: MACRO_INSERT_DATE_COMMAND_ID,
      title: "Insert date",
      description: "Quick insert current date",
      kind: "quickInsert",
      trigger: "date",
      aliases: ["today", "now-date"],
      execute(context) {
        context.state.insertBlock(createTextBlock<TBlock>(formatDate(new Date())));
      },
      preview() {
        return `Date: ${formatDate(new Date())}`;
      },
    },
    {
      id: MACRO_INSERT_TIME_COMMAND_ID,
      title: "Insert time",
      description: "Quick insert current time",
      kind: "quickInsert",
      trigger: "time",
      aliases: ["now-time", "clock"],
      execute(context) {
        context.state.insertBlock(createTextBlock<TBlock>(formatTime(new Date())));
      },
      preview() {
        return `Time: ${formatTime(new Date())}`;
      },
    },
    {
      id: MACRO_VARIABLE_DATE_COMMAND_ID,
      title: "Variable: date",
      description: "Insert dynamic {{date}} variable token",
      kind: "variable",
      trigger: "var-date",
      aliases: ["{{date}}", "variable-date"],
      execute(context) {
        context.state.insertBlock(createTextBlock<TBlock>("{{date}}"));
      },
      preview() {
        return "Inserts token {{date}} resolved by renderer/output pipeline.";
      },
    },
    {
      id: MACRO_VARIABLE_AUTHOR_COMMAND_ID,
      title: "Variable: author",
      description: "Insert dynamic {{author}} variable token",
      kind: "variable",
      trigger: "var-author",
      aliases: ["{{author}}", "variable-author"],
      execute(context) {
        context.state.insertBlock(createTextBlock<TBlock>("{{author}}"));
      },
      preview() {
        return `Current author default: ${author}`;
      },
    },
    {
      id: MACRO_TEMPLATE_NOTE_COMMAND_ID,
      title: "Template: note",
      description: "Insert a multi-block note template",
      kind: "template",
      trigger: "template-note",
      aliases: ["note-template", "starter-note"],
      execute(context) {
        context.state.insertBlock(createTextBlock<TBlock>("Note title"));
        context.state.insertBlock(createTextBlock<TBlock>("- key point one"));
        context.state.insertBlock(createTextBlock<TBlock>("- key point two"));
      },
      preview() {
        return "Template inserts 3 blocks: title + 2 bullet-like lines.";
      },
    },
  ];
}

export function createMacroCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  options: CreateMacroCommandsOptions = {},
): {
  commands: EditorCommand<TBlock>[];
  macroRegistry: MacroRegistry<TBlock>;
} {
  const macroDefinitions = createMacroDefinitions<TBlock>(options);
  const macroRegistry = new MacroRegistry<TBlock>();

  for (const definition of macroDefinitions) {
    macroRegistry.register(definition);
  }

  const commands = macroDefinitions.map<EditorCommand<TBlock>>((definition) => ({
    id: definition.id,
    title: definition.title,
    description: definition.description,
    category: "Macros",
    menuPath: ["insert", "macros", definition.kind],
    slashTrigger: definition.trigger,
    aliases: definition.aliases,
    keywords: [definition.kind, "macro", "insert"],
    execute(context) {
      definition.execute(context);
    },
    getPreview(context) {
      if (!definition.preview) {
        return undefined;
      }

      return definition.preview(context);
    },
  }));

  return {
    commands,
    macroRegistry,
  };
}

export function registerMacroCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  registry: EditorCommandRegistry<TBlock>,
  options: CreateMacroCommandsOptions = {},
): {
  commands: EditorCommand<TBlock>[];
  macroRegistry: MacroRegistry<TBlock>;
} {
  const result = createMacroCommands<TBlock>(options);

  for (const command of result.commands) {
    if (!registry.has(command.id)) {
      registry.register(command);
    }
  }

  return result;
}
