import type { Block, BlockData } from "../../../core/src/types/block";
import {
  createBlockTransferPayload,
  deserializeBlockTransferPayload,
  serializeBlockTransferPayload,
} from "../../../core/src/state/blockTransfer";
import type { ImportBlocksMode } from "../../../core/src/state/DocumentState";
import type { EditorStateAdapter } from "../state/EditorStateAdapter";

function createGeneratedId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function uniqueInOrder(values: string[]): string[] {
  return Array.from(new Set(values));
}

function resolveSelectedBlockIds<TBlock extends Block<BlockData>>(
  snapshot: ReturnType<EditorStateAdapter<TBlock>["getSnapshot"]>,
): string[] {
  const documentIds = snapshot.document.blocks.map((block) => block.id);
  const knownBlockIdSet = new Set(documentIds);

  if (snapshot.selection.multiBlockIds.length > 0) {
    return uniqueInOrder(
      snapshot.selection.multiBlockIds.filter((blockId) => knownBlockIdSet.has(blockId)),
    );
  }

  if (snapshot.selection.range) {
    const startIndex = documentIds.indexOf(snapshot.selection.range.start.blockId);
    const endIndex = documentIds.indexOf(snapshot.selection.range.end.blockId);

    if (startIndex >= 0 && endIndex >= 0) {
      const from = Math.min(startIndex, endIndex);
      const to = Math.max(startIndex, endIndex);
      return documentIds.slice(from, to + 1);
    }
  }

  if (snapshot.focusedBlockId && knownBlockIdSet.has(snapshot.focusedBlockId)) {
    return [snapshot.focusedBlockId];
  }

  return [];
}

function resolveInsertIndex<TBlock extends Block<BlockData>>(
  snapshot: ReturnType<EditorStateAdapter<TBlock>["getSnapshot"]>,
  index?: number,
): number | undefined {
  if (index !== undefined) {
    return index;
  }

  if (!snapshot.focusedBlockId) {
    return snapshot.document.blocks.length;
  }

  const focusedIndex = snapshot.document.blocks.findIndex(
    (block) => block.id === snapshot.focusedBlockId,
  );

  if (focusedIndex < 0) {
    return snapshot.document.blocks.length;
  }

  return focusedIndex + 1;
}

function remapCopiedBlocks<TBlock extends Block<BlockData>>(
  blocks: TBlock[],
): TBlock[] {
  const idMap = new Map<string, string>();

  for (const block of blocks) {
    idMap.set(block.id, createGeneratedId(block.type));
  }

  const now = new Date().toISOString();

  return blocks.map((block) => {
    const remappedParentId =
      block.parentId && idMap.has(block.parentId)
        ? idMap.get(block.parentId) ?? null
        : null;

    return {
      ...block,
      id: idMap.get(block.id) ?? block.id,
      parentId: remappedParentId,
      createdAt: now,
      updatedAt: now,
    };
  });
}

export interface ClipboardDriver {
  readText(): Promise<string>;
  writeText(value: string): Promise<void>;
}

export interface EditorClipboardControllerOptions<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  state: EditorStateAdapter<TBlock>;
  driver?: ClipboardDriver;
}

export interface EditorClipboardCopyResult {
  copied: boolean;
  blockIds: string[];
  serialized: string | null;
}

export interface EditorClipboardPasteOptions {
  mode?: ImportBlocksMode;
  index?: number;
  serialized?: string;
}

export interface EditorClipboardPasteResult {
  pasted: boolean;
  mode: ImportBlocksMode;
  blockIds: string[];
}

class InMemoryClipboardDriver implements ClipboardDriver {
  private value: string;

  constructor(initialValue: string = "") {
    this.value = initialValue;
  }

  async readText(): Promise<string> {
    return this.value;
  }

  async writeText(value: string): Promise<void> {
    this.value = value;
  }
}

export class EditorClipboardController<
  TBlock extends Block<BlockData> = Block<BlockData>,
> {
  private readonly state: EditorStateAdapter<TBlock>;
  private readonly driver: ClipboardDriver;

  constructor(options: EditorClipboardControllerOptions<TBlock>) {
    this.state = options.state;
    this.driver = options.driver ?? new InMemoryClipboardDriver();
  }

  async copySelectedBlocks(): Promise<EditorClipboardCopyResult> {
    const snapshot = this.state.getSnapshot();
    const blockIds = resolveSelectedBlockIds(snapshot);

    if (blockIds.length === 0) {
      return {
        copied: false,
        blockIds: [],
        serialized: null,
      };
    }

    const serialized = this.state.exportBlocks({
      blockIds,
    });
    await this.driver.writeText(serialized);

    return {
      copied: true,
      blockIds,
      serialized,
    };
  }

  async pasteBlocks(
    options: EditorClipboardPasteOptions = {},
  ): Promise<EditorClipboardPasteResult> {
    const mode = options.mode ?? "insert";
    const serialized = options.serialized ?? (await this.driver.readText());
    const payload = deserializeBlockTransferPayload<TBlock>(serialized);
    const remappedBlocks = remapCopiedBlocks(payload.blocks);
    const nextPayload = createBlockTransferPayload<TBlock>({
      blocks: remappedBlocks,
    });
    const remappedSerialized = serializeBlockTransferPayload(nextPayload);

    if (mode === "insert") {
      const index = resolveInsertIndex(this.state.getSnapshot(), options.index);
      this.state.importBlocks(remappedSerialized, {
        mode,
        index,
      });
    } else {
      this.state.importBlocks(remappedSerialized, {
        mode,
      });
    }

    return {
      pasted: remappedBlocks.length > 0,
      mode,
      blockIds: remappedBlocks.map((block) => block.id),
    };
  }
}

export function createInMemoryClipboardDriver(initialValue: string = ""): ClipboardDriver {
  return new InMemoryClipboardDriver(initialValue);
}

export function createEditorClipboardController<
  TBlock extends Block<BlockData> = Block<BlockData>,
>(
  options: EditorClipboardControllerOptions<TBlock>,
): EditorClipboardController<TBlock> {
  return new EditorClipboardController(options);
}
