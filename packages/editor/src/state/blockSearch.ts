import type { Block, BlockData } from "../../../core/src/types/block";
import type { EditorStateSnapshot } from "../types";

export interface BlockSearchOptions {
  limit?: number;
  types?: string[];
}

export interface BlockSearchResult<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  block: TBlock;
  blockIndex: number;
  matchedIn: "type" | "content";
  score: number;
  snippet: string;
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function extractPrimitiveValues(value: unknown): string[] {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractPrimitiveValues(item));
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap((item) => extractPrimitiveValues(item));
  }

  return [];
}

function buildSnippet(content: string, query: string): string {
  if (!query) {
    return content.slice(0, 80);
  }

  const index = content.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) {
    return content.slice(0, 80);
  }

  const start = Math.max(0, index - 20);
  const end = Math.min(content.length, index + query.length + 20);
  return content.slice(start, end).trim();
}

export function searchBlocks<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  snapshot: EditorStateSnapshot<TBlock>,
  query: string,
  options: BlockSearchOptions = {},
): BlockSearchResult<TBlock>[] {
  const normalizedQuery = normalizeValue(query);
  const normalizedTypeFilter = new Set((options.types ?? []).map((type) => normalizeValue(type)));

  const results: BlockSearchResult<TBlock>[] = [];

  snapshot.document.blocks.forEach((block, blockIndex) => {
    if (normalizedTypeFilter.size > 0 && !normalizedTypeFilter.has(normalizeValue(block.type))) {
      return;
    }

    const typeText = normalizeValue(block.type);
    const contentText = extractPrimitiveValues(block.data).join(" ");
    const normalizedContent = normalizeValue(contentText);

    if (!normalizedQuery) {
      results.push({
        block,
        blockIndex,
        matchedIn: "content",
        score: 10,
        snippet: buildSnippet(contentText, ""),
      });
      return;
    }

    if (typeText.includes(normalizedQuery)) {
      results.push({
        block,
        blockIndex,
        matchedIn: "type",
        score: 140 - (typeText.indexOf(normalizedQuery) * 2),
        snippet: block.type,
      });
      return;
    }

    if (normalizedContent.includes(normalizedQuery)) {
      results.push({
        block,
        blockIndex,
        matchedIn: "content",
        score: 100 - normalizedContent.indexOf(normalizedQuery),
        snippet: buildSnippet(contentText, normalizedQuery),
      });
    }
  });

  results.sort((left, right) => {
    if (left.score !== right.score) {
      return right.score - left.score;
    }

    return left.blockIndex - right.blockIndex;
  });

  const limit = options.limit ?? 20;
  return results.slice(0, Math.max(0, limit));
}
