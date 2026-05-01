import type { Block, BlockData } from "../../../core/src/types/block";
import {
  AlertBlock,
  AudioBlock,
  CalloutBlock,
  EmbedBlock,
  FileBlock,
  TableBlock,
  VideoBlock,
  type AlertBlockData,
  type AudioBlockData,
  type CalloutBlockData,
  type EmbedBlockData,
  type FileBlockData,
  type TableBlockData,
  type VideoBlockData,
} from "../../../blocks/src";
import type {
  EditorCommand,
  EditorCommandContext,
  EditorCommandRegistry,
} from "./CommandRegistry";

export const INSERT_VIDEO_BLOCK_COMMAND_ID = "editor.block.video";
export const INSERT_AUDIO_BLOCK_COMMAND_ID = "editor.block.audio";
export const INSERT_FILE_BLOCK_COMMAND_ID = "editor.block.file";
export const INSERT_TABLE_BLOCK_COMMAND_ID = "editor.block.table";
export const INSERT_EMBED_BLOCK_COMMAND_ID = "editor.block.embed";
export const INSERT_CALLOUT_BLOCK_COMMAND_ID = "editor.block.callout";
export const INSERT_ALERT_BLOCK_COMMAND_ID = "editor.block.alert";

type ExtendedBlockDataMap = {
  video: VideoBlockData;
  audio: AudioBlockData;
  file: FileBlockData;
  table: TableBlockData;
  embed: EmbedBlockData;
  callout: CalloutBlockData;
  alert: AlertBlockData;
};

const EXTENDED_BLOCK_DEFINITIONS = {
  video: VideoBlock,
  audio: AudioBlock,
  file: FileBlock,
  table: TableBlock,
  embed: EmbedBlock,
  callout: CalloutBlock,
  alert: AlertBlock,
} as const;

export type ExtendedBlockType = keyof ExtendedBlockDataMap;

interface ExtendedBlockCommandSpec<TType extends ExtendedBlockType = ExtendedBlockType> {
  type: TType;
  commandId: string;
  title: string;
  description: string;
  category: string;
  menuPath: string[];
  slashTrigger: string;
  aliases?: string[];
  keywords?: string[];
}

const EXTENDED_BLOCK_COMMAND_SPECS: readonly ExtendedBlockCommandSpec[] = [
  {
    type: "video",
    commandId: INSERT_VIDEO_BLOCK_COMMAND_ID,
    title: "Video",
    description: "Insert a video block",
    category: "Media",
    menuPath: ["insert", "media"],
    slashTrigger: "video",
    aliases: ["movie"],
    keywords: ["media", "youtube", "vimeo"],
  },
  {
    type: "audio",
    commandId: INSERT_AUDIO_BLOCK_COMMAND_ID,
    title: "Audio",
    description: "Insert an audio block",
    category: "Media",
    menuPath: ["insert", "media"],
    slashTrigger: "audio",
    aliases: ["podcast", "sound"],
    keywords: ["media", "music", "voice"],
  },
  {
    type: "file",
    commandId: INSERT_FILE_BLOCK_COMMAND_ID,
    title: "File",
    description: "Insert a file attachment block",
    category: "Media",
    menuPath: ["insert", "media"],
    slashTrigger: "file",
    aliases: ["attachment"],
    keywords: ["download", "asset"],
  },
  {
    type: "table",
    commandId: INSERT_TABLE_BLOCK_COMMAND_ID,
    title: "Table",
    description: "Insert a table block",
    category: "Insert",
    menuPath: ["insert", "structured"],
    slashTrigger: "table",
    aliases: ["grid"],
    keywords: ["rows", "columns", "data"],
  },
  {
    type: "embed",
    commandId: INSERT_EMBED_BLOCK_COMMAND_ID,
    title: "Embed",
    description: "Insert a generic embed block",
    category: "Insert",
    menuPath: ["insert", "structured"],
    slashTrigger: "embed",
    aliases: ["iframe"],
    keywords: ["external", "widget"],
  },
  {
    type: "callout",
    commandId: INSERT_CALLOUT_BLOCK_COMMAND_ID,
    title: "Callout",
    description: "Insert a highlighted callout block",
    category: "Insert",
    menuPath: ["insert", "structured"],
    slashTrigger: "callout",
    aliases: ["note"],
    keywords: ["tip", "highlight"],
  },
  {
    type: "alert",
    commandId: INSERT_ALERT_BLOCK_COMMAND_ID,
    title: "Alert",
    description: "Insert an alert status block",
    category: "Insert",
    menuPath: ["insert", "structured"],
    slashTrigger: "alert",
    aliases: ["warning"],
    keywords: ["status", "severity"],
  },
] as const;

