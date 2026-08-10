import { BlockRegistry } from "../../core/src/registry/BlockRegistry";
import type { BlockDefinition } from "../../core/src/types/block";

import { AlertBlock } from "./AlertBlock";
import { AccordionBlock } from "./AccordionBlock";
import { AnnotatedImageBlock } from "./AnnotatedImageBlock";
import { AudioBlock } from "./AudioBlock";
import { BeforeAfterBlock } from "./BeforeAfterBlock";
import { BlockquoteBlock } from "./BlockquoteBlock";
import { CardBlock } from "./CardBlock";
import { CalloutBlock } from "./CalloutBlock";
import { CarouselBlock } from "./CarouselBlock";
import { ChartBlock } from "./ChartBlock";
import { CodeBlock } from "./CodeBlock";
import { CodeSandboxBlock } from "./CodeSandboxBlock";
import { ComparisonBlock } from "./ComparisonBlock";
import { DiagramBlock } from "./DiagramBlock";
import { EmbedBlock } from "./EmbedBlock";
import { FileBlock } from "./FileBlock";
import { FlashcardBlock } from "./FlashcardBlock";
import { GalleryBlock } from "./GalleryBlock";
import { HeadingBlock } from "./HeadingBlock";
import { HeroSectionBlock } from "./HeroSectionBlock";
import { HorizontalRuleBlock } from "./HorizontalRuleBlock";
import { ImageBlock } from "./ImageBlock";
import { ListBlock } from "./ListBlock";
import { LinkBlock } from "./LinkBlock";
import { MangaPanelBlock } from "./MangaPanelBlock";
import { MapBlock } from "./MapBlock";
import { MathEquationBlock } from "./MathEquationBlock";
import { PollBlock } from "./PollBlock";
import { QuizBlock } from "./QuizBlock";
import { SpoilerBlock } from "./SpoilerBlock";
import { SpeechBubbleBlock } from "./SpeechBubbleBlock";
import { SurveyBlock } from "./SurveyBlock";
import { TableBlock } from "./TableBlock";
import { TabsBlock } from "./TabsBlock";
import { TextBlock } from "./TextBlock";
import { TimelineBlock } from "./TimelineBlock";
import { ToggleBlock } from "./ToggleBlock";
import type { BlockTypeDefinition } from "./types";
import { VideoBlock } from "./VideoBlock";
import { AutoSolveEquationBlock } from "./AutoSolveEquationBlock";
import { BranchesBlock } from "./BranchesBlock";
import { SteppedEquationBlock } from "./SteppedEquationBlock";

