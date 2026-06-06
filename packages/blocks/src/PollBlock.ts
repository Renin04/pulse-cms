import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";
import { renderInlineMarkdown } from "./BlockquoteBlock";

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
  explanation?: string;
  align?: "left" | "center" | "right" | "justify";
}

export const pollOptionSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    votes: z.number().int().min(0),
  });

export const pollBlockDataSchema = z
  .object({
    question: z.string(),
    options: z.array(pollOptionSchema).max(12),
    allowMultiple: z.boolean(),
    closesAt: z.string().datetime().optional(),
    explanation: z.string().optional(),
    align: z.enum(["left", "center", "right", "justify"]).optional(),
  });

function stablePollId(question: string, options: PollOption[]): string {
  const raw = question + options.map((o) => o.id + o.label).join('');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'poll-' + Math.abs(hash).toString(36);
}

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
    let parsed: PollBlockData;
    try {
      parsed = pollBlockDataSchema.parse(data);
    } catch {
      return `<section class="pulse-poll" data-block-type="poll"><h3 class="pulse-poll-question">Poll</h3><p style="color:var(--neutral-500);">This poll could not be displayed.</p></section>`;
    }
    const totalVotes = parsed.options.reduce((total, option) => total + option.votes, 0);
    const pollId = stablePollId(parsed.question, parsed.options);
    const alignAttr = parsed.align ? ` style="text-align:${escapeHtml(parsed.align)};"` : "";
    const explanationMarkup = parsed.explanation
      ? `<p class="pulse-poll-explanation">${renderInlineMarkdown(parsed.explanation)}</p>`
      : "";

    const items = parsed.options
      .map((option) => {
        const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
        return `<li class="pulse-poll-option" data-votes="${option.votes}" data-original-votes="${option.votes}" data-option-id="${escapeHtml(option.id)}">
  <button type="button" class="pulse-poll-btn">
    <span class="pulse-poll-label">${escapeHtml(option.label)}</span>
    <span class="pulse-poll-bar-wrap">
      <span class="pulse-poll-bar" style="width:${percentage}%;"></span>
    </span>
    <span class="pulse-poll-pct">${percentage}%</span>
  </button>
</li>`;
      })
      .join("");

    const closeInfo = parsed.closesAt
      ? `<div class="pulse-poll-closes">Closes at ${escapeHtml(parsed.closesAt)}</div>`
      : "";

    return `<section class="pulse-poll" data-block-type="poll" data-poll-id="${pollId}" data-allow-multiple="${String(parsed.allowMultiple)}" data-total-votes="${totalVotes}"${alignAttr}>
  <h3 class="pulse-poll-question"${alignAttr}>${renderInlineMarkdown(parsed.question)}</h3>
  ${explanationMarkup}
  <ul class="pulse-poll-options">${items}</ul>
  <button type="button" class="pulse-poll-retract" hidden>Reset my vote</button>
  ${closeInfo}
</section>`;
  },
  serialize(data) {
    const parsed = pollBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return pollBlockDataSchema.parse(parseJson<PollBlockData>(content));
  },
};
