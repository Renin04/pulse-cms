import type { Block, BlockData } from "../../../core/src/types/block";
import {
  CardBlock,
  CarouselBlock,
  GalleryBlock,
  MangaPanelBlock,
  PollBlock,
  QuizBlock,
  SpeechBubbleBlock,
  SurveyBlock,
  type CardBlockData,
  type CarouselBlockData,
  type GalleryBlockData,
  type MangaPanelBlockData,
  type PollBlockData,
  type QuizBlockData,
  type SpeechBubbleBlockData,
  type SurveyBlockData,
} from "../../../blocks/src";
import type {
  EditorCommand,
  EditorCommandContext,
  EditorCommandRegistry,
} from "./CommandRegistry";

export const INSERT_QUIZ_BLOCK_COMMAND_ID = "editor.block.quiz";
export const INSERT_POLL_BLOCK_COMMAND_ID = "editor.block.poll";
export const INSERT_SURVEY_BLOCK_COMMAND_ID = "editor.block.survey";
export const INSERT_MANGA_PANEL_BLOCK_COMMAND_ID = "editor.block.mangaPanel";
export const INSERT_SPEECH_BUBBLE_BLOCK_COMMAND_ID = "editor.block.speechBubble";
export const INSERT_CARD_BLOCK_COMMAND_ID = "editor.block.card";
export const INSERT_GALLERY_BLOCK_COMMAND_ID = "editor.block.gallery";
export const INSERT_CAROUSEL_BLOCK_COMMAND_ID = "editor.block.carousel";

type InteractiveCreativeDataMap = {
  quiz: QuizBlockData;
  poll: PollBlockData;
  survey: SurveyBlockData;
  "manga-panel": MangaPanelBlockData;
  "speech-bubble": SpeechBubbleBlockData;
  card: CardBlockData;
  gallery: GalleryBlockData;
  carousel: CarouselBlockData;
};

const INTERACTIVE_CREATIVE_BLOCK_DEFINITIONS = {
  quiz: QuizBlock,
  poll: PollBlock,
  survey: SurveyBlock,
  "manga-panel": MangaPanelBlock,
  "speech-bubble": SpeechBubbleBlock,
  card: CardBlock,
  gallery: GalleryBlock,
  carousel: CarouselBlock,
} as const;

export type InteractiveCreativeBlockType = keyof InteractiveCreativeDataMap;

interface InteractiveCreativeCommandSpec<
  TType extends InteractiveCreativeBlockType = InteractiveCreativeBlockType,
