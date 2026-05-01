import type { Block, BlockData } from "../../../core/src/types/block";
import {
  INSERT_CARD_BLOCK_COMMAND_ID,
  INSERT_CAROUSEL_BLOCK_COMMAND_ID,
  INSERT_GALLERY_BLOCK_COMMAND_ID,
  INSERT_MANGA_PANEL_BLOCK_COMMAND_ID,
  INSERT_POLL_BLOCK_COMMAND_ID,
  INSERT_QUIZ_BLOCK_COMMAND_ID,
  INSERT_SPEECH_BUBBLE_BLOCK_COMMAND_ID,
  INSERT_SURVEY_BLOCK_COMMAND_ID,
} from "../commands/interactiveCreativeBlockCommands";
import type { ShortcutBinding } from "./ShortcutRegistry";

export const INTERACTIVE_CREATIVE_SHORTCUT_BINDINGS = {
  insertQuiz: {
    id: "shortcut.block.quiz",
    combo: "mod+shift+q",
    commandId: INSERT_QUIZ_BLOCK_COMMAND_ID,
    description: "Insert quiz block",
  },
  insertPoll: {
    id: "shortcut.block.poll",
    combo: "mod+shift+p",
    commandId: INSERT_POLL_BLOCK_COMMAND_ID,
    description: "Insert poll block",
  },
  insertSurvey: {
    id: "shortcut.block.survey",
    combo: "mod+shift+u",
    commandId: INSERT_SURVEY_BLOCK_COMMAND_ID,
    description: "Insert survey block",
  },
  insertMangaPanel: {
    id: "shortcut.block.manga-panel",
    combo: "mod+shift+m",
    commandId: INSERT_MANGA_PANEL_BLOCK_COMMAND_ID,
    description: "Insert manga panel block",
  },
  insertSpeechBubble: {
    id: "shortcut.block.speech-bubble",
    combo: "mod+shift+b",
    commandId: INSERT_SPEECH_BUBBLE_BLOCK_COMMAND_ID,
    description: "Insert speech bubble block",
  },
  insertCard: {
    id: "shortcut.block.card",
    combo: "mod+shift+d",
    commandId: INSERT_CARD_BLOCK_COMMAND_ID,
    description: "Insert card block",
  },
  insertGallery: {
    id: "shortcut.block.gallery",
    combo: "mod+shift+g",
    commandId: INSERT_GALLERY_BLOCK_COMMAND_ID,
    description: "Insert gallery block",
  },
  insertCarousel: {
    id: "shortcut.block.carousel",
    combo: "mod+shift+r",
    commandId: INSERT_CAROUSEL_BLOCK_COMMAND_ID,
    description: "Insert carousel block",
  },
} as const satisfies Record<string, ShortcutBinding>;

export function createInteractiveCreativeShortcutBindings<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(): ShortcutBinding<TBlock>[] {
  return [
    INTERACTIVE_CREATIVE_SHORTCUT_BINDINGS.insertQuiz,
    INTERACTIVE_CREATIVE_SHORTCUT_BINDINGS.insertPoll,
    INTERACTIVE_CREATIVE_SHORTCUT_BINDINGS.insertSurvey,
    INTERACTIVE_CREATIVE_SHORTCUT_BINDINGS.insertMangaPanel,
    INTERACTIVE_CREATIVE_SHORTCUT_BINDINGS.insertSpeechBubble,
    INTERACTIVE_CREATIVE_SHORTCUT_BINDINGS.insertCard,
    INTERACTIVE_CREATIVE_SHORTCUT_BINDINGS.insertGallery,
    INTERACTIVE_CREATIVE_SHORTCUT_BINDINGS.insertCarousel,
  ];
}
