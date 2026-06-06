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

function stableSurveyId(title: string, questions: SurveyQuestion[]): string {
  const raw = title + questions.map((q) => q.id + q.prompt + q.type).join("");
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return "survey-" + Math.abs(hash).toString(36);
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
      { ...question, id: question.id ?? createQuestionId() },
    ],
  });
}

export function updateSurveyQuestion(
  data: SurveyBlockData,
  questionId: string,
  patch: Partial<SurveyQuestion>,
): SurveyBlockData {
  const parsed = surveyBlockDataSchema.parse(data);
  const exists = parsed.questions.some((q) => q.id === questionId);
  if (!exists) throw new Error(`Survey question "${questionId}" not found`);
  return surveyBlockDataSchema.parse({
    ...parsed,
    questions: parsed.questions.map((q) =>
      q.id === questionId ? { ...q, ...patch } : q,
    ),
  });
}

function renderRatingQuestion(q: SurveyQuestion, qName: string, idx: number): string {
  const max = q.scaleMax ?? 5;
  const inputs = Array.from({ length: max }, (_, i) => {
    const val = String(i + 1);
    return `
      <label class="pulse-survey-rating-btn" data-value="${val}">
        <input type="radio" name="${qName}" value="${val}" ${q.required ? "required" : ""} />
        <span class="pulse-survey-rating-num">${val}</span>
      </label>`;
  }).join("");

  return `
    <div class="pulse-survey-question" data-question-type="rating" data-question-id="${escapeHtml(q.id)}">
      <div class="pulse-survey-qheader">
        <span class="pulse-survey-qnum">${idx + 1}</span>
        <p class="pulse-survey-qprompt">${escapeHtml(q.prompt)}${q.required ? '<span class="pulse-survey-required">*</span>' : ""}</p>
      </div>
      <div class="pulse-survey-rating-row" role="radiogroup">${inputs}</div>
    </div>`;
}

function renderSingleQuestion(q: SurveyQuestion, qName: string, idx: number): string {
  const inputs = (q.options ?? []).map((opt) => `
    <label class="pulse-survey-option">
      <input type="radio" name="${qName}" value="${escapeHtml(opt)}" ${q.required ? "required" : ""} />
      <span class="pulse-survey-option-indicator"></span>
      <span class="pulse-survey-option-text">${escapeHtml(opt)}</span>
    </label>`).join("");

  return `
    <div class="pulse-survey-question" data-question-type="single" data-question-id="${escapeHtml(q.id)}">
      <div class="pulse-survey-qheader">
        <span class="pulse-survey-qnum">${idx + 1}</span>
        <p class="pulse-survey-qprompt">${escapeHtml(q.prompt)}${q.required ? '<span class="pulse-survey-required">*</span>' : ""}</p>
      </div>
      <div class="pulse-survey-options" role="radiogroup">${inputs}</div>
    </div>`;
}

function renderMultiQuestion(q: SurveyQuestion, qName: string, idx: number): string {
  const inputs = (q.options ?? []).map((opt) => `
    <label class="pulse-survey-option">
      <input type="checkbox" name="${qName}" value="${escapeHtml(opt)}" />
      <span class="pulse-survey-option-indicator pulse-survey-check"></span>
      <span class="pulse-survey-option-text">${escapeHtml(opt)}</span>
    </label>`).join("");

  return `
    <div class="pulse-survey-question" data-question-type="multi" data-question-id="${escapeHtml(q.id)}">
      <div class="pulse-survey-qheader">
        <span class="pulse-survey-qnum">${idx + 1}</span>
        <p class="pulse-survey-qprompt">${escapeHtml(q.prompt)}${q.required ? '<span class="pulse-survey-required">*</span>' : ""}</p>
      </div>
      <div class="pulse-survey-options" role="group">${inputs}</div>
    </div>`;
}

function renderTextQuestion(q: SurveyQuestion, qName: string, idx: number): string {
  return `
    <div class="pulse-survey-question" data-question-type="text" data-question-id="${escapeHtml(q.id)}">
      <div class="pulse-survey-qheader">
        <span class="pulse-survey-qnum">${idx + 1}</span>
        <p class="pulse-survey-qprompt">${escapeHtml(q.prompt)}${q.required ? '<span class="pulse-survey-required">*</span>' : ""}</p>
      </div>
      <textarea name="${qName}" ${q.required ? "required" : ""} placeholder="Write your answer..." class="pulse-survey-textarea"></textarea>
    </div>`;
}

export const SurveyBlock: BlockTypeDefinition<SurveyBlockData> = {
  type: "survey",
  name: "Survey",
  icon: "SURVEY",
  schema: surveyBlockDataSchema,
  defaultData: {
    title: "Reader feedback",
    description: "Help us improve your reading experience.",
    questions: [
      {
        id: "survey-question-1",
        prompt: "How would you rate this article?",
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
    const surveyId = stableSurveyId(parsed.title, parsed.questions);

    const questionsHtml = parsed.questions.map((q, i) => {
      const qName = `q_${q.id}`;
      if (q.type === "rating") return renderRatingQuestion(q, qName, i);
      if (q.type === "single") return renderSingleQuestion(q, qName, i);
      if (q.type === "multi") return renderMultiQuestion(q, qName, i);
      return renderTextQuestion(q, qName, i);
    }).join("");

    const description = parsed.description
      ? `<p class="pulse-survey-desc">${escapeHtml(parsed.description)}</p>`
      : "";

    return `
<section data-block-type="survey" class="pulse-survey" data-survey-id="${surveyId}">
  <div class="pulse-survey-accent"></div>
  <h3 class="pulse-survey-title">${escapeHtml(parsed.title)}</h3>
  ${description}
  <form class="pulse-survey-form" novalidate>
    <div class="pulse-survey-questions">
      ${questionsHtml}
    </div>
    <div class="pulse-survey-actions">
      <button type="submit" class="pulse-survey-submit">
        <span class="pulse-survey-submit-text">Submit</span>
        <span class="pulse-survey-submit-spinner" hidden></span>
      </button>
    </div>
    <div class="pulse-survey-error" hidden>
      <p class="pulse-survey-error-text">Something went wrong. Please try again.</p>
    </div>
    <div class="pulse-survey-success" hidden>
      <div class="pulse-survey-success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <p class="pulse-survey-success-title">Thank you!</p>
      <p class="pulse-survey-success-body">Your response has been recorded.</p>
    </div>
  </form>
</section>`;
  },
  serialize(data) {
    return JSON.stringify(surveyBlockDataSchema.parse(data));
  },
  deserialize(content) {
    return surveyBlockDataSchema.parse(parseJson<SurveyBlockData>(content));
  },
};
