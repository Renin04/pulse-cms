import type { ZodError } from "zod";

import { BlockRegistry } from "../registry/BlockRegistry";
import type { Block, BlockData, BlockDefinition, BlockMeta } from "../types/block";

/**
 * Machine-readable failure codes returned by every fallible ArticleApi
 * operation. AI consumers can branch on `code` while surfacing `message`
 * directly to a human.
 */
export type ArticleApiErrorCode =
  | "unknown-block-type"
  | "block-not-found"
  | "validation-failed"
  | "invalid-index"
  | "invalid-payload";

/**
 * Structured, human-readable error. `issues` contains one plain string per
 * schema violation (e.g. `"items: Single-open accordion can only have one
 * expanded item"`) — raw `ZodError` objects never leak through this API.
 */
export interface ArticleApiError {
  /** Stable machine-readable code for programmatic handling. */
  code: ArticleApiErrorCode;
  /** Human-readable summary safe to show to a user or an AI agent. */
  message: string;
  /** One readable string per schema issue, when validation failed. */
  issues?: string[];
}

/** Success half of {@link ArticleApiResult}. */
export interface ArticleApiSuccess<TValue> {
  ok: true;
  value: TValue;
}

/** Failure half of {@link ArticleApiResult}. */
export interface ArticleApiFailure {
  ok: false;
  error: ArticleApiError;
}

/**
 * Discriminated result union. Every fallible ArticleApi operation returns
 * this instead of throwing, so AI callers always get readable errors.
 */
export type ArticleApiResult<TValue> =
  | ArticleApiSuccess<TValue>
  | ArticleApiFailure;

/**
 * Payload of a successful state-changing operation. `blocks` is the next
 * immutable state of the article; `block`/`index` identify the affected
 * block (absent for `remove`).
 */
export interface ArticleMutation<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  /** The next immutable state of the article after the mutation. */
  blocks: TBlock[];
  /** The block that was inserted, updated, moved, or duplicated. */
  block?: TBlock;
  /** Index of the affected block in the next state. */
  index?: number;
}

/** Result of a state-changing ArticleApi operation. */
export type ArticleMutationResult<
  TBlock extends Block<BlockData> = Block<BlockData>,
> = ArticleApiResult<ArticleMutation<TBlock>>;

/**
 * Per-block-type repair function. Receives unvalidated data (possibly
 * legacy- or AI-shaped) and returns data that satisfies the block's schema.
 * The block packages' `normalize*Data` helpers plug in here.
 */
export type ArticleBlockNormalizer = (data: BlockData) => BlockData;

/** Map of block type → normalizer used to self-heal data before validation. */
export type ArticleBlockNormalizers = Readonly<
  Record<string, ArticleBlockNormalizer>
>;

/** Options accepted by {@link createArticleApi} and {@link ArticleApi.deserialize}. */
export interface ArticleApiOptions {
  /**
   * Registry used to resolve block definitions. Defaults to the shared
   * `BlockRegistry.getInstance()` singleton.
   */
  registry?: BlockRegistry;
  /**
   * Optional per-type normalizers (e.g. the blocks package's
   * `normalizeAccordionData`). Applied before schema validation so legacy
   * or AI-produced payloads self-heal instead of failing.
   */
  normalizers?: ArticleBlockNormalizers;
  /** Custom id generator for new blocks. Defaults to `crypto.randomUUID()`. */
  idGenerator?: () => string;
  /** Custom clock returning ISO timestamps (mainly for tests). */
  now?: () => string;
}

/** Options for {@link ArticleApi.duplicate}. */
export interface ArticleDuplicateOptions {
  /**
   * When `true` (default) the copy keeps the source block's content. When
   * `false` the copy is reset to the block type's `defaultData` — the same
   * "duplicate without content" UX the studio offers.
   */
  withContent?: boolean;
}