> {
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

const INTERACTIVE_CREATIVE_COMMAND_SPECS: readonly InteractiveCreativeCommandSpec[] = [
  {
    type: "quiz",
    commandId: INSERT_QUIZ_BLOCK_COMMAND_ID,
    title: "Quiz",
    description: "Insert a quiz block",
    category: "Interactive",
    menuPath: ["insert", "interactive"],
    slashTrigger: "quiz",
    aliases: ["mcq"],
    keywords: ["question", "assessment"],
  },
  {
    type: "poll",
    commandId: INSERT_POLL_BLOCK_COMMAND_ID,
    title: "Poll",
    description: "Insert a poll block",
    category: "Interactive",
    menuPath: ["insert", "interactive"],
    slashTrigger: "poll",
    keywords: ["vote", "survey-lite"],
  },
  {
    type: "survey",
    commandId: INSERT_SURVEY_BLOCK_COMMAND_ID,
    title: "Survey",
    description: "Insert a survey block",
    category: "Interactive",
    menuPath: ["insert", "interactive"],
    slashTrigger: "survey",
    keywords: ["questionnaire", "form"],
  },
  {
    type: "manga-panel",
    commandId: INSERT_MANGA_PANEL_BLOCK_COMMAND_ID,
    title: "Manga Panel",
    description: "Insert a manga panel block",
    category: "Creative",
    menuPath: ["insert", "creative"],
    slashTrigger: "manga",
    aliases: ["comic-panel"],
    keywords: ["storyboard", "panel"],
  },
  {
    type: "speech-bubble",
    commandId: INSERT_SPEECH_BUBBLE_BLOCK_COMMAND_ID,
    title: "Speech Bubble",
    description: "Insert a speech bubble block",
    category: "Creative",
    menuPath: ["insert", "creative"],
    slashTrigger: "speech",
    aliases: ["dialogue"],
    keywords: ["bubble", "quote"],
  },
  {
    type: "card",
    commandId: INSERT_CARD_BLOCK_COMMAND_ID,
    title: "Card",
    description: "Insert a content card block",
    category: "Creative",
    menuPath: ["insert", "creative"],
    slashTrigger: "card",
    keywords: ["feature", "tile"],
  },
  {
    type: "gallery",
    commandId: INSERT_GALLERY_BLOCK_COMMAND_ID,
    title: "Gallery",
    description: "Insert a gallery block",
    category: "Creative",
    menuPath: ["insert", "creative"],
    slashTrigger: "gallery",
    keywords: ["images", "media-grid"],
  },
  {
    type: "carousel",
    commandId: INSERT_CAROUSEL_BLOCK_COMMAND_ID,
    title: "Carousel",
    description: "Insert a carousel block",
    category: "Creative",
    menuPath: ["insert", "creative"],
    slashTrigger: "carousel",
    aliases: ["slider"],
    keywords: ["slides", "sequence"],
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

function getDefaultInteractiveCreativeData<TType extends InteractiveCreativeBlockType>(
  type: TType,
): InteractiveCreativeDataMap[TType] {
  const definition = INTERACTIVE_CREATIVE_BLOCK_DEFINITIONS[type];
  const defaultData =
    typeof definition.defaultData === "function"
      ? definition.defaultData()
      : definition.defaultData;

  return validateInteractiveCreativeBlockData(type, cloneValue(defaultData));
}

export function validateInteractiveCreativeBlockData<TType extends InteractiveCreativeBlockType>(
  type: TType,
  data: unknown,
): InteractiveCreativeDataMap[TType] {
  const definition = INTERACTIVE_CREATIVE_BLOCK_DEFINITIONS[type];
  return definition.schema.parse(data) as InteractiveCreativeDataMap[TType];
}

export function mergeInteractiveCreativeBlockData<TType extends InteractiveCreativeBlockType>(
  type: TType,
  currentData: InteractiveCreativeDataMap[TType],
  patch: Partial<InteractiveCreativeDataMap[TType]>,
): InteractiveCreativeDataMap[TType] {
  const current = validateInteractiveCreativeBlockData(type, currentData);
  return validateInteractiveCreativeBlockData(type, {
    ...current,
    ...patch,
  });
}

export interface CreateInteractiveCreativeBlockOptions<TType extends InteractiveCreativeBlockType> {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  data?: Partial<InteractiveCreativeDataMap[TType]>;
}

export function createInteractiveCreativeBlock<TType extends InteractiveCreativeBlockType>(
  type: TType,
  options: CreateInteractiveCreativeBlockOptions<TType> = {},
): Block<InteractiveCreativeDataMap[TType]> {
  const timestamp = options.createdAt ?? new Date().toISOString();
  const baseData = getDefaultInteractiveCreativeData(type);
  const mergedData = options.data
    ? mergeInteractiveCreativeBlockData(type, baseData, options.data)
    : baseData;

  return {
    id: options.id ?? createGeneratedId(type),
    type,
    data: mergedData,
    createdAt: timestamp,
    updatedAt: options.updatedAt ?? timestamp,
  };
}

function insertInteractiveCreativeBlock<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
  type: InteractiveCreativeBlockType,
): void {
  const block = createInteractiveCreativeBlock(type);
  const index = resolveInsertIndex(context);
  context.state.insertBlock(block as unknown as TBlock, index);
}

export function createInteractiveCreativeBlockCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): EditorCommand<TBlock>[] {
  return INTERACTIVE_CREATIVE_COMMAND_SPECS.map((spec) => ({
    id: spec.commandId,
    title: spec.title,
    description: spec.description,
    category: spec.category,
    menuPath: spec.menuPath,
    slashTrigger: spec.slashTrigger,
    aliases: spec.aliases,
    keywords: spec.keywords,
    execute(context) {
      insertInteractiveCreativeBlock(context, spec.type);
    },
  }));
}

export function registerInteractiveCreativeBlockCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(registry: EditorCommandRegistry<TBlock>): EditorCommand<TBlock>[] {
  const commands = createInteractiveCreativeBlockCommands<TBlock>();
  const registered: EditorCommand<TBlock>[] = [];

  for (const command of commands) {
    if (!registry.has(command.id)) {
      registry.register(command);
      registered.push(command);
    }
  }

  return registered;
}
