import { validateBlock } from "../schemas/blockSchema";
import type { Block, BlockData } from "../types/block";

export const BLOCK_TRANSFER_VERSION = 1;

export interface BlockTransferPayload<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  version: typeof BLOCK_TRANSFER_VERSION;
  exportedAt: string;
  sourceDocumentId?: string;
  blocks: TBlock[];
}

export interface CreateBlockTransferPayloadOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  blocks: TBlock[];
  sourceDocumentId?: string;
  exportedAt?: string;
}

function cloneValue<TValue>(value: TValue): TValue {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as TValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assertIsoTimestamp(
  value: unknown,
  fieldName: string,
): asserts value is string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new Error(`Invalid block transfer payload: "${fieldName}" must be an ISO timestamp`);
  }
}

export function createBlockTransferPayload<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  options: CreateBlockTransferPayloadOptions<TBlock>,
): BlockTransferPayload<TBlock> {
  const blocks = options.blocks.map((block) =>
    validateBlock(cloneValue(block as Block<BlockData>)),
  ) as TBlock[];

  const payload: BlockTransferPayload<TBlock> = {
    version: BLOCK_TRANSFER_VERSION,
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    blocks,
  };

  if (options.sourceDocumentId) {
    payload.sourceDocumentId = options.sourceDocumentId;
  }

  return payload;
}

export function serializeBlockTransferPayload<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(payload: BlockTransferPayload<TBlock>): string {
  return JSON.stringify(payload);
}

export function deserializeBlockTransferPayload<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(serialized: string): BlockTransferPayload<TBlock> {
  const parsed = JSON.parse(serialized) as unknown;
  if (!isRecord(parsed)) {
    throw new Error("Invalid block transfer payload");
  }

  if (parsed.version !== BLOCK_TRANSFER_VERSION) {
    throw new Error(
      `Unsupported block transfer payload version: ${String(parsed.version)}`,
    );
  }

  assertIsoTimestamp(parsed.exportedAt, "exportedAt");

  if (!Array.isArray(parsed.blocks)) {
    throw new Error('Invalid block transfer payload: "blocks" must be an array');
  }

  if (
    "sourceDocumentId" in parsed &&
    parsed.sourceDocumentId !== undefined &&
    typeof parsed.sourceDocumentId !== "string"
  ) {
    throw new Error(
      'Invalid block transfer payload: "sourceDocumentId" must be a string',
    );
  }

  const blocks = parsed.blocks.map((value) =>
    validateBlock(cloneValue(value as Block<BlockData>)),
  ) as TBlock[];

  return {
    version: BLOCK_TRANSFER_VERSION,
    exportedAt: parsed.exportedAt,
    sourceDocumentId:
      typeof parsed.sourceDocumentId === "string"
        ? parsed.sourceDocumentId
        : undefined,
    blocks,
  };
}
