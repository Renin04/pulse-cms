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
    const formId = `survey-${Math.random().toString(36).slice(2, 8)}`;
    const questions = parsed.questions
      .map((question) => {
        const qName = `q_${question.id}`;
        if (question.type === "rating") {
          const inputs = Array.from({ length: question.scaleMax ?? 5 }, (_, i) => {
            const val = i + 1;
            return `<label style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:6px;border:1px solid var(--neutral-200);margin-right:6px;"><input type="radio" name="${qName}" value="${val}" ${question.required ? 'required' : ''} style="cursor:pointer;" /> ${val}</label>`;
          }).join("");
          return `<div style="margin-bottom:16px;"><p style="font-weight:600;margin-bottom:8px;">${escapeHtml(question.prompt)} ${question.required ? '<span style="color:#dc2626;">*</span>' : ''}</p><div style="display:flex;flex-wrap:wrap;gap:4px;">${inputs}</div></div>`;
        }

        if (question.type === "single") {
          const inputs = (question.options ?? []).map((opt) => {
            return `<label style="cursor:pointer;display:block;padding:6px 10px;border-radius:6px;border:1px solid var(--neutral-200);margin-bottom:6px;"><input type="radio" name="${qName}" value="${escapeHtml(opt)}" ${question.required ? 'required' : ''} style="cursor:pointer;margin-right:8px;" /> ${escapeHtml(opt)}</label>`;
          }).join("");
          return `<div style="margin-bottom:16px;"><p style="font-weight:600;margin-bottom:8px;">${escapeHtml(question.prompt)} ${question.required ? '<span style="color:#dc2626;">*</span>' : ''}</p>${inputs}</div>`;
        }

        if (question.type === "multi") {
          const inputs = (question.options ?? []).map((opt) => {
            return `<label style="cursor:pointer;display:block;padding:6px 10px;border-radius:6px;border:1px solid var(--neutral-200);margin-bottom:6px;"><input type="checkbox" name="${qName}" value="${escapeHtml(opt)}" style="cursor:pointer;margin-right:8px;" /> ${escapeHtml(opt)}</label>`;
          }).join("");
          return `<div style="margin-bottom:16px;"><p style="font-weight:600;margin-bottom:8px;">${escapeHtml(question.prompt)} ${question.required ? '<span style="color:#dc2626;">*</span>' : ''}</p>${inputs}</div>`;
        }

        return `<div style="margin-bottom:16px;"><label style="font-weight:600;display:block;margin-bottom:8px;">${escapeHtml(question.prompt)} ${question.required ? '<span style="color:#dc2626;">*</span>' : ''}</label><textarea name="${qName}" ${question.required ? 'required' : ''} placeholder="Your answer..." style="width:100%;min-height:80px;padding:10px;border-radius:8px;border:1px solid var(--neutral-200);resize:vertical;"></textarea></div>`;
      })
      .join("");
    const description = parsed.description ? `<p style="margin-bottom:16px;color:var(--neutral-600);">${escapeHtml(parsed.description)}</p>` : "";

    return `<section data-block-type="survey" class="pulse-survey"><h3 style="margin-bottom:12px;">${escapeHtml(parsed.title)}</h3>${description}<form id="${formId}" onsubmit="event.preventDefault();var btn=this.querySelector('button');btn.textContent='✅ Submitted!';btn.disabled=true;btn.style.opacity='0.6';" style="max-width:600px;">${questions}<button type="submit" style="padding:10px 24px;border-radius:10px;background:var(--pulse-black);color:#fff;font-weight:600;border:none;cursor:pointer;">Submit</button></form></section>`;
  },
  serialize(data) {
    const parsed = surveyBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return surveyBlockDataSchema.parse(parseJson<SurveyBlockData>(content));
  },
};
