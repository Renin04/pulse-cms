import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export type SurveyQuestionType = "text" | "single" | "multi" | "rating";

export interface SurveyQuestion {
  id: string;
  prompt: string;
  type: SurveyQuestionType;
  required: boolean;
  options?: string[];
  scaleMax?: number;
}

export interface SurveyBlockData extends Record<string, unknown> {
  title: string;
  description?: string;
  questions: SurveyQuestion[];
}

const surveyQuestionSchema = z
  .object({
    id: z.string(),
    prompt: z.string(),
    type: z.enum(["text", "single", "multi", "rating"]),
    required: z.boolean(),
    options: z.array(z.string()).max(12).optional(),
    scaleMax: z.number().int().min(3).max(10).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if ((value.type === "single" || value.type === "multi") && !value.options) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selection questions require options",
        path: ["options"],
      });
    }

    if (value.type === "rating" && value.scaleMax === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rating questions require scaleMax",
        path: ["scaleMax"],
      });
    }
  });

export const surveyBlockDataSchema = z
  .object({
    title: z.string(),
    description: z.string().optional(),
    questions: z.array(surveyQuestionSchema).max(30),
  })
  .strict();

function createQuestionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `survey-question-${crypto.randomUUID()}`;
  }

  return `survey-question-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function addSurveyQuestion(
  data: SurveyBlockData,
  question: Omit<SurveyQuestion, "id"> & { id?: string },
): SurveyBlockData {
  const parsed = surveyBlockDataSchema.parse(data);

  return surveyBlockDataSchema.parse({
    ...parsed,
    questions: [
      ...parsed.questions,
      {
        ...question,
        id: question.id ?? createQuestionId(),
      },
    ],
  });
}

export function updateSurveyQuestion(
  data: SurveyBlockData,
  questionId: string,
  patch: Partial<SurveyQuestion>,
): SurveyBlockData {
  const parsed = surveyBlockDataSchema.parse(data);
  const questionExists = parsed.questions.some((question) => question.id === questionId);
  if (!questionExists) {
    throw new Error(`Survey question "${questionId}" was not found`);
  }

  return surveyBlockDataSchema.parse({
    ...parsed,
    questions: parsed.questions.map((question) =>
      question.id === questionId
        ? {
            ...question,
            ...patch,
          }
        : question,
    ),
  });
}

export const SurveyBlock: BlockTypeDefinition<SurveyBlockData> = {
  type: "survey",
  name: "Survey",
  icon: "SURVEY",
  schema: surveyBlockDataSchema,
  defaultData: {
    title: "Reader feedback",
    description: "Help us prioritize the next editor sprint.",
    questions: [
      {
        id: "survey-question-1",
        prompt: "How easy is the current block editor?",
        type: "rating",
        required: true,
        scaleMax: 5,
      },
    ],
  },
  config: {
    category: "interactive",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = surveyBlockDataSchema.parse(data);
    const questions = parsed.questions
      .map((question) => {
        if (question.type === "rating") {
          return `<li data-question-type="rating">${escapeHtml(question.prompt)} (1-${question.scaleMax})</li>`;
        }

        if (question.type === "single" || question.type === "multi") {
          return `<li data-question-type="${question.type}">${escapeHtml(question.prompt)}: ${escapeHtml(
            (question.options ?? []).join(", "),
          )}</li>`;
        }

        return `<li data-question-type="text">${escapeHtml(question.prompt)}</li>`;
      })
      .join("");
    const description = parsed.description ? `<p>${escapeHtml(parsed.description)}</p>` : "";

    return `<section data-block-type="survey"><h3>${escapeHtml(
      parsed.title,
    )}</h3>${description}<ol>${questions}</ol></section>`;
  },
  serialize(data) {
    const parsed = surveyBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return surveyBlockDataSchema.parse(parseJson<SurveyBlockData>(content));
  },
};
