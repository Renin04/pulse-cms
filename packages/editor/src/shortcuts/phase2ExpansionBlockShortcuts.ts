import type { Block, BlockData } from "../../../core/src/types/block";
import {
  INSERT_ACCORDION_BLOCK_COMMAND_ID,
  INSERT_ANNOTATED_IMAGE_BLOCK_COMMAND_ID,
  INSERT_BEFORE_AFTER_BLOCK_COMMAND_ID,
  INSERT_CHART_BLOCK_COMMAND_ID,
  INSERT_COMPARISON_BLOCK_COMMAND_ID,
  INSERT_DIAGRAM_BLOCK_COMMAND_ID,
  INSERT_FLASHCARD_BLOCK_COMMAND_ID,
  INSERT_HERO_SECTION_BLOCK_COMMAND_ID,
  INSERT_MAP_BLOCK_COMMAND_ID,
  INSERT_MATH_EQUATION_BLOCK_COMMAND_ID,
  INSERT_SPOILER_BLOCK_COMMAND_ID,
  INSERT_TABS_BLOCK_COMMAND_ID,
  INSERT_TIMELINE_BLOCK_COMMAND_ID,
  INSERT_TOGGLE_BLOCK_COMMAND_ID,
} from "../commands/phase2ExpansionBlockCommands";
import type { ShortcutBinding } from "./ShortcutRegistry";

export const PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS = {
  insertFlashcard: {
    id: "shortcut.block.flashcard",
    combo: "mod+alt+shift+1",
    commandId: INSERT_FLASHCARD_BLOCK_COMMAND_ID,
    description: "Insert flashcard block",
  },
  insertAccordion: {
    id: "shortcut.block.accordion",
    combo: "mod+alt+shift+2",
    commandId: INSERT_ACCORDION_BLOCK_COMMAND_ID,
    description: "Insert accordion block",
  },
  insertTabs: {
    id: "shortcut.block.tabs",
    combo: "mod+alt+shift+3",
    commandId: INSERT_TABS_BLOCK_COMMAND_ID,
    description: "Insert tabs block",
  },
  insertToggle: {
    id: "shortcut.block.toggle",
    combo: "mod+alt+shift+4",
    commandId: INSERT_TOGGLE_BLOCK_COMMAND_ID,
    description: "Insert toggle block",
  },
  insertSpoiler: {
    id: "shortcut.block.spoiler",
    combo: "mod+alt+shift+5",
    commandId: INSERT_SPOILER_BLOCK_COMMAND_ID,
    description: "Insert spoiler block",
  },
  insertChart: {
    id: "shortcut.block.chart",
    combo: "mod+alt+shift+6",
    commandId: INSERT_CHART_BLOCK_COMMAND_ID,
    description: "Insert chart block",
  },
  insertMap: {
    id: "shortcut.block.map",
    combo: "mod+alt+shift+7",
    commandId: INSERT_MAP_BLOCK_COMMAND_ID,
    description: "Insert map block",
  },
  insertMathEquation: {
    id: "shortcut.block.math-equation",
    combo: "mod+alt+shift+8",
    commandId: INSERT_MATH_EQUATION_BLOCK_COMMAND_ID,
    description: "Insert math equation block",
  },
  insertDiagram: {
    id: "shortcut.block.diagram",
    combo: "mod+alt+shift+9",
    commandId: INSERT_DIAGRAM_BLOCK_COMMAND_ID,
    description: "Insert diagram block",
  },
  insertTimeline: {
    id: "shortcut.block.timeline",
    combo: "mod+alt+shift+0",
    commandId: INSERT_TIMELINE_BLOCK_COMMAND_ID,
    description: "Insert timeline block",
  },
  insertComparison: {
    id: "shortcut.block.comparison",
    combo: "mod+alt+shift+c",
    commandId: INSERT_COMPARISON_BLOCK_COMMAND_ID,
    description: "Insert comparison block",
  },
  insertBeforeAfter: {
    id: "shortcut.block.before-after",
    combo: "mod+alt+shift+b",
    commandId: INSERT_BEFORE_AFTER_BLOCK_COMMAND_ID,
    description: "Insert before-after block",
  },
  insertHeroSection: {
    id: "shortcut.block.hero-section",
    combo: "mod+alt+shift+h",
    commandId: INSERT_HERO_SECTION_BLOCK_COMMAND_ID,
    description: "Insert hero section block",
  },
  insertAnnotatedImage: {
    id: "shortcut.block.annotated-image",
    combo: "mod+alt+shift+i",
    commandId: INSERT_ANNOTATED_IMAGE_BLOCK_COMMAND_ID,
    description: "Insert annotated image block",
  },
} as const satisfies Record<string, ShortcutBinding>;

export function createPhase2ExpansionBlockShortcutBindings<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): ShortcutBinding<TBlock>[] {
  return [
    PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS.insertFlashcard,
    PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS.insertAccordion,
    PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS.insertTabs,
    PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS.insertToggle,
    PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS.insertSpoiler,
    PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS.insertChart,
    PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS.insertMap,
    PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS.insertMathEquation,
    PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS.insertDiagram,
    PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS.insertTimeline,
    PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS.insertComparison,
    PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS.insertBeforeAfter,
    PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS.insertHeroSection,
    PHASE2_EXPANSION_BLOCK_SHORTCUT_BINDINGS.insertAnnotatedImage,
  ];
}