function cloneValue<TValue>(value: TValue): TValue {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as TValue;
}

function createGeneratedId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function resolveInsertIndex<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
): number | undefined {
  const snapshot = context.state.getSnapshot();
  if (!snapshot.focusedBlockId) {
    return undefined;
  }

  const focusedIndex = snapshot.document.blocks.findIndex(
    (block) => block.id === snapshot.focusedBlockId,
  );

  return focusedIndex >= 0 ? focusedIndex + 1 : undefined;
}

function getDefaultExtendedData<TType extends ExtendedBlockType>(
  type: TType,
): ExtendedBlockDataMap[TType] {
  const definition = EXTENDED_BLOCK_DEFINITIONS[type];
  const defaultData =
    typeof definition.defaultData === "function"
      ? definition.defaultData()
      : definition.defaultData;

  return validateExtendedBlockData(type, cloneValue(defaultData));
}

export function validateExtendedBlockData<TType extends ExtendedBlockType>(
  type: TType,
  data: unknown,
): ExtendedBlockDataMap[TType] {
  const definition = EXTENDED_BLOCK_DEFINITIONS[type];
  return definition.schema.parse(data) as ExtendedBlockDataMap[TType];
}

export function mergeExtendedBlockData<TType extends ExtendedBlockType>(
  type: TType,
  currentData: ExtendedBlockDataMap[TType],
  patch: Partial<ExtendedBlockDataMap[TType]>,
): ExtendedBlockDataMap[TType] {
  const current = validateExtendedBlockData(type, currentData);
  return validateExtendedBlockData(type, {
    ...current,
    ...patch,
  });
}

export interface CreateExtendedBlockOptions<TType extends ExtendedBlockType> {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  data?: Partial<ExtendedBlockDataMap[TType]>;
}

export function createExtendedBlock<TType extends ExtendedBlockType>(
  type: TType,
  options: CreateExtendedBlockOptions<TType> = {},
): Block<ExtendedBlockDataMap[TType]> {
  const timestamp = options.createdAt ?? new Date().toISOString();
  const baseData = getDefaultExtendedData(type);
  const mergedData = options.data
    ? mergeExtendedBlockData(type, baseData, options.data)
    : baseData;

  return {
    id: options.id ?? createGeneratedId(type),
    type,
    data: mergedData,
    createdAt: timestamp,
    updatedAt: options.updatedAt ?? timestamp,
  };
}

function insertExtendedBlock<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
  type: ExtendedBlockType,
): void {
  const block = createExtendedBlock(type);
  const index = resolveInsertIndex(context);
  context.state.insertBlock(block as unknown as TBlock, index);
}

export function createExtendedBlockCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): EditorCommand<TBlock>[] {
  return EXTENDED_BLOCK_COMMAND_SPECS.map((spec) => ({
    id: spec.commandId,
    title: spec.title,
    description: spec.description,
    category: spec.category,
    menuPath: spec.menuPath,
    slashTrigger: spec.slashTrigger,
    aliases: spec.aliases,
    keywords: spec.keywords,
    execute(context) {
      insertExtendedBlock(context, spec.type);
    },
  }));
}

export function registerExtendedBlockCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(registry: EditorCommandRegistry<TBlock>): EditorCommand<TBlock>[] {
  const commands = createExtendedBlockCommands<TBlock>();
  const registered: EditorCommand<TBlock>[] = [];

  for (const command of commands) {
    if (!registry.has(command.id)) {
      registry.register(command);
      registered.push(command);
    }
  }

  return registered;
}
