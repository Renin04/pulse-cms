import type { Block, BlockData } from "../../../core/src/types/block";
import {
  AccordionBlock,
  AnnotatedImageBlock,
  BeforeAfterBlock,
  ChartBlock,
  ComparisonBlock,
  DiagramBlock,
  FlashcardBlock,
  HeroSectionBlock,
  MapBlock,
  MathEquationBlock,
  SpoilerBlock,
  TabsBlock,
  TimelineBlock,
  ToggleBlock,
  type AccordionBlockData,
  type AnnotatedImageBlockData,
  type BeforeAfterBlockData,
  type ChartBlockData,
  type ComparisonBlockData,
  type DiagramBlockData,
  type FlashcardBlockData,
  type HeroSectionBlockData,
  type MapBlockData,
  type MathEquationBlockData,
  type SpoilerBlockData,
  type TabsBlockData,
  type TimelineBlockData,
  type ToggleBlockData,
} from "../../../blocks/src";
import type {
  EditorCommand,
  EditorCommandContext,
  EditorCommandRegistry,
} from "./CommandRegistry";

export const INSERT_FLASHCARD_BLOCK_COMMAND_ID = "editor.block.flashcard";
export const INSERT_ACCORDION_BLOCK_COMMAND_ID = "editor.block.accordion";
export const INSERT_TABS_BLOCK_COMMAND_ID = "editor.block.tabs";
export const INSERT_TOGGLE_BLOCK_COMMAND_ID = "editor.block.toggle";
export const INSERT_SPOILER_BLOCK_COMMAND_ID = "editor.block.spoiler";
export const INSERT_CHART_BLOCK_COMMAND_ID = "editor.block.chart";
export const INSERT_MAP_BLOCK_COMMAND_ID = "editor.block.map";
export const INSERT_MATH_EQUATION_BLOCK_COMMAND_ID = "editor.block.mathEquation";
export const INSERT_DIAGRAM_BLOCK_COMMAND_ID = "editor.block.diagram";
export const INSERT_TIMELINE_BLOCK_COMMAND_ID = "editor.block.timeline";
export const INSERT_COMPARISON_BLOCK_COMMAND_ID = "editor.block.comparison";
export const INSERT_BEFORE_AFTER_BLOCK_COMMAND_ID = "editor.block.beforeAfter";
export const INSERT_HERO_SECTION_BLOCK_COMMAND_ID = "editor.block.heroSection";
export const INSERT_ANNOTATED_IMAGE_BLOCK_COMMAND_ID = "editor.block.annotatedImage";

type Phase2ExpansionDataMap = {
  flashcard: FlashcardBlockData;
  accordion: AccordionBlockData;
  tabs: TabsBlockData;
  toggle: ToggleBlockData;
  spoiler: SpoilerBlockData;
  chart: ChartBlockData;
  map: MapBlockData;
  "math-equation": MathEquationBlockData;
  diagram: DiagramBlockData;
  timeline: TimelineBlockData;
  comparison: ComparisonBlockData;
  "before-after": BeforeAfterBlockData;
  "hero-section": HeroSectionBlockData;
  "annotated-image": AnnotatedImageBlockData;
};

const PHASE2_EXPANSION_BLOCK_DEFINITIONS = {
  flashcard: FlashcardBlock,
  accordion: AccordionBlock,
  tabs: TabsBlock,
  toggle: ToggleBlock,
  spoiler: SpoilerBlock,
  chart: ChartBlock,
  map: MapBlock,
  "math-equation": MathEquationBlock,
  diagram: DiagramBlock,
  timeline: TimelineBlock,
  comparison: ComparisonBlock,
  "before-after": BeforeAfterBlock,
  "hero-section": HeroSectionBlock,
  "annotated-image": AnnotatedImageBlock,
} as const;

export type Phase2ExpansionBlockType = keyof Phase2ExpansionDataMap;

interface Phase2ExpansionCommandSpec<
  TType extends Phase2ExpansionBlockType = Phase2ExpansionBlockType,
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