export {
  AutoSolveEquationBlock,
  autoSolveEquationBlockDataSchema,
  normalizeAutoSolveEquationData,
} from "./AutoSolveEquationBlock";
export type { AutoSolveEquationBlockData } from "./AutoSolveEquationBlock";
export {
  BranchesBlock,
  branchesBlockDataSchema,
  normalizeBranchesData,
} from "./BranchesBlock";
export type { BranchesBlockData, BranchPath } from "./BranchesBlock";
export {
  SteppedEquationBlock,
  steppedEquationBlockDataSchema,
  normalizeSteppedEquationData,
} from "./SteppedEquationBlock";
export type { SteppedEquationBlockData, SteppedEquationStep } from "./SteppedEquationBlock";
export { AlertBlock, alertBlockDataSchema, dismissAlert, resetAlert } from "./AlertBlock";
export type { AlertBlockData, AlertSeverity } from "./AlertBlock";
export { AccordionBlock, accordionBlockDataSchema, addAccordionItem, normalizeAccordionData } from "./AccordionBlock";
export type { AccordionBlockData, AccordionItem } from "./AccordionBlock";
export {
  AnnotatedImageBlock,
  annotatedImageBlockDataSchema,
  addImageHotspot,
} from "./AnnotatedImageBlock";
export type { AnnotatedImageBlockData, ImageHotspot } from "./AnnotatedImageBlock";
export { AudioBlock, audioBlockDataSchema } from "./AudioBlock";
export type { AudioBlockData } from "./AudioBlock";
export {
  BeforeAfterBlock,
  beforeAfterBlockDataSchema,
  setBeforeAfterPosition,
} from "./BeforeAfterBlock";
export type { BeforeAfterBlockData } from "./BeforeAfterBlock";
export { BlockquoteBlock, blockquoteBlockDataSchema } from "./BlockquoteBlock";
export {
  renderInlineMarkdown,
  renderInlineMarks,
  isValidInlineHexColor,
  normalizeInlineHexColor,
  INLINE_HEX_COLOR_PATTERN,
} from "./inlineMarkdown";
export type { InlineMarkdownHandlers } from "./inlineMarkdown";
export { CardBlock, cardBlockDataSchema } from "./CardBlock";
export type { CardBlockData } from "./CardBlock";
export { CalloutBlock, calloutBlockDataSchema, updateCallout } from "./CalloutBlock";
export type { CalloutBlockData, CalloutVariant } from "./CalloutBlock";
export { CarouselBlock, carouselBlockDataSchema, addCarouselSlide } from "./CarouselBlock";
export type { CarouselBlockData, CarouselSlide } from "./CarouselBlock";
export { ChartBlock, chartBlockDataSchema, addChartDataset, normalizeChartData } from "./ChartBlock";
export type { ChartBlockData, ChartDataset, ChartType } from "./ChartBlock";
export {
  CodeBlock,
  codeBlockDataSchema,
  setCodeBlockHighlighter,
  supportsCodeLanguage,
  SUPPORTED_CODE_LANGUAGES,
  buildSandboxSrcdoc,
  utf8ToBase64,
  base64ToUtf8,
} from "./CodeBlock";
export {
  CodeSandboxBlock,
  codeSandboxBlockDataSchema,
  buildPyodideSrcdoc,
} from "./CodeSandboxBlock";
export type { CodeSandboxBlockData } from "./CodeSandboxBlock";
export {
  ComparisonBlock,
  comparisonBlockDataSchema,
  addComparisonRow,
} from "./ComparisonBlock";
export type { ComparisonBlockData, ComparisonRow } from "./ComparisonBlock";
export { DiagramBlock, diagramBlockDataSchema } from "./DiagramBlock";
export type { DiagramBlockData, DiagramEngine } from "./DiagramBlock";
export { EmbedBlock, embedBlockDataSchema } from "./EmbedBlock";
export type { EmbedAspectRatio, EmbedBlockData } from "./EmbedBlock";
export { FileBlock, fileBlockDataSchema } from "./FileBlock";
export type { FileBlockData } from "./FileBlock";
export { FlashcardBlock, flashcardBlockDataSchema, addFlashcard } from "./FlashcardBlock";
export type { FlashcardBlockData, FlashcardItem } from "./FlashcardBlock";
export { GalleryBlock, galleryBlockDataSchema, addGalleryImage } from "./GalleryBlock";
export type { GalleryBlockData, GalleryImage, GalleryLayout } from "./GalleryBlock";
export { HeadingBlock } from "./HeadingBlock";
export { HeroSectionBlock, heroSectionBlockDataSchema } from "./HeroSectionBlock";
export type { HeroSectionBlockData } from "./HeroSectionBlock";
export {
  HorizontalRuleBlock,
  horizontalRuleBlockDataSchema,
} from "./HorizontalRuleBlock";
export {
  ImageBlock,
  imageBlockDataSchema,
  startImageUpload,
  applyImageUploadSuccess,
  applyImageUploadError,
  resizeImage,
} from "./ImageBlock";
export { LinkBlock, linkBlockDataSchema } from "./LinkBlock";
export { ListBlock } from "./ListBlock";
export {
  ReferenceBlock,
  referenceBlockDataSchema,
  formatReferenceNumber,
} from "./ReferenceBlock";
export type { ReferenceBlockData, ReferenceStyle } from "./ReferenceBlock";
export {
  MangaPanelBlock,
  mangaPanelBlockDataSchema,
  addMangaPanel,
  setMangaLayout,
} from "./MangaPanelBlock";
export type { MangaPanelBlockData, MangaPanel, MangaPanelLayout, MangaPanelMode, MangaPanelSize } from "./MangaPanelBlock";
export { MapBlock, mapBlockDataSchema } from "./MapBlock";
export type { MapBlockData, MapProvider } from "./MapBlock";
export { MathEquationBlock, mathEquationBlockDataSchema } from "./MathEquationBlock";
export type { MathEquationBlockData } from "./MathEquationBlock";
export { PollBlock, pollBlockDataSchema, addPollOption, votePollOption } from "./PollBlock";
export type { PollBlockData, PollOption } from "./PollBlock";
export {
  QuizBlock,
  quizBlockDataSchema,
  quizOptionSchema,
  addQuizOption,
  toggleQuizOptionCorrect,
} from "./QuizBlock";
export type { QuizBlockData, QuizOption } from "./QuizBlock";
export { SpoilerBlock, spoilerBlockDataSchema, revealSpoiler } from "./SpoilerBlock";
export type { SpoilerBlockData } from "./SpoilerBlock";
export { SpeechBubbleBlock, speechBubbleBlockDataSchema } from "./SpeechBubbleBlock";
export type {
  SpeechBubbleBlockData,
  SpeechBubbleAlign,
  SpeechBubbleTone,
} from "./SpeechBubbleBlock";
export {
  SurveyBlock,
  surveyBlockDataSchema,
  addSurveyQuestion,
  updateSurveyQuestion,
} from "./SurveyBlock";
export type {
  SurveyBlockData,
  SurveyQuestion,
  SurveyQuestionType,
} from "./SurveyBlock";
export {
  TableBlock,
  tableBlockDataSchema,
  addTableRow,
  updateTableCell,
} from "./TableBlock";
export type { TableBlockData } from "./TableBlock";
export { TabsBlock, tabsBlockDataSchema, addTabItem, setActiveTab } from "./TabsBlock";
export type { TabsBlockData, TabItem } from "./TabsBlock";
export { TextBlock } from "./TextBlock";
export { TimelineBlock, timelineBlockDataSchema, addTimelineEntry } from "./TimelineBlock";
export type { TimelineBlockData, TimelineEntry } from "./TimelineBlock";
export { ToggleBlock, toggleBlockDataSchema, toggleDefaultState } from "./ToggleBlock";
export type { ToggleBlockData } from "./ToggleBlock";
export type { BlockTypeDefinition, BlockRenderContext } from "./types";
export { escapeHtml, sanitizeUrl } from "./types";
export { VideoBlock, videoBlockDataSchema } from "./VideoBlock";
export type { VideoBlockData, VideoProvider } from "./VideoBlock";

