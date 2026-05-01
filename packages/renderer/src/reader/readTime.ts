import type { Block } from "@pulse/core";
import { computeDocumentProgress } from "../interactions/progressTracking";

export interface ReadTimeConfig {
  wordsPerMinute?: number;
  minimumMinutes?: number;
}

export interface ReadTimeEstimate {
  words: number;
  minutes: number;
  wordsPerMinute: number;
}

export interface ReadingProgressSnapshot {
  scrollY: number;
  viewportHeight: number;
  documentHeight: number;
}

const DEFAULT_WORDS_PER_MINUTE = 220;
const DEFAULT_MINIMUM_MINUTES = 1;

const TEXT_KEYS = [
  "text",
  "content",
  "caption",
  "title",
  "alt",
  "description",
] as const;

function normalizeWordsPerMinute(value: number | undefined): number {
  const numeric = Math.floor(Number.isFinite(value) ? (value as number) : DEFAULT_WORDS_PER_MINUTE);
  if (numeric < 1) return DEFAULT_WORDS_PER_MINUTE;
  return numeric;
}

function normalizeMinimumMinutes(value: number | undefined): number {
  const numeric = Math.floor(
    Number.isFinite(value) ? (value as number) : DEFAULT_MINIMUM_MINUTES,
  );
  if (numeric < 0) return 0;
  return numeric;
}

function extractStrings(value: unknown, sink: string[]): void {
  if (typeof value === "string") {
    if (value.trim()) {
      sink.push(value.trim());
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      extractStrings(item, sink);
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (TEXT_KEYS.includes(key as (typeof TEXT_KEYS)[number])) {
        extractStrings(nested, sink);
      }
    }
  }
}

export function extractReadableStrings(blocks: Block[]): string[] {
  const strings: string[] = [];

  for (const block of blocks) {
    extractStrings(block.data, strings);
  }

  return strings;
}

export function countWords(text: string): number {
  const normalized = text
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u200E\u200F\u202A-\u202E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return 0;
  return normalized.split(" ").filter(Boolean).length;
}

export function estimateReadTimeFromText(
  text: string,
  config: ReadTimeConfig = {},
): ReadTimeEstimate {
  const wordsPerMinute = normalizeWordsPerMinute(config.wordsPerMinute);
  const minimumMinutes = normalizeMinimumMinutes(config.minimumMinutes);
  const words = countWords(text);
  const minutes =
    words === 0
      ? minimumMinutes
      : Math.max(minimumMinutes, Math.ceil(words / wordsPerMinute));

  return {
    words,
    minutes,
    wordsPerMinute,
  };
}

export function estimateReadTimeFromBlocks(
  blocks: Block[],
  config: ReadTimeConfig = {},
): ReadTimeEstimate {
  const text = extractReadableStrings(blocks).join(" ");
  return estimateReadTimeFromText(text, config);
}

export function calculateReadingProgress(
  snapshot: ReadingProgressSnapshot,
): number {
  return computeDocumentProgress({
    scrollY: snapshot.scrollY,
    viewportHeight: snapshot.viewportHeight,
    documentHeight: snapshot.documentHeight,
  });
}

export function estimateRemainingReadMinutes(
  totalMinutes: number,
  progress: number,
): number {
  const normalizedProgress = Math.max(0, Math.min(1, progress));
  const remainingFraction = 1 - normalizedProgress;
  return Math.max(0, Math.ceil(totalMinutes * remainingFraction));
}