const PHASE2_EXPANSION_COMMAND_SPECS: readonly Phase2ExpansionCommandSpec[] = [
  {
    type: "flashcard",
    commandId: INSERT_FLASHCARD_BLOCK_COMMAND_ID,
    title: "Flashcard",
    description: "Insert a flashcard learning block",
    category: "Interactive",
    menuPath: ["insert", "interactive"],
    slashTrigger: "flashcard",
    aliases: ["card-flip"],
    keywords: ["study", "learning"],
  },
  {
    type: "accordion",
    commandId: INSERT_ACCORDION_BLOCK_COMMAND_ID,
    title: "Accordion",
    description: "Insert an accordion block",
    category: "Interactive",
    menuPath: ["insert", "interactive"],
    slashTrigger: "accordion",
    aliases: ["collapse"],
    keywords: ["faq", "sections"],
  },
  {
    type: "tabs",
    commandId: INSERT_TABS_BLOCK_COMMAND_ID,
    title: "Tabs",
    description: "Insert a tabbed block",
    category: "Interactive",
    menuPath: ["insert", "interactive"],
    slashTrigger: "tabs",
    aliases: ["tab"],
    keywords: ["switch", "sections"],
  },
  {
    type: "toggle",
    commandId: INSERT_TOGGLE_BLOCK_COMMAND_ID,
    title: "Toggle",
    description: "Insert a toggle block",
    category: "Interactive",
    menuPath: ["insert", "interactive"],
    slashTrigger: "toggle",
    keywords: ["show", "hide"],
  },
  {
    type: "spoiler",
    commandId: INSERT_SPOILER_BLOCK_COMMAND_ID,
    title: "Spoiler",
    description: "Insert a spoiler reveal block",
    category: "Interactive",
    menuPath: ["insert", "interactive"],
    slashTrigger: "spoiler",
    aliases: ["reveal"],
    keywords: ["hidden", "sensitive"],
  },
  {
    type: "chart",
    commandId: INSERT_CHART_BLOCK_COMMAND_ID,
    title: "Chart",
    description: "Insert a chart block",
    category: "Advanced",
    menuPath: ["insert", "advanced"],
    slashTrigger: "chart",
    keywords: ["data", "visualization"],
  },
  {
    type: "map",
    commandId: INSERT_MAP_BLOCK_COMMAND_ID,
    title: "Map",
    description: "Insert a map block",
    category: "Advanced",
    menuPath: ["insert", "advanced"],
    slashTrigger: "map",
    keywords: ["location", "geography"],
  },
  {
    type: "math-equation",
    commandId: INSERT_MATH_EQUATION_BLOCK_COMMAND_ID,
    title: "Math equation",
    description: "Insert a math equation block",
    category: "Advanced",
    menuPath: ["insert", "advanced"],
    slashTrigger: "math",
    aliases: ["equation", "latex"],
    keywords: ["formula"],
  },
  {
    type: "diagram",
    commandId: INSERT_DIAGRAM_BLOCK_COMMAND_ID,
    title: "Diagram",
    description: "Insert a diagram block",
    category: "Advanced",
    menuPath: ["insert", "advanced"],
    slashTrigger: "diagram",
    aliases: ["mermaid"],
    keywords: ["flowchart", "uml"],
  },
  {
    type: "timeline",
    commandId: INSERT_TIMELINE_BLOCK_COMMAND_ID,
    title: "Timeline",
    description: "Insert a timeline block",
    category: "Advanced",
    menuPath: ["insert", "advanced"],
    slashTrigger: "timeline",
    keywords: ["milestones", "events"],
  },
  {
    type: "comparison",
    commandId: INSERT_COMPARISON_BLOCK_COMMAND_ID,
    title: "Comparison",
    description: "Insert a comparison table block",
    category: "Advanced",
    menuPath: ["insert", "advanced"],
    slashTrigger: "comparison",
    aliases: ["compare"],
    keywords: ["versus", "side-by-side"],
  },
  {
    type: "before-after",
    commandId: INSERT_BEFORE_AFTER_BLOCK_COMMAND_ID,
    title: "Before/After",
    description: "Insert a before-after visual block",
    category: "Advanced",
    menuPath: ["insert", "advanced"],
    slashTrigger: "before-after",
    aliases: ["beforeafter"],
    keywords: ["diff", "slider"],
  },
  {
    type: "hero-section",
    commandId: INSERT_HERO_SECTION_BLOCK_COMMAND_ID,
    title: "Hero section",
    description: "Insert a hero section block",
    category: "Creative",
    menuPath: ["insert", "creative"],
    slashTrigger: "hero",
    aliases: ["banner"],
    keywords: ["header", "cta"],
  },
  {
    type: "annotated-image",
    commandId: INSERT_ANNOTATED_IMAGE_BLOCK_COMMAND_ID,
    title: "Annotated image",
    description: "Insert an annotated image block",
    category: "Creative",
    menuPath: ["insert", "creative"],
    slashTrigger: "annotated-image",
    aliases: ["hotspot"],
    keywords: ["image", "annotation"],
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

function getDefaultPhase2ExpansionData<TType extends Phase2ExpansionBlockType>(
  type: TType,
): Phase2ExpansionDataMap[TType] {
  const definition = PHASE2_EXPANSION_BLOCK_DEFINITIONS[type];
  const defaultData =
    typeof definition.defaultData === "function"
      ? definition.defaultData()
      : definition.defaultData;

  return validatePhase2ExpansionBlockData(type, cloneValue(defaultData));
}

export function validatePhase2ExpansionBlockData<TType extends Phase2ExpansionBlockType>(
  type: TType,
  data: unknown,
): Phase2ExpansionDataMap[TType] {
  const definition = PHASE2_EXPANSION_BLOCK_DEFINITIONS[type];
  return definition.schema.parse(data) as Phase2ExpansionDataMap[TType];
}

export function mergePhase2ExpansionBlockData<TType extends Phase2ExpansionBlockType>(
  type: TType,
  currentData: Phase2ExpansionDataMap[TType],
  patch: Partial<Phase2ExpansionDataMap[TType]>,
): Phase2ExpansionDataMap[TType] {
  const current = validatePhase2ExpansionBlockData(type, currentData);
  return validatePhase2ExpansionBlockData(type, {
    ...current,
    ...patch,
  });
}

export interface CreatePhase2ExpansionBlockOptions<TType extends Phase2ExpansionBlockType> {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  data?: Partial<Phase2ExpansionDataMap[TType]>;
}

export function createPhase2ExpansionBlock<TType extends Phase2ExpansionBlockType>(
  type: TType,
  options: CreatePhase2ExpansionBlockOptions<TType> = {},
): Block<Phase2ExpansionDataMap[TType]> {
  const timestamp = options.createdAt ?? new Date().toISOString();
  const baseData = getDefaultPhase2ExpansionData(type);
  const mergedData = options.data
    ? mergePhase2ExpansionBlockData(type, baseData, options.data)
    : baseData;

  return {
    id: options.id ?? createGeneratedId(type),
    type,
    data: mergedData,
    createdAt: timestamp,
    updatedAt: options.updatedAt ?? timestamp,
  };
}

function insertPhase2ExpansionBlock<TBlock extends Block<BlockData>>(
  context: EditorCommandContext<TBlock>,
  type: Phase2ExpansionBlockType,
): void {
  const block = createPhase2ExpansionBlock(type);
  const index = resolveInsertIndex(context);
  context.state.insertBlock(block as unknown as TBlock, index);
}

export function createPhase2ExpansionBlockCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): EditorCommand<TBlock>[] {
  return PHASE2_EXPANSION_COMMAND_SPECS.map((spec) => ({
    id: spec.commandId,
    title: spec.title,
    description: spec.description,
    category: spec.category,
    menuPath: spec.menuPath,
    slashTrigger: spec.slashTrigger,
    aliases: spec.aliases,
    keywords: spec.keywords,
    execute(context) {
      insertPhase2ExpansionBlock(context, spec.type);
    },
  }));
}

export function registerPhase2ExpansionBlockCommands<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(registry: EditorCommandRegistry<TBlock>): EditorCommand<TBlock>[] {
  const commands = createPhase2ExpansionBlockCommands<TBlock>();
  const registered: EditorCommand<TBlock>[] = [];

  for (const command of commands) {
    if (!registry.has(command.id)) {
      registry.register(command);
      registered.push(command);
    }
  }

  return registered;
}