export const BASIC_BLOCK_DEFINITIONS = [
  TextBlock,
  HeadingBlock,
  ListBlock,
  BlockquoteBlock,
  HorizontalRuleBlock,
  LinkBlock,
  CodeBlock,
  CodeSandboxBlock,
  ImageBlock,
] as const;

export const EXTENDED_BLOCK_DEFINITIONS = [
  VideoBlock,
  AudioBlock,
  FileBlock,
  TableBlock,
  EmbedBlock,
  CalloutBlock,
  AlertBlock,
] as const;

export const INTERACTIVE_CREATIVE_BLOCK_DEFINITIONS = [
  QuizBlock,
  PollBlock,
  SurveyBlock,
  MangaPanelBlock,
  SpeechBubbleBlock,
  CardBlock,
  GalleryBlock,
  CarouselBlock,
] as const;

export const PHASE2_EXPANSION_BLOCK_DEFINITIONS = [
  FlashcardBlock,
  AccordionBlock,
  TabsBlock,
  ToggleBlock,
  SpoilerBlock,
  ChartBlock,
  MapBlock,
  MathEquationBlock,
  DiagramBlock,
  TimelineBlock,
  ComparisonBlock,
  BeforeAfterBlock,
  HeroSectionBlock,
  AnnotatedImageBlock,
] as const;

export const PHASE3_BLOCK_DEFINITIONS = [
  AutoSolveEquationBlock,
  BranchesBlock,
  SteppedEquationBlock,
] as const;

export const BUILTIN_BLOCK_DEFINITIONS = [
  ...BASIC_BLOCK_DEFINITIONS,
  ...EXTENDED_BLOCK_DEFINITIONS,
  ...INTERACTIVE_CREATIVE_BLOCK_DEFINITIONS,
  ...PHASE2_EXPANSION_BLOCK_DEFINITIONS,
  ...PHASE3_BLOCK_DEFINITIONS,
] as const;

function toCoreBlockDefinition(definition: BlockTypeDefinition): BlockDefinition {
  return {
    type: definition.type,
    name: definition.name,
    schema: definition.schema,
    defaultData: definition.defaultData,
    config: definition.config,
    hooks: definition.hooks,
  } as unknown as BlockDefinition;
}

function registerDefinitions(
  definitions: readonly BlockTypeDefinition[],
  registry: BlockRegistry = BlockRegistry.getInstance(),
): BlockDefinition[] {
  const registered: BlockDefinition[] = [];

  for (const definition of definitions) {
    if (!registry.has(definition.type)) {
      const coreDefinition = toCoreBlockDefinition(definition);
      registry.register(coreDefinition);
      registered.push(coreDefinition);
    }
  }

  return registered;
}

export function registerBasicBlocks(
  registry: BlockRegistry = BlockRegistry.getInstance(),
): BlockDefinition[] {
  return registerDefinitions(BASIC_BLOCK_DEFINITIONS, registry);
}

export function registerExtendedBlocks(
  registry: BlockRegistry = BlockRegistry.getInstance(),
): BlockDefinition[] {
  return registerDefinitions(EXTENDED_BLOCK_DEFINITIONS, registry);
}

export function registerInteractiveCreativeBlocks(
  registry: BlockRegistry = BlockRegistry.getInstance(),
): BlockDefinition[] {
  return registerDefinitions(INTERACTIVE_CREATIVE_BLOCK_DEFINITIONS, registry);
}

export function registerPhase2ExpansionBlocks(
  registry: BlockRegistry = BlockRegistry.getInstance(),
): BlockDefinition[] {
  return registerDefinitions(PHASE2_EXPANSION_BLOCK_DEFINITIONS, registry);
}

export function registerPhase3Blocks(
  registry: BlockRegistry = BlockRegistry.getInstance(),
): BlockDefinition[] {
  return registerDefinitions(PHASE3_BLOCK_DEFINITIONS, registry);
}

export function registerBuiltinBlocks(
  registry: BlockRegistry = BlockRegistry.getInstance(),
): BlockDefinition[] {
  return registerDefinitions(BUILTIN_BLOCK_DEFINITIONS, registry);
}

export { renderMath } from "./mathRenderer";
export { solveEquation } from "./mathSolver";
export type { SolveResult, SolveStep } from "./mathSolver";
