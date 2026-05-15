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
    const nameAttr = `quiz-${Math.random().toString(36).slice(2, 8)}`;
    const optionsMarkup = parsed.options
      .map((option) => {
        const explanation = parsed.showExplanations && option.explanation
          ? `<small class="pulse-quiz-explanation" style="display:none;color:#059669;margin-top:4px;">${escapeHtml(option.explanation)}</small>`
          : "";
        return `<li data-correct="${String(option.isCorrect)}"><label class="pulse-quiz-option" style="cursor:pointer;padding:8px 12px;border-radius:8px;border:1px solid var(--neutral-200);display:flex;align-items:center;gap:8px;margin-bottom:6px;"><input type="${optionType}" name="${nameAttr}" value="${escapeHtml(option.id)}" style="cursor:pointer;" /> ${escapeHtml(option.text)}</label>${explanation}</li>`;
      })
      .join("");

    return `<section data-block-type="quiz" class="pulse-quiz"><h3 style="margin-bottom:12px;">${escapeHtml(parsed.question)}</h3><ol style="list-style:none;padding:0;">${optionsMarkup}</ol><div class="pulse-quiz-result" style="margin-top:12px;font-weight:600;display:none;"></div></section>`;
  },
  serialize(data) {
    const parsed = quizBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return quizBlockDataSchema.parse(parseJson<QuizBlockData>(content));
  },
};
