import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface QuizBlockData extends Record<string, unknown> {
  question: string;
  options: QuizOption[];
  allowMultiple: boolean;
  randomizeOptions: boolean;
  showExplanations: boolean;
}

export const quizOptionSchema = z
  .object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean(),
    explanation: z.string().optional(),
  })
  .strict();

export const quizBlockDataSchema = z
  .object({
    question: z.string(),
    options: z.array(quizOptionSchema).min(2).max(12),
    allowMultiple: z.boolean(),
    randomizeOptions: z.boolean(),
    showExplanations: z.boolean(),
  })
  .strict()
  .superRefine((value, context) => {
    const correctCount = value.options.filter((option) => option.isCorrect).length;
    if (correctCount < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quiz must include at least one correct option",
        path: ["options"],
      });
    }

    if (!value.allowMultiple && correctCount > 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Single-answer quizzes can only have one correct option",
        path: ["options"],
      });
    }
  });

function createOptionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `quiz-option-${crypto.randomUUID()}`;
  }

  return `quiz-option-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function addQuizOption(
  data: QuizBlockData,
  option?: Partial<QuizOption>,
): QuizBlockData {
  const parsed = quizBlockDataSchema.parse(data);
  const nextOption: QuizOption = {
    id: option?.id ?? createOptionId(),
    text: option?.text ?? "Option",
    isCorrect: Boolean(option?.isCorrect),
    explanation: option?.explanation,
  };

  return quizBlockDataSchema.parse({
    ...parsed,
    options: [...parsed.options, nextOption],
  });
}

export function toggleQuizOptionCorrect(
  data: QuizBlockData,
  optionId: string,
): QuizBlockData {
  const parsed = quizBlockDataSchema.parse(data);
  const optionExists = parsed.options.some((option) => option.id === optionId);
  if (!optionExists) {
    throw new Error(`Quiz option "${optionId}" was not found`);
  }

  const options = parsed.options.map((option) => {
    if (option.id !== optionId) {
      return parsed.allowMultiple ? option : { ...option, isCorrect: false };
    }

    return {
      ...option,
      isCorrect: !option.isCorrect,
    };
  });

  return quizBlockDataSchema.parse({
    ...parsed,
    options,
  });
}

export const QuizBlock: BlockTypeDefinition<QuizBlockData> = {
  type: "quiz",
  name: "Quiz",
  icon: "QUIZ",
  schema: quizBlockDataSchema,
  defaultData: {
    question: "What should Pulse optimize first?",
    options: [
      {
        id: "quiz-option-1",
        text: "Editor speed",
        isCorrect: true,
      },
      {
        id: "quiz-option-2",
        text: "Theme presets",
        isCorrect: false,
      },
    ],
    allowMultiple: false,
    randomizeOptions: false,
    showExplanations: true,
  },
  config: {
    category: "interactive",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = quizBlockDataSchema.parse(data);
    const optionType = parsed.allowMultiple ? "checkbox" : "radio";
    const optionsMarkup = parsed.options
      .map((option) => {
        const explanation = parsed.showExplanations && option.explanation
          ? `<small>${escapeHtml(option.explanation)}</small>`
          : "";
        return `<li data-correct="${String(option.isCorrect)}"><label><input type="${optionType}" disabled /> ${escapeHtml(
          option.text,
        )}</label>${explanation}</li>`;
      })
      .join("");

    return `<section data-block-type="quiz"><h3>${escapeHtml(
      parsed.question,
    )}</h3><ol>${optionsMarkup}</ol></section>`;
  },
  serialize(data) {
    const parsed = quizBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return quizBlockDataSchema.parse(parseJson<QuizBlockData>(content));
  },
};
