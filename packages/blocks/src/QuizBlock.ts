import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson, stableRenderId } from "./types";
import { renderInlineMarkdown } from "./BlockquoteBlock";

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
  align?: "left" | "center" | "right" | "justify";
  successMessage?: string;
  failureMessage?: string;
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
    align: z.enum(["left", "center", "right", "justify"]).optional(),
    successMessage: z.string().optional(),
    failureMessage: z.string().optional(),
  })
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
    let parsed: QuizBlockData;
    try {
      parsed = quizBlockDataSchema.parse(data);
    } catch {
      return `<section class="pulse-quiz" data-block-type="quiz">
  <h3 class="pulse-quiz-question">Quiz</h3>
  <p style="color:var(--neutral-500);">This quiz block could not be displayed.</p>
</section>`;
    }

    const optionType = parsed.allowMultiple ? "checkbox" : "radio";
    const nameAttr = stableRenderId("quiz", JSON.stringify(parsed));

    let options = parsed.options;
    if (parsed.randomizeOptions) {
      options = [...options].sort(() => Math.random() - 0.5);
    }

    const alignAttr = parsed.align ? ` style="text-align:${escapeHtml(parsed.align)};"` : "";
    const submitBtn = parsed.allowMultiple
      ? `<button type="button" class="pulse-quiz-submit">Check answer</button>`
      : "";

    const optionsMarkup = options
      .map((option) => {
        const explanation = parsed.showExplanations && option.explanation
          ? `<div class="pulse-quiz-explanation" hidden>${renderInlineMarkdown(option.explanation)}</div>`
          : "";
        return `<li class="pulse-quiz-option" data-correct="${String(option.isCorrect)}">
  <label class="pulse-quiz-label">
    <input type="${optionType}" name="${nameAttr}" value="${escapeHtml(option.id)}" style="position:absolute;width:0;height:0;opacity:0;pointer-events:none;" />
    <span class="pulse-quiz-text">${escapeHtml(option.text)}</span>
    <span class="pulse-quiz-status" aria-hidden="true"></span>
  </label>
  ${explanation}
</li>`;
      })
      .join("");

    const successMsg = escapeHtml(parsed.successMessage || "Correct!");
    const failureMsg = escapeHtml(parsed.failureMessage || "Some answers are incorrect. Try again.");

    return `<section class="pulse-quiz" data-block-type="quiz" data-multiple="${String(parsed.allowMultiple)}" data-success="${successMsg}" data-failure="${failureMsg}">
  <div class="pulse-quiz-header">
    <h3 class="pulse-quiz-question"${alignAttr}>${renderInlineMarkdown(parsed.question)}</h3>
  </div>
  <ol class="pulse-quiz-options">${optionsMarkup}</ol>
  <div class="pulse-quiz-footer">${submitBtn}</div>
  <div class="pulse-quiz-result" hidden>
    <span class="pulse-quiz-result-icon" aria-hidden="true"></span>
    <span class="pulse-quiz-result-text"></span>
  </div>
  <button type="button" class="pulse-quiz-retract" hidden>Reset answer</button>
</section>`;
  },
  serialize(data) {
    const parsed = quizBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return quizBlockDataSchema.parse(parseJson<QuizBlockData>(content));
  },
};
