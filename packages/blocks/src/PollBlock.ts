import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface PollBlockData extends Record<string, unknown> {
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  closesAt?: string;
}

export const pollOptionSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    votes: z.number().int().min(0),
  })
  .strict();

export const pollBlockDataSchema = z
  .object({
    question: z.string(),
    options: z.array(pollOptionSchema).max(12),
    allowMultiple: z.boolean(),
    closesAt: z.string().datetime().optional(),
  })
  .strict();

function createOptionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `poll-option-${crypto.randomUUID()}`;
  }

  return `poll-option-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function addPollOption(
  data: PollBlockData,
  label: string = "New option",
): PollBlockData {
  const parsed = pollBlockDataSchema.parse(data);

  return pollBlockDataSchema.parse({
    ...parsed,
    options: [
      ...parsed.options,
      {
        id: createOptionId(),
        label,
        votes: 0,
      },
    ],
  });
}

export function votePollOption(
  data: PollBlockData,
  optionId: string,
  increment: number = 1,
): PollBlockData {
  const parsed = pollBlockDataSchema.parse(data);
  const optionExists = parsed.options.some((option) => option.id === optionId);
  if (!optionExists) {
    throw new Error(`Poll option "${optionId}" was not found`);
  }

  const options = parsed.options.map((option) => {
    if (option.id !== optionId) {
      return option;
    }

    return {
      ...option,
      votes: Math.max(0, option.votes + increment),
    };
  });

  return pollBlockDataSchema.parse({
    ...parsed,
    options,
  });
}

export const PollBlock: BlockTypeDefinition<PollBlockData> = {
  type: "poll",
  name: "Poll",
  icon: "POLL",
  schema: pollBlockDataSchema,
  defaultData: {
    question: "Which editor workflow should be prioritized?",
    options: [
      {
        id: "poll-option-1",
        label: "Command palette",
        votes: 10,
      },
      {
        id: "poll-option-2",
        label: "Drag and drop",
        votes: 6,
      },
    ],
    allowMultiple: false,
  },
  config: {
    category: "interactive",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = pollBlockDataSchema.parse(data);
    const totalVotes = parsed.options.reduce((total, option) => total + option.votes, 0);
    const items = parsed.options
      .map((option) => {
        const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
        return `<li data-votes="${option.votes}"><span>${escapeHtml(
          option.label,
        )}</span><strong>${percentage}%</strong></li>`;
      })
      .join("");

    const closeInfo = parsed.closesAt
      ? `<small>Closes at ${escapeHtml(parsed.closesAt)}</small>`
      : "";

    return `<section data-block-type="poll"><h3>${escapeHtml(
      parsed.question,
    )}</h3><ul>${items}</ul>${closeInfo}</section>`;
  },
  serialize(data) {
    const parsed = pollBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return pollBlockDataSchema.parse(parseJson<PollBlockData>(content));
  },
};
