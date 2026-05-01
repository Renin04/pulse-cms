import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

export interface FlashcardBlockData extends Record<string, unknown> {
  title?: string;
  shuffle: boolean;
  cards: FlashcardItem[];
}

const flashcardItemSchema = z
  .object({
    id: z.string(),
    front: z.string(),
    back: z.string(),
    hint: z.string().optional(),
  })
  .strict();

export const flashcardBlockDataSchema = z
  .object({
    title: z.string().optional(),
    shuffle: z.boolean(),
    cards: z.array(flashcardItemSchema).max(100),
  })
  .strict();

function createFlashcardId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `flashcard-${crypto.randomUUID()}`;
  }

  return `flashcard-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function addFlashcard(
  data: FlashcardBlockData,
  card: Omit<FlashcardItem, "id"> & { id?: string },
): FlashcardBlockData {
  const parsed = flashcardBlockDataSchema.parse(data);

  return flashcardBlockDataSchema.parse({
    ...parsed,
    cards: [
      ...parsed.cards,
      {
        ...card,
        id: card.id ?? createFlashcardId(),
      },
    ],
  });
}

export const FlashcardBlock: BlockTypeDefinition<FlashcardBlockData> = {
  type: "flashcard",
  name: "Flashcard",
  icon: "FLASHCARD",
  schema: flashcardBlockDataSchema,
  defaultData: {
    title: "Flashcards",
    shuffle: false,
    cards: [
      {
        id: "flashcard-1",
        front: "What opens commands quickly?",
        back: "Use slash or backslash trigger menus.",
      },
    ],
  },
  config: {
    category: "interactive",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = flashcardBlockDataSchema.parse(data);
    const titleMarkup = parsed.title ? `<h3>${escapeHtml(parsed.title)}</h3>` : "";
    const cardsMarkup = parsed.cards
      .map((card) => {
        const hintMarkup = card.hint ? `<small>${escapeHtml(card.hint)}</small>` : "";
        return `<details><summary>${escapeHtml(card.front)}</summary><p>${escapeHtml(
          card.back,
        )}</p>${hintMarkup}</details>`;
      })
      .join("");

    return `<section data-block-type="flashcard" data-shuffle="${String(
      parsed.shuffle,
    )}">${titleMarkup}${cardsMarkup}</section>`;
  },
  serialize(data) {
    const parsed = flashcardBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return flashcardBlockDataSchema.parse(parseJson<FlashcardBlockData>(content));
  },
};
