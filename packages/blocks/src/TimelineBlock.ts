import { z } from "zod";

import type { BlockTypeDefinition } from "./types";
import { escapeHtml, parseJson } from "./types";

export interface TimelineEntry {
  id: string;
  title: string;
  date: string;
  description?: string;
}

export interface TimelineBlockData extends Record<string, unknown> {
  title?: string;
  entries: TimelineEntry[];
}

const timelineEntrySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    date: z.string().datetime(),
    description: z.string().optional(),
  })
  .strict();

export const timelineBlockDataSchema = z
  .object({
    title: z.string().optional(),
    entries: z.array(timelineEntrySchema).max(100),
  })
  .strict();

function createTimelineEntryId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `timeline-entry-${crypto.randomUUID()}`;
  }

  return `timeline-entry-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function addTimelineEntry(
  data: TimelineBlockData,
  entry: Omit<TimelineEntry, "id"> & { id?: string },
): TimelineBlockData {
  const parsed = timelineBlockDataSchema.parse(data);

  return timelineBlockDataSchema.parse({
    ...parsed,
    entries: [
      ...parsed.entries,
      {
        ...entry,
        id: entry.id ?? createTimelineEntryId(),
      },
    ],
  });
}

export const TimelineBlock: BlockTypeDefinition<TimelineBlockData> = {
  type: "timeline",
  name: "Timeline",
  icon: "TIMELINE",
  schema: timelineBlockDataSchema,
  defaultData: {
    title: "Milestones",
    entries: [
      {
        id: "timeline-entry-1",
        title: "Kickoff",
        date: "2026-01-01T00:00:00.000Z",
        description: "Project started",
      },
    ],
  },
  config: {
    category: "advanced",
    canHaveChildren: false,
  },
  render(data) {
    const parsed = timelineBlockDataSchema.parse(data);
    const heading = parsed.title ? `<h3>${escapeHtml(parsed.title)}</h3>` : "";
    const entries = parsed.entries
      .map((entry) => {
        const description = entry.description
          ? `<p>${escapeHtml(entry.description)}</p>`
          : "";
        return `<li><time>${escapeHtml(entry.date)}</time><strong>${escapeHtml(
          entry.title,
        )}</strong>${description}</li>`;
      })
      .join("");

    return `<section data-block-type="timeline">${heading}<ol>${entries}</ol></section>`;
  },
  serialize(data) {
    const parsed = timelineBlockDataSchema.parse(data);
    return JSON.stringify(parsed);
  },
  deserialize(content) {
    return timelineBlockDataSchema.parse(parseJson<TimelineBlockData>(content));
  },
};