/** Options for {@link ArticleApi.insert}. */
export interface ArticleInsertOptions {
  /**
   * Wrapper-level metadata (e.g. a branch `gate`) attached to the new block.
   * Lives next to — never inside — `data`, so block data schemas stay
   * untouched; preserved by update/duplicate/serialize/deserialize.
   */
  meta?: BlockMeta;
}

/** Internal outcome of the normalize + validate pipeline. */
type DataPreparation = { ok: true; data: BlockData } | ArticleApiFailure;

function failure(
  code: ArticleApiErrorCode,
  message: string,
  issues?: string[],
): ArticleApiFailure {
  return {
    ok: false,
    error: issues ? { code, message, issues } : { code, message },
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cloneValue<TValue>(value: TValue): TValue {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as TValue;
}

/**
 * Recursively merges `patch` over `base`. Plain objects merge key by key;
 * arrays and primitives from the patch replace the base value. Neither
 * argument is mutated.
 */
function deepMergeData(base: unknown, patch: unknown): unknown {
  if (isPlainObject(base) && isPlainObject(patch)) {
    const merged: Record<string, unknown> = { ...base };
    for (const [key, patchValue] of Object.entries(patch)) {
      if (patchValue === undefined) {
        continue;
      }
      merged[key] =
        key in merged ? deepMergeData(merged[key], patchValue) : cloneValue(patchValue);
    }
    return merged;
  }
  return cloneValue(patch);
}

function resolveDefaultData(definition: BlockDefinition<BlockData>): BlockData {
  const defaults =
    typeof definition.defaultData === "function"
      ? definition.defaultData()
      : definition.defaultData;
  return cloneValue(defaults);
}

function defaultIdGenerator(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `block_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

function defaultClock(): string {
  return new Date().toISOString();
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

/** Flattens a ZodError into readable `"path.to.field: message"` strings. */
function formatZodIssues(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

/**
 * Runs the shared normalize → validate pipeline. The normalizer (when
 * registered for the block type) gets the first chance to repair the data;
 * the block's Zod schema has the final word. Never throws.
 */
function prepareBlockData(
  definition: BlockDefinition<BlockData>,
  candidate: unknown,
  normalizer: ArticleBlockNormalizer | undefined,
  context: string,
): DataPreparation {
  let normalized: unknown = candidate;
  if (normalizer) {
    try {
      normalized = normalizer(candidate as BlockData);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return failure(
        "validation-failed",
        `${context}: the normalizer for block type "${definition.type}" failed (${detail}).`,
      );
    }
  }

  const parsed = definition.schema.safeParse(normalized);
  if (!parsed.success) {
    const issues = formatZodIssues(parsed.error);
    return failure(
      "validation-failed",
      `${context}: block type "${definition.type}" data is invalid — ${issues.join("; ")}.`,
      issues,
    );
  }

  return { ok: true, data: parsed.data };
}

/** Accepts a bare block array, an envelope with a `blocks` array, or one block. */
function extractRawBlocks(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (isPlainObject(payload)) {
    if (Array.isArray(payload.blocks)) {
      return payload.blocks;
    }
    if (typeof payload.type === "string") {
      return [payload];
    }
  }
  return null;
}

/**
 * Healing pipeline for {@link ArticleApi.deserialize}. Legacy payloads need
 * the normalizer to see their original shape unobstructed (e.g. chart
 * `labels`/`datasets` would be shadowed by default `categories`/`series`),
 * so the raw data is normalized first; if that does not validate, the
 * block's `defaultData` is merged underneath and the pipeline retries.
 * Without a normalizer the defaults merge runs directly. The most complete
 * attempt's error is returned when everything fails.
 */
function prepareDeserializedData(
  definition: BlockDefinition<BlockData>,
  rawData: BlockData,
  normalizer: ArticleBlockNormalizer | undefined,
  context: string,
): DataPreparation {
  if (!normalizer) {
    return prepareBlockData(
      definition,
      deepMergeData(resolveDefaultData(definition), rawData),
      undefined,
      context,
    );
  }

  const direct = prepareBlockData(definition, rawData, normalizer, context);
  if (direct.ok) {
    return direct;
  }

  return prepareBlockData(
    definition,
    deepMergeData(resolveDefaultData(definition), rawData),
    normalizer,
    context,
  );
}

interface ResolvedArticleApiOptions {
  registry: BlockRegistry;
  normalizers: ArticleBlockNormalizers;
  idGenerator: () => string;
  now: () => string;
}

function resolveOptions(options: ArticleApiOptions): ResolvedArticleApiOptions {
  return {
    registry: options.registry ?? BlockRegistry.getInstance(),
    normalizers: options.normalizers ?? {},
    idGenerator: options.idGenerator ?? defaultIdGenerator,
    now: options.now ?? defaultClock,
  };
}

/**
 * Typed, framework-agnostic read/write API for an article's block list,
 * designed for AI agents (Phase 4) and other programmatic consumers.
 *
 * Every operation validates against the block registry's Zod schemas,
 * applies the block type's default data (and optional per-type normalizer),
 * and returns a structured {@link ArticleApiResult} instead of throwing —
 * raw `ZodError`s never leak. State updates are immutable: operations never
 * mutate previously returned arrays or blocks, they replace the internal
 * snapshot with a new one. Treat all returned blocks as read-only.
 *
 * Use {@link ArticleApi.deserialize} for untrusted/legacy JSON payloads: it
 * self-heals missing ids, timestamps, and fields, and repairs block data
 * through the configured normalizers.
 *
 * @example
 * ```ts
 * import { ArticleApi, createArticleApi } from "@pulse/core";
 * import { registerBuiltinBlocks, normalizeAccordionData } from "@pulse/blocks";
 *
 * registerBuiltinBlocks();
 *
 * const normalizers = {
 *   accordion: (data) =>
 *     normalizeAccordionData(data as Parameters<typeof normalizeAccordionData>[0]),
 * };
 *
 * const api = createArticleApi([], { normalizers });
 *
 * const inserted = api.insert("text", { text: "Hello Pulse" }, 0);
 * if (!inserted.ok) {
 *   console.error(inserted.error.message); // readable, never a ZodError
 * } else {
 *   const saved = api.serialize();
 *   if (saved.ok) {
 *     const restored = ArticleApi.deserialize(saved.value, { normalizers });
 *   }
 * }
 * ```
 */
export class ArticleApi<TBlock extends Block<BlockData> = Block<BlockData>> {
  private blocks: TBlock[];
  private readonly registry: BlockRegistry;
  private readonly normalizers: ArticleBlockNormalizers;
  private readonly idGenerator: () => string;
  private readonly now: () => string;

  /**
   * Creates an API over a deep-cloned copy of `blocks`. The input array and
   * its blocks are never mutated, and the constructor does not validate —
   * use {@link ArticleApi.deserialize} for untrusted payloads.
   *
   * The parameter is deliberately not generic-dependent so that
   * `new ArticleApi([])` yields `ArticleApi<Block<BlockData>>` instead of
   * inferring `never`; pass the type argument explicitly
   * (`new ArticleApi<MyBlock>(blocks)`) to narrow the block type.
   */
  constructor(
    blocks: readonly Block<BlockData>[] = [],
    options: ArticleApiOptions = {},
  ) {
    const resolved = resolveOptions(options);
    this.registry = resolved.registry;
    this.normalizers = resolved.normalizers;
    this.idGenerator = resolved.idGenerator;
    this.now = resolved.now;
    // Boundary cast: the generic only narrows block `data`; see class docs.
    this.blocks = cloneValue([...blocks]) as TBlock[];
  }

  /**
   * Returns a copy of the current block list, optionally filtered to a
   * single block `type`.
   */
  list(type?: string): TBlock[] {
    if (type === undefined) {
      return [...this.blocks];
    }
    return this.blocks.filter((block) => block.type === type);
  }

  /** Returns the block with the given `id`, or `undefined` when absent. */
  get(id: string): TBlock | undefined {
    return this.blocks.find((block) => block.id === id);
  }

  /** Returns the first block matching `predicate`, or `undefined`. */
  find(predicate: (block: TBlock, index: number) => boolean): TBlock | undefined {
    return this.blocks.find(predicate);
  }

  /**
   * Creates a block of `type` from the block registry: the type's
   * `defaultData` is deep-merged under `data`, the configured normalizer
   * repairs the result, and the block's Zod schema validates it. A fresh id
   * and timestamps are generated. Inserts at `index` (0-based, defaults to
   * the end of the article). `options.meta` attaches wrapper-level metadata
   * (e.g. a branch gate) outside the validated data schema.
   */
  insert(
    type: string,
    data: BlockData = {},
    index?: number,
    options: ArticleInsertOptions = {},
  ): ArticleMutationResult<TBlock> {
    const definition = this.registry.getDefinition<BlockData>(type);
    if (!definition) {
      return failure(
        "unknown-block-type",
        `Cannot insert: block type "${type}" is not registered in the block registry.`,
      );
    }

    const position = index ?? this.blocks.length;
    if (!Number.isInteger(position) || position < 0 || position > this.blocks.length) {
      return failure(
        "invalid-index",
        `Cannot insert at index ${String(position)}: valid range is 0 to ${this.blocks.length}.`,
      );
    }

    const candidate = deepMergeData(resolveDefaultData(definition), data);
    const prepared = prepareBlockData(
      definition,
      candidate,
      this.normalizers[definition.type],
      `Insert of block type "${type}"`,
    );
    if (!prepared.ok) {
      return prepared;
    }

    const timestamp = this.now();
    // The registry-validated shape satisfies TBlock's data contract; the
    // generic only narrows `data`, so a single boundary cast is required.
    const block = {
      id: this.idGenerator(),
      type: definition.type,
      data: prepared.data,
      ...(options.meta ? { meta: cloneValue(options.meta) } : {}),
      createdAt: timestamp,
      updatedAt: timestamp,
    } as TBlock;

    const next = [...this.blocks.slice(0, position), block, ...this.blocks.slice(position)];
    this.blocks = next;
    return { ok: true, value: { blocks: next, block, index: position } };
  }

  /**
   * Merges `patch` into the data of the block with `id` and re-validates.
   * `patch` may be a partial data object (deep-merged; arrays replace) or an
   * updater receiving a read-only copy of the current data and returning
   * such a partial. The block's normalizer runs before validation, and
   * `updatedAt` is refreshed. On failure the state is left untouched.
   */
  update(
    id: string,
    patch:
      | Partial<TBlock["data"]>
      | ((data: Readonly<TBlock["data"]>) => Partial<TBlock["data"]>),
  ): ArticleMutationResult<TBlock> {
    const index = this.blocks.findIndex((block) => block.id === id);
    if (index === -1) {
      return failure("block-not-found", `Cannot update: no block with id "${id}" exists.`);
    }

    const current = this.blocks[index];
    const definition = this.registry.getDefinition<BlockData>(current.type);
    if (!definition) {
      return failure(
        "unknown-block-type",
        `Cannot update block "${id}": type "${current.type}" is not registered in the block registry.`,
      );
    }

    const partial =
      typeof patch === "function"
        ? patch(cloneValue(current.data) as Readonly<TBlock["data"]>)
        : patch;
    const candidate = deepMergeData(current.data, partial);
    const prepared = prepareBlockData(
      definition,
      candidate,
      this.normalizers[definition.type],
      `Update of block "${id}" ("${current.type}")`,
    );
    if (!prepared.ok) {
      return prepared;
    }

    const updated: TBlock = {
      ...current,
      data: prepared.data as TBlock["data"],
      updatedAt: this.now(),
    };
    const next = [...this.blocks];
    next[index] = updated;
    this.blocks = next;
    return { ok: true, value: { blocks: next, block: updated, index } };
  }

  /** Removes the block with `id`. Fails with `block-not-found` when absent. */
  remove(id: string): ArticleMutationResult<TBlock> {
    const index = this.blocks.findIndex((block) => block.id === id);
    if (index === -1) {
      return failure("block-not-found", `Cannot remove: no block with id "${id}" exists.`);
    }

    const next = this.blocks.filter((_, blockIndex) => blockIndex !== index);
    this.blocks = next;
    return { ok: true, value: { blocks: next } };
  }

  /**
   * Moves the block with `id` to `toIndex` in the final ordering (0-based).
   * Content and timestamps are untouched. Fails with `invalid-index` when
   * `toIndex` is outside `0..length - 1`.
   */
  move(id: string, toIndex: number): ArticleMutationResult<TBlock> {
    const from = this.blocks.findIndex((block) => block.id === id);
    if (from === -1) {
      return failure("block-not-found", `Cannot move: no block with id "${id}" exists.`);
    }
    if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= this.blocks.length) {
      return failure(
        "invalid-index",
        `Cannot move block "${id}" to index ${String(toIndex)}: valid range is 0 to ${this.blocks.length - 1}.`,
      );
    }

    const next = [...this.blocks];
    const moved = next[from];
    next.splice(from, 1);
    next.splice(toIndex, 0, moved);
    this.blocks = next;
    return { ok: true, value: { blocks: next, block: moved, index: toIndex } };
  }

  /**
   * Duplicates the block with `id`, inserting the copy right after the
   * source with a fresh id and timestamps. With `withContent: false` the
   * copy is reset to the block type's `defaultData` (the studio's
   * "duplicate without content" UX). The copy's data is always re-validated.
   */
  duplicate(
    id: string,
    options: ArticleDuplicateOptions = {},
  ): ArticleMutationResult<TBlock> {
    const withContent = options.withContent ?? true;
    const index = this.blocks.findIndex((block) => block.id === id);
    if (index === -1) {
      return failure("block-not-found", `Cannot duplicate: no block with id "${id}" exists.`);
    }

    const source = this.blocks[index];
    const definition = this.registry.getDefinition<BlockData>(source.type);
    if (!definition) {
      return failure(
        "unknown-block-type",
        `Cannot duplicate block "${id}": type "${source.type}" is not registered in the block registry.`,
      );
    }

    const candidate = withContent ? cloneValue(source.data) : resolveDefaultData(definition);
    const prepared = prepareBlockData(
      definition,
      candidate,
      this.normalizers[definition.type],
      `Duplicate of block "${id}" ("${source.type}")`,
    );
    if (!prepared.ok) {
      return prepared;
    }

    const timestamp = this.now();
    const copy: TBlock = {
      ...source,
      id: this.idGenerator(),
      data: prepared.data as TBlock["data"],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const position = index + 1;
    const next = [...this.blocks.slice(0, position), copy, ...this.blocks.slice(position)];
    this.blocks = next;
    return { ok: true, value: { blocks: next, block: copy, index: position } };
  }

  /**
   * Serializes the article to a JSON string of the block array (the same
   * shape the studio persists). Each block's data is normalized and
   * re-validated first, and the healed data is what gets written — the
   * internal state is not modified. Fails with `validation-failed` if a
   * block cannot be healed.
   */
  serialize(): ArticleApiResult<string> {
    const output: TBlock[] = [];
    for (const block of this.blocks) {
      const definition = this.registry.getDefinition<BlockData>(block.type);
      if (!definition) {
        return failure(
          "unknown-block-type",
          `Cannot serialize: block "${block.id}" has type "${block.type}", which is not registered in the block registry.`,
        );
      }
      const prepared = prepareBlockData(
        definition,
        cloneValue(block.data),
        this.normalizers[definition.type],
        `Serialize of block "${block.id}" ("${block.type}")`,
      );
      if (!prepared.ok) {
        return prepared;
      }
      output.push({ ...block, data: prepared.data as TBlock["data"] });
    }
    return { ok: true, value: JSON.stringify(output) };
  }

  /**
   * Parses untrusted JSON (string or already-parsed value) into a validated
   * block list. Accepts a bare block array, an object with a `blocks` array
   * (e.g. a persisted studio entry), or a single block object.
   *
   * Self-healing per block, instead of throwing:
   * - missing/invalid `id` → fresh id; duplicate ids are regenerated;
   * - missing/invalid `createdAt`/`updatedAt` → current timestamp;
   * - missing `data` → the block type's `defaultData`;
   * - legacy/AI-shaped `data` → repaired by the configured normalizer,
   *   then validated by the block's Zod schema;
   * - wrapper-level `meta` (e.g. a branch gate) is preserved untouched.
   *
   * Returns a structured error (never throws) when a block has no usable
   * `type`, the type is unregistered, or the data fails validation after
   * normalization.
   */
  static deserialize<TBlock extends Block<BlockData> = Block<BlockData>>(
    json: unknown,
    options: ArticleApiOptions = {},
  ): ArticleApiResult<TBlock[]> {
    const resolved = resolveOptions(options);

    let payload: unknown = json;
    if (typeof json === "string") {
      try {
        payload = JSON.parse(json) as unknown;
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        return failure(
          "invalid-payload",
          `Cannot deserialize article: the payload is not valid JSON (${detail}).`,
        );
      }
    }

    const rawBlocks = extractRawBlocks(payload);
    if (!rawBlocks) {
      return failure(
        "invalid-payload",
        'Cannot deserialize article: expected a JSON array of blocks or an object with a "blocks" array.',
      );
    }

    const seenIds = new Set<string>();
    const blocks: TBlock[] = [];

    for (const [index, raw] of rawBlocks.entries()) {
      if (!isPlainObject(raw)) {
        return failure("invalid-payload", `Cannot deserialize: block at index ${index} is not an object.`);
      }

      const type = raw.type;
      if (typeof type !== "string" || type.length === 0) {
        return failure(
          "invalid-payload",
          `Cannot deserialize: block at index ${index} is missing a valid "type" string.`,
        );
      }

      const definition = resolved.registry.getDefinition<BlockData>(type);
      if (!definition) {
        return failure(
          "unknown-block-type",
          `Cannot deserialize: block at index ${index} has type "${type}", which is not registered in the block registry.`,
        );
      }

      const rawData = isPlainObject(raw.data) ? raw.data : {};
      const prepared = prepareDeserializedData(
        definition,
        rawData,
        resolved.normalizers[definition.type],
        `Deserialize of block at index ${index} ("${type}")`,
      );
      if (!prepared.ok) {
        return prepared;
      }

      let id = typeof raw.id === "string" && raw.id.length > 0 ? raw.id : resolved.idGenerator();
      if (seenIds.has(id)) {
        id = resolved.idGenerator();
      }
      seenIds.add(id);

      const createdAt = isIsoTimestamp(raw.createdAt) ? raw.createdAt : resolved.now();
      const updatedAt = isIsoTimestamp(raw.updatedAt) ? raw.updatedAt : createdAt;

      const block: Block<BlockData> = {
        id,
        type,
        data: prepared.data,
        createdAt,
        updatedAt,
        ...(typeof raw.parentId === "string" || raw.parentId === null
          ? { parentId: raw.parentId }
          : {}),
        ...(isPlainObject(raw.meta) ? { meta: cloneValue(raw.meta) } : {}),
      };
      // Registry-validated shape satisfies TBlock's data contract.
      blocks.push(block as TBlock);
    }

    return { ok: true, value: blocks };
  }
}

/**
 * Creates an {@link ArticleApi} over `blocks`. See the class documentation
 * for a full usage example. Like the constructor, the blocks parameter is
 * not generic-dependent: `createArticleApi([])` yields
 * `ArticleApi<Block<BlockData>>`; pass the type argument explicitly to
 * narrow the block type.
 */
export function createArticleApi<TBlock extends Block<BlockData> = Block<BlockData>>(
  blocks: readonly Block<BlockData>[] = [],
  options: ArticleApiOptions = {},
): ArticleApi<TBlock> {
  return new ArticleApi<TBlock>(blocks, options);
}
